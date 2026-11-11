/** Shared environment helpers. */

export const root = document.documentElement;

export const qs = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
    scope.querySelector<T>(sel);

export const qsa = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
    Array.from(scope.querySelectorAll<T>(sel));

/** Set by the inline head script from `prefers-reduced-motion`. */
export const reducedMotion = () => root.classList.contains('reduced-motion');

export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const isSmall = () => window.innerWidth < 768;

export const lowPower = () => (navigator.hardwareConcurrency ?? 8) <= 4;

/** Deterministic PRNG (mulberry32) so «random» offsets are stable per element. */
export function rng(seed: number) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let r = Math.imul(s ^ (s >>> 15), 1 | s);
        r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

export function hashString(str: string) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

export function debounce<T extends (...args: never[]) => void>(fn: T, wait = 150) {
    let id = 0;
    return (...args: Parameters<T>) => {
        window.clearTimeout(id);
        id = window.setTimeout(() => fn(...args), wait);
    };
}

/** Resolves when web fonts are ready, but never waits longer than `max` ms. */
export function fontsReady(max = 1200): Promise<void> {
    const ready = document.fonts?.ready ?? Promise.resolve();
    return Promise.race([ready.then(() => undefined), new Promise<void>((r) => setTimeout(r, max))]);
}

declare global {
    interface Window {
        __nwIntroFailsafe?: number;
    }
}

/** Ends the intro gating set up by the inline head script. */
export function releaseIntroGate() {
    if (window.__nwIntroFailsafe) window.clearTimeout(window.__nwIntroFailsafe);
    root.classList.remove('intro-pending');
}
