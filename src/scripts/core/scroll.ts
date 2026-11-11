import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from './gsap';
import { root, reducedMotion } from './env';

/**
 * Smooth scrolling (Lenis, synced with ScrollTrigger) plus in-page anchor
 * handling that also moves keyboard focus to the target section.
 * Disabled entirely for reduced motion – native scrolling takes over.
 */
export let lenis: Lenis | null = null;

export function initScroll() {
    if (!reducedMotion()) {
        lenis = new Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            autoRaf: false,
        });
        root.classList.add('has-lenis');
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis?.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    // Once the header has scrolled away, the round menu button takes over
    const onScroll = () => root.classList.toggle('is-scrolled', window.scrollY > 140);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    document.addEventListener('click', onAnchorClick);
}

export function scrollToTarget(target: HTMLElement | number, onComplete?: () => void) {
    if (lenis) {
        lenis.scrollTo(target, { duration: 1.3, onComplete: () => onComplete?.() });
        return;
    }
    const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
    onComplete?.();
}

function focusTarget(el: HTMLElement) {
    if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '-1');
        el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true });
    }
    el.focus({ preventScroll: true });
}

/**
 * Scrolls to an in-page anchor. Returns false when `href` points elsewhere,
 * so callers can fall back to normal navigation.
 */
export function scrollToHash(href: string): boolean {
    const url = new URL(href, location.href);
    const norm = (p: string) => p.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (url.origin !== location.origin || norm(url.pathname) !== norm(location.pathname) || !url.hash) return false;

    const id = decodeURIComponent(url.hash.slice(1));
    if (id === 'top') {
        scrollToTarget(0, () => focusTarget(document.getElementById('main')!));
        history.replaceState(null, '', location.pathname);
        return true;
    }
    const target = document.getElementById(id);
    if (!target) return false;
    scrollToTarget(target, () => focusTarget(target));
    history.pushState(null, '', `#${id}`);
    return true;
}

/** In-page anchors scroll smoothly; everything else navigates normally. */
export function navigateTo(href: string) {
    if (!scrollToHash(href)) location.assign(href);
}

function onAnchorClick(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.target === '_blank' || link.closest('[data-menu]')) return;
    if (scrollToHash(link.href)) event.preventDefault();
}
