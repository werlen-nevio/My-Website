// @ts-check
import { defineConfig } from 'astro/config';

// Static output that matches the nginx clean-URL setup:
// /cv -> cv.html, /en -> en.html, /projects/pyra -> projects/pyra.html
export default defineConfig({
    site: 'https://nevio.dev',
    trailingSlash: 'never',
    build: {
        format: 'file',
        inlineStylesheets: 'auto',
    },
    prefetch: {
        prefetchAll: false,
        defaultStrategy: 'hover',
    },
    devToolbar: { enabled: false },
});
