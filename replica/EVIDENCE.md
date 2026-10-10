# Evidence log

Append-only receipts written by `tools/record.py`. A feature is `verified` only if a
command here exited 0. Do not hand-edit this file.

## [F1] Client records and appointment calendar — 2026-10-10 17:23:08Z

note: Signed up, added a client, booked 15:00 UTC on 2026-06-15, saw the session on day and week views, and opened the chart.

command: `npx playwright test e2e/f1-calendar.spec.ts`
exit code: 0

```
Running 1 test using 1 worker

  ✓  1 [chromium] › e2e/f1-calendar.spec.ts:4:5 › create a client, book a session, and see it on the calendar and chart (6.2s)

  1 passed (10.3s)
(node:87389) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
[WebServer]  ⚠ Cross origin request detected from 127.0.0.1 to /_next/* resource. In a future major version of Next.js, you will need to explicitly configure "allowedDevOrigins" in next.config to allow this.
[WebServer] Read more: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
```

## [F11] Scope guard: no insurance billing — 2026-10-10 17:23:09Z

note: Walked app and src for claims, clearinghouse, eligibility, ERA, EOB, and 837 modules.

command: `npx vitest run tests/f11-scope.test.ts`
exit code: 0

```
RUN  v3.2.7 /Users/karthikmprakash/Documents/Personal/Projects/cashpractice

 ✓ tests/f11-scope.test.ts (1 test) 3ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  22:53:08
   Duration  154ms (transform 16ms, setup 8ms, collect 6ms, tests 3ms, environment 0ms, prepare 29ms)
```

## [F2] Appointment reminders — 2026-10-10 17:23:09Z

note: 24h and 1h send times; second enqueue inserted 0; dispatch did not double-send.

command: `npx vitest run tests/f2-reminders.test.ts`
exit code: 0

```
RUN  v3.2.7 /Users/karthikmprakash/Documents/Personal/Projects/cashpractice

 ✓ tests/f2-reminders.test.ts (1 test) 32ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  22:53:09
   Duration  230ms (transform 47ms, setup 8ms, collect 54ms, tests 32ms, environment 0ms, prepare 25ms)
```

## [F3] Notes: templates, e-signature, timestamps — 2026-10-10 17:23:10Z

note: SOAP, DAP, and free notes sign with UTC time and hash; app and SQL updates of signed notes fail.

command: `npx vitest run tests/f3-notes.test.ts`
exit code: 0

```
RUN  v3.2.7 /Users/karthikmprakash/Documents/Personal/Projects/cashpractice

 ✓ tests/f3-notes.test.ts (1 test) 33ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  22:53:10
   Duration  221ms (transform 40ms, setup 8ms, collect 45ms, tests 33ms, environment 0ms, prepare 25ms)
```

## [F4] Audit trail — 2026-10-10 17:23:11Z

note: Four operations produced four audit rows; update and delete aborted; a second account saw nothing.

command: `npx vitest run tests/f4-audit.test.ts`
exit code: 0

```
RUN  v3.2.7 /Users/karthikmprakash/Documents/Personal/Projects/cashpractice

 ✓ tests/f4-audit.test.ts (1 test) 57ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  22:53:10
   Duration  246ms (transform 43ms, setup 8ms, collect 48ms, tests 57ms, environment 0ms, prepare 25ms)
```

## [F6] Take payment via the practitioner's own Stripe + record cash/transfer — 2026-10-10 17:23:12Z

note: Signed checkout.session.completed plus cash and transfer reconciled to zero difference and zero platform fee.

command: `npx vitest run tests/f6-payments.test.ts`
exit code: 0

```
RUN  v3.2.7 /Users/karthikmprakash/Documents/Personal/Projects/cashpractice

 ✓ tests/f6-payments.test.ts (1 test) 33ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  22:53:11
   Duration  274ms (transform 45ms, setup 8ms, collect 102ms, tests 33ms, environment 0ms, prepare 24ms)
```

## [F8] Telehealth via third-party embed — 2026-10-10 17:23:21Z

note: Two sessions produced two meet.jit.si room URLs; source imports daily-js and does not implement RTCPeerConnection.

command: `npx playwright test e2e/f8-telehealth.spec.ts`
exit code: 0

```
Running 1 test using 1 worker

  ✓  1 [chromium] › e2e/f8-telehealth.spec.ts:16:5 › each session launches a unique third-party room (6.4s)

  1 passed (9.2s)
(node:88025) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
[WebServer]  ⚠ Cross origin request detected from 127.0.0.1 to /_next/* resource. In a future major version of Next.js, you will need to explicitly configure "allowedDevOrigins" in next.config to allow this.
[WebServer] Read more: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
```

## [F10] HIPAA-defensible baseline — 2026-10-10 17:23:22Z

note: Logger redaction, ciphertext at rest, client secret guard, and TLS-only production config.

command: `npx vitest run tests/f10-hipaa.test.ts`
exit code: 0

```
RUN  v3.2.7 /Users/karthikmprakash/Documents/Personal/Projects/cashpractice

 ✓ tests/f10-hipaa.test.ts (1 test) 133ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  22:53:22
   Duration  333ms (transform 43ms, setup 7ms, collect 53ms, tests 133ms, environment 0ms, prepare 28ms)
```

## [F5] Secure client portal: intake, consent, messaging — 2026-10-10 17:23:31Z

note: Intake completed in a clean browser from a token link and showed on the chart.

command: `npx playwright test e2e/f5-portal.spec.ts`
exit code: 0

```
Running 1 test using 1 worker

  ✓  1 [chromium] › e2e/f5-portal.spec.ts:4:5 › client completes intake from a token link without an account (5.5s)

  1 passed (8.2s)
(node:88496) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
[WebServer]  ⚠ Cross origin request detected from 127.0.0.1 to /_next/* resource. In a future major version of Next.js, you will need to explicitly configure "allowedDevOrigins" in next.config to allow this.
[WebServer] Read more: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
```

## [F9] Data export and portability — 2026-10-10 17:23:32Z

note: Seeded 100 clients and checked JSON, CSV, and note PDF counts.

command: `npx vitest run tests/f9-export.test.ts`
exit code: 0

```
RUN  v3.2.7 /Users/karthikmprakash/Documents/Personal/Projects/cashpractice

 ✓ tests/f9-export.test.ts (1 test) 164ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  22:53:31
   Duration  439ms (transform 54ms, setup 8ms, collect 134ms, tests 164ms, environment 0ms, prepare 25ms)
```

## [F7] Superbill generator — 2026-10-10 17:23:33Z

note: PDF text included identity, diagnosis, CPT, charged and paid amounts, and excluded the out-of-range session.

command: `npx vitest run tests/f7-superbill.test.ts`
exit code: 0

```
RUN  v3.2.7 /Users/karthikmprakash/Documents/Personal/Projects/cashpractice

 ✓ tests/f7-superbill.test.ts (1 test) 44ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  22:53:32
   Duration  396ms (transform 103ms, setup 7ms, collect 210ms, tests 44ms, environment 0ms, prepare 25ms)
```
