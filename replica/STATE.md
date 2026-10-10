# Build state

Machine-readable truth is `replica/features.json` (run `python3 tools/status.py`).

## Current phase
done (11/11 verified, tools/verify.sh --strict passed)

## Phases
- [x] recon        -> replica/recon-map.md
- [x] architect    -> replica/architecture.md
- [x] design       -> replica/design/tokens.json + tokens.css
- [x] build        -> screens from the recon map
- [x] backend      -> auth, db, payments, integrations
- [x] test         -> e2e specs green
- [x] diff         -> parity 95.2
- [x] entrepreneur -> replica/fixes.md
- [x] brand        -> CashPractice, pine on paper
- [x] launch       -> landing page and store listing
- (deploy: only once the human supplies a domain)

## Last session summary
All eleven features verified. Strict gate passed. Browser check walked signup, the agreement, and a new client chart on a narrow layout.

## Next 3 concrete actions
1. Signed BAAs and a covered video host.
2. Stripe test-mode Checkout with the human's keys.
3. Deliver the reminder outbox.
