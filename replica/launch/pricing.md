# Pricing

Read 2026-10-10.

| product | public price | url |
| --- | --- | --- |
| Reference incumbent | $49 / $79 / $99 per month after promo | https://www.simplepractice.com/pricing/ |
| Sessions Health | free, then $39 | https://www.sessionshealth.com/pricing |
| Practice Better | $25 annual / $35 monthly | https://www.practicebetter.io/pricing |
| Carepatron | from about $15.50 | https://carepatron.com/pricing |

In the App Store sample, price is a thin theme (11 of 150). One line: "I likely need to find a new platform, Simple Practice has been disappointing and expensive lately." https://itunes.apple.com/us/rss/customerreviews/page=3/id=738207604/sortBy=mostRecent/json#12962635544

## Our price

| plan | price | who |
| --- | --- | --- |
| Solo monthly | $29 | one clinician |
| Solo annual | $290 | two months not billed |

No free tier. Cancel is one button in settings and sets `cancel_requested`. The Stripe Price object is for the human to create; put its id in `STRIPE_PRICE_ID`. Session charges on the clinician's own Stripe account do not add a platform fee.

Do not describe this as the cheapest option. Cheaper tools already exist.
