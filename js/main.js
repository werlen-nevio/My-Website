/* ========== SUBPAGE HERO — mountain scene ========== */
(() => {
    const L = window.Landscape;
    const svg = document.querySelector('.subhero .scene');
    if (!L || !svg) return;

    const H = 360, seed = +svg.dataset.seed || 1;
    const far = L.ridge({ seed: 11 + seed, base: 190, rough: 70, peaks: [{ x: 1080, h: 120, w: 190, k: 1.45 }, { x: 360, h: 60, w: 260 }] });
    const mid = L.ridge({ seed: 23 + seed, base: 244, rough: 50, peaks: [{ x: 620, h: 70, w: 240 }, { x: 1420, h: 64, w: 220 }] });
    const near = L.ridge({ seed: 7 + seed, base: 300, rough: 26, steps: 6 });

    svg.querySelector('.layers').innerHTML =
        `<path class="l1" d="${L.fill(far, H)}"/><path class="snowcap" d="${L.snow(far, 150, 5 + seed)}"/>` +
        `<path class="l3" d="${L.fill(mid, H)}"/><path class="snowcap" d="${L.snow(mid, 214, 9 + seed)}" opacity=".6"/>` +
        `<path class="l4" d="${L.fill(near, H)}"/>` + L.trees(near, { seed: 3 + seed }) +
        `<path class="l6" d="M0 360 L0 350 Q 400 336 800 340 T 1600 348 L1600 360 Z"/>`;

    const canvas = document.querySelector('.subhero canvas.stars');
    const drawStars = () => L.stars(canvas, 120, 4 + seed);
    drawStars();
    addEventListener('resize', drawStars);
})();

/* ========== RIDGES — footer and CV sheet ========== */
(() => {
    const L = window.Landscape;
    if (!L) return;

    document.querySelectorAll('.footer-ridge').forEach((svg, i) => {
        const pts = L.ridge({ seed: 31 + i, base: 66, rough: 26, steps: 6, peaks: [{ x: 1040, h: 52, w: 260, k: 1.3 }, { x: 320, h: 24, w: 220 }] });
        svg.innerHTML = `<path d="${L.fill(pts, 90)}"/>`;
    });

    document.querySelectorAll('.cv-ridge').forEach((svg) => {
        const far = L.ridge({ seed: 5, base: 70, rough: 30, steps: 6, peaks: [{ x: 1180, h: 56, w: 240, k: 1.4 }, { x: 420, h: 30, w: 260 }] });
        const near = L.ridge({ seed: 19, base: 98, rough: 16, steps: 6, peaks: [{ x: 760, h: 22, w: 320 }] });
        svg.innerHTML = `<path class="far" d="${L.fill(far, 120)}"/><path class="near" d="${L.fill(near, 120)}"/>`;
    });
})();

/* ========== PROJECT GALLERY LIGHTBOX ========== */
(() => {
    const items = Array.from(document.querySelectorAll('.project-gallery .gallery-item'));
    if (!items.length) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML = `
        <button class="lightbox-btn lightbox-close" aria-label="Close">×</button>
        <button class="lightbox-btn lightbox-prev" aria-label="Previous">‹</button>
        <button class="lightbox-btn lightbox-next" aria-label="Next">›</button>
        <img class="lightbox-img" alt="">
        <div class="lightbox-caption"></div>
    `;
    document.body.appendChild(lightbox);

    const imgEl     = lightbox.querySelector('.lightbox-img');
    const captionEl = lightbox.querySelector('.lightbox-caption');
    const closeBtn  = lightbox.querySelector('.lightbox-close');
    const prevBtn   = lightbox.querySelector('.lightbox-prev');
    const nextBtn   = lightbox.querySelector('.lightbox-next');

    let current = 0;

    const show = (i) => {
        current = (i + items.length) % items.length;
        const item    = items[current];
        const src     = item.querySelector('img')?.getAttribute('src') || '';
        const caption = item.querySelector('.gallery-item-caption')?.textContent.trim() || '';
        imgEl.src = src;
        imgEl.alt = caption;
        captionEl.textContent = caption;
        captionEl.style.display = caption ? 'block' : 'none';
    };

    const open = (i) => {
        show(i);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    };

    const close = () => {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        imgEl.src = '';
        items[current].focus();
    };

    items.forEach((item, i) => {
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.addEventListener('click', () => open(i));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
        });
    });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn.addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape')     close();
        if (e.key === 'ArrowLeft')  show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
    });
})();
