"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { acceptBaa, assertRateLimit, deleteAccount, practitionerFromToken, setReminderOffsets, setStripeAccount, setSubscriptionStatus, signIn, signOut, signUp } from "@/src/server/auth";
import { bookLocalAppointment, setAppointmentStatus } from "@/src/server/appointments";
import { createClient } from "@/src/server/clients";
import { getDb } from "@/src/server/db";
import { AppError } from "@/src/server/errors";
import { parseMoney } from "@/src/server/format";
import { createDraft, fieldsFor, signNote, updateDraft, type NoteTemplate } from "@/src/server/notes";
import { createCheckoutSession } from "@/src/server/payments";
import { recordManualPayment } from "@/src/server/payments";
import { createPortalLink, sendPortalMessage, sendPractitionerMessage, submitIntake } from "@/src/server/portal";
import { enqueueReminders, rebuildQueuedReminders } from "@/src/server/reminders";
import { sessionCookieOptions } from "@/src/server/tls";

const COOKIE = "cp_session";

async function token(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value;
}

export async function currentPractitioner() {
  const value = await token();
  if (!value) return null;
  return practitionerFromToken(getDb(), value);
}

export async function requireUser() {
  const practitioner = await currentPractitioner();
  if (!practitioner) redirect("/login");
  return practitioner;
}

export async function requirePractice() {
  const practitioner = await requireUser();
  if (!practitioner.baaAcceptedAt) redirect("/onboarding");
  return practitioner;
}

async function setCookie(value: string) {
  const jar = await cookies();
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  jar.set(COOKIE, value, sessionCookieOptions(expires));
}

async function clearCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

function fail(path: string, error: unknown): never {
  if (error instanceof AppError) redirect(`${path}${path.includes("?") ? "&" : "?"}error=${error.code}`);
  throw error;
}

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("name") ?? "");
  let session = "";
  try {
    assertRateLimit(`signup:${email.toLowerCase()}`);
    const practitioner = signUp(getDb(), { email, password, displayName });
    session = signIn(getDb(), email, password).token;
    void practitioner;
  } catch (error) {
    fail("/signup", error);
  }
  await setCookie(session);
  redirect("/onboarding");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  let session = "";
  let ready = false;
  try {
    assertRateLimit(`login:${email.toLowerCase()}`);
    const result = signIn(getDb(), email, password);
    session = result.token;
    ready = Boolean(result.practitioner.baaAcceptedAt);
  } catch (error) {
    fail("/login", error);
  }
  await setCookie(session);
  redirect(ready ? "/today" : "/onboarding");
}

export async function logoutAction() {
  const value = await token();
  if (value) signOut(getDb(), value);
  await clearCookie();
  redirect("/");
}

export async function baaAction(formData: FormData) {
  const practitioner = await requireUser();
  const accepted = formData.get("accept") === "on";
  if (!accepted) redirect("/onboarding?error=baa");
  try {
    acceptBaa(getDb(), practitioner.id, {
      npi: String(formData.get("npi") ?? ""),
      taxId: String(formData.get("taxId") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
    });
  } catch (error) {
    fail("/onboarding", error);
  }
  redirect("/today");
}

export async function createClientAction(formData: FormData) {
  const practitioner = await requirePractice();
  let clientId = "";
  try {
    const client = createClient(getDb(), practitioner, {
      displayName: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      dob: String(formData.get("dob") ?? ""),
      diagnosis: String(formData.get("diagnosis") ?? ""),
    });
    clientId = client.id;
  } catch (error) {
    fail("/clients/new", error);
  }
  redirect(`/clients/${clientId}`);
}

export async function bookAction(formData: FormData) {
  const practitioner = await requirePractice();
  const clientId = String(formData.get("clientId") ?? "");
  try {
    const appointment = bookLocalAppointment(getDb(), practitioner, {
      clientId,
      day: String(formData.get("day") ?? ""),
      time: String(formData.get("time") ?? ""),
      durationMinutes: Number(formData.get("duration") ?? 60),
      timeZone: practitioner.timezone,
      serviceCode: String(formData.get("serviceCode") ?? ""),
      serviceDescription: String(formData.get("description") ?? ""),
      feeCents: parseMoney(String(formData.get("fee") ?? "")),
      video: formData.get("video") === "on",
    });
    enqueueReminders(getDb(), practitioner.id, appointment.id);
  } catch (error) {
    fail(`/clients/${clientId}`, error);
  }
  redirect(`/clients/${clientId}`);
}

export async function statusAction(formData: FormData) {
  const practitioner = await requirePractice();
  const clientId = String(formData.get("clientId") ?? "");
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const status = String(formData.get("status") ?? "") as "attended" | "cancelled" | "no_show" | "scheduled";
  try {
    setAppointmentStatus(getDb(), practitioner, appointmentId, status);
  } catch (error) {
    fail(`/clients/${clientId}`, error);
  }
  redirect(`/clients/${clientId}`);
}

export async function startNoteAction(formData: FormData) {
  const practitioner = await requirePractice();
  const clientId = String(formData.get("clientId") ?? "");
  const template = String(formData.get("template") ?? "soap") as NoteTemplate;
  let noteId = "";
  try {
    const note = createDraft(getDb(), practitioner, {
      clientId,
      template,
      appointmentId: String(formData.get("appointmentId") ?? "") || undefined,
    });
    noteId = note.id;
  } catch (error) {
    fail(`/clients/${clientId}`, error);
  }
  redirect(`/clients/${clientId}/notes/${noteId}`);
}

export async function saveNoteAction(formData: FormData) {
  const practitioner = await requirePractice();
  const clientId = String(formData.get("clientId") ?? "");
  const noteId = String(formData.get("noteId") ?? "");
  const template = String(formData.get("template") ?? "soap") as NoteTemplate;
  const body = Object.fromEntries(fieldsFor(template).map((key) => [key, String(formData.get(key) ?? "")]));
  const intent = String(formData.get("intent") ?? "save");
  try {
    if (intent === "sign") signNote(getDb(), practitioner, noteId, body);
    else updateDraft(getDb(), practitioner, noteId, body);
  } catch (error) {
    fail(`/clients/${clientId}/notes/${noteId}`, error);
  }
  redirect(`/clients/${clientId}/notes/${noteId}`);
}

export async function manualPaymentAction(formData: FormData) {
  const practitioner = await requirePractice();
  const clientId = String(formData.get("clientId") ?? "");
  const method = String(formData.get("method") ?? "");
  try {
    if (method !== "cash" && method !== "transfer") throw new AppError("Record cash or a transfer.", "method");
    recordManualPayment(getDb(), practitioner, {
      appointmentId: String(formData.get("appointmentId") ?? ""),
      method,
      amountCents: parseMoney(String(formData.get("amount") ?? "")),
      paidAt: new Date(String(formData.get("paidOn") ?? "")).toISOString(),
    });
  } catch (error) {
    fail(`/clients/${clientId}`, error);
  }
  redirect(`/clients/${clientId}`);
}

export async function cardPaymentAction(formData: FormData) {
  const practitioner = await requirePractice();
  const clientId = String(formData.get("clientId") ?? "");
  const appointmentId = String(formData.get("appointmentId") ?? "");
  let url = "";
  try {
    const origin = String(formData.get("origin") ?? "");
    const session = await createCheckoutSession(getDb(), practitioner, appointmentId, {
      successUrl: `${origin}/clients/${clientId}?paid=1`,
      cancelUrl: `${origin}/clients/${clientId}?error=stripe`,
    });
    url = session.url ?? "";
    if (!url) throw new AppError("Card payments need a Stripe account connected in settings.", "stripe");
  } catch (error) {
    fail(`/clients/${clientId}`, error);
  }
  redirect(url);
}

export async function intakeLinkAction(formData: FormData) {
  const practitioner = await requirePractice();
  const clientId = String(formData.get("clientId") ?? "");
  let path = "";
  try {
    path = createPortalLink(getDb(), practitioner, clientId).path;
  } catch (error) {
    fail(`/clients/${clientId}`, error);
  }
  redirect(`/clients/${clientId}?intake=${encodeURIComponent(path)}`);
}

export async function portalIntakeAction(formData: FormData) {
  const portalToken = String(formData.get("token") ?? "");
  try {
    submitIntake(getDb(), portalToken, {
      reason: String(formData.get("reason") ?? ""),
      emergencyName: String(formData.get("emergencyName") ?? ""),
      emergencyPhone: String(formData.get("emergencyPhone") ?? ""),
      consent: formData.get("consent") === "on",
      signature: String(formData.get("signature") ?? ""),
    });
  } catch (error) {
    fail(`/portal/${portalToken}`, error);
  }
  redirect(`/portal/${portalToken}?done=1`);
}

export async function portalMessageAction(formData: FormData) {
  const portalToken = String(formData.get("token") ?? "");
  try {
    sendPortalMessage(getDb(), portalToken, String(formData.get("body") ?? ""));
  } catch (error) {
    fail(`/portal/${portalToken}`, error);
  }
  redirect(`/portal/${portalToken}`);
}

export async function messageAction(formData: FormData) {
  const practitioner = await requirePractice();
  const clientId = String(formData.get("clientId") ?? "");
  try {
    sendPractitionerMessage(getDb(), practitioner, clientId, String(formData.get("body") ?? ""));
  } catch (error) {
    fail(`/clients/${clientId}`, error);
  }
  redirect(`/clients/${clientId}`);
}

export async function settingsAction(formData: FormData) {
  const practitioner = await requirePractice();
  try {
    const selected = formData.getAll("offset").map((value) => Number(value));
    setReminderOffsets(getDb(), practitioner.id, selected);
    rebuildQueuedReminders(getDb(), practitioner.id);
    setStripeAccount(getDb(), practitioner.id, String(formData.get("stripeAccount") ?? ""));
  } catch (error) {
    fail("/settings", error);
  }
  redirect("/settings?saved=1");
}

export async function cancelPlanAction() {
  const practitioner = await requirePractice();
  setSubscriptionStatus(getDb(), practitioner.id, "cancel_requested");
  redirect("/settings?canceled=1");
}

export async function deleteAccountAction(formData: FormData) {
  const practitioner = await requirePractice();
  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (confirm !== practitioner.email) redirect("/settings?error=email");
  deleteAccount(getDb(), practitioner.id);
  await clearCookie();
  redirect("/");
}
