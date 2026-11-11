import { gsap, ScrollTrigger, SplitText, EASE } from './core/gsap';
import { qsa, rng, hashString, reducedMotion } from './core/env';

/**
 * Scroll reveals in the same language as the hero rebuild: fragments
 * arrive from slightly different directions and lock into place.
 *
 *   data-reveal="assemble"  direct children assemble in sequence
 *   data-reveal="rise"      the element itself rises in (batched with siblings)
 *   data-scrub-words        words light up while scrolling past
 *   data-parallax="0.1"     gentle vertical drift
 */
export function initReveals() {
    if (reducedMotion()) return;

    const start = 'top 86%';

    qsa('[data-reveal="assemble"]').forEach((el) => {
        const r = rng(hashString(el.className + (el.textContent ?? '').slice(0, 20)));
        gsap.from(el.children, {
            opacity: 0,
            x: () => (r() - 0.5) * 24,
            y: () => 16 + r() * 22,
            filter: 'blur(6px)',
            duration: 1.1,
            stagger: 0.08,
            ease: EASE.out,
            clearProps: 'filter,transform',
            scrollTrigger: { trigger: el, start, once: true },
        });
    });

    const risers = qsa('[data-reveal="rise"]');
    if (risers.length) {
        const r = rng(7);
        risers.forEach((el) => {
            gsap.set(el, { opacity: 0, y: 56, x: (r() - 0.5) * 30, rotate: (r() - 0.5) * 1.2 });
        });
        ScrollTrigger.batch(risers, {
            start: 'clamp(top 90%)',
            once: true,
            onEnter: (batch) =>
                gsap.to(batch, {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    rotate: 0,
                    duration: 1.3,
                    stagger: 0.12,
                    ease: EASE.out,
                    clearProps: 'transform',
                }),
        });
    }

    qsa('[data-scrub-words]').forEach((el) => {
        const split = SplitText.create(el, { type: 'words', aria: 'none' });
        gsap.fromTo(
            split.words,
            { opacity: 0.16 },
            {
                opacity: 1,
                ease: 'none',
                stagger: 0.1,
                scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: 0.6 },
            },
        );
    });

    qsa('[data-parallax]').forEach((el) => {
        const speed = parseFloat(el.dataset.parallax ?? '0');
        const amp = () => speed * window.innerHeight;
        gsap.fromTo(
            el,
            { y: () => amp() },
            {
                y: () => -amp(),
                ease: 'none',
                scrollTrigger: {
                    trigger: el.closest('section') ?? el,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            },
        );
    });
}
