# Test plan

Automated cases live in `tests/` and `e2e/`. Playwright fails the run on page errors, 5xx responses, and axe violations.

| id | path | expect |
| --- | --- | --- |
| F01-H1 | sign up, accept agreement, add client, book, open day and week | session link opens the chart |
| F01-E1 | empty name | stays on the form with an error |
| F02-H1 | default 24h and 1h offsets | two jobs, second run inserts zero, dispatch does not double-send |
| F03-H1 | SOAP, DAP, free, then sign | hash and UTC time stored |
| F03-N1 | edit after sign, including raw SQL | rejected |
| F04-H1 | N operations | N audit rows; update and delete of the log throw |
| F04-N1 | second account | empty list, chart not found |
| F05-H1 | token link in a clean browser | intake stored on the chart |
| F06-H1 | signed Stripe test event plus cash and transfer | ledger difference 0, platform fee 0, duplicate event ignored |
| F06-N1 | bad signature | throws |
| F07-H1 | PDF for June | required fields present, July session absent |
| F08-H1 | two sessions | two room URLs, external SDK, no RTCPeerConnection in our source |
| F09-H1 | 100 synthetic clients | JSON and CSV counts, note PDF contains the first and last name |
| F10-H1 | logger, ciphertext file, secret guard, TLS flag, HSTS | as specified |
| F11-H1 | walk app and src | no billing-engine modules |

Edge cases covered in the suite: duplicate webhook, signed-note trigger, second user, date range, idempotent reminders. Not covered by automation: a real card in Stripe's hosted page, a real video join, a real email delivery.
