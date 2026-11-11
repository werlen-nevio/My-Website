import { qs, qsa } from './core/env';

/** Small interactions that answer something the visitor did. */

/**
 * Screenshots live on the server only. If one is missing, hide it and let
 * the designed mock underneath take over (and become visible to AT).
 */
export function initMediaFallback() {
    qsa<HTMLImageElement>('img[data-fallback]').forEach((img) => {
        const fail = () => {
            img.classList.add('is-broken');
            img.closest('.frame__view')?.querySelector('.frame__mock')?.removeAttribute('aria-hidden');
            const item = img.closest<HTMLElement>('[data-gallery-item]');
            if (item) {
                item.hidden = true;
                const gallery = item.closest<HTMLElement>('[data-gallery]');
                if (gallery && qsa('[data-gallery-item]:not([hidden])', gallery).length === 0) gallery.hidden = true;
            }
        };
        if (img.complete && img.naturalWidth === 0) fail();
        else img.addEventListener('error', fail, { once: true });
    });
}

/** Local time in Valais. */
export function initClock() {
    const clocks = qsa<HTMLTimeElement>('[data-clock]');
    if (!clocks.length) return;
    const update = () => {
        const now = new Date();
        clocks.forEach((el) => {
            const fmt = new Intl.DateTimeFormat(el.dataset.locale ?? 'de-CH', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Zurich',
            });
            el.textContent = fmt.format(now);
            el.dateTime = now.toISOString();
        });
    };
    update();
    window.setInterval(update, 15_000);
}

/** Copy e-mail address with visible + announced confirmation. */
export function initCopy() {
    qsa<HTMLButtonElement>('[data-copy]').forEach((btn) => {
        const label = qs('[data-copy-label]', btn);
        const status = btn.parentElement?.querySelector<HTMLElement>('[data-copy-status]');
        const original = label?.textContent ?? '';
        let timer = 0;

        btn.addEventListener('click', async () => {
            const value = btn.dataset.copy ?? '';
            try {
                await navigator.clipboard.writeText(value);
            } catch {
                const ta = Object.assign(document.createElement('textarea'), { value });
                ta.style.cssText = 'position:fixed;opacity:0';
                document.body.append(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            btn.classList.add('is-copied');
            if (label) label.textContent = btn.dataset.copiedLabel ?? original;
            if (status) status.textContent = status.dataset.message ?? '';
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                btn.classList.remove('is-copied');
                if (label) label.textContent = original;
                if (status) status.textContent = '';
            }, 2200);
        });
    });
}

/** Remembers an explicit language choice; suggests the browser's language once. */
export function initLanguage() {
    const KEY = 'nw:lang';
    const read = () => {
        try {
            return localStorage.getItem(KEY);
        } catch {
            return null;
        }
    };
    const write = (v: string) => {
        try {
            localStorage.setItem(KEY, v);
        } catch {
            /* storage blocked – the choice just isn't remembered */
        }
    };

    qsa<HTMLAnchorElement>('[data-lang-link]').forEach((link) =>
        link.addEventListener('click', () => write(link.dataset.langLink ?? '')),
    );

    const hint = qs('[data-lang-hint]');
    if (!hint || read()) return;
    const target = hint.dataset.langHint ?? '';
    const browser = (navigator.languages?.[0] ?? navigator.language ?? '').slice(0, 2).toLowerCase();
    const current = document.documentElement.lang.slice(0, 2);
    const wantsTarget = target === 'de' ? browser === 'de' : browser !== 'de';
    if (!wantsTarget || browser === current) return;

    window.setTimeout(() => {
        hint.hidden = false;
        hint.classList.add('is-entering');
        requestAnimationFrame(() => requestAnimationFrame(() => hint.classList.remove('is-entering')));
    }, 3600);

    qs('[data-lang-hint-dismiss]', hint)?.addEventListener('click', () => {
        write(current);
        hint.classList.add('is-entering');
        window.setTimeout(() => (hint.hidden = true), 500);
    });
}

/** Education progress, computed from today's date. */
export function initProgress() {
    qsa('[data-progress]').forEach((el) => {
        const [sy, sm] = (el.dataset.start ?? '').split('-').map(Number);
        const [ey, em] = (el.dataset.end ?? '').split('-').map(Number);
        const start = new Date(sy, sm - 1, 1).getTime();
        const end = new Date(ey, em, 1).getTime();
        const pct = Math.round(Math.min(1, Math.max(0, (Date.now() - start) / (end - start))) * 100);
        const bar = qs('[data-progress-bar]', el);
        const label = qs('[data-progress-label]', el);
        bar?.style.setProperty('--p', String(pct / 100));
        if (label) label.textContent = (label.dataset.template ?? '{n} %').replace('{n}', String(pct));
    });
}
