# Deploy checklist: CashPractice

Date: 2026-10-11  Commit: local  Go from user: not yet (host stack only)

The user asked for Docker Compose, VCS, CI/CD, and GitHub Releases. This is the production host. No live domain, Stripe live mode, or DNS was applied.

## Preflight (all must pass)

- [x] no open S1 or S2 bugs (`replica/bugs.md`)
- [ ] e2e suite green: not re-run in this pass
- [ ] parity: not re-run in this pass
- [ ] rebrand sweep: not re-run in this pass
- [x] store listing: not shipping to stores
- [ ] production build: image job in CI
- [x] privacy/security page exists at `/security`
- [x] account deletion exists
- [x] favicon and titles are CashPractice

## Production

- [x] separate SQLite volume `cashpractice-data` (not the developer `data/` file)
- [x] backups: `deploy/backup.sh`
- [x] schema applied on first open of the volume
- [x] env var names match `.env.example`
- [ ] env values: operator runs `deploy/generate-secrets.sh` and fills vendor keys
- [ ] Stripe live: products, prices, webhook, one real purchase refunded
- [ ] email sending domain verified
- [x] OAuth: none in this build

## Domain

Operator-owned. After they buy the name:

| record | name | value |
| --- | --- | --- |
| A | @ | VPS public IPv4 |
| AAAA | @ | VPS public IPv6, if any |
| CNAME | www | the apex, or the same A |

Caddy on the box issues the certificate. Canonical host is `APP_DOMAIN`. Set `APP_ORIGIN` to `https://<that host>`.

Email DNS (when Resend is connected): SPF, DKIM, DMARC `v=DMARC1; p=none; rua=mailto:you@yourdomain`.

## Watch

- [x] process health: `GET /api/health`
- [x] container healthcheck in Compose
- [x] stdout logs when `LOG_TO_STDOUT=1`
- [ ] uptime check on `/api/health` (operator's monitor)
- [ ] error tracking (not wired; add Sentry only with a BAA)
- [ ] first-week: sign up, book, note, collect, export on the live host

## VCS and releases

- GitHub: https://github.com/karthikmprakash/cash-practice
- CI: `.github/workflows/ci.yml`
- Release: tag `v*`, `.github/workflows/release.yml`, image `ghcr.io/karthikmprakash/cash-practice`
- Dependabot: npm, Actions, Docker
