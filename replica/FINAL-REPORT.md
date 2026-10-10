# Final report

`tools/verify.sh --strict` exited 0 on 2026-10-10. All 11 features are `verified`.

## 1. Status

| ID | Name | Status | Verify command |
| --- | --- | --- | --- |
| F1 | Client records and appointment calendar | verified | `npx playwright test e2e/f1-calendar.spec.ts` |
| F2 | Appointment reminders | verified | `npx vitest run tests/f2-reminders.test.ts` |
| F3 | Notes: templates, e-signature, timestamps | verified | `npx vitest run tests/f3-notes.test.ts` |
| F4 | Audit trail | verified | `npx vitest run tests/f4-audit.test.ts` |
| F5 | Secure client portal | verified | `npx playwright test e2e/f5-portal.spec.ts` |
| F6 | Stripe test payment and cash/transfer | verified | `npx vitest run tests/f6-payments.test.ts` |
| F7 | Superbill generator | verified | `npx vitest run tests/f7-superbill.test.ts` |
| F8 | Telehealth embed | verified | `npx playwright test e2e/f8-telehealth.spec.ts` |
| F9 | Data export | verified | `npx vitest run tests/f9-export.test.ts` |
| F10 | HIPAA-defensible baseline | verified | `npx vitest run tests/f10-hipaa.test.ts` |
| F11 | No insurance billing | verified | `npx vitest run tests/f11-scope.test.ts` |

## 2. Evidence

Receipts, including command output and exit codes, are in `replica/EVIDENCE.md`. A feature is verified only if that file shows exit code 0 for it.

## 3. Blocked

Nothing in `replica/features.json` is blocked. These are still required before a real client, and they are not done:

- A lawyer-reviewed BAA, plus signed agreements with the host, Stripe, email or SMS, and the video vendor.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID` from the human's own Stripe account.
- `VIDEO_ROOM_BASE_URL` pointing at a vendor that will sign a BAA. The default public room is not that.
- `RESEND_API_KEY` if reminders should actually send.
- A domain. Deploy was not run.

## 4. Deviations

- The database is SQLite with AES-256-GCM on client fields, not hosted Postgres. Chosen so the suite runs without credentials. See `replica/DECISIONS.md`.
- Card success is proven with Stripe's signed test event, not a browser payment against a test API key. The Checkout call exists and runs when a key is set. No platform fee is in the parameters or the ledger.
- Reminders are queued and idempotent. They are not delivered.
- The agreement text says it has not been reviewed by counsel.
- CPT long descriptors are not shipped.
- Feature parity is 95.2. Missing items are calendar sync, a native app, and SMS delivery. Layout screenshots of the reference app were not taken.
- The brand sweep still matches `PRD.md` and `AGENT-BUILD-PROMPT.md`, which name the reference product on purpose. Application code does not.

## 5. How to run

```bash
npm install
cp .env.example .env.local
# put a 32-byte base64 value in DATA_ENCRYPTION_KEY
npm run dev
```

Tests:

```bash
npm test
./tools/verify.sh --strict
```

There is no migration step. The schema is applied when the database file opens. Synthetic data for the export test is created inside the test, not at startup.

Production:

```bash
FORCE_HTTPS=1 npm run build
FORCE_HTTPS=1 npm start
```

## 6. Known weaknesses

- Disk encryption is field-level. A stolen laptop is not covered by a host's disk encryption because there is no host.
- The audit log and session table live in the same SQLite file as the charts. There is no off-site backup.
- The rate limit is in memory and resets when the process restarts.
- Password reset is not built. Closing an account is.
- Public video rooms will leak whatever people say in them. Do not use the default host for a real visit.
- The $29 plan does not charge anyone until a Stripe price exists. Cancel only flips a local status.
- The App Store review sample is 150 reviews from one app, and every theme is thin. It is mostly anger at the phone app, not a full picture of the web product.
- Trademark, domain, and handle checks are written as "to run". None were cleared.
- Two processes writing `.next` at once can fail the production build. Run the build alone.

## 7. What to build next

1. Signed agreements and a BAA-covered video host, then point `VIDEO_ROOM_BASE_URL` at it.
2. A real Stripe test-mode Checkout, with the $29 price, using keys the human creates.
3. Delivery of the reminder outbox through the human's own email or SMS account, still without putting client names in the message.
