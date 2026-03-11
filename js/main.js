/**
 * nevio.dev — Main JS
 * Handles contact form, nav active states, and misc interactions.
 */

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

        // Simulate send (replace with real fetch/API call)
        const btn = contactForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Sende...';

        setTimeout(() => {
            showStatus('Nachricht gesendet ✓ Ich melde mich bald!', 'success');
            contactForm.reset();
            btn.disabled = false;
            btn.textContent = 'Nachricht senden ✉️';
        }, 900);
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
