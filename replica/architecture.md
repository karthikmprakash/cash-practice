# Architecture

Stack: Next.js 15 App Router, TypeScript, better-sqlite3, AES-256-GCM for client fields, Stripe Checkout when a key is present, pdf-lib for PDFs.

Why this and not the hosted default: the acceptance suite has to run with no Supabase project, no Stripe account, and no domain. SQLite on disk plus field encryption is the local stand-in. Postgres is the swap when a host exists. One database. No services split apart.

| layer | choice | why |
| --- | --- | --- |
| web | Next.js App Router + TypeScript | boring, one deployable |
| style | tokens.css + Tailwind mapping | roles, not raw hex in components |
| database | SQLite via better-sqlite3 | runs in tests; encrypted columns for client fields |
| auth | email, scrypt, httpOnly cookie | no third-party auth project required |
| payments | Stripe Checkout on the practitioner's `acct_` id, fee omitted | their money, not a platform cut |
| jobs | rows in `reminder_jobs` and `outbox` | idempotent, no vendor send |
| video | `@daily-co/daily-js` or the Jitsi external script | not our WebRTC |
| files | PDF bytes returned by the app | no object store yet |

## Schema

Canonical SQL: `replica/schema.sql` (same file the app executes from `src/server/schema.sql`).

Access rule: every query that returns client data takes the practitioner id and filters on it. A second account gets nothing. Audit rows are insert-only via triggers. Signed notes reject updates via a trigger.

Money is integer cents. Times are UTC text. PHI columns are `v1:` AES-GCM payloads. The audit table stores actor, action, entity type, entity id, and time. It does not store names or note text.

## API

| method path | what it does | who | flow |
| --- | --- | --- | --- |
| POST signup action | create account, set session | public | F01 |
| POST login action | session cookie | public | F01 |
| POST baa action | store NPI and tax id encrypted, mark agreement | signed in | F01 |
| POST create client | encrypted client row + audit | practice | F02 |
| POST book | appointment, reminder jobs | practice | F02 |
| GET /calendar | day or week | practice | F02 |
| POST note save / sign | draft or immutable signed note | practice | F03 |
| POST intake link | hashed token, raw token returned once | practice | F04 |
| POST portal intake | answers + consent hash | token holder | F04 |
| POST manual payment | cash or transfer | practice | F05 |
| POST card | Checkout Session, no application fee | practice, needs Stripe key | F05 |
| POST /api/stripe/webhook | verify signature, record once | Stripe | F05 |
| GET superbill | PDF for a date range | practice | F06 |
| GET /appointments/:id/video | unguessable room URL | practice | F07 |
| GET /api/export | JSON, CSV, or note PDF | practice | export |
| POST settings | reminder offsets, Stripe account id | practice | reminders |
| POST cancel plan | status `cancel_requested` | practice | billing |
| POST delete account | delete the practice row, keep audit | practice | account |

## Parts that bite

- Time zones: stored UTC, grouped with `Intl` in the practice zone. Tests use UTC.
- Webhooks: event id is a primary key. A second delivery does not create a second payment.
- Stripe product names do not include the client name.
- Room names are 32 random bytes. The client name is not in the URL.
- Production startup throws unless `FORCE_HTTPS=1`. The build phase is exempt so `next build` can run.
- Reminder bodies do not include the client name. They are encrypted in the outbox and not sent.
- Account deletion cascades clinical rows and leaves the audit log.

## Build order

1. Vertical slice: sign up, agreement, client, booking, calendar. Done.
2. Notes, audit, portal, payments, superbill, export, video, HIPAA checks, scope guard. Done.
3. Should-haves not in the contract (calendar sync, SMS delivery) wait for credentials.

Next step was design, then the build. Both are in the repo.
