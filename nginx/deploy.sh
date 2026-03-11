#!/usr/bin/env bash
# ============================================================
#  nevio.dev — Server setup script
#  Run as root on a fresh Debian/Ubuntu VPS.
#
#  Usage:
#    chmod +x deploy.sh
#    sudo ./deploy.sh
# ============================================================
set -euo pipefail

DOMAIN="nevio.dev"
WWW_ROOT="/var/www/${DOMAIN}"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}.conf"
EMAIL="hi@nevio.dev"   # used by certbot for renewal notices

# ── 1. System packages ──────────────────────────────────────
echo ">>> Installing packages..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx ufw

# ── 2. Firewall ─────────────────────────────────────────────
echo ">>> Configuring UFW..."
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

# ── 3. Document root ────────────────────────────────────────
echo ">>> Creating document root ${WWW_ROOT}..."
mkdir -p "${WWW_ROOT}"

# Copy site files (run from repo root, adjust path as needed)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "${SCRIPT_DIR}")"

rsync -av --delete \
    --exclude '.git' \
    --exclude 'nginx' \
    --exclude 'README.md' \
    "${REPO_ROOT}/" "${WWW_ROOT}/"

chown -R www-data:www-data "${WWW_ROOT}"
chmod -R 755 "${WWW_ROOT}"

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
        try_files \$uri \$uri/ =404;
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

# ── 7. Auto-renew cron ──────────────────────────────────────
echo ">>> Verifying certbot renewal timer..."
systemctl enable --now certbot.timer 2>/dev/null || true
# Fallback cron if systemd timer isn't available
if ! systemctl is-active --quiet certbot.timer; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
    echo "    Renewal cron added."
else
    echo "    Systemd certbot.timer is active."
fi

echo ""
echo "✓ Done! https://${DOMAIN} is live."
