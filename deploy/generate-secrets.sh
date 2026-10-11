#!/bin/sh
# Writes local secret names into .env. Does not print the values.
set -eu
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  echo ".env already exists. Edit it by hand; this script will not overwrite it." >&2
  exit 1
fi

umask 077
enc="$(openssl rand -base64 32 | tr -d '\n')"
sess="$(openssl rand -hex 32 | tr -d '\n')"

cat > .env <<EOF
DATA_ENCRYPTION_KEY=${enc}
SESSION_SECRET=${sess}
FORCE_HTTPS=1
LOG_TO_STDOUT=1
APP_DOMAIN=localhost
APP_ORIGIN=https://localhost
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
VIDEO_ROOM_BASE_URL=
RESEND_API_KEY=
DAILY_DOMAIN=
ACME_EMAIL=
EOF

echo "Wrote .env with DATA_ENCRYPTION_KEY and SESSION_SECRET. Fill the rest before a public host."
