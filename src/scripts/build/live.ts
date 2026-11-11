import { gsap } from '../core/gsap';
import { finePointer } from '../core/env';
import { createBuilder, createFrame, createCaret, type Builder } from './cursors';
import { move, press, release } from './planner';

/**
 * Live session – after the build, a few cursors stay in the hero like
 * colleagues working in the same file:
 *
 *   Design  selects elements (frame + size) and pulls guides down
 *   Code    inspects elements (DevTools-style box + tag) and measures spacing
 *   Text    selects words in the copy
 *
 * Targets are marked with `data-live` in the hero. Everything is decorative
 * (aria-hidden layer, pointer-events: none), never more than two actions
 * at once, paused while the hero is off screen, and idle cursors make room
 * when the visitor's pointer comes close.
 *
 * Coordinates are relative to the workspace element (`ws`), so the layer
 * moves along with the hero's scroll parallax.
 */

export type Role = 'design' | 'code' | 'text';

interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Peer {
    id: string;
    role: Role;
    b: Builder;
    /** the running action */
    tl: gsap.core.Timeline | null;
    /** the pause before the next action */
    wait: gsap.core.Tween | null;
    drift: gsap.core.Tween | null;
    overlays: HTMLElement[];
    claims: string[];
    lastDodge: number;
}

export interface LiveOptions {
    ws: HTMLElement;
    board: HTMLElement;
    layer: HTMLElement;
    labels: Record<Role, string>;
    roles: Role[];
}

export interface Live {
    /** Cancel running actions and start over (after a resize). */
    reset(): void;
    stop(): void;
}

/** Palette index per role (see cursors.ts) – orange, green, pink. */
const COLOR: Record<Role, number> = { design: 2, code: 1, text: 6 };
/** Cursor tempo: slower than the build, like a person thinking. */
const PACE = 1.7;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** All entries, ordered by a weighted random draw. */
function weighted<T>(entries: [T, number][]): T[] {
    const pool = entries.slice();
    const out: T[] = [];
    while (pool.length) {
        const total = pool.reduce((s, [, w]) => s + w, 0);
        let r = Math.random() * total;
        const i = pool.findIndex(([, w]) => (r -= w) < 0);
        out.push(pool.splice(i < 0 ? 0 : i, 1)[0][0]);
    }
    return out;
}

export function startLive(opts: LiveOptions): Live {
    const { ws, board, layer, labels, roles } = opts;
    const peers: Peer[] = [];
    const claimed = new Set<string>();
    const waiting = new Set<Peer>();
    let paused = false;
    let stopped = false;
    let entry: gsap.core.Timeline[] = [];

    /* ---- Geometry --------------------------------------------------------- */
    const target = (key: string) => ws.querySelector<HTMLElement>(`[data-live="${key}"]`);

    function box(t: Element | DOMRect): Box {
        const r = t instanceof Element ? t.getBoundingClientRect() : t;
        const w = ws.getBoundingClientRect();
        return { x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height };
    }

    /** Width of the text, height of the element (like a text layer). */
    function textBox(el: HTMLElement): Box {
        const b = box(el);
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        if (!r.width) return b;
        const t = box(r);
        return { x: t.x, y: b.y, w: t.w, h: b.h };
    }

    const isText = (key: string) => key === 'name' || key === 'lede';
    const boxOf = (key: string, el: HTMLElement) => (isText(key) ? textBox(el) : box(el));

    /** Bottom of the header – nothing happens above it. */
    function top() {
        const header = document.querySelector('.header__inner');
        return header ? header.getBoundingClientRect().bottom - ws.getBoundingClientRect().top : 80;
    }

    /** Area the cursors stay in: around the content, inside the viewport. */
    function bounds() {
        const b = box(board);
        const wsTop = ws.getBoundingClientRect().top;
        return {
            x0: 16,
            x1: ws.clientWidth - 96,
            y0: Math.max(top() + 24, b.y - 80),
            y1: Math.min(b.y + b.h + 10, window.innerHeight - wsTop - 56),
        };
    }

    /** On screen and big enough to work with. */
    function usable(el: HTMLElement | null): el is HTMLElement {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 4 && r.height > 4 && r.top > 70 && r.bottom < window.innerHeight - 30;
    }

    function free(keys: string[]) {
        return keys.filter((k) => !claimed.has(k) && usable(target(k)));
    }

    /* ---- Peer plumbing ---------------------------------------------------- */
    function sync(p: Peer) {
        p.b.x = gsap.getProperty(p.b.root, 'x') as number;
        p.b.y = gsap.getProperty(p.b.root, 'y') as number;
    }

    function overlay(p: Peer, className: string, html = '') {
        const el = document.createElement('div');
        el.className = className;
        el.style.setProperty('--c', p.b.color.bg);
        el.style.setProperty('--cf', p.b.color.fg);
        el.innerHTML = html;
        layer.append(el);
        p.overlays.push(el);
        return el;
    }

    function claim(p: Peer, ...keys: string[]) {
        keys.forEach((k) => claimed.add(k));
        p.claims.push(...keys);
    }

    function timeline(p: Peer) {
        const tl = gsap.timeline({ onComplete: () => finish(p) });
        p.tl = tl;
        return tl;
    }

    /** Ends the current action: overlays and claims. */
    function clean(p: Peer) {
        p.tl?.kill();
        p.tl = null;
        p.overlays.forEach((el) => el.remove());
        p.overlays = [];
        p.claims.forEach((k) => claimed.delete(k));
        p.claims = [];
        p.b.root.classList.remove('is-text');
        gsap.set(p.b.root, { scale: 1 });
    }

    function finish(p: Peer) {
        clean(p);
        schedule(p);
    }

    function schedule(p: Peer, delay = roles.length === 1 ? rand(2.6, 5) : rand(1.8, 4.2)) {
        if (stopped) return;
        if (paused) {
            waiting.add(p);
            return;
        }
        // a small drift while thinking – finished before the next action
        const driftDur = Math.min(1.4, delay * 0.5);
        if (driftDur > 0.4 && Math.random() < 0.7) {
            const bd = bounds();
            const x = clamp(p.b.x + rand(-14, 14), bd.x0, bd.x1);
            const y = clamp(p.b.y + rand(-10, 10), bd.y0, bd.y1);
            p.drift = gsap.to(p.b.root, { x, y, duration: driftDur, delay: rand(0, delay - driftDur - 0.1), ease: 'sine.inOut' });
            p.b.x = x;
            p.b.y = y;
        }
        p.wait = gsap.delayedCall(delay, () => {
            p.wait = null;
            p.drift = null;
            act(p);
        });
    }

    function act(p: Peer) {
        if (stopped) return;
        // never more than two things going on at once – it should feel calm
        const busy = peers.filter((o) => o !== p && o.tl?.isActive()).length;
        if (busy >= 2) return schedule(p, rand(0.8, 1.8));
        sync(p);
        const plan: [() => gsap.core.Timeline | null, number][] =
            p.role === 'design'
                ? [
                      [() => select(p), 5],
                      [() => guide(p), 3],
                      [() => wander(p), 1],
                  ]
                : p.role === 'code'
                  ? [
                        [() => inspect(p), 4],
                        [() => measure(p), 4],
                        [() => wander(p), 1],
                    ]
                  : [
                        [() => markText(p), 5],
                        [() => select(p), 1],
                        [() => wander(p), 1],
                    ];
        for (const action of weighted(plan)) {
            if (action()) return;
        }
        schedule(p, 1);
    }

    /* ---- Actions ---------------------------------------------------------- */

    /** Design: click an element – selection frame with its size. */
    function select(p: Peer) {
        const key = pick(free(['name', 'lede', 'cta', 'now', 'link']));
        if (!key) return null;
        const bx = boxOf(key, target(key)!);
        claim(p, key);
        const tl = timeline(p);
        const b = p.b;

        let t = move(tl, b, bx.x + bx.w * rand(0.2, 0.65), bx.y + bx.h * rand(0.35, 0.7), 0, PACE);
        t = press(tl, b, t, 0.1);
        const frame = createFrame(b.color, layer);
        p.overlays.push(frame);
        frame.querySelector('.bsel__size')!.textContent = `${Math.round(bx.w)} × ${Math.round(bx.h)}`;
        gsap.set(frame, { x: bx.x, y: bx.y, width: bx.w, height: bx.h, opacity: 0 });
        tl.to(frame, { opacity: 1, duration: 0.12, ease: 'none' }, t - 0.06);
        t = release(tl, b, t + 0.04);

        // the hand rests next to it for a moment
        const bd = bounds();
        move(tl, b, clamp(b.x + rand(-50, 70), bd.x0, bd.x1), clamp(b.y + rand(26, 60), bd.y0, bd.y1), t + 0.5, PACE);
        tl.to(frame, { opacity: 0, duration: 0.25, ease: 'none' }, t + rand(1.9, 3.2));
        return tl;
    }

    /** Design: pull a guide down to an edge, look at it, take it away again. */
    function guide(p: Peer) {
        if (claimed.has('guide')) return null;
        const edges: number[] = [];
        for (const key of ['name', 'lede', 'cta']) {
            const el = target(key);
            if (!usable(el)) continue;
            const bx = boxOf(key, el);
            edges.push(key === 'cta' ? bx.y + bx.h : bx.y);
        }
        if (!edges.length) return null;
        claim(p, 'guide');
        const tl = timeline(p);
        const b = p.b;
        const bd = bounds();
        const origin = box(board).y;
        const ty = Math.round(pick(edges));
        const startY = top() + 6;
        const gx = clamp(b.x + rand(-140, 140), bd.x0 + 40, bd.x1 - 60);

        const line = overlay(p, 'live-guide', '<span class="live-guide__val"></span>');
        const val = line.firstElementChild as HTMLElement;
        // the line spans the whole hero (it sits 100vw to the left)
        val.style.left = `calc(100vw + ${gx + 16}px)`;
        gsap.set(line, { y: startY, opacity: 0 });
        const pos = { y: startY };
        const update = () => {
            gsap.set(line, { y: pos.y });
            val.textContent = String(Math.round(pos.y - origin));
        };

        let t = move(tl, b, gx, startY, 0, PACE);
        t = press(tl, b, t, 0.14);
        tl.set(line, { opacity: 1 }, t - 0.05);
        const down = clamp(0.6 + Math.abs(ty - startY) / 900, 0.7, 1.3);
        tl.to(pos, { y: ty, duration: down, ease: 'power2.inOut', onUpdate: update }, t);
        tl.to(b.root, { y: ty, duration: down, ease: 'power2.inOut' }, t);
        b.y = ty;
        t = release(tl, b, t + down);

        const side = gx > (bd.x0 + bd.x1) / 2 ? -1 : 1;
        move(tl, b, clamp(gx + side * rand(70, 150), bd.x0, bd.x1), clamp(ty + rand(30, 80), bd.y0, bd.y1), t + 0.35, PACE);
        let t2 = t + rand(2.2, 3.4);
        t2 = move(tl, b, clamp(b.x - side * rand(20, 60), bd.x0, bd.x1), ty, t2, PACE);
        t2 = press(tl, b, t2, 0.12);
        const up = clamp(0.5 + Math.abs(ty - startY) / 1100, 0.55, 1);
        tl.to(pos, { y: startY, duration: up, ease: 'power2.inOut', onUpdate: update }, t2);
        tl.to(b.root, { y: startY, duration: up, ease: 'power2.inOut' }, t2);
        b.y = startY;
        tl.to(line, { opacity: 0, duration: 0.12, ease: 'none' }, t2 + up - 0.1);
        t2 = release(tl, b, t2 + up);
        move(tl, b, clamp(b.x + rand(-60, 60), bd.x0, bd.x1), clamp(startY + rand(100, 200), bd.y0, bd.y1), t2 + 0.1, PACE);
        return tl;
    }

    /** Code: hover an element – DevTools-style box (padding shaded) and tag. */
    function inspect(p: Peer) {
        const key = pick(free(['name', 'lede', 'cta', 'link', 'now', 'clock']));
        if (!key) return null;
        const el = target(key)!;
        const bx = box(el);
        claim(p, key);
        const tl = timeline(p);
        const b = p.b;

        const cs = getComputedStyle(el);
        const shade = overlay(p, 'live-inspect');
        shade.style.borderWidth = `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`;
        gsap.set(shade, { x: bx.x, y: bx.y, width: bx.w, height: bx.h, opacity: 0 });

        const tip = overlay(p, 'live-tip', '<b></b><span></span><em></em>');
        tip.children[0].textContent = el.tagName.toLowerCase();
        tip.children[1].textContent = el.classList[0] ? `.${el.classList[0]}` : '';
        tip.children[2].textContent = `${Math.round(bx.w)} × ${Math.round(bx.h)}`;
        const tw = tip.offsetWidth;
        const above = bx.y - 34 > top() + 6;
        gsap.set(tip, {
            x: clamp(bx.x, 6, ws.clientWidth - tw - 8),
            y: above ? bx.y - 32 : bx.y + bx.h + 8,
            opacity: 0,
        });

        const t = move(tl, b, bx.x + Math.min(bx.w * rand(0.3, 0.7), 260), bx.y + bx.h * rand(0.4, 0.7), 0, PACE);
        tl.to([shade, tip], { opacity: 1, duration: 0.14, ease: 'none' }, t - 0.08);
        const nx = b.x + rand(-16, 16);
        const ny = b.y + rand(-6, 10);
        tl.to(b.root, { x: nx, y: ny, duration: 1.2, ease: 'sine.inOut' }, t + 0.3);
        b.x = nx;
        b.y = ny;
        tl.to([shade, tip], { opacity: 0, duration: 0.18, ease: 'none' }, t + rand(1.8, 2.8));
        return tl;
    }

    /** Code: measure the space between two elements, like holding Alt. */
    function measure(p: Peer) {
        const pairs: [string, string][] = [
            ['name', 'lede'],
            ['lede', 'cta'],
            ['cta', 'link'],
            ['lede', 'now'],
        ];
        const options = pairs.filter(([a, c]) => free([a, c]).length === 2).sort(() => Math.random() - 0.5);
        for (const [ka, kb] of options) {
            const a = boxOf(ka, target(ka)!);
            const c = boxOf(kb, target(kb)!);
            let gap = 0;
            let line: Box;
            if (c.y >= a.y + a.h - 1) {
                const l = Math.max(a.x, c.x);
                const r = Math.min(a.x + a.w, c.x + c.w);
                const x = r > l ? l + (r - l) * rand(0.3, 0.6) : c.x + 20;
                gap = c.y - (a.y + a.h);
                line = { x, y: a.y + a.h, w: 1, h: gap };
            } else if (c.x >= a.x + a.w - 1) {
                const t = Math.max(a.y, c.y);
                const btm = Math.min(a.y + a.h, c.y + c.h);
                const y = btm > t ? (t + btm) / 2 : c.y + c.h / 2;
                gap = c.x - (a.x + a.w);
                line = { x: a.x + a.w, y, w: gap, h: 1 };
            } else continue;
            if (gap < 8) continue;
            return runMeasure(p, ka, kb, a, c, line, gap);
        }
        return null;
    }

    function runMeasure(p: Peer, ka: string, kb: string, a: Box, c: Box, line: Box, gap: number) {
        claim(p, ka, kb);
        const tl = timeline(p);
        const b = p.b;
        const outA = overlay(p, 'live-outline');
        const outC = overlay(p, 'live-outline');
        gsap.set(outA, { x: a.x, y: a.y, width: a.w, height: a.h, opacity: 0 });
        gsap.set(outC, { x: c.x, y: c.y, width: c.w, height: c.h, opacity: 0 });
        const vertical = line.w === 1;
        const ruler = overlay(p, `live-measure ${vertical ? 'is-v' : 'is-h'}`, '<span class="live-measure__val"></span>');
        ruler.firstElementChild!.textContent = String(Math.round(gap));
        gsap.set(ruler, { x: line.x, y: line.y, width: line.w, height: line.h, opacity: 0 });

        let t = move(tl, b, a.x + Math.min(a.w * rand(0.3, 0.6), 220), a.y + a.h * 0.5, 0, PACE);
        tl.to(outA, { opacity: 1, duration: 0.12, ease: 'none' }, t - 0.06);
        t = move(tl, b, c.x + Math.min(c.w * rand(0.25, 0.5), 160), c.y + c.h * 0.55, t + 0.45, PACE);
        tl.to([outC, ruler], { opacity: 1, duration: 0.14, ease: 'none' }, t - 0.06);
        tl.to([outA, outC, ruler], { opacity: 0, duration: 0.2, ease: 'none' }, t + rand(2, 3));
        return tl;
    }

    /** Text: drag-select a word or two in the copy, caret blinking. */
    function markText(p: Peer) {
        const key = free(['lede'])[0];
        if (!key) return null;
        const el = target(key)!;
        const host = el.matches('[data-live-text]') ? el : (el.querySelector<HTMLElement>('[data-live-text]') ?? el);

        // words of at least five letters
        const words: Range[] = [];
        const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const text = node.textContent ?? '';
            for (const m of text.matchAll(/[\p{L}\p{N}][\p{L}\p{N}-]{4,}/gu)) {
                const r = document.createRange();
                r.setStart(node, m.index!);
                r.setEnd(node, m.index! + m[0].length);
                words.push(r);
            }
        }
        const range = pick(words);
        if (!range) return null;
        // sometimes take the next word too, if it is on the same line
        const next = words[words.indexOf(range) + 1];
        if (next && Math.random() < 0.4 && next.startContainer === range.startContainer) {
            const both = document.createRange();
            both.setStart(range.startContainer, range.startOffset);
            both.setEnd(next.endContainer, next.endOffset);
            if (both.getClientRects().length === 1) range.setEnd(next.endContainer, next.endOffset);
        }
        const rects = range.getClientRects();
        if (rects.length !== 1) return null;
        const bx = box(rects[0]);
        claim(p, key);
        const tl = timeline(p);
        const b = p.b;

        const hl = overlay(p, 'live-hl');
        gsap.set(hl, { x: bx.x, y: bx.y, width: 0, height: bx.h, opacity: 1 });
        const caret = createCaret(b.color, layer);
        p.overlays.push(caret);
        gsap.set(caret, { x: bx.x + bx.w, y: bx.y + bx.h * 0.1, height: bx.h * 0.8, opacity: 0 });

        const midY = bx.y + bx.h * 0.55;
        tl.call(() => b.root.classList.add('is-text'), [], 0.25);
        let t = move(tl, b, bx.x - 1, midY, 0, PACE);
        t = press(tl, b, t, 0.1);
        const dur = clamp(bx.w / 380, 0.3, 0.8);
        tl.to(hl, { width: bx.w, duration: dur, ease: 'power1.inOut' }, t);
        tl.to(b.root, { x: bx.x + bx.w, duration: dur, ease: 'power1.inOut' }, t);
        b.x = bx.x + bx.w;
        t = release(tl, b, t + dur);
        tl.set(caret, { opacity: 1 }, t);
        tl.to(caret, { opacity: 0, duration: 0.5, repeat: 5, yoyo: true, ease: 'steps(1)' }, t + 0.5);

        // click elsewhere: the selection is gone
        const hold = rand(2, 3);
        const bd = bounds();
        const nx = clamp(b.x + rand(30, 90), bd.x0, bd.x1);
        const ny = clamp(midY + rand(30, 70), bd.y0, bd.y1);
        tl.to(b.root, { x: nx, y: ny, duration: 0.8, ease: 'power2.inOut' }, t + 0.4);
        b.x = nx;
        b.y = ny;
        tl.call(() => b.root.classList.remove('is-text'), [], t + 0.9);
        tl.set([hl, caret], { opacity: 0 }, t + hold);
        return tl;
    }

    /** Anyone: look somewhere else for a moment. */
    function wander(p: Peer) {
        const bd = bounds();
        if (bd.y1 - bd.y0 < 40) return null;
        const tl = timeline(p);
        move(tl, p.b, rand(bd.x0, bd.x1), rand(bd.y0 + 40, bd.y1), 0, PACE * 1.2);
        return tl;
    }

    /* ---- The visitor's pointer: idle cursors make room -------------------- */
    const onPointer = (e: PointerEvent) => {
        const r = ws.getBoundingClientRect();
        const px = e.clientX - r.left;
        const py = e.clientY - r.top;
        const now = performance.now();
        for (const p of peers) {
            if (!p.wait || now - p.lastDodge < 900) continue;
            const x = gsap.getProperty(p.b.root, 'x') as number;
            const y = gsap.getProperty(p.b.root, 'y') as number;
            const d = Math.hypot(x - px, y - py);
            if (d > 64) continue;
            p.lastDodge = now;
            p.wait.kill();
            p.wait = null;
            p.drift?.kill();
            p.drift = null;
            sync(p);
            const bd = bounds();
            const k = 120 / Math.max(d, 1);
            const tx = clamp(x + (x - px || 1) * k, bd.x0, bd.x1);
            const ty = clamp(y + (y - py || 1) * k, bd.y0, bd.y1);
            const tl = timeline(p);
            tl.to(p.b.root, { x: tx, y: ty, duration: 0.6, ease: 'power3.out' });
            p.b.x = tx;
            p.b.y = ty;
        }
    };
    const hero = ws.closest('section') ?? ws;
    if (finePointer()) hero.addEventListener('pointermove', onPointer);

    /* ---- Off screen: no new actions --------------------------------------- */
    const io = new IntersectionObserver(([e]) => {
        paused = !e.isIntersecting;
        if (paused) {
            peers.forEach((p) => {
                if (!p.wait) return;
                p.wait.kill();
                p.wait = null;
                waiting.add(p);
            });
        } else {
            waiting.forEach((p) => schedule(p, rand(0.4, 1.4)));
            waiting.clear();
        }
    });
    io.observe(ws);

    /* ---- Enter ------------------------------------------------------------ */
    function spawn(role: Role, i: number) {
        const bd = bounds();
        const fromRight = i % 2 === 0;
        const x = fromRight ? ws.clientWidth + 30 : -40;
        const y = rand(bd.y0 + 40, Math.max(bd.y0 + 60, bd.y1 - 60));
        const b = createBuilder(labels[role], COLOR[role], x, y, layer);
        gsap.set(b.root, { x, y, opacity: 0 });
        const p: Peer = { id: `live-${role}`, role, b, tl: null, wait: null, drift: null, overlays: [], claims: [], lastDodge: 0 };
        peers.push(p);

        const tl = gsap.timeline({ delay: 0.2 + i * 1.3, onComplete: () => schedule(p, rand(0.2, 0.8)) });
        tl.to(b.root, { opacity: 1, duration: 0.3, ease: 'none' }, 0);
        move(tl, b, rand(bd.x0 + 40, bd.x1 - 40), rand(bd.y0 + 30, Math.max(bd.y0 + 40, bd.y1 - 40)), 0, PACE * 1.2);
        entry.push(tl);
    }

    roles.forEach(spawn);

    return {
        reset() {
            if (stopped) return;
            entry.forEach((tl) => tl.progress(1));
            entry = [];
            const bd = bounds();
            peers.forEach((p) => {
                p.wait?.kill();
                p.wait = null;
                p.drift?.kill();
                p.drift = null;
                waiting.delete(p);
                clean(p);
                sync(p);
                p.b.x = clamp(p.b.x, bd.x0, bd.x1);
                p.b.y = clamp(p.b.y, bd.y0, bd.y1);
                gsap.set(p.b.root, { x: p.b.x, y: p.b.y });
                schedule(p, rand(0.6, 1.6));
            });
        },
        stop() {
            if (stopped) return;
            stopped = true;
            io.disconnect();
            hero.removeEventListener('pointermove', onPointer);
            entry.forEach((tl) => tl.kill());
            peers.forEach((p) => {
                p.wait?.kill();
                p.drift?.kill();
                clean(p);
                gsap.to(p.b.root, { opacity: 0, duration: 0.25, ease: 'none', onComplete: () => p.b.root.remove() });
            });
        },
    };
}
