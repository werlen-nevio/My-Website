import './site';
import { gsap, EASE } from './core/gsap';
import { qs, qsa, reducedMotion } from './core/env';
import { lenis } from './core/scroll';

/**
 * Case study gallery lightbox on a native <dialog>:
 * focus is trapped, Esc closes, arrow keys browse, focus returns to the
 * thumbnail that opened it.
 */
function initLightbox() {
    const dialog = qs<HTMLDialogElement>('[data-lightbox]');
    const buttons = qsa<HTMLButtonElement>('[data-gallery-open]');
    if (!dialog || !buttons.length) return;

    const img = qs<HTMLImageElement>('[data-lightbox-img]', dialog)!;
    const caption = qs('[data-lightbox-caption]', dialog)!;
    const count = qs('[data-lightbox-count]', dialog);
    let index = 0;
    let opener: HTMLElement | null = null;

    const visible = () => buttons.filter((b) => !b.closest<HTMLElement>('[data-gallery-item]')?.hidden);

    const show = (i: number) => {
        const list = visible();
        index = (i + list.length) % list.length;
        const btn = list[index];
        const thumb = btn.querySelector('img');
        img.src = thumb?.currentSrc || thumb?.src || '';
        img.alt = btn.dataset.caption ?? '';
        caption.textContent = btn.dataset.caption ?? '';
        if (count) count.textContent = `${index + 1} / ${list.length}`;
        if (!reducedMotion()) gsap.fromTo(img, { opacity: 0, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.6, ease: EASE.out });
    };

    const open = (btn: HTMLButtonElement) => {
        opener = btn;
        show(visible().indexOf(btn));
        dialog.showModal();
        lenis?.stop();
        if (!reducedMotion()) gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: EASE.soft });
    };

    const close = () => {
        const done = () => {
            dialog.close();
            dialog.style.opacity = '';
            lenis?.start();
            opener?.focus();
        };
        if (reducedMotion()) done();
        else gsap.to(dialog, { opacity: 0, duration: 0.25, ease: EASE.inOut, onComplete: done });
    };

    buttons.forEach((btn) => btn.addEventListener('click', () => open(btn)));
    qs('[data-lightbox-close]', dialog)?.addEventListener('click', close);
    qs('[data-lightbox-prev]', dialog)?.addEventListener('click', () => show(index - 1));
    qs('[data-lightbox-next]', dialog)?.addEventListener('click', () => show(index + 1));
    dialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        close();
    });
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) close();
    });
    dialog.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
    });
}

initLightbox();
