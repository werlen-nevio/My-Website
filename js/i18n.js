/* ========== i18n ==========
 * Translations live in /js/i18n.json. Mark elements with:
 *   data-i18n="path.to.key"             -> textContent
 *   data-i18n-html="path.to.key"        -> innerHTML (only trusted strings)
 *   data-i18n-placeholder="..."         -> placeholder attribute
 *   data-i18n-aria-label="..."          -> aria-label attribute
 *   data-i18n-alt="..."                 -> alt attribute
 *   data-i18n-title="..."               -> title attribute
 * Page <html> can carry data-i18n-page-title for <title>.
 */
(function () {
    const SUPPORTED = ['de', 'en'];
    const DEFAULT = 'en';
    const STORAGE_KEY = 'lang';

    let translations = null;
    let currentLang = DEFAULT;
    let pending = [];

    function detectLang() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && SUPPORTED.includes(stored)) return stored;
        } catch (e) { /* localStorage may be blocked */ }
        const browser = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
        if (browser.startsWith('de')) return 'de';
        return DEFAULT;
    }

    function get(key, lang) {
        if (!translations) return null;
        const tree = translations[lang] || translations[DEFAULT];
        if (!tree) return null;
        return key.split('.').reduce(
            (o, k) => (o && o[k] !== undefined && o[k] !== null) ? o[k] : null,
            tree
        );
    }

    function applyAttr(el, attrName, value) {
        el.setAttribute(attrName, value);
    }

    function applyAll() {
        if (!translations) return;
        document.documentElement.lang = currentLang;

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const v = get(el.getAttribute('data-i18n'), currentLang);
            if (v !== null) el.textContent = v;
        });

        document.querySelectorAll('[data-i18n-html]').forEach((el) => {
            const v = get(el.getAttribute('data-i18n-html'), currentLang);
            if (v !== null) el.innerHTML = v;
        });

        ['placeholder', 'title', 'alt', 'aria-label'].forEach((attr) => {
            const selector = `[data-i18n-${attr}]`;
            document.querySelectorAll(selector).forEach((el) => {
                const v = get(el.getAttribute(`data-i18n-${attr}`), currentLang);
                if (v !== null) applyAttr(el, attr, v);
            });
        });

        const titleKey = document.documentElement.getAttribute('data-i18n-page-title');
        if (titleKey) {
            const v = get(titleKey, currentLang);
            if (v !== null) document.title = v;
        }

        document.querySelectorAll('.lang-switch [data-lang]').forEach((btn) => {
            const active = btn.getAttribute('data-lang') === currentLang;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        // notify other scripts that translations are ready / changed
        document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: currentLang } }));

        // run any pending callbacks
        pending.forEach((cb) => { try { cb(currentLang); } catch (e) { /* noop */ } });
        pending = [];
    }

    function setLang(lang) {
        if (!SUPPORTED.includes(lang)) return;
        currentLang = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* noop */ }
        applyAll();
    }

    async function load() {
        try {
            const res = await fetch('/js/i18n.json', { cache: 'no-cache' });
            translations = await res.json();
        } catch (e) {
            console.error('[i18n] failed to load translations', e);
            translations = {};
        }
        applyAll();
    }

    function onReady(cb) {
        if (translations) cb(currentLang);
        else pending.push(cb);
    }

    window.i18n = {
        setLang,
        onReady,
        t: (key) => get(key, currentLang),
        get current() { return currentLang; }
    };

    currentLang = detectLang();
    document.documentElement.lang = currentLang;
    load();

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-switch [data-lang]');
        if (!btn) return;
        e.preventDefault();
        setLang(btn.getAttribute('data-lang'));
    });
})();
