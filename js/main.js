/* ========== HAMBURGER MENU ========== */
const hamburger  = document.querySelector('.nav-hamburger');
const mobileNav  = document.querySelector('.nav-mobile');

if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
        const open = mobileNav.classList.toggle('open');
        hamburger.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', open);
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });
}

/* ========== CONTACT FORM ========== */
const contactForm = document.getElementById('contact-form');
const formStatus  = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name    = contactForm.querySelector('input[name="name"]').value.trim();
        const email   = contactForm.querySelector('input[name="email"]').value.trim();
        const message = contactForm.querySelector('textarea[name="message"]').value.trim();

        if (!name || !email || !message) {
            const msg = (window.i18n && window.i18n.t('home.contact.errorRequired')) || 'Please fill in all fields.';
            showStatus(msg, 'error');
            return;
        }

        const subjectText = (window.i18n && window.i18n.t('home.contact.mailSubject')) || 'Contact from';
        const subject = encodeURIComponent(`${subjectText} ${name}`);
        const body    = encodeURIComponent(`Name: ${name}\nE-Mail: ${email}\n\n${message}`);
        window.location.href = `mailto:hi@nevio.dev?subject=${subject}&body=${body}`;
    });
}

function showStatus(msg, type) {
    if (!formStatus) return;
    formStatus.textContent = msg;
    formStatus.className = 'form-status form-status--' + type;
    formStatus.style.display = 'block';
    setTimeout(() => { formStatus.style.display = 'none'; }, 4000);
}

/* ========== NAV ACTIVE STATE ========== */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                navLinks.forEach((link) => {
                    link.classList.toggle(
                        'nav-active',
                        link.getAttribute('href') === '#' + entry.target.id
                    );
                });
            }
        });
    },
    { threshold: 0.35 }
);

sections.forEach((s) => observer.observe(s));

/* ========== SKILL CARDS — hover label ========== */
document.querySelectorAll('.skill-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
        card.style.zIndex = '2';
    });
    card.addEventListener('mouseleave', () => {
        card.style.zIndex = '';
    });
});

/* ========== PROJECT GALLERY LIGHTBOX ========== */
(() => {
    const items = Array.from(document.querySelectorAll('.project-gallery .gallery-item'));
    if (!items.length) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
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
    };

    const close = () => {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        imgEl.src = '';
    };

    items.forEach((item, i) => item.addEventListener('click', () => open(i)));
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
