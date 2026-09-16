# nevio.dev

Personal portfolio website for **Nevio** — Full Stack Developer at [VALCODE](https://valcode.ch), based in Wallis, Switzerland.

## Live

[nevio.dev](https://nevio.dev)

## Stack

| Layer   | Tech                                              |
|---------|---------------------------------------------------|
| Markup  | HTML5                                             |
| Styles  | Vanilla CSS (custom design system)                |
| Scripts | Vanilla JavaScript · GSAP + ScrollTrigger · Lenis (CDN, home only) |
| Fonts   | Archivo · Hanken Grotesk · JetBrains Mono (Google Fonts) |
| Hosting | VPS + Nginx + Let's Encrypt (Certbot)             |

## Project Structure

```
nevio.dev/
├── index.html          # Home (hero, about, projects, route, backpack, summit/contact)
├── cv.html             # Printable A4 CV (Download PDF = browser print)
├── projects/           # Case studies: slopesafe, pyra, aiventure
├── css/
│   └── style.css       # All styles — tokens (light/dark), home, subpages, CV, print
├── js/
│   ├── i18n.js         # DE/EN switcher, reads data-i18n* attributes
│   ├── i18n.json       # All translations
│   ├── landscape.js    # Seeded generator for ridges, snow, trees, stars
│   ├── home.js         # Hero scene, altimeter, hiking trail, contact form, scroll motion
│   └── main.js         # Subpages: mountain header, footer/CV ridges, gallery lightbox
├── nginx/
│   ├── nevio.dev.conf  # Nginx server blocks (HTTP redirect + HTTPS with SSL)
│   └── deploy.sh       # One-shot server setup script (Nginx + Certbot + UFW)
└── README.md
```

Screenshots live in `assets/` on the server (git-ignored).

## Design

Alpine ascent — scrolling the home page climbs from Visp (651 m) to the Allalinhorn (4’027 m):
- Generated mountain layers with parallax; the name sits on a ridge
- Fixed altimeter that tracks the current "station" while scrolling
- Swiss hiking signpost (yellow) as navigation, white-red-white trail blazes as markers
- Night summit with a summit cross for the contact section
- Light and dark theme via `prefers-color-scheme`; motion respects `prefers-reduced-motion`

## Sections

| # | Section         | Station        | Description                                            |
|---|-----------------|----------------|--------------------------------------------------------|
| 1 | Hero            | Visp           | Intro, signpost navigation                             |
| 2 | About           | Saas-Fee       | Bio + legend table                                     |
| 3 | Projects        | Felskinn       | Bento cards with live mock-ups                         |
| 4 | Route           | Mittelallalin  | Experience as a hiking trail that draws while scrolling|
| 5 | Backpack        | —              | Skills + GitHub contribution chart                     |
| 6 | Summit          | Allalinhorn    | Contact form (opens the mail app)                      |

## Development

No build step required — plain HTML/CSS/JS.

```bash
# Serve locally with any static server, e.g.:
npx serve .
# or just open index.html directly in your browser
```

## Server Deployment (Nginx + HTTPS)

### Prerequisites
- Debian/Ubuntu VPS with a public IP
- DNS A records for `nevio.dev` and `www.nevio.dev` pointing to your server

### One-command setup

```bash
# Clone repo on the server, then:
sudo bash nginx/deploy.sh
```

The script will:
1. Install **nginx**, **certbot** (`python3-certbot-nginx`), and **ufw**
2. Open ports 80 / 443 in the firewall
3. Copy site files to `/var/www/nevio.dev`
4. Start Nginx with the HTTP config
5. Run `certbot --nginx` to obtain a free Let's Encrypt certificate
6. Swap in the full HTTPS config (HTTP/2, security headers, gzip, asset caching)
7. Enable the certbot systemd timer (or add a cron) for automatic renewal

### Manual steps (if you prefer)

```bash
# 1. Install deps
sudo apt-get install nginx certbot python3-certbot-nginx

# 2. Copy site files
sudo rsync -av --exclude '.git' --exclude 'nginx' . /var/www/nevio.dev/

# 3. Install Nginx config
sudo cp nginx/nevio.dev.conf /etc/nginx/sites-available/nevio.dev.conf
sudo ln -s /etc/nginx/sites-available/nevio.dev.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. Obtain certificate
sudo certbot --nginx -d nevio.dev -d www.nevio.dev -m hi@nevio.dev --agree-tos --redirect

# 5. Verify auto-renewal
sudo certbot renew --dry-run
```

### What the Nginx config does

| Feature              | Detail                                              |
|----------------------|-----------------------------------------------------|
| HTTP → HTTPS         | 301 redirect, ACME challenge passthrough            |
| TLS                  | Managed by Certbot (`options-ssl-nginx.conf`)       |
| HTTP/2               | Enabled on port 443                                 |
| HSTS                 | `max-age=1y; includeSubDomains; preload`            |
| Security headers     | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| Gzip                 | CSS, JS, SVG, fonts                                 |
| Static asset caching | 1-year `Cache-Control: immutable` for CSS/JS/fonts/images |
| Dotfile protection   | `location ~ /\. { deny all; }`                     |

## Contact

**Email:** hi@nevio.dev
**Company:** [valcode.ch](https://valcode.ch)
**Location:** Wallis, Switzerland / Remote
