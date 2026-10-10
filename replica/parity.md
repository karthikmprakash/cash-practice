# Parity

Feature score from `python3 .claude/skills/replica-diff/parity.py replica/features.csv` on 2026-10-10:

**95.2 / 100.** Must-haves 15 of 15. Counted rows: 20.

Missing, in build order:

- Calendar sync (could). Not in the MVP contract.
- Native mobile app (could). Responsive web and a manifest instead.
- SMS delivery (could, partial). Jobs are queued. Nothing is sent without a vendor key.

Left out on purpose and not scored: group practice, insurance claims, e-prescribe, an AI scribe, treatment-planner content, CPT long descriptors.

Layout diff was not run. Authenticated reference screens were not available (no login), and marketing screenshots were not saved into the repo. The feature score is the one that matters here.

Behaviour: the clone's core path is sign up, agreement, client, book, calendar, note, payment, superbill. The reference bundles claims and a heavier settings surface. Those stays out.

Verdict: shippable on the feature score (must-haves done, above 80, no open S1 or S2). Better than a straight copy on the fixes that are actually built: export, one-click cancel, no AI notes, income snapshot, status changes on a session. Not better on delivered SMS, calendar sync, or a native app. No domain, so it is not launched.
