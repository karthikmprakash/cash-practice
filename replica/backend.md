# Backend checklist

- [x] secrets only in env vars, `.env*` gitignored, client files scanned at build
- [x] server checks on signup, clients, notes, payments, portal
- [x] a second user gets no rows (tested)
- [x] rate limit on signup and login (disabled in the test env)
- [x] Stripe webhook checks the signature and stores the event id
- [ ] uploads: no file upload in this version
- [x] client values are not written to the log helper; URLs do not carry names
- [ ] `npm audit` not treated as a gate
- [x] processors named on /security: host, Stripe, email/SMS, video vendor

## Not connected until the human adds keys

| variable | used for |
| --- | --- |
| STRIPE_SECRET_KEY | Checkout and webhook verification against Stripe |
| STRIPE_WEBHOOK_SECRET | signature |
| STRIPE_PRICE_ID | the $29 plan, not created here |
| RESEND_API_KEY | sending mail; outbox holds the jobs |
| VIDEO_ROOM_BASE_URL | BAA-covered video host |
| DATA_ENCRYPTION_KEY | 32-byte base64 |
| SESSION_SECRET | reserved |
| FORCE_HTTPS | must be 1 in production |

Backups: the SQLite file is local. A host backup is not turned on because there is no host yet.

Google Calendar OAuth was not started. It is outside the eleven features and the vendor review takes weeks.
