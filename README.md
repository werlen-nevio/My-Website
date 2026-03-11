# nevio.dev

Personal portfolio website for **Nevio** — Full Stack Developer at [VALCODE](https://valcode.ch), based in Wallis, Switzerland.

## Live

[nevio.dev](https://nevio.dev)

## Stack

| Layer   | Tech                                              |
|---------|---------------------------------------------------|
| Markup  | HTML5                                             |
| Styles  | Vanilla CSS (custom design system)                |
| Scripts | Vanilla JavaScript                                |
| Fonts   | Special Elite · Caveat · Space Mono (Google Fonts)|
| Hosting | VPS + Nginx + Let's Encrypt (Certbot)             |

## Project Structure

```
nevio.dev/
├── index.html        # Main page (nav, hero, about, skills, experience, projects, contact, footer)
├── css/
│   └── style.css     # All styles — variables, layout, components, responsive breakpoints
├── js/
│   └── main.js       # Contact form handling, nav active state, misc interactions
├── nginx/
│   ├── nevio.dev.conf  # Nginx server blocks (HTTP redirect + HTTPS with SSL)
│   └── deploy.sh       # One-shot server setup script (Nginx + Certbot + UFW)
└── README.md
```

## Design

Notebook / brutalist aesthetic:
- Lined paper background with red margin rule
- Ink-on-paper color palette (`--paper`, `--ink`, `--green`, `--yellow`)
- Hand-written feel via **Caveat** font
- Typewriter feel via **Special Elite** / **Space Mono**
- Hard borders, offset box-shadows, subtle card rotations

## Sections

| # | Section       | Description                                                       |
|---|---------------|-------------------------------------------------------------------|
| 1 | Hero          | Intro, online status badge, CTA buttons, ticker tape              |
| 2 | About         | Bio, blockquote, info table                                       |
| 3 | Skills        | 16-skill grid (Frontend / Backend / 3D / DevOps)                  |
| 4 | Experience    | Chronological work log                                            |
| 5 | Stats         | GitHub activity chart + VALCODE product overview                  |
| 6 | Projects      | PYRA · Valcode Appoint · 3D Portfolio · Track Attack              |
| 7 | Testimonials  | Auto-scrolling review cards (pauses on hover)                     |
| 8 | Contact       | Contact info + accessible form with client-side validation        |

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
