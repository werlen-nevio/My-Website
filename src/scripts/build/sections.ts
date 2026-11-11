import { gsap, ScrollTrigger } from '../core/gsap';
import { qsa, isSmall, reducedMotion, releaseIntroGate, fontsReady } from '../core/env';
import { planBuild } from './planner';

/**
 * Swarm Rebuild beyond the first screen.
 *
 * Builders only ever work on what the visitor can see: every element is
 * built at the moment it scrolls into view. Elements that enter together
 * (within ~0.15 s) are handed to the same small team of cursors, so a
 * fast scroll never queues up work off-screen.
 *
 * Without JS or with reduced motion everything is simply visible.
 */

/** Is the element (at least partly) inside the current viewport? */
export function inView(el: Element, margin = 0.92) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * margin && r.bottom > 0;
}

/** Hides the elements now and builds each one once it becomes visible. */
export function observeBuilds(elements: HTMLElement[]) {
    if (!elements.length || reducedMotion()) return;
    gsap.set(elements, { opacity: 0 });

    ScrollTrigger.batch(elements, {
        start: 'clamp(top 90%)', // clamp: elements at the very end of the page still trigger
        once: true,
        interval: 0.15,
        batchMax: isSmall() ? 3 : 5,
        onEnter: (batch) => {
            const small = isSmall();
            const tl = gsap.timeline();
            const plan = planBuild({
                tl,
                targets: batch as HTMLElement[],
                speed: 0.75,
                maxCursors: Math.min(batch.length, small ? 2 : 3),
                small,
                scatter: 0.18,
                entryStagger: 0.1,
            });
            tl.call(plan.cleanup, [], plan.end);
        },
    });
}

export function initSectionBuilds() {
    observeBuilds(qsa('[data-build-section] [data-build]'));
}

/**
 * Subpages: what is visible on load is built right away; anything further
 * down is built when it scrolls into view.
 */
export async function buildPageIntro() {
    const roots = qsa('[data-build-root="intro"]');
    if (reducedMotion() || !document.documentElement.classList.contains('intro-pending') || !roots.length) {
        releaseIntroGate();
        return;
    }
    await fontsReady(800);
    const all = roots.flatMap((r) => qsa('[data-build]', r));
    const now = all.filter((el) => inView(el));
    const later = all.filter((el) => !now.includes(el));

    const small = isSmall();
    const tl = gsap.timeline({ paused: true });
    const plan = planBuild({
        tl,
        targets: now,
        speed: 0.8,
        start: 0.05,
        maxCursors: small ? 2 : 4,
        small,
        scatter: 0.22,
        entryStagger: 0.08,
        enter: 'inside',
    });
    observeBuilds(later);
    releaseIntroGate();
    tl.call(plan.cleanup, [], plan.end);
    tl.play();
}
