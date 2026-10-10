# Recon map: SimplePractice (web)

Scope: the solo cash-pay loop — schedule, chart, note, payment, superbill, intake. Not insurance billing, not group practice, not the native apps.
For: one licensed clinician who does not bill insurance.
Date: 2026-10-10

Public pages only. No login. Authenticated screens were not opened, so states marked "not observed" were designed for this product from the help articles rather than seen.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Pricing | https://www.simplepractice.com/pricing/ | Starter $49, Essential $79, Plus $99 after promo months. Read 2026-10-10. |
| 2 | Plan comparison | https://support.simplepractice.com/hc/en-us/articles/360034957931-Comparing-SimplePractice-features-by-plan | Telehealth on all plans. Messaging and reminders not on the cheapest plan. |
| 3 | Pricing FAQ | https://support.simplepractice.com/hc/en-us/articles/115005956266-SimplePractice-pricing-and-subscription-FAQs | Add-ons: group appointments, e-prescribe, note-taker. |
| 4 | Client portal setup | https://support.simplepractice.com/hc/en-us/articles/207925883-Setting-up-the-Client-Portal | Portal toggle, domain, greeting, appointment requests. |
| 5 | Intake | https://support.simplepractice.com/hc/en-us/articles/207925943-Sending-intake-forms-and-documents-to-clients | Email with a portal link. Status: shared, viewed, signed, completed. |
| 6 | Client portal (client help) | https://support.simplepracticeclient.com/hc/en-us/articles/10356808631181-Getting-started-with-the-Client-Portal | Appointments, documents, billing, messages. One-time links expire in 24 hours. |
| 7 | Superbills | https://support.simplepractice.com/hc/en-us/articles/8490137073677-Understanding-invoices-statements-and-superbills | Superbill fields: demographics, diagnosis, provider, dates, POS, CPT, charged, paid. |
| 8 | Insurance pricing change | https://support.simplepractice.com/hc/en-us/articles/48468642804237-What-s-changing-with-insurance-pricing | Claims are a separate priced engine. Out of scope here. |

## Core loop

Open today, open the chart, write and sign a note, record the payment, and later hand the client a superbill.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Marketing home | public site | explain the product | hero, price, actions | filled |
| S02 | Pricing | public pricing | choose a plan | plan cards | filled |
| S03 | Sign up | account creation | create the practice | form | empty, error — not observed |
| S04 | Agreement | after sign up | accept the BAA and identity | checkbox, NPI, tax id | not observed; required by our spec |
| S05 | Today | home after login | the day's sessions | list, empty state | not observed |
| S06 | Calendar | schedule | day and week | columns, session links | not observed |
| S07 | Client list | clients | find a chart | list, empty | not observed |
| S08 | New client | from the list | add a person | form | not observed |
| S09 | Chart | client profile | sessions, notes, intake, money | forms, status | help docs describe filled and pending intake |
| S10 | Note | from the chart | SOAP, DAP, or free text, then sign | template, sign | help docs: draft, signed and locked |
| S11 | Video | from a session | third-party room | embed | not observed |
| S12 | Settings | settings | reminders, export, plan | form | not observed |
| S13 | Portal | token link | intake, consent, message | form | client help: pending documents, signed in via link |
| S14 | Security | public | how records are kept | prose | written for this product |

## Flows

```
F01 Sign up and accept the agreement
    S03 -> S04 -> S05
    happy path clicks: 2 submits
    edge: short password, duplicate email, unchecked agreement

F02 Add a client and book
    S05 -> S08 -> S09 -> calendar S06
    happy path clicks: 3
    edge: bad diagnosis code, end before start, overlap left allowed

F03 Write and sign a note
    S09 -> S10
    happy path clicks: 2
    edge: empty section, edit after sign

F04 Intake without an account
    S09 -> S13 in a clean browser -> back to S09
    happy path clicks: 2
    edge: expired link, unchecked consent

F05 Record a payment
    S09 cash, transfer, or card
    edge: duplicate card event, zero amount

F06 Superbill
    S09 date range -> PDF
    edge: session outside the range

F07 Video room
    S09 -> S11
    edge: two sessions must not share a room
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger | default, hover, focus, disabled | all |
| Text field | text, email, password, date, time, number | empty, filled, error | forms |
| Select | timezone, duration, template | default | S04, S09 |
| Checkbox | agreement, consent, reminder, video | unchecked, checked | S04, S12, S13 |
| Card | section | empty, filled | all |
| Calendar column | day, week | empty, filled | S06 |
| Notice | error, success | hidden, shown | forms |
| Nav | sidebar, stacked on small screens | current | practice |

## Inferred data model

```
Practitioner  id, email, name, timezone, npi, tax id, reminder offsets
              evidence: pricing is per clinician; superbill help lists provider identity
              confidence: high

Client        id, name, email, phone, dob, diagnosis
              evidence: superbill help (demographics, diagnosis); portal is per client
              confidence: high

Appointment   start, end, status, service code, fee, place of service
              evidence: superbill appointment details; calendar is the home of the product
              confidence: high

Note          template, body, signed at, author, lock
              evidence: help articles on signing and locking progress notes
              confidence: high

Payment       method, amount, date
              evidence: superbill "amount charged and payments received"
              confidence: high

Intake        answers, signature, time
              evidence: intake help (shared, viewed, signed, completed)
              confidence: high

Portal link   token, expiry
              evidence: client help, one-time links expire
              confidence: medium (we use a 14-day capability link, not their 24-hour login)

Reminder      offset, send time
              evidence: plan comparison gates reminders by plan
              confidence: medium
```

Relationships: Practitioner 1-n Client, Client 1-n Appointment, Appointment 0-n Note, Appointment 0-n Payment, Client 1-n Intake.

## Feature matrix

See `features.csv`. Insurance billing, group practice, e-prescribe, and an AI scribe are skip.

## Out of scope (cannot or should not be cloned)

- Their claims, eligibility, and ERA tools. The product thesis is that those stay out.
- Their logo, copy, icons, and brand color.
- Their client population and marketplace.
- Licensed treatment-planner content and CPT long descriptors.
- Native iOS and Android apps in this version.

## Size

Screens 14, flows 7, entities 8. Hard parts: encryption and audit, immutable signed notes, Stripe without a platform fee, PDF superbills. Size: M.
