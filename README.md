# CashPractice

Solo cash-pay practice software: the day, the chart, the payment, and the superbill. Production host is Docker Compose behind Caddy. Images and GitHub Releases are cut from version tags.

## Run it

```bash
git clone https://github.com/karthikmprakash/cash-practice.git
cd cash-practice
sh deploy/generate-secrets.sh
# set APP_DOMAIN and APP_ORIGIN in .env to the public hostname
docker compose up --build -d
```

Caddy terminates TLS on 80/443 and proxies to the app. The SQLite file lives in the `cashpractice-data` volume. Open `https://$APP_DOMAIN`.

Required in `.env` before a public host: `DATA_ENCRYPTION_KEY` (32-byte base64), `SESSION_SECRET`, `APP_DOMAIN`, `APP_ORIGIN`. Fill Stripe, Resend, and the video host when those vendors exist. Names only are in `.env.example`.

## Day-to-day

| Task | Command |
| --- | --- |
| Logs | `docker compose logs -f app` |
| Health | `curl -fsS https://$APP_DOMAIN/api/health` |
| Backup the books | `sh deploy/backup.sh` |
| Stop | `docker compose down` |

The database is created on first boot from `src/server/schema.sql`. Keep volume backups; PHI lives in that file.

## Releases

CI on `main` and every pull request: lint, typecheck, Vitest, and a Docker build.

A tag `v*` builds `ghcr.io/karthikmprakash/cash-practice`, pushes `:version`, `:major.minor`, and `:latest`, and opens a GitHub Release.

```bash
git tag v0.1.0
git push origin v0.1.0
```

On the host, pin the image and pull:

```bash
export CASHPRACTICE_VERSION=0.1.0
docker compose pull
docker compose up -d
```

## Develop

```bash
cp .env.example .env.local
# put a local DATA_ENCRYPTION_KEY in .env.local
npm install
npm run dev
npm test
```
