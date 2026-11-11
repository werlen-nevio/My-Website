import { gsap, ScrollTrigger, EASE } from '../core/gsap';
import { qs, qsa, root, isSmall, fontsReady, releaseIntroGate, reducedMotion, debounce } from '../core/env';
import { scrollToTarget, lenis } from '../core/scroll';
import { planBuild, type Plan } from './planner';
import { startLive, type Live, type Role } from './live';
import { inView, observeBuilds } from './sections';

/**
 * Swarm Rebuild – home hero.
 *
 * On load the hero is a mess: the name lies around in tilted fragments,
 * everything else is missing, and the builder cursors are already on the
 * page. One cursor draws the frame around everything (it stays up while
 * the others work) and one builds the navigation; then the team builds
 * the content inside: drags the name together, types the copy, draws the
 * buttons, drags in the «Currently» entries. Most of them leave – a few
 * stay as colleagues in the file (live.ts) while the hero is on screen.
 *
 *  - deep links / reload far down the page: short fade-in
 *  - visitor scrolls or types during the build: it speeds up
 *  - «Rebuild this page» in the footer: scatter everything, build again
 *  - reduced motion: no build at all
 */

type Mode = 'full' | 'short';

/** Bounding box of the text itself (block elements report the full row). */
function textRect(el: HTMLElement): DOMRect {
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    return r.width ? r : el.getBoundingClientRect();
}

export function initHeroBuild() {
    const hero = qs('[data-hero]');
    if (!hero) {
        releaseIntroGate();
        return null;
    }

    const reduced = reducedMotion();
    const name = qs('[data-hero-name]', hero)!;
    const lines = qsa('[data-name-line]', hero);
    const inner = qs('[data-hero-inner]', hero)!;
    const board = qs('[data-board]', hero)!;
    const layer = qs('[data-live-layer]', hero)!;
    const labels = JSON.parse(inner.dataset.liveLabels ?? '{}') as Record<Role, string>;
    /** Everything the intro builds: header + hero (both marked as intro roots). */
    const targets = () => qsa('[data-build-root="intro"] [data-build]');

    let tl: gsap.core.Timeline | null = null;
    let plans: Plan[] = [];
    let busy = false;
    let live: Live | null = null;
    let liveTimer = 0;

    /* ---- Colleagues ------------------------------------------------------- */
    function stopLive() {
        window.clearTimeout(liveTimer);
        live?.stop();
        live = null;
    }

    function goLive(delay: number) {
        if (reduced) return;
        stopLive();
        const w = window.innerWidth;
        const roles: Role[] = w < 768 ? ['design'] : w < 1024 ? ['design', 'code'] : ['design', 'code', 'text'];
        liveTimer = window.setTimeout(() => {
            live = startLive({ ws: inner, board, layer, labels, roles });
        }, delay * 1000);
    }

    /* ---- Fit the name to the container width ----------------------------- */
    function fitName() {
        name.style.removeProperty('--name-fs');
        const fs = parseFloat(getComputedStyle(name).fontSize);
        const stacked = getComputedStyle(lines[0]).display === 'block';
        const rects = lines.map(textRect);
        const widest = stacked ? Math.max(...rects.map((r) => r.width)) : rects[rects.length - 1].right - rects[0].left;
        const avail = name.clientWidth;
        if (!widest || !avail) return;
        let next = fs * (avail / widest) * 0.995;
        if (!stacked && window.innerWidth >= 1024) next = Math.min(next, window.innerHeight * 0.25);
        name.style.setProperty('--name-fs', `${next.toFixed(2)}px`);
    }

    function cleanup() {
        tl?.kill();
        plans.forEach((p) => p.cleanup());
        plans = [];
    }

    /* ---- Full build -------------------------------------------------------- */
    function full() {
        const small = isSmall();
        tl = gsap.timeline({ paused: true });

        // builders only work on what is on screen; the rest is built once it
        // scrolls into view
        const all = targets();
        const visible = all.filter((el) => inView(el));
        const later = all.filter((el) => !visible.includes(el));

        // three teams on one timeline: the frame is drawn first while the
        // navigation is built; the content team starts while it closes
        const speed = small ? 0.85 : 1;
        const frame = visible.filter((el) => el.hasAttribute('data-build-first'));
        const nav = visible.filter((el) => !hero!.contains(el));
        const content = visible.filter((el) => !frame.includes(el) && !nav.includes(el));

        // measure + start states happen inside planBuild, in this same task
        const framePlan = planBuild({ tl, targets: frame, speed, start: 0.05, small, maxCursors: 1, enter: 'inside' });
        const navPlan = planBuild({ tl, targets: nav, speed, start: 0.3, small, entryStagger: 0.1, enter: 'inside', colorOffset: 4 });
        const contentPlan = planBuild({
            tl,
            targets: content,
            speed,
            start: frame.length ? Math.max(0.3, framePlan.end - 1.55) : 0.05,
            small,
            scatter: small ? 0.32 : 0.28,
            entryStagger: 0.07,
            enter: 'inside',
            colorOffset: 1,
        });
        plans = [framePlan, navPlan, contentPlan];
        observeBuilds(later);
        releaseIntroGate();

        // the frame stays up while the team works, then lets go
        const end = Math.max(...plans.map((p) => p.end));
        tl.to(qsa('.build-layer .bsel.is-held'), { opacity: 0, duration: 0.5, ease: 'power2.out' }, Math.max(contentPlan.end - 0.6, 0));
        tl.call(done, [], end + 0.05);
        tl.play();
        hurryOnInput();
    }

    /* ---- Short version ----------------------------------------------------- */
    function short() {
        releaseIntroGate();
        tl = gsap.timeline();
        tl.from(targets(), {
            opacity: 0,
            y: 18,
            filter: 'blur(6px)',
            duration: 1,
            stagger: 0.03,
            ease: EASE.out,
            clearProps: 'opacity,transform,filter',
        });
        tl.call(done, [], 1);
    }

    function done() {
        plans.forEach((p) => p.cleanup());
        plans = [];
        ScrollTrigger.refresh();
        busy = false;
        goLive(0.4);
    }

    function hurryOnInput() {
        const events = ['wheel', 'touchmove', 'keydown'] as const;
        const hurry = () => {
            if (tl?.isActive()) tl.timeScale(2.6);
            events.forEach((e) => window.removeEventListener(e, hurry));
        };
        events.forEach((e) => window.addEventListener(e, hurry, { passive: true }));
    }

    async function play(mode: Mode) {
        cleanup();
        await fontsReady();
        fitName();
        ScrollTrigger.refresh();
        if (mode === 'full') full();
        else short();
    }

    /* ---- «Rebuild this page» ---------------------------------------------- */
    async function replay() {
        if (busy || reduced) return;
        busy = true;
        await new Promise<void>((resolve) => {
            if (window.scrollY < 4) return resolve();
            scrollToTarget(0, resolve);
            window.setTimeout(resolve, 1800);
        });
        // the build only works on what is on screen – make sure that's the hero
        if (window.scrollY > 4) {
            lenis?.scrollTo(0, { immediate: true, force: true });
            window.scrollTo(0, 0);
        }
        cleanup();
        stopLive();
        const parts = targets();
        await gsap.to(parts, {
            opacity: 0,
            x: () => gsap.utils.random(-60, 60),
            y: () => gsap.utils.random(-40, 40),
            rotation: () => gsap.utils.random(-8, 8),
            duration: 0.5,
            stagger: { each: 0.012, from: 'random' },
            ease: 'power2.in',
        });
        gsap.set(parts, { clearProps: 'opacity,transform,filter' });
        root.classList.add('intro-pending');
        await play('full');
    }

    /* ---- Depth on scroll --------------------------------------------------- */
    if (!reduced) {
        gsap.to(inner, {
            y: () => window.innerHeight * 0.14,
            opacity: 0.35,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        });
    }

    window.addEventListener(
        'resize',
        debounce(() => {
            if (tl?.isActive()) tl.progress(1);
            fitName();
            ScrollTrigger.refresh();
            live?.reset();
        }, 200),
    );

    /* ---- Start ------------------------------------------------------------- */
    const requested = (root.dataset.introMode as Mode | undefined) ?? 'short';
    if (reduced) {
        fontsReady().then(() => {
            fitName();
            releaseIntroGate();
        });
    } else {
        busy = true;
        play(window.scrollY > window.innerHeight * 0.5 ? 'short' : requested);
    }

    return { replay };
}
