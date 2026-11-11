import { gsap, EASE } from './core/gsap';
import { qs, qsa, reducedMotion } from './core/env';
import { lenis, navigateTo } from './core/scroll';

/**
 * Menu: a side panel on a native <dialog> (focus trap and Esc for free),
 * opened from the round button that appears once the header has scrolled
 * out of view (always visible on phones).
 */
export function initNav() {
    const dialog = qs<HTMLDialogElement>('[data-menu]');
    const panel = qs('[data-menu-panel]');
    const openers = qsa<HTMLButtonElement>('[data-menu-open]');
    if (!dialog || !panel || !openers.length) return;

    const items = qsa('[data-menu-item]', dialog);
    let opener: HTMLButtonElement | null = null;
    let closing = false;

    const open = (btn: HTMLButtonElement) => {
        opener = btn;
        dialog.showModal();
        openers.forEach((b) => b.setAttribute('aria-expanded', 'true'));
        lenis?.stop();
        if (reducedMotion()) return;
        gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: EASE.soft });
        gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.9, ease: EASE.out });
        gsap.fromTo(items, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 1, stagger: 0.05, delay: 0.12, ease: EASE.out, clearProps: 'transform' });
    };

    const close = (after?: () => void) => {
        if (closing || !dialog.open) return;
        closing = true;
        const done = () => {
            dialog.close();
            gsap.set([dialog, panel], { clearProps: 'all' });
            closing = false;
            openers.forEach((b) => b.setAttribute('aria-expanded', 'false'));
            lenis?.start();
            if (after) after();
            else opener?.focus();
        };
        if (reducedMotion()) return done();
        gsap.to(panel, { xPercent: 100, duration: 0.5, ease: 'power3.in' });
        gsap.to(dialog, { opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: done });
    };

    openers.forEach((btn) => btn.addEventListener('click', () => open(btn)));
    qs('[data-menu-close]', dialog)?.addEventListener('click', () => close());
    dialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        close();
    });
    // click on the dimmed area closes
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) close();
    });

    qsa<HTMLAnchorElement>('[data-menu-link]', dialog).forEach((link) => {
        link.addEventListener('click', (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey) return;
            e.preventDefault();
            close(() => navigateTo(link.href));
        });
    });
}
