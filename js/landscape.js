/* ========== LANDSCAPE ==========
 * Generates the alpine scenery (ridges, snow caps, trees, stars).
 * Everything is seeded, so every page renders the same mountains on each visit.
 * Exposed as window.Landscape for home.js and main.js.
 */
(function () {
    const W = 1600;

    function rng(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    const f = (v) => Math.round(v * 10) / 10;

    // Midpoint displacement ridge, optionally lifted by named peaks
    function ridge({ seed, base, rough, steps = 7, peaks = [], w = W }) {
        const r = rng(seed), n = 2 ** steps, ys = new Array(n + 1);
        ys[0] = base + (r() - .5) * rough;
        ys[n] = base + (r() - .5) * rough;
        let step = n, amp = rough;
        while (step > 1) {
            const h = step / 2;
            for (let i = h; i < n; i += step) ys[i] = (ys[i - h] + ys[i + h]) / 2 + (r() - .5) * amp;
            amp *= .56; step = h;
        }
        return ys.map((y, i) => {
            const x = i / n * w;
            for (const p of peaks) {
                const d = Math.abs(x - p.x) / p.w;
                if (d < 1) y -= p.h * Math.pow(1 - d, p.k || 1.35);
            }
            return [x, y];
        });
    }

    const fill = (pts, h = 800) =>
        `M0 ${h} ` + pts.map(([x, y]) => `L${f(x)} ${f(y)}`).join(' ') + ` L${pts[pts.length - 1][0]} ${h} Z`;

    function yAt(pts, x) {
        const n = pts.length - 1, t = x / pts[n][0] * n, i = Math.min(n - 1, Math.floor(t)), u = t - i;
        return pts[i][1] * (1 - u) + pts[i + 1][1] * u;
    }

    function snow(pts, base, seed) {
        const r = rng(seed);
        const bottom = pts.map(([x, y]) => [x, Math.max(y, base + 18 * Math.sin(x / 41) + (r() < .3 ? r() * 38 : r() * 10))]);
        let d = `M${pts[0][0]} ${f(pts[0][1])} ` + pts.map(([x, y]) => `L${f(x)} ${f(y)}`).join(' ');
        for (let i = bottom.length - 1; i >= 0; i--) d += ` L${f(bottom[i][0])} ${f(bottom[i][1])}`;
        return d + ' Z';
    }

    // Spruces (two stacked triangles) and larches (one slim triangle)
    function trees(pts, { seed, from = 0, to = W, gap = [8, 18], h = [16, 30], larch = .28, sink = 3 }) {
        const r = rng(seed);
        let sp = '', la = '';
        for (let x = from + r() * gap[0]; x < to; x += gap[0] + r() * (gap[1] - gap[0])) {
            const y = yAt(pts, x) + sink + r() * 6, th = h[0] + r() * (h[1] - h[0]);
            if (r() < larch) {
                const w = th * .36;
                la += `M${f(x - w / 2)} ${f(y)}L${f(x)} ${f(y - th)}L${f(x + w / 2)} ${f(y)}Z`;
            } else {
                const w = th * .52;
                sp += `M${f(x - w / 2)} ${f(y)}L${f(x)} ${f(y - th * .72)}L${f(x + w / 2)} ${f(y)}Z` +
                      `M${f(x - w * .38)} ${f(y - th * .34)}L${f(x)} ${f(y - th)}L${f(x + w * .38)} ${f(y - th * .34)}Z`;
            }
        }
        return `<path class="spruce" d="${sp}"/><path class="larch" d="${la}"/>`;
    }

    function stars(canvas, count, seed) {
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const c = canvas.getContext('2d');
        c.scale(dpr, dpr);
        const r = rng(seed);
        for (let i = 0; i < count; i++) {
            const x = r() * w, y = Math.pow(r(), 1.4) * h, rad = r() < .08 ? 1.4 : .5 + r() * .7;
            c.globalAlpha = .35 + r() * .65;
            c.fillStyle = '#fff';
            c.beginPath();
            c.arc(x, y, rad, 0, 6.283);
            c.fill();
        }
    }

    window.Landscape = { W, rng, f, ridge, fill, yAt, snow, trees, stars };
})();
