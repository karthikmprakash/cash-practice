# Decisions log

Every choice made without asking the human goes here: decision, alternatives, why.
Ambiguity is not a reason to stop; it is a reason to write an entry and continue.

| # | date | decision | alternatives rejected | why |
|---|------|----------|----------------------|-----|
| 1 | 2026-10-10 | Build the eleven-feature practice in features.json, positioned on superbills, export, and a short setup. | Superbill-only tool recommended in PRD §7. | features.json is the acceptance contract and matches PRD §4. §7 is the warning not to win by being the cheapest. |
| 2 | 2026-10-10 | SQLite (better-sqlite3) plus AES-256-GCM on client fields. | Hosted Postgres. | No database credentials were available. The suite has to run unattended. Postgres remains the production swap. |
| 3 | 2026-10-10 | Email and password with scrypt and an httpOnly cookie. | Hosted auth. | No auth vendor project. Sessions last 14 days so the app does not demand a login on every open. |
| 4 | 2026-10-10 | Card charges go to a Stripe Connect account id with no application fee. Tests sign a Checkout completion with Stripe's test header helper. | A fake paid flag. | The ledger, signature check, and idempotency are the real code. Creating the remote session runs when STRIPE_SECRET_KEY is set. |
| 5 | 2026-10-10 | Video rooms are random 32-byte names. Daily's SDK joins daily.co URLs. Otherwise the page loads the Jitsi external script. Default host is meet.jit.si. | Building WebRTC. A Daily room that cannot be created without a key. | The room has to be unique and external. Public Jitsi is not a BAA. Set VIDEO_ROOM_BASE_URL before any real visit. Client names are not in the URL. |
| 6 | 2026-10-10 | Reminders are rows with a unique (appointment, offset). Dispatch writes one encrypted outbox row. | Sending SMS. | No SMS key. Re-running the scheduler does not duplicate. |
| 7 | 2026-10-10 | Service descriptions are the practitioner's words. Default is "Clinical session". | Shipping CPT long descriptors. | Those descriptors are not ours to copy. |
| 8 | 2026-10-10 | Overlapping sessions are allowed. | A database exclusion. | A solo day sometimes stacks. The calendar shows both. |
| 9 | 2026-10-10 | The Solo plan is $29 and cancel sets cancel_requested. Access is not locked behind a live Stripe price. | A hard paywall. | There is no price id in the environment. Locking charts behind it would hide the product. |
| 10 | 2026-10-10 | One audit row per public read or write. Internal authorization selects are not a second row. | A row per SQL statement. | The acceptance test counts operations. |
| 11 | 2026-10-10 | The agreement text is operational and marked as not reviewed by counsel. | Pretending a lawyer signed off. | A real BAA with the host, email, SMS, Stripe, and video vendor is still the human's job. |
| 12 | 2026-10-10 | Accounts are isolated even though the product is for one clinician. | A single global database. | A second login must not see the first practice. That is the access test. |
| 13 | 2026-10-10 | Review sample is 150 recent App Store reviews of the clinician app, one source. Reddit and the second store listing were not usable (timeout, empty feed, or not about this product). | Inventing quotes to reach three sources. | Themes are thin. The mobile app's calendar and login dominate that sample. It is not the whole web product. |
