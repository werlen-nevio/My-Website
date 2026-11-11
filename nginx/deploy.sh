#!/usr/bin/env bash
# ============================================================
#  nevio.dev — Server setup & deploy script
#  Run as root on a Debian/Ubuntu VPS from inside the repo.
#
#  Usage:
#    sudo ./nginx/deploy.sh            # first-time setup: nginx, certbot, firewall, build, deploy
#    sudo ./nginx/deploy.sh --update   # later deploys: build + sync + reload only
#
#  Requires Node.js >= 22.23 and npm on the server (or build locally
#  and copy dist/ over – the script skips the build if npm is missing
#  but dist/ already exists).
# ============================================================
set -euo pipefail

DOMAIN="nevio.dev"
WWW_ROOT="/var/www/${DOMAIN}"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}.conf"
EMAIL="hi@nevio.dev"   # used by certbot for renewal notices

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "${SCRIPT_DIR}")"
MODE="${1:-setup}"

# The distro's Node is too old for Astro; prefer the standalone install if present
NODE_HOME="${NODE_HOME:-/opt/node/current}"
if [ -x "${NODE_HOME}/bin/node" ]; then
    export PATH="${NODE_HOME}/bin:${PATH}"
fi

build_site() {
    echo ">>> Building site..."
    cd "${REPO_ROOT}"
    if command -v npm >/dev/null 2>&1; then
        npm ci --no-audit --no-fund
        npm run build:fast
    elif [ -d "${REPO_ROOT}/dist" ]; then
        echo "    npm not found – deploying the existing dist/ folder."
    else
        echo "!!  Neither npm nor a prebuilt dist/ found. Install Node.js >= 22.23 or build locally." >&2
        exit 1
    fi
}

sync_site() {
    echo ">>> Syncing dist/ to ${WWW_ROOT}..."
    mkdir -p "${WWW_ROOT}"
    # --delete removes stale pages, but never the server-only screenshots in assets/
    rsync -a --delete --exclude 'assets/' "${REPO_ROOT}/dist/" "${WWW_ROOT}/"

    # Screenshots are git-ignored and live next to the repo on the server
    if [ -d "${REPO_ROOT}/assets" ]; then
        echo ">>> Syncing screenshots (assets/)..."
        rsync -a "${REPO_ROOT}/assets/" "${WWW_ROOT}/assets/"
    fi

    chown -R www-data:www-data "${WWW_ROOT}"
    find "${WWW_ROOT}" -type d -exec chmod 755 {} +
    find "${WWW_ROOT}" -type f -exec chmod 644 {} +
}

# ── Update: build, sync, reload ─────────────────────────────
if [ "${MODE}" = "--update" ]; then
    build_site
    sync_site
    nginx -t
    systemctl reload nginx
    echo ""
    echo "✓ Updated https://${DOMAIN}"
    exit 0
fi

# ── 1. System packages ──────────────────────────────────────
echo ">>> Installing packages..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx ufw rsync

# ── 2. Firewall ─────────────────────────────────────────────
echo ">>> Configuring UFW..."
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

# ── 3. Build + document root ────────────────────────────────
build_site
sync_site

# ── 4. Nginx config (HTTP only — before certbot) ────────────
echo ">>> Installing temporary HTTP-only Nginx config..."
cat > "${NGINX_CONF}" <<HTTPONLY
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${WWW_ROOT};
    index index.html;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        try_files \$uri \$uri.html \$uri/ =404;
    }
}
HTTPONLY

ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# ── 5. Certbot — obtain certificate ─────────────────────────
echo ">>> Running Certbot..."
certbot --nginx \
    -d "${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    -m "${EMAIL}" \
    --redirect

# ── 6. Deploy final config (with SSL) ───────────────────────
echo ">>> Installing final Nginx config (HTTPS)..."
cp "${SCRIPT_DIR}/nevio.dev.conf" "${NGINX_CONF}"
nginx -t
systemctl reload nginx

# ── 7. Auto-renew ───────────────────────────────────────────
echo ">>> Verifying certbot renewal timer..."
systemctl enable --now certbot.timer 2>/dev/null || true
if ! systemctl is-active --quiet certbot.timer; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
    echo "    Renewal cron added."
else
    echo "    Systemd certbot.timer is active."
fi

echo ""
echo "✓ Done! https://${DOMAIN} is live."
