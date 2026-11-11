import type { APIRoute } from 'astro';
import { langs, locales, localizePath, defaultLang } from '../i18n';
import { caseStudies } from '../data/projects';

/** Sitemap with hreflang alternates for every page in both languages. */
export const GET: APIRoute = ({ site }) => {
    const base = (site?.href ?? 'https://nevio.dev/').replace(/\/$/, '');
    const paths = ['/', '/cv', ...caseStudies.map((p) => `/projects/${p.slug}`)];
    const today = new Date().toISOString().slice(0, 10);

    const urls = paths.flatMap((path) =>
        langs.map((lang) => {
            const alternates = langs
                .map((alt) => `    <xhtml:link rel="alternate" hreflang="${locales[alt]}" href="${base}${localizePath(path, alt)}"/>`)
                .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${base}${localizePath(path, defaultLang)}"/>`)
                .join('\n');
            return `  <url>\n    <loc>${base}${localizePath(path, lang)}</loc>\n    <lastmod>${today}</lastmod>\n${alternates}\n  </url>`;
        }),
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
