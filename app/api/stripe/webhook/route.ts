import { NextResponse } from "next/server";
import { getDb } from "@/src/server/db";
import { applyStripeEvent, type StripeLikeEvent } from "@/src/server/payments";
import { logInfo } from "@/src/server/logger";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const raw = await request.text();
  if (!secret || !signature) return new NextResponse("Missing signature", { status: 400 });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return new NextResponse("Stripe is not configured", { status: 400 });
  try {
    const StripeSdk = (await import("stripe")).default;
    const stripe = new StripeSdk(key);
    const event = stripe.webhooks.constructEvent(raw, signature, secret);
    applyStripeEvent(getDb(), event as unknown as StripeLikeEvent);
    return new NextResponse("ok");
  } catch (error) {
    logInfo("stripe webhook rejected", { reason: error instanceof Error ? error.name : "error" });
    return new NextResponse("Invalid signature", { status: 400 });
  }
}
