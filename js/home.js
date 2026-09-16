/* ========== HOME ==========
 * Hero scenery, altimeter, hiking trail, contact form and scroll motion.
 * Needs landscape.js; GSAP, ScrollTrigger and Lenis are optional.
 */
(() => {
    const L = window.Landscape;
    if (!L) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const W = 1600, H = 800;
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => [...document.querySelectorAll(s)];
    const t = (key, fallback) => (window.i18n && window.i18n.t(key)) || fallback;
    const f = L.f;

    /* ========== HERO LANDSCAPE ========== */
    const r1 = L.ridge({ seed: 11, base: 470, rough: 80, peaks: [{ x: 900, h: 250, w: 150, k: 1.45 }, { x: 1250, h: 150, w: 260, k: 1.2 }, { x: 420, h: 70, w: 240 }, { x: 1530, h: 110, w: 190 }] });
    $('#L1').innerHTML = `<path class="l1" d="${L.fill(r1, H)}"/><path class="snowcap" d="${L.snow(r1, 395, 5)}"/>`;
    const r2 = L.ridge({ seed: 23, base: 525, rough: 70, peaks: [{ x: 640, h: 100, w: 260 }, { x: 1130, h: 95, w: 230 }, { x: 1480, h: 60, w: 180 }] });
    $('#L2').innerHTML = `<path class="l2" d="${L.fill(r2, H)}"/><path class="snowcap" d="${L.snow(r2, 470, 9)}" opacity=".9"/>`;
    const r3 = L.ridge({ seed: 41, base: 578, rough: 46, peaks: [{ x: 1430, h: 90, w: 230 }, { x: 90, h: 36, w: 180 }] });
    $('#L3').innerHTML = `<path class="l3" d="${L.fill(r3, H)}"/><path class="snowcap" d="${L.snow(r3, 530, 3)}" opacity=".75"/>`;
    const r4 = L.ridge({ seed: 7, base: 642, rough: 30, steps: 6 });
    $('#L4').innerHTML = `<path class="l4" d="${L.fill(r4, H)}"/>` +
        L.trees(r4, { seed: 3 }) +
        L.trees(r4.map(([x, y]) => [x, y + 16]), { seed: 8, gap: [10, 22], h: [18, 32] });
    const r5 = L.ridge({ seed: 17, base: 706, rough: 22, steps: 5 });
    $('#L5').innerHTML = `<path class="l5" d="${L.fill(r5, H)}"/>` +
        L.trees(r5, { seed: 21, from: 0, to: 320, gap: [22, 44], h: [52, 96], larch: .35, sink: 8 }) +
        L.trees(r5, { seed: 29, from: 1340, to: 1600, gap: [22, 44], h: [52, 96], larch: .35, sink: 8 });

    // The name sits on the crest of the third ridge
    const hero = $('.hero'), nameEl = $('#heroName');
    function placeName() {
        const box = nameEl.firstElementChild, nm = box.firstElementChild;
        box.style.fontSize = '';
        const cs = getComputedStyle(box);
        const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        if (nm.offsetWidth > avail) box.style.fontSize = (parseFloat(cs.fontSize) * avail / nm.offsetWidth * .98) + 'px';
        const s = Math.max(hero.clientWidth / W, hero.clientHeight / H);
        const fs = parseFloat(getComputedStyle(box).fontSize);
        nameEl.style.setProperty('--name-bottom', `${(H - 578) * s - fs * .16}px`);
    }

    /* ========== SUMMIT WITH CROSS ========== */
    (() => {
        const far = L.ridge({ seed: 5, base: 240, rough: 50, steps: 6, peaks: [{ x: 420, h: 90, w: 300 }, { x: 1380, h: 70, w: 260 }] });
        $('#peakFar').setAttribute('d', L.fill(far, 360));
        const rock = L.ridge({ seed: 13, base: 300, rough: 40, steps: 7, peaks: [{ x: 1000, h: 190, w: 420, k: 1.25 }] });
        const [cx, cy] = rock.reduce((a, p) => p[1] < a[1] ? p : a);
        $('#peakRock').setAttribute('d', L.fill(rock, 360));
        $('#peakGlow').setAttribute('d', L.snow(rock, 190, 4));
        const ch = 46;
        $('#peakCross').innerHTML =
            `<line class="cross" x1="${cx}" y1="${cy + 2}" x2="${cx}" y2="${cy - ch}"/>` +
            `<line class="cross" x1="${cx - 14}" y1="${cy - ch + 13}" x2="${cx + 14}" y2="${cy - ch + 13}"/>`;
    })();

    /* ========== CONTOUR LINES ON THE SLOPESAFE CARD ========== */
    (() => {
        const r = L.rng(99);
        let d = '';
        for (let k = 1; k <= 11; k++) {
            const R = 18 + k * 21, ph = r() * 6, pts = [];
            for (let i = 0; i < 72; i++) {
                const a = i / 72 * Math.PI * 2;
                const rr = R * (1 + .13 * Math.sin(3 * a + ph) + .07 * Math.sin(5 * a + k * .7) + .03 * Math.sin(9 * a));
                pts.push([330 + Math.cos(a) * rr * 1.15, 170 + Math.sin(a) * rr * .85]);
            }
            let p = `M${f((pts[0][0] + pts[71][0]) / 2)} ${f((pts[0][1] + pts[71][1]) / 2)}`;
            for (let i = 0; i < 72; i++) {
                const a = pts[i], b = pts[(i + 1) % 72];
                p += ` Q${f(a[0])} ${f(a[1])} ${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2)}`;
            }
            d += `<path d="${p}Z"${k % 5 === 0 ? ' class="idx"' : ''}/>`;
        }
        $('#topo').innerHTML = d;
    })();

    /* ========== HIKING TRAIL ========== */
    // Offsets instead of bounding rects, so reveal transforms don't bend the path
    function drawTrail() {
        const list = $('#trail'), svg = $('#trailSvg');
        const pts = $$('#trail .wp').map((wp) => {
            const m = wp.querySelector('.blaze');
            return [wp.offsetLeft + m.offsetLeft + m.offsetWidth / 2, wp.offsetTop + m.offsetTop + m.offsetHeight / 2];
        });
        if (!pts.length) return 0;
        let d = `M${pts[0][0]} ${pts[0][1] - 30} L${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dy = y1 - y0, sw = i % 2 ? 44 : -30;
            d += ` C${x0 + sw} ${y0 + dy * .3} ${x1 - sw} ${y1 - dy * .3} ${x1} ${y1}`;
        }
        const last = pts[pts.length - 1];
        d += ` L${last[0]} ${last[1] + 60}`;
        const w = Math.max(90, list.clientWidth), h = list.clientHeight + 60;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.style.width = w + 'px';
        svg.style.height = h + 'px';
        $('#trailCasing').setAttribute('d', d);
        $('#trailLine').setAttribute('d', d);
        return $('#trailLine').getTotalLength();
    }

    /* ========== ALTIMETER ========== */
    const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '’');
    const stations = $$('[data-alt]');
    const MIN = 500, MAX = 4100, track = $('#altTrack'), marker = $('#altMarker');
    const ticks = stations.map((el) => {
        const tick = document.createElement('span');
        tick.className = 'tick';
        tick.style.bottom = ((+el.dataset.alt - MIN) / (MAX - MIN) * 100) + '%';
        tick.innerHTML = `<span>${el.dataset.station} ${fmt(+el.dataset.alt)}</span>`;
        track.appendChild(tick);
        return tick;
    });

    let anchors = [];
    function measure() {
        const max = document.documentElement.scrollHeight - innerHeight;
        anchors = stations.map((el, i) => ({
            y: i === 0 ? 0 : Math.min(max, el.getBoundingClientRect().top + scrollY - innerHeight * .45),
            alt: +el.dataset.alt,
            name: el.dataset.station
        }));
        for (let i = 1; i < anchors.length; i++) anchors[i].y = Math.max(anchors[i].y, anchors[i - 1].y + 1);
    }

    let lastAlt = -1;
    function updateAlt() {
        const y = scrollY;
        let alt = anchors[0].alt, idx = 0;
        for (let i = 1; i < anchors.length; i++) {
            const a = anchors[i - 1], b = anchors[i];
            if (y >= b.y) { alt = b.alt; idx = i; continue; }
            if (y > a.y) {
                const p = (y - a.y) / (b.y - a.y);
                alt = a.alt + (b.alt - a.alt) * p;
                idx = p > .5 ? i : i - 1;
            }
            break;
        }
        if (Math.round(alt) === lastAlt) return;
        lastAlt = Math.round(alt);
        $('#altNum').textContent = fmt(alt);
        $('#altStn').textContent = anchors[idx].name;
        marker.style.bottom = ((alt - MIN) / (MAX - MIN) * 100) + '%';
        ticks.forEach((tick, i) => tick.classList.toggle('passed', alt >= anchors[i].alt - 1));
    }

    let ticking = false;
    addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { updateAlt(); ticking = false; });
    }, { passive: true });

    /* ========== CONTACT FORM -> MAIL APP ========== */
    const form = $('#contact-form'), note = $('#form-note');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const field = (n) => form.querySelector(`[name="${n}"]`).value.trim();
        const name = field('name'), email = field('email'), message = field('message');
        if (!name || !email || !message) {
            note.textContent = t('home.contact.errorRequired', 'Please fill in all fields.');
            return;
        }
        const subject = `${t('home.contact.mailSubject', 'Contact from')} ${name}`;
        const body = `${message}\n\n– ${name} (${email})`;
        window.location.href = `mailto:mail@nevio.dev?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        note.textContent = t('home.contact.sent', 'Your mail app opens with the message. If not: mail@nevio.dev');
    });

    /* ========== LAYOUT ========== */
    let trailLen = 0, motion = false;
    function layout() {
        placeName();
        L.stars($('#heroStars'), 160, 2);
        L.stars($('#summitStars'), 220, 6);
        trailLen = drawTrail();
        measure();
        lastAlt = -1;
        updateAlt();
    }
    function relayout() {
        layout();
        if (motion) ScrollTrigger.refresh();
    }
    layout();

    let resizeTimer;
    addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(relayout, 120); });
    if (document.fonts) document.fonts.ready.then(relayout);
    // Text length changes with the language, so waypoints move
    document.addEventListener('i18n:applied', relayout);

    /* ========== ANCHORS ========== */
    let lenis = null;
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { duration: 1.6 });
        else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }));

    /* ========== MOTION ========== */
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    motion = true;

    if (window.Lenis) {
        lenis = new Lenis({ lerp: .1 });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }

    // Entrance: ridges rise, the name grows out from behind the crest.
    // fromTo with explicit end values: a refresh mid-tween (fonts, i18n) must not
    // re-record the hidden start state as the end state.
    gsap.fromTo('.rise', { y: (i) => 50 + i * 14 }, { y: 0, duration: 1.8, ease: 'power3.out', stagger: .08 });
    gsap.fromTo('#heroName .nm', { yPercent: 38 }, { yPercent: 0, duration: 1.5, ease: 'power3.out', delay: .25 });
    gsap.fromTo('.hero-intro .inner > *', { y: 22 }, { y: 0, duration: 1, ease: 'power3.out', stagger: .08, delay: .1 });
    gsap.fromTo('.signpost .arm', { scaleX: 0 }, { scaleX: 1, duration: .7, ease: 'back.out(1.7)', stagger: .12, delay: .8, clearProps: 'transform' }); // frees the CSS hover nudge

    // Parallax while leaving the valley
    const heroST = () => ({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true });
    $$('.px').forEach((g) => gsap.to(g, { y: +g.dataset.speed * 300, ease: 'none', scrollTrigger: heroST() }));
    gsap.to('#heroName', { y: () => hero.clientHeight * .16, ease: 'none', scrollTrigger: heroST() });
    gsap.to('.hero-intro', { y: -90, ease: 'none', scrollTrigger: heroST() });
    gsap.to('.clouds', { y: 120, ease: 'none', scrollTrigger: heroST() });
    gsap.to('.signpost', { y: -30, ease: 'none', scrollTrigger: heroST() });

    // Soft reveal (content always stays readable)
    $$('.reveal').forEach((el) => gsap.fromTo(el, { y: 48, opacity: .45 }, {
        y: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 62%', scrub: .6 }
    }));

    // Avalanche scale builds up, AI meter fills
    gsap.fromTo('.scale li b', { scaleY: .25 }, {
        scaleY: 1, ease: 'back.out(2)', duration: .7, stagger: .08,
        scrollTrigger: { trigger: '#dangerScale', start: 'top 85%' }
    });
    gsap.fromTo('#aiBar', { scaleX: .1 }, {
        scaleX: 1, ease: 'power2.out', duration: 1.2,
        scrollTrigger: { trigger: '#aiBar', start: 'top 90%' }
    });

    // Trail draws itself while scrolling
    const line = $('#trailLine'), casing = $('#trailCasing');
    const paintTrail = (progress) => [line, casing].forEach((p) => {
        p.style.strokeDasharray = trailLen;
        p.style.strokeDashoffset = trailLen * (1 - progress);
    });
    paintTrail(0);
    ScrollTrigger.create({
        trigger: '#trail', start: 'top 70%', end: 'bottom 55%',
        onRefresh: (st) => paintTrail(st.progress),
        onUpdate: (st) => paintTrail(st.progress)
    });

    // Skills rise like bubbles
    const rc = L.rng(77);
    $$('.chip').forEach((c) => gsap.fromTo(c, { y: 40 + rc() * 70 }, {
        y: 0, ease: 'none',
        scrollTrigger: { trigger: c.closest('.pack'), start: 'top 100%', end: 'top 45%', scrub: .8 }
    }));

    // Summit comes closer
    gsap.fromTo('#peak', { yPercent: 18 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.summit', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });

    // Cards tilt slightly under the pointer
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        $$('.tilt').forEach((card) => {
            card.addEventListener('pointermove', (e) => {
                const b = card.getBoundingClientRect();
                const x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
                gsap.to(card, { rotationX: -y * 4, rotationY: x * 5, transformPerspective: 1000, duration: .4, ease: 'power2.out', overwrite: 'auto' });
            });
            card.addEventListener('pointerleave', () => gsap.to(card, { rotationX: 0, rotationY: 0, duration: .6, ease: 'power3.out', overwrite: 'auto' }));
        });
    }

    ScrollTrigger.addEventListener('refresh', () => { measure(); lastAlt = -1; updateAlt(); });
})();
