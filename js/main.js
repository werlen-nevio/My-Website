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
            showStatus('Bitte alle Felder ausfüllen.', 'error');
            return;
        }

        const subject = encodeURIComponent(`Kontakt von ${name}`);
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
