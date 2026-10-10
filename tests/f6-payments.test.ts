import { expect, test } from "vitest";
import Stripe from "stripe";
import { createAppointment } from "../src/server/appointments";
import { createClient } from "../src/server/clients";
import { appointmentBalance, applyStripeEvent, buildSessionCheckoutParams, ledger, recordManualPayment } from "../src/server/payments";
import { practice, removeDb, tempDb } from "./helpers";

const secret = `whsec_${"a".repeat(32)}`;

test("a signed Stripe test event and manual payments reconcile with no platform fee", () => {
  const { db, file } = tempDb();
  const actor = practice(db);
  const client = createClient(db, actor, { displayName: "River Sample" });
  const session = createAppointment(db, actor, {
    clientId: client.id,
    startsAt: "2026-06-15T15:00:00.000Z",
    endsAt: "2026-06-15T16:00:00.000Z",
    serviceCode: "90837",
    feeCents: 20000,
  });
  const other = createAppointment(db, actor, {
    clientId: client.id,
    startsAt: "2026-06-16T15:00:00.000Z",
    endsAt: "2026-06-16T16:00:00.000Z",
    serviceCode: "90837",
    feeCents: 5000,
  });
  const params = buildSessionCheckoutParams({
    appointmentId: session.id,
    amountCents: 15000,
    successUrl: "https://example.com/ok",
    cancelUrl: "https://example.com/cancel",
  });
  expect(JSON.stringify(params)).not.toContain("application_fee");
  const stripe = new Stripe("sk_test_" + "0".repeat(24));
  const payload = JSON.stringify({
    id: "evt_test_session",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_session",
        object: "checkout.session",
        amount_total: 15000,
        currency: "usd",
        payment_intent: "pi_test_session",
        payment_status: "paid",
        metadata: { appointmentId: session.id },
      },
    },
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  const event = stripe.webhooks.constructEvent(payload, header, secret);
  expect(applyStripeEvent(db, event as unknown as Parameters<typeof applyStripeEvent>[1]).status).toBe("recorded");
  expect(applyStripeEvent(db, event as unknown as Parameters<typeof applyStripeEvent>[1]).status).toBe("duplicate");
  expect(() => stripe.webhooks.constructEvent(payload, "t=1,v1=bad", secret)).toThrow();
  recordManualPayment(db, actor, {
    appointmentId: session.id,
    method: "cash",
    amountCents: 5000,
    paidAt: "2026-06-15T16:00:00.000Z",
  });
  recordManualPayment(db, actor, {
    appointmentId: other.id,
    method: "transfer",
    amountCents: 5000,
    paidAt: "2026-06-16T16:00:00.000Z",
  });
  expect(appointmentBalance(db, actor, session.id)).toMatchObject({ status: "paid", paidCents: 20000, platformFeeCents: 0 });
  const books = ledger(db, actor.id);
  expect(books.chargesCents).toBe(25000);
  expect(books.paidCents).toBe(25000);
  expect(books.differenceCents).toBe(0);
  expect(books.platformFeeCents).toBe(0);
  expect(books.byMethod).toEqual({ stripe: 15000, cash: 5000, transfer: 5000 });
  const fees = db.prepare(`SELECT COALESCE(SUM(platform_fee_cents), 0) AS n FROM payments`).get() as { n: number };
  expect(fees.n).toBe(0);
  removeDb(file, db);
});
