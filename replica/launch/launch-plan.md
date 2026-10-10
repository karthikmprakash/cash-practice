# Launch plan

Do not deploy. No domain has been supplied.

1. A lawyer reviews the agreement text and the listing.
2. Run the trademark and domain checks in `brand.md`. Do not buy a name on the "to run" rows.
3. Create the Stripe Price for $29/month and $290/year. Put the id in `STRIPE_PRICE_ID`.
4. Sign BAAs with the host, Stripe, the mail vendor, and the video vendor. Set `VIDEO_ROOM_BASE_URL` to that video host. Do not leave the public room default on for real clients.
5. Put production env vars in the host. `FORCE_HTTPS=1`.
6. Point DNS at the host. This step waits for a domain.

No Product Hunt draft. No store submission until the listing lint is clean and the name checks have actually been run.
