import { randomUUID } from "node:crypto";
import { audit } from "./audit";
import type { Actor } from "./auth";
import { getPractitioner, setSubscriptionStatus } from "./auth";
import { requireAppointmentRow } from "./appointments";
import type { DB } from "./db";
import { isUniqueConstraint } from "./db";
import { AppError, nowIso } from "./errors";

export type CheckoutParams = {
  mode: "payment";
  success_url: string;
  cancel_url: string;
  client_reference_id: string;
  line_items: Array<{
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string };
    };
  }>;
  metadata: { appointmentId: string };
  payment_intent_data: { metadata: { appointmentId: string } };
};

export function buildSessionCheckoutParams(input: {
  appointmentId: string;
  amountCents: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
}): CheckoutParams {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new AppError("Enter an amount to charge.", "amount");
  }
  return {
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.appointmentId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency ?? "usd",
          unit_amount: input.amountCents,
          product_data: { name: "Session fee" },
        },
      },
    ],
    metadata: { appointmentId: input.appointmentId },
    payment_intent_data: { metadata: { appointmentId: input.appointmentId } },
  };
}

export type StripeLikeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export function applyStripeEvent(db: DB, event: StripeLikeEvent): { status: "recorded" | "duplicate" | "ignored" } {
  if (!["checkout.session.completed", "customer.subscription.updated", "customer.subscription.deleted", "invoice.payment_failed"].includes(event.type)) {
    return { status: "ignored" };
  }
  try {
    const run = db.transaction(() => {
      db.prepare(`INSERT INTO stripe_events (id, received_at) VALUES (?, ?)`).run(event.id, nowIso());
      if (event.type === "checkout.session.completed") recordStripePayment(db, event);
      else applySubscriptionEvent(db, event);
      return "recorded" as const;
    });
    return { status: run() };
  } catch (error) {
    if (isUniqueConstraint(error)) {
      const existing = db.prepare(`SELECT id FROM stripe_events WHERE id = ?`).get(event.id);
      if (existing) return { status: "duplicate" };
    }
    throw error;
  }
}

function recordStripePayment(db: DB, event: StripeLikeEvent): void {
  const session = event.data.object;
  const metadata = (session.metadata ?? {}) as { appointmentId?: string };
  const appointmentId = metadata.appointmentId;
  if (!appointmentId) throw new AppError("The payment is missing a session id.", "stripe");
  const appointment = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(appointmentId) as
    | { id: string; practitioner_id: string; client_id: string }
    | undefined;
  if (!appointment) throw new AppError("That session was not found.", "not_found");
  const amount = session.amount_total;
  if (typeof amount !== "number" || amount <= 0) throw new AppError("The payment amount was empty.", "amount");
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const currency = typeof session.currency === "string" ? session.currency : "usd";
  const id = randomUUID();
  const paidAt = nowIso();
  db.prepare(
    `INSERT INTO payments
      (id, practitioner_id, client_id, appointment_id, method, amount_cents, currency, paid_at,
       stripe_event_id, stripe_payment_intent_id, platform_fee_cents, created_at)
     VALUES (?, ?, ?, ?, 'stripe', ?, ?, ?, ?, ?, 0, ?)`,
  ).run(id, appointment.practitioner_id, appointment.client_id, appointment.id, amount, currency, paidAt, event.id, paymentIntent, paidAt);
  audit(db, "system:stripe", "write", "payment", id);
}

function applySubscriptionEvent(db: DB, event: StripeLikeEvent): void {
  const object = event.data.object;
  const metadata = (object.metadata ?? {}) as { practitionerId?: string };
  const practitionerId = metadata.practitionerId;
  if (!practitionerId) return;
  if (event.type === "customer.subscription.deleted") {
    setSubscriptionStatus(db, practitionerId, "canceled");
    return;
  }
  if (event.type === "invoice.payment_failed") {
    setSubscriptionStatus(db, practitionerId, "past_due");
    return;
  }
  const status = object.status === "active" || object.status === "trialing" || object.status === "past_due" || object.status === "canceled"
    ? object.status
    : "active";
  setSubscriptionStatus(db, practitionerId, status);
}

export function recordManualPayment(
  db: DB,
  actor: Actor,
  input: { appointmentId: string; method: "cash" | "transfer"; amountCents: number; paidAt: string },
): string {
  if (input.method !== "cash" && input.method !== "transfer") {
    throw new AppError("Record cash or a transfer.", "method");
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw new AppError("Enter an amount.", "amount");
  const paidAt = new Date(input.paidAt);
  if (Number.isNaN(paidAt.getTime())) throw new AppError("Enter the date you received the payment.", "date");
  const appointment = requireAppointmentRow(db, actor.id, input.appointmentId);
  const id = randomUUID();
  const created = nowIso();
  db.prepare(
    `INSERT INTO payments
      (id, practitioner_id, client_id, appointment_id, method, amount_cents, currency, paid_at, platform_fee_cents, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'usd', ?, 0, ?)`,
  ).run(id, actor.id, appointment.client_id, appointment.id, input.method, input.amountCents, paidAt.toISOString(), created);
  audit(db, actor.id, "write", "payment", id);
  return id;
}

export function appointmentBalance(db: DB, actor: Actor, appointmentId: string): {
  feeCents: number;
  paidCents: number;
  status: "unpaid" | "partial" | "paid";
  platformFeeCents: number;
} {
  const appointment = requireAppointmentRow(db, actor.id, appointmentId);
  const row = db.prepare(
    `SELECT COALESCE(SUM(amount_cents), 0) AS paid, COALESCE(SUM(platform_fee_cents), 0) AS fee
     FROM payments WHERE appointment_id = ? AND practitioner_id = ?`,
  ).get(appointmentId, actor.id) as { paid: number; fee: number };
  const status = row.paid <= 0 ? "unpaid" : row.paid >= appointment.fee_cents ? "paid" : "partial";
  audit(db, actor.id, "read", "payment", appointmentId);
  return { feeCents: appointment.fee_cents, paidCents: row.paid, status, platformFeeCents: row.fee };
}

export type Ledger = {
  chargesCents: number;
  paidCents: number;
  platformFeeCents: number;
  differenceCents: number;
  byMethod: Record<string, number>;
};

export function ledger(db: DB, practitionerId: string): Ledger {
  const charges = db.prepare(
    `SELECT COALESCE(SUM(fee_cents), 0) AS n FROM appointments WHERE practitioner_id = ? AND status != 'cancelled'`,
  ).get(practitionerId) as { n: number };
  const paid = db.prepare(
    `SELECT COALESCE(SUM(amount_cents), 0) AS n, COALESCE(SUM(platform_fee_cents), 0) AS fee
     FROM payments WHERE practitioner_id = ?`,
  ).get(practitionerId) as { n: number; fee: number };
  const methods = db.prepare(
    `SELECT method, COALESCE(SUM(amount_cents), 0) AS n FROM payments WHERE practitioner_id = ? GROUP BY method`,
  ).all(practitionerId) as { method: string; n: number }[];
  const byMethod: Record<string, number> = {};
  for (const method of methods) byMethod[method.method] = method.n;
  return {
    chargesCents: charges.n,
    paidCents: paid.n,
    platformFeeCents: paid.fee,
    differenceCents: charges.n - paid.n,
    byMethod,
  };
}

export function listPaymentsForClient(db: DB, actor: Actor, clientId: string): Array<{
  id: string;
  appointmentId: string | null;
  method: string;
  amountCents: number;
  paidAt: string;
}> {
  const rows = db.prepare(
    `SELECT id, appointment_id, method, amount_cents, paid_at FROM payments
     WHERE practitioner_id = ? AND client_id = ? ORDER BY paid_at`,
  ).all(actor.id, clientId) as { id: string; appointment_id: string | null; method: string; amount_cents: number; paid_at: string }[];
  return rows.map((row) => {
    audit(db, actor.id, "read", "payment", row.id);
    return { id: row.id, appointmentId: row.appointment_id, method: row.method, amountCents: row.amount_cents, paidAt: row.paid_at };
  });
}

export function paidCentsForAppointment(db: DB, appointmentId: string): number {
  const row = db.prepare(`SELECT COALESCE(SUM(amount_cents), 0) AS n FROM payments WHERE appointment_id = ?`).get(appointmentId) as { n: number };
  return row.n;
}

export async function createCheckoutSession(
  db: DB,
  actor: Actor,
  appointmentId: string,
  urls: { successUrl: string; cancelUrl: string },
) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new AppError("Card payments need a Stripe account connected in settings.", "stripe");
  const appointment = requireAppointmentRow(db, actor.id, appointmentId);
  const practitioner = getPractitioner(db, actor.id);
  const params = buildSessionCheckoutParams({
    appointmentId,
    amountCents: appointment.fee_cents,
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
  });
  const StripeSdk = (await import("stripe")).default;
  const stripe = new StripeSdk(key);
  const options = practitioner.stripeAccountId ? { stripeAccount: practitioner.stripeAccountId } : undefined;
  return stripe.checkout.sessions.create(params, options);
}

export function listAllPayments(db: DB, actor: Actor) {
  const rows = db.prepare(
    `SELECT id, client_id, appointment_id, method, amount_cents, currency, paid_at, platform_fee_cents
     FROM payments WHERE practitioner_id = ? ORDER BY paid_at`,
  ).all(actor.id) as {
    id: string;
    client_id: string;
    appointment_id: string | null;
    method: string;
    amount_cents: number;
    currency: string;
    paid_at: string;
    platform_fee_cents: number;
  }[];
  return rows.map((row) => {
    audit(db, actor.id, "read", "payment", row.id);
    return row;
  });
}
