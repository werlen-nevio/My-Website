import { gsap, SplitText } from '../core/gsap';
import { createBuilder, createFrame, createCaret, type Builder } from './cursors';

/**
 * Swarm Rebuild planner.
 *
 * Every element marked `data-build` is handed to a builder cursor:
 *
 *   drag  – the element lies scattered and tilted; a cursor grabs it and
 *           drags it into place (with a selection frame)
 *   type  – a cursor clicks into the text and it is typed in word by word
 *   draw  – a cursor drags a frame open (showing W × H); the content
 *           appears inside it. `data-build-hold` keeps the frame up (the
 *           caller fades `.bsel.is-held`), `data-build-name` labels it.
 *   pop   – a cursor clicks and the element appears
 *
 * Elements with the same `data-build-group` share one cursor and are built
 * one after another; otherwise elements are dealt round-robin to
 * `maxCursors` cursors. Everything is scheduled on one GSAP timeline, so
 * the whole build can be sped up, finished early or replayed.
 */

export type BuildKind = 'pop' | 'type' | 'draw' | 'drag';

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Target {
    el: HTMLElement;
    kind: BuildKind;
    rect: Rect;
    label: string;
    drag?: { dx: number; dy: number; rot: number };
    words?: HTMLElement[];
    wordRects?: Rect[];
    /** Short single-line text: typed letter by letter with a clip sweep. */
    sweep?: number;
}

export interface PlanOptions {
    tl: gsap.core.Timeline;
    targets: HTMLElement[];
    /** Duration multiplier (< 1 is faster). */
    speed?: number;
    /** Timeline position where cursors start to enter. */
    start?: number;
    maxCursors?: number;
    small?: boolean;
    /** How far dragged fragments are scattered (fraction of the viewport). */
    scatter?: number;
    entryStagger?: number;
    /**
     * 'edge'   – cursors fly in from the viewport edges (default)
     * 'inside' – cursors are already on screen near their first target
     */
    enter?: 'edge' | 'inside';
    /** Shifts the cursor colours – for a second plan on the same timeline. */
    colorOffset?: number;
}

export interface Plan {
    end: number;
    /** Removes cursors/frames and reverts text splitting. Safe to call twice. */
    cleanup: () => void;
}

const DEFAULT_LABEL: Record<BuildKind, string> = { pop: 'UI', type: 'Text', draw: 'Layout', drag: 'Layout' };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function unionRect(rects: Rect[]): Rect {
    const x = Math.min(...rects.map((r) => r.x));
    const y = Math.min(...rects.map((r) => r.y));
    const r = Math.max(...rects.map((r) => r.x + r.w));
    const b = Math.max(...rects.map((r) => r.y + r.h));
    return { x, y, w: r - x, h: b - y };
}

export function pageRect(el: Element): Rect {
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}

export function planBuild(opts: PlanOptions): Plan {
    const { tl, speed = 1, start = 0, maxCursors = 3, small = false, scatter = 0.3, entryStagger = 0.08, enter = 'edge', colorOffset = 0 } = opts;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const created: HTMLElement[] = [];
    const splits: SplitText[] = [];

    /* 1 — measure everything before any state is touched */
    const targets: Target[] = [];
    for (const el of opts.targets) {
        const rect = pageRect(el);
        if (rect.w < 1 || rect.h < 1) continue;
        const kind = (el.dataset.build as BuildKind) || 'pop';
        const t: Target = { el, kind, rect, label: el.dataset.buildLabel ?? '' };
        if (kind === 'type') {
            const split = SplitText.create(el, { type: 'words', aria: 'none' });
            const words = split.words as HTMLElement[];
            const rects = words.map(pageRect);
            const oneLine = rects.every((r) => Math.abs(r.y - rects[0].y) < 4);
            if (words.length <= 3 && oneLine) {
                // short headline: no splitting, type it letter by letter
                split.revert();
                t.sweep = Math.max(1, (el.textContent ?? '').trim().length);
                t.rect = pageRect(el);
                t.wordRects = [unionRect(rects)];
            } else {
                splits.push(split);
                t.words = words;
                t.wordRects = rects;
            }
        }
        if (kind === 'drag') {
            const s = scatter * (small ? 0.7 : 1);
            t.drag = {
                dx: rand(-1, 1) * vw * s,
                dy: rand(-0.7, 0.7) * vh * s,
                rot: rand(-11, 11),
            };
        }
        targets.push(t);
    }

    /* 2 — group targets per cursor */
    const groups = new Map<string, Target[]>();
    targets.forEach((t, i) => {
        const key = (small && t.el.dataset.buildGroupSm) || t.el.dataset.buildGroup || `auto-${i % maxCursors}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
    });

    /* 3 — start states */
    for (const t of targets) {
        if (t.kind === 'pop') gsap.set(t.el, { opacity: 0, scale: 0.92, y: 10 });
        if (t.kind === 'draw') gsap.set(t.el, { opacity: 0 });
        if (t.kind === 'type') {
            gsap.set(t.el, { opacity: 1 });
            if (t.words) gsap.set(t.words, { opacity: 0 });
            else gsap.set(t.el, { clipPath: 'inset(-30% 100% -30% -6%)' });
        }
        if (t.kind === 'drag') gsap.set(t.el, { x: t.drag!.dx, y: t.drag!.dy, rotation: t.drag!.rot, opacity: 0.3 });
    }

    /* 4 — schedule one cursor per group */
    let end = start;
    let gi = 0;
    const edges = ['left', 'top', 'right', 'bottom'] as const;

    for (const [, list] of groups) {
        const first = list[0];
        const label = first.label || DEFAULT_LABEL[first.kind];
        const anchor = first.drag
            ? { x: first.rect.x + first.drag.dx + first.rect.w / 2, y: first.rect.y + first.drag.dy + first.rect.h / 2 }
            : { x: first.rect.x, y: first.rect.y };
        const inside = enter === 'inside';
        const entry = inside ? insidePoint(anchor, vw, vh) : entryPoint(edges[gi % 4], anchor, vw, vh);
        const b = createBuilder(label, gi + colorOffset, entry.x, entry.y);
        created.push(b.root);
        // on screen from the first frame – or invisible until they fly in
        gsap.set(b.root, { x: entry.x, y: entry.y, opacity: inside ? 1 : 0 });

        let t = start + gi * entryStagger;
        if (!inside) tl.to(b.root, { opacity: 1, duration: 0.25 * speed, ease: 'none' }, t);

        for (const target of list) {
            if (target.kind === 'pop') t = pop(tl, b, target, t, speed);
            else if (target.kind === 'type') t = type(tl, b, target, t, speed, created);
            else if (target.kind === 'draw') t = draw(tl, b, target, t, speed, created);
            else t = drag(tl, b, target, t, speed, created);
        }

        // done: drift away and fade
        const away = { x: b.x + (b.x > window.scrollX + vw / 2 ? 120 : -120), y: b.y + 40 };
        tl.to(b.root, { x: away.x, y: away.y, opacity: 0, duration: 0.55 * speed, ease: 'power2.in' }, t + 0.12 * speed);
        end = Math.max(end, t + 0.7 * speed);
        gi++;
    }

    let cleaned = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        created.forEach((n) => n.remove());
        splits.forEach((s) => s.revert());
        targets.forEach((t) => gsap.set(t.el, { clearProps: 'opacity,transform,filter,clipPath' }));
    };

    return { end, cleanup };
}

/* ---------------------------------------------------------------------- */

function entryPoint(edge: 'left' | 'top' | 'right' | 'bottom', near: { x: number; y: number }, vw: number, vh: number) {
    const sx = window.scrollX;
    const sy = window.scrollY;
    const along = (min: number, max: number, v: number) => clamp(v + rand(-0.35, 0.35) * (max - min), min, max);
    switch (edge) {
        case 'left':
            return { x: sx - 60, y: along(sy, sy + vh, near.y) };
        case 'right':
            return { x: sx + vw + 30, y: along(sy, sy + vh, near.y) };
        case 'top':
            return { x: along(sx, sx + vw, near.x), y: sy - 60 };
        default:
            return { x: along(sx, sx + vw, near.x), y: sy + vh + 30 };
    }
}

/** A resting spot on screen, a short hop away from the first target. */
function insidePoint(near: { x: number; y: number }, vw: number, vh: number) {
    const sx = window.scrollX;
    const sy = window.scrollY;
    // offset towards the middle of the screen, so they don't pile up at an edge
    const angle = Math.atan2(sy + vh / 2 - near.y, sx + vw / 2 - near.x) + rand(-1.1, 1.1);
    const dist = rand(90, 220);
    return {
        x: clamp(near.x + Math.cos(angle) * dist, sx + 24, sx + vw - 110),
        y: clamp(near.y + Math.sin(angle) * dist, sy + 70, sy + vh - 50),
    };
}

/** Moves the cursor (arcs slightly, like a real hand) and returns arrival time. */
export function move(tl: gsap.core.Timeline, b: Builder, x: number, y: number, at: number, speed: number) {
    const dist = Math.hypot(x - b.x, y - b.y);
    const dur = clamp(0.2 + dist / 1800, 0.22, 0.9) * speed;
    const bend = clamp(dist * 0.12, 0, 60) * (Math.random() < 0.5 ? -1 : 1);
    const mx = (b.x + x) / 2 + bend * 0.4;
    const my = (b.y + y) / 2 - Math.abs(bend);
    tl.to(b.root, { keyframes: { x: [b.x, mx, x], y: [b.y, my, y], easeEach: 'none' }, duration: dur, ease: 'power3.inOut' }, at);
    b.x = x;
    b.y = y;
    return at + dur;
}

export function press(tl: gsap.core.Timeline, b: Builder, at: number, hold = 0.12) {
    const ripple = b.root.querySelector('.bc__ripple');
    tl.to(b.root, { scale: 0.86, duration: 0.09, ease: 'power2.out' }, at);
    if (ripple) tl.fromTo(ripple, { scale: 0.2, opacity: 0.7 }, { scale: 1.8, opacity: 0, duration: 0.5, ease: 'power2.out' }, at);
    return at + hold;
}

export function release(tl: gsap.core.Timeline, b: Builder, at: number) {
    tl.to(b.root, { scale: 1, duration: 0.18, ease: 'power2.out' }, at);
    return at + 0.05;
}

function pop(tl: gsap.core.Timeline, b: Builder, t: Target, at: number, speed: number) {
    const { rect } = t;
    let time = move(tl, b, rect.x + Math.min(rect.w * 0.4, 36), rect.y + rect.h * 0.62, at, speed);
    time = press(tl, b, time, 0.05);
    tl.to(t.el, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'expo.out', clearProps: 'transform' }, time);
    time = release(tl, b, time);
    return time + 0.04 * speed;
}

function type(tl: gsap.core.Timeline, b: Builder, t: Target, at: number, speed: number, created: HTMLElement[]) {
    const rects = t.wordRects!;
    const first = rects[0];
    let time = move(tl, b, first.x - 3, first.y + first.h * 0.55, at, speed);
    tl.call(() => b.root.classList.add('is-text'), [], time - 0.12 * speed);
    time = press(tl, b, time, 0.08);
    time = release(tl, b, time);

    const caret = createCaret(b.color);
    created.push(caret);
    gsap.set(caret, { x: first.x, y: first.y + first.h * 0.12, height: first.h * 0.76, opacity: 0 });
    tl.set(caret, { opacity: 1 }, time);

    if (t.sweep) {
        // letter by letter: a stepped clip sweep with the caret riding along
        const n = t.sweep;
        const dur = clamp(n * 0.04, 0.25, 0.6) * speed;
        const state = { p: 0 };
        tl.to(
            state,
            {
                p: 1,
                duration: dur,
                ease: `steps(${n})`,
                onUpdate: () => {
                    t.el.style.clipPath = `inset(-30% ${(1 - state.p) * 100}% -30% -6%)`;
                    gsap.set(caret, { x: first.x + first.w * state.p + 2 });
                },
            },
            time,
        );
        const typed = time + dur;
        tl.to(b.root, { x: first.x + Math.min(first.w * 0.6, 160), duration: dur, ease: 'none' }, time);
        b.x = first.x + Math.min(first.w * 0.6, 160);
        tl.set(t.el, { clearProps: 'clipPath' }, typed + 0.02);
        tl.to(caret, { opacity: 0, duration: 0.08, repeat: 3, yoyo: true, ease: 'steps(1)' }, typed + 0.05);
        tl.set(caret, { opacity: 0 }, typed + 0.45);
        tl.call(() => b.root.classList.remove('is-text'), [], typed + 0.1);
        return typed + 0.12 * speed;
    }

    const words = t.words!;

    const step = clamp(0.8 / words.length, 0.025, 0.08) * speed;
    words.forEach((word, i) => {
        const r = rects[i];
        const at2 = time + i * step;
        tl.set(word, { opacity: 1 }, at2);
        tl.set(caret, { x: r.x + r.w + 2, y: r.y + r.h * 0.12, height: r.h * 0.76 }, at2);
    });
    const typed = time + words.length * step;

    // the hand drifts along while typing
    const last = rects[rects.length - 1];
    const driftX = Math.min(first.x + 90, last.x + last.w * 0.5);
    tl.to(b.root, { x: driftX, y: first.y + first.h * 0.9, duration: Math.max(0.2, typed - time), ease: 'none' }, time);
    b.x = driftX;
    b.y = first.y + first.h * 0.9;

    tl.to(caret, { opacity: 0, duration: 0.08, repeat: 3, yoyo: true, ease: 'steps(1)' }, typed + 0.05);
    tl.set(caret, { opacity: 0 }, typed + 0.45);
    tl.call(() => b.root.classList.remove('is-text'), [], typed + 0.1);
    return typed + 0.12 * speed;
}

function draw(tl: gsap.core.Timeline, b: Builder, t: Target, at: number, speed: number, created: HTMLElement[]) {
    const { rect } = t;
    let time = move(tl, b, rect.x, rect.y, at, speed);
    time = press(tl, b, time, 0.06);

    const frame = createFrame(b.color);
    created.push(frame);
    const hold = t.el.hasAttribute('data-build-hold');
    if (hold) frame.classList.add('is-held');
    if (t.el.dataset.buildName) {
        const tag = document.createElement('span');
        tag.className = 'bsel__name';
        tag.textContent = t.el.dataset.buildName;
        frame.append(tag);
    }
    const size = frame.querySelector<HTMLElement>('.bsel__size')!;
    gsap.set(frame, { x: rect.x, y: rect.y, width: 0, height: 0, opacity: 0 });
    tl.set(frame, { opacity: 1 }, time);

    // tall elements: the hand stops at the bottom of the viewport
    const reachY = Math.min(rect.y + rect.h, window.scrollY + window.innerHeight * 0.88);
    const dur = clamp(0.38 + (rect.w + rect.h) / 2600, 0.45, 0.85) * speed;
    const box = { w: 0, h: 0 };
    tl.to(
        box,
        {
            w: rect.w,
            h: rect.h,
            duration: dur,
            ease: 'power2.inOut',
            onUpdate: () => {
                gsap.set(frame, { width: box.w, height: box.h });
                size.textContent = `${Math.round(box.w)} × ${Math.round(box.h)}`;
            },
        },
        time,
    );
    tl.to(b.root, { x: rect.x + rect.w, y: reachY, duration: dur, ease: 'power2.inOut' }, time);
    b.x = rect.x + rect.w;
    b.y = reachY;
    time += dur;
    time = release(tl, b, time);

    tl.fromTo(
        t.el,
        { opacity: 0, scale: 0.985, filter: 'blur(6px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'expo.out', clearProps: 'transform,filter' },
        time,
    );
    if (!hold) tl.to(frame, { opacity: 0, duration: 0.4, ease: 'power2.out' }, time + 0.2);
    return time + 0.12 * speed;
}

function drag(tl: gsap.core.Timeline, b: Builder, t: Target, at: number, speed: number, created: HTMLElement[]) {
    const { rect } = t;
    const { dx, dy, rot } = t.drag!;
    const gx = rect.x + dx + rect.w * rand(0.3, 0.7);
    const gy = rect.y + dy + rect.h * rand(0.35, 0.65);

    let time = move(tl, b, gx, gy, at, speed);
    time = press(tl, b, time, 0.1);

    const frame = createFrame(b.color);
    created.push(frame);
    frame.querySelector('.bsel__size')!.textContent = `${Math.round(rect.w)} × ${Math.round(rect.h)}`;
    gsap.set(frame, { x: rect.x + dx, y: rect.y + dy, width: rect.w, height: rect.h, rotation: rot, opacity: 0 });
    tl.set(frame, { opacity: 1 }, time - 0.06);
    tl.to(t.el, { opacity: 1, duration: 0.15, ease: 'none' }, time - 0.06);

    const dur = clamp(0.5 + Math.hypot(dx, dy) / 1700, 0.55, 1.05) * speed;
    const ease = 'power3.inOut';
    tl.to(t.el, { x: 0, y: 0, rotation: 0, duration: dur, ease }, time);
    tl.to(frame, { x: rect.x, y: rect.y, rotation: 0, duration: dur, ease }, time);
    tl.to(b.root, { x: gx - dx, y: gy - dy, duration: dur, ease }, time);
    b.x = gx - dx;
    b.y = gy - dy;
    time += dur;
    time = release(tl, b, time);
    tl.to(frame, { opacity: 0, duration: 0.35, ease: 'power2.out' }, time + 0.1);
    tl.set(t.el, { clearProps: 'transform' }, time + 0.05);
    return time + 0.1 * speed;
}
