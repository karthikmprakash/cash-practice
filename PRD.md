# PRD — "CashPractice": a bare-bones EHR for solo cash-pay practitioners

**Target price:** $25–29/mo
**Status:** researched hypothesis · **Evidence strength:** strong demand, **but the cheap tier is already occupied** — read §7 before committing
**One-line:** scheduling, notes and invoices for a solo practitioner who will never bill an insurance company, at a third of the incumbent's price.

---

## 1. Problem & evidence

A single churn event created this entire market segment: **SimplePractice raised prices roughly 69% in March 2025, taking its entry plan from about $49 to $79/month.**[93] Solo clinicians who used a fraction of the platform were hit hardest.

The customers say it in their own words:

- *"$50/month is too expensive for how few clients I see. $40 is even pushing it, so something bare bones that is $30 or less and is legitimate would be amazing."* — a solo practitioner who does not take insurance, after learning SimplePractice had "raised their price $20/month", describing hours of research with no conclusion.[37]
- A thread titled, in full: *"WHY IS THERAPY SOFTWARE SO EXPENSIVE!!!"*[1]
- A dedicated thread on the price increase alone: *"I have a solo private practice. I don't take insurance. Thinking of jumping ship."*[40]
- The requirements are consistently minimal: *"I will not be taking insurance and need only the bare bones — scheduling, billing, documentation, notes, and ideally telehealth. It's just me and I don't plan on changing that."*[37]

**The shape of the demand:** every incumbent bundles insurance billing — clearinghouse claims, eligibility checks, ERA/EOB posting — into every plan. A cash-pay practitioner pays for a revenue-cycle engine they will never switch on.

⚠️ **But read §7 before you build.** "Cheap EHR" is not an empty market; it's an actively contested one.

---

## 2. Target user

| Attribute | Definition |
|---|---|
| Who | Solo licensed clinician or coach: LCSW, LPC, LMFT, psychologist, PMHNP, speech/OT/PT, or a solo allied-health practitioner |
| Business model | **Cash-pay / private-pay only.** No insurance panels, no clearinghouse, no claim submission |
| Caseload | 5–25 clients/week, often part-time alongside a day job |
| Compliance | Must be HIPAA-defensible; may want a signed BAA |
| Trigger to buy | A price increase at an incumbent, or leaving a group practice to go solo |
| Budget | Explicitly stated as **≤$30/month**[37] |

**Anti-persona:** group practices (3+ clinicians), anyone paneled with insurance, and anyone who wants an AI scribe as the primary value. Those buyers are all being fought over and are not price-constrained in the same way.

---

## 3. Jobs to be done

1. **Before a session:** see today's schedule and open the client's chart in two taps.
2. **During/after a session:** write and sign a note fast (subjective/objective/assessment/plan or DAP), without fighting a form.
3. **After the session:** record payment and produce a receipt or superbill the client can submit to their own insurer.
4. **At onboarding:** collect intake/consent with an e-signature without printing anything.
5. **At tax time:** export a clean income/expense summary.

**Not a job to be done:** submitting claims, checking eligibility, or posting ERAs. That is the thing being deliberately excluded.

---

## 4. MVP scope

**In:**
- Client records + appointment calendar with reminders (SMS optional, throughput-priced)
- Note templates (SOAP/DAP/free-form), e-signature, timestamps, audit trail
- Secure client portal: intake forms, consent e-sign, messaging
- Payments via **the practitioner's own Stripe account**; record cash/transfer manually
- **Superbill generator** — the bridge product that replaces insurance billing for cash-pay clients
- Telehealth (embed a third-party room; do not build WebRTC)
- Encrypted storage, audit log, signed BAA, data export

**Explicitly out (this is the whole product thesis):**
- Insurance claims, clearinghouse integration, eligibility checks, ERA/EOB posting
- Group-practice features: supervision, multiple locations, role permissions beyond one user
- Built-in AI scribe (integrators do it better — sessions are the wrong place to learn this)
- Marketing tools, website builder, courses, community features
- Native mobile app in v1 (responsive web + PWA)

---

## 5. Core flows

**Onboarding (the make-or-break flow):** sign up → accept BAA → add first client → send intake + consent → book first appointment. Target: **under 10 minutes, no sales call, no demo.**

**Session loop:** open today → tap client → note editor with last session's note visible for continuity → sign → mark attended → take payment → receipt.

**Superbill flow:** at month end, generate a per-client superbill (dates, service codes, amounts, diagnosis code) as a PDF the client submits to their insurer for out-of-network reimbursement. This is the feature that makes "no insurance billing" a *feature* rather than a gap.

---

## 6. Pricing & packaging

| Plan | Price | Notes |
|---|---|---|
| Solo | **$29/mo** | The stated willingness-to-pay ceiling[37] |
| Solo + telehealth | $35/mo | +$5, or include it and win the comparison outright |
| Annual | $290/yr | 2 months free; improves retention |

Position against SimplePractice's $79[10] and TherapyNotes' add-on pricing,[76] and *above* the free tiers — free signals "not serious" in a clinical context.

---

## 7. Competitive landscape

| Product | Published price | Positioning | Weakness you can attack |
|---|---|---|---|
| **SimplePractice** | **$79/mo monthly** (promo $39.50 for 3 months), up to $99/mo; additional practitioner $74→$99 | Default incumbent, all-in-one | ⚠️ Not a weakness — *they* are the one who raised prices ~69%, which is your acquisition channel[10][93] |
| **TherapyNotes** | Base plan + **$50/mo per additional clinician**; free non-clinical staff | Insurance-billing depth, loved by billers | Not the cheap option; built around claims[76] |
| **Sessions Health** | **Free tier**, then **$39/mo** first practitioner, $29 additional; telehealth +$10; e-claims $0.19–$0.25; AI Assist +$35 | *"Good price, responsive to the community"* | ⚠️ **This is already your product at almost your price.** Must out-position, not out-price[77] |
| **Practice Better** | **$25/mo annual** ($35 monthly) up to $145; free "Sprout" plan; SMS/broadcast quotas by tier | Wellness/holistic practitioners | Built for coaches/nutrition, less clinical[78] |
| **Carepatron** | **Free tier**, paid from **$15.50–$19.50/mo** | Broad allied health, aggressive pricing | ⚠️ Sub-$20 already exists[79] |
| **Jane App** | **Free "Balance" plan** (1 practitioner, 20 appts/mo); $79/$99/mo paid; +$5/$2.50 per additional practitioner; insurance billing +$20/mo | Clinic-oriented, well-loved | Free tier caps at 20 appointments/month[80] |
| **Upheal / others** | ~$1 per session (AI-notes-led) | AI documentation | Different job entirely |

### The honest read — this is the section that matters

**The "$30-or-less bare-bones EHR" idea is already served.** Sessions Health sits at $39 with a free tier.[77] Practice Better is $25/month on annual billing.[78] Carepatron starts at $15.50 with a free tier.[79] Jane App gives away a free 20-appointment tier.[80] The Reddit user asking for "something $30 or less"[37] simply did not know these existed.

That is itself the real finding: **the gap is discoverability and trust, not price.** A practitioner drowning in SimplePractice's price rise doesn't want another cheap option — they want to be *sure* the cheap option is legitimate and won't lose their notes. The thread's own words: *"something bare bones that is $30 or less **and is legitimate**."*[37]

**Therefore the defensible wedge is not a cheaper EHR. It is one of:**

1. **Superbill-only.** A $9–12/mo tool that does exactly one thing: turn a cash-pay practitioner's session log into insurer-ready superbills for out-of-network reimbursement. Tiny scope, no charting, far lower compliance surface, and it does not compete with the EHR they already have. **This is the recommendation.**
2. **A radical-simplicity EHR** that wins on the onboarding promise — "your first note in 5 minutes, we will import your SimplePractice data free, cancel anytime" — competing on trust and migration, not price.
3. **A discipline-specific EHR** (e.g. speech therapy, OT, music therapy) where generic tools fit badly.

---

## 8. Risks & kill criteria

| Risk | Severity | Mitigation / kill criterion |
|---|---|---|
| **Cheap tier already occupied**[77][79][80] | **Critical** | Do not launch a generic cheap EHR. Choose superbill-only or discipline-specific |
| HIPAA/BAA, breach liability, cyber-insurance | **High** | Budget for BAAs (hosting, email, SMS, video), encryption at rest/in transit, audit logging from day one. This is the single largest cost and it is not optional |
| Trust barrier: clinicians will not trust a solo founder with clinical records | High | Free migration, published security posture, transparent company identity, reference customers |
| Support load is personal and high-touch | High | Strict self-serve; "no demo calls" as a feature. If support >20% of revenue, kill it |
| Regulatory drift (state telehealth rules, AI-note rules) | Medium | Stay out of AI note generation |
| Payments/telehealth are regulated add-ons | Medium | Integrate; never build |

**Kill the project if:** you cannot sign a BAA with a competent hosting/SMS/video stack under ~$50/month total infrastructure cost, or if a superbill-only MVP cannot reach 50 paying practitioners in 90 days.

---

## 9. Metrics that matter

- **Activation:** signup → first signed note in <24h (target >70%; this is the entire trust argument)
- **Migration:** % of signups importing data from an incumbent (a direct churn signal)
- **Retention:** 12-month retention (clinical tools are sticky — anything under 90% means the product is failing)
- **Trust proxy:** % of signups who complete the BAA step
- **Support:** tickets per 100 accounts per month (target <12)

---

## 10. Validation plan

1. Post in r/therapists and r/privatepractice asking not "would you pay" but **"what do you currently do for out-of-network superbills?"** — that is the under-served job.
2. Test the trust gap: a landing page offering *free SimplePractice data import* + published security posture, with a $29/mo card requirement. Measure conversion vs a page that leads with price. Hypothesis: import+trust beats price.
3. Interview 10 cash-pay practitioners who churned off SimplePractice; ask what they switched to and why.[40][93]
4. Ship superbill-only first. It is a two-week build with a fraction of the compliance surface and it validates the audience.

---

## 11. Sources

## Sources

[1] https://www.reddit.com/r/therapy/comments/1nfb2i4/why_is_therapy_software_so_expensive
[10] https://www.simplepractice.com/pricing
[37] https://www.reddit.com/r/therapists/comments/1j3yi0u/ehr_that_isnt_sp_theranest_sessions_health_or
[40] https://www.reddit.com/r/therapists/comments/1ih5o67/simple_practice_price_increase_what_do_you_use
[76] https://www.therapynotes.com/pricing
[77] https://www.sessionshealth.com/pricing
[78] https://www.practicebetter.io/pricing
[79] https://carepatron.com/pricing
[80] https://www.jane.app/pricing
[93] https://steadypractice.app/blog/simplepractice-alternatives-solo-therapists.html
