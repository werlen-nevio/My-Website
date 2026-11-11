import { gsap } from './core/gsap';
import { qsa, root, finePointer, reducedMotion } from './core/env';

/**
 * Pointer details from the portfolio playbook – mouse only, never with
 * reduced motion:
 *  - [data-magnetic]          the element leans towards the cursor
 *    [data-magnetic-inner]    …and its label leans a little further
 *  - [data-cursor="Label"]    the pointer becomes a builder cursor with a name tag
 */
export function initPointer() {
    if (!finePointer() || reducedMotion()) return;
    initMagnetic();
    initViewCursor();
}

function initMagnetic() {
    qsa('[data-magnetic]').forEach((el) => {
        const strength = parseFloat(el.dataset.magnetic || '') || 0.32;
        const inner = el.querySelector<HTMLElement>('[data-magnetic-inner]');
        const target = el.dataset.magneticSelf === 'false' ? null : el;
        const xTo = target ? gsap.quickTo(target, 'x', { duration: 0.9, ease: 'expo.out' }) : null;
        const yTo = target ? gsap.quickTo(target, 'y', { duration: 0.9, ease: 'expo.out' }) : null;
        const ixTo = inner ? gsap.quickTo(inner, 'x', { duration: 0.9, ease: 'expo.out' }) : null;
        const iyTo = inner ? gsap.quickTo(inner, 'y', { duration: 0.9, ease: 'expo.out' }) : null;

        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            xTo?.(dx * strength);
            yTo?.(dy * strength);
            ixTo?.(dx * strength * 0.45);
            iyTo?.(dy * strength * 0.45);
        });
        el.addEventListener('pointerleave', () => {
            xTo?.(0);
            yTo?.(0);
            ixTo?.(0);
            iyTo?.(0);
        });
    });
}

/**
 * Over a project the visitor's own pointer joins the swarm: the same arrow
 * the builders use, with a name tag naming what a click will open. It sits
 * exactly on the pointer (no easing), so it feels like the real cursor.
 */
function initViewCursor() {
    const el = document.createElement('div');
    el.className = 'view-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
        '<svg class="view-cursor__arrow" width="22" height="24" viewBox="0 0 22 24"><path d="M2.5 2.2 2.6 19.4l4.6-4.3 3.1 7 3.3-1.5-3.1-6.9 6.4-.3Z"/></svg>' +
        '<span class="view-cursor__tag"><span class="view-cursor__text"></span>' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></span>';
    document.body.append(el);
    const text = el.querySelector('.view-cursor__text')!;
    root.classList.add('has-view-cursor');

    let active: HTMLElement | null = null;
    let x = -100;
    let y = -100;

    const place = () => {
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const update = (target: Element | null) => {
        const next = target?.closest<HTMLElement>('[data-cursor]') ?? null;
        if (next === active) return;
        active = next;
        if (next) text.textContent = next.dataset.cursor ?? '';
        el.classList.toggle('is-on', !!next);
    };

    window.addEventListener(
        'pointermove',
        (e) => {
            x = e.clientX;
            y = e.clientY;
            place();
            update(e.target as Element);
        },
        { passive: true },
    );
    window.addEventListener('pointerdown', () => el.classList.add('is-down'), { passive: true });
    window.addEventListener('pointerup', () => el.classList.remove('is-down'), { passive: true });
    // content moves under a resting pointer while scrolling
    window.addEventListener('scroll', () => update(document.elementFromPoint(x, y)), { passive: true });
    document.documentElement.addEventListener('pointerleave', () => update(null));
}
