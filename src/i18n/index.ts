/**
 * Minimal i18n layer.
 * German lives at the root (/, /cv, /projects/…), English under /en.
 * Content is stored as `Localized` objects next to the data it belongs to;
 * short interface strings live in ./ui.ts.
 */
import { ui, type UiKey } from './ui';

export const languages = { de: 'Deutsch', en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'de';
export const langs = Object.keys(languages) as Lang[];

export type Localized<T = string> = Record<Lang, T>;

/** Locale tags used for Intl formatting and <html lang>. */
export const locales: Record<Lang, string> = { de: 'de-CH', en: 'en-GB' };
export const ogLocales: Record<Lang, string> = { de: 'de_CH', en: 'en_GB' };

export function useT(lang: Lang) {
    return (key: UiKey, vars?: Record<string, string | number>) => {
        let s: string = ui[lang][key] ?? ui[defaultLang][key];
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
        return s;
    };
}

export const l = <T>(value: Localized<T>, lang: Lang): T => value[lang];

/**
 * Prefixes an internal path for the given language.
 *   localizePath('/', 'en')          -> '/en'
 *   localizePath('/#about', 'en')    -> '/en#about'
 *   localizePath('/cv', 'en')        -> '/en/cv'
 */
export function localizePath(path: string, lang: Lang): string {
    if (lang === defaultLang) return path;
    if (path === '/') return `/${lang}`;
    if (path.startsWith('/#')) return `/${lang}${path.slice(1)}`;
    return `/${lang}${path}`;
}

/** Removes a language prefix from a pathname: '/en/cv' -> '/cv'. */
export function basePath(pathname: string): string {
    const clean = pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    for (const lang of langs) {
        if (lang === defaultLang) continue;
        if (clean === `/${lang}`) return '/';
        if (clean.startsWith(`/${lang}/`)) return clean.slice(lang.length + 1);
    }
    return clean;
}

/** 'YYYY-MM' -> 'Nov. 2026' (de-CH) / 'Nov 2026' (en-GB) */
export function formatMonth(ym: string, lang: Lang, month: 'short' | 'long' = 'short'): string {
    const [y, m] = ym.split('-').map(Number);
    return new Intl.DateTimeFormat(locales[lang], { month, year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(y, m - 1, 1)));
}

/** Formats a period such as 'Aug. 2022 bis Juli 2026' or 'Nov. 2026 bis heute'. */
export function formatPeriod(start: string, end: string | null, lang: Lang): string {
    const t = useT(lang);
    return `${formatMonth(start, lang)} ${t('time.to')} ${end ? formatMonth(end, lang) : t('time.present')}`;
}

/** Whole months between two 'YYYY-MM' values, inclusive of both months. */
export function monthsBetween(start: string, end: string): number {
    const [y1, m1] = start.split('-').map(Number);
    const [y2, m2] = end.split('-').map(Number);
    return (y2 - y1) * 12 + (m2 - m1) + 1;
}

export function formatDuration(months: number, lang: Lang): string {
    const t = useT(lang);
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts: string[] = [];
    if (years) parts.push(t(years === 1 ? 'time.year' : 'time.years', { n: years }));
    if (rest) parts.push(t(rest === 1 ? 'time.month' : 'time.months', { n: rest }));
    return parts.join(' ');
}

/** Current year/month as 'YYYY-MM' at build time. */
export function nowMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isCurrent(end: string | null): boolean {
    return end === null || end >= nowMonth();
}
