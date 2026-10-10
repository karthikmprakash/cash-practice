# Fixes

Sample: 150 App Store reviews of the clinician iOS app, 2024-11-06 through 2026-10-07, one source. Every theme is thin. Reddit timed out. A Hacker News search did not return reviews of this product. Do not treat the mobile-app sample as the whole market. The calendar and login themes are still the loudest thing in the sample.

## What they hate

1. Calendar that fights you. 48 reviews, 1 source. "The calendar is completely useless on this app." https://itunes.apple.com/us/rss/customerreviews/id=738207604/sortBy=mostRecent/json#14547049387
2. An update made it worse. 35 reviews, 1 source. "I hate this new update." https://itunes.apple.com/us/rss/customerreviews/page=2/id=738207604/sortBy=mostRecent/json#13008454803
3. Login. 35 reviews, 1 source. "With the latest updates, you constantly have to sign in." https://itunes.apple.com/us/rss/customerreviews/page=2/id=738207604/sortBy=mostRecent/json#13019327945

## What is missing

1. The phone app does not carry the web chart. 11 reviews, 1 source. "Can’t access notes, post new notes to the chart, unable to view a lot of data that is only available on the full website." https://itunes.apple.com/us/rss/customerreviews/page=3/id=738207604/sortBy=mostRecent/json#12333806027
2. Income on one screen. One review asked for an income snapshot. https://itunes.apple.com/us/rss/customerreviews/page=2/id=738207604/sortBy=mostRecent/json#13065041356
3. A way to leave. "I wish I had started with a whole different software because it was a pain to change." https://itunes.apple.com/us/rss/customerreviews/id=738207604/sortBy=mostRecent/json#14475957774

## What is unsolved

1. People who do not want an AI note product. "there is no way to turn it off." https://itunes.apple.com/us/rss/customerreviews/id=738207604/sortBy=mostRecent/json#14220779305
2. Solo clinicians who find the suite heavy. "This app is very limited in functions you need when you’re running a private practice." is the opposite complaint, and it is thin. The product choice here is still the small cash-pay set, because that is the contract.

## Fix plan

| fix | size | where | evidence |
| --- | --- | --- | --- |
| Day and week calendar that stays on the date in the URL | S | built | calendar theme |
| 14-day session cookie | S | built | login theme |
| Mark attended, no-show, cancelled | S | built | a reviewer could not change status |
| Income totals on settings | S | built | income snapshot request |
| Full export | M | built | pain of switching |
| One-click cancel | S | built | billing theme, thin |
| No AI note generator | S | left out | AI theme |
| Delivered SMS | M | not built | no vendor key |

## Angle

For a solo clinician whose current app makes the calendar and the login harder than the session, CashPractice keeps the day, the note, the payment, and the superbill on one web chart, and lets them take the records with them.

Evidence: calendar theme, 48 reviews, one source. Thin. The recommendation stands because the same shape is what the PRD's jobs already ask for, and the review sample does not contradict it.

Other options, not chosen: compete on the monthly price (price is rank 8 and thin in this sample); build a native app first (the sample is angry at the native app, and v1 is responsive web).
