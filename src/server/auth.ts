import { randomUUID } from "node:crypto";
import { audit } from "./audit";
import { decryptOptional, decryptString, encryptString, hashPassword, randomToken, sha256, verifyPassword } from "./crypto";
import type { DB } from "./db";
import { isUniqueConstraint } from "./db";
import { AppError, nowIso } from "./errors";

export type Actor = { id: string };

export type Practitioner = {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  reminderOffsets: number[];
  baaAcceptedAt: string | null;
  baaVersion: string | null;
  stripeAccountId: string | null;
  subscriptionStatus: string;
};

type PractitionerRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  npi_enc: string | null;
  tax_id_enc: string | null;
  timezone: string;
  reminder_offsets_json: string;
  baa_accepted_at: string | null;
  baa_version: string | null;
  stripe_account_id: string | null;
  subscription_status: string;
  created_at: string;
  updated_at: string;
};

const hits = new Map<string, number[]>();

export function assertRateLimit(key: string, limit = 30, windowMs = 60_000): void {
  if (process.env.RATE_LIMIT_DISABLED === "1") return;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) throw new AppError("Too many attempts. Wait a minute and try again.", "rate");
  recent.push(now);
  hits.set(key, recent);
}

export function resetRateLimits(): void {
  hits.clear();
}

function mapPractitioner(row: PractitionerRow): Practitioner {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    timezone: row.timezone,
    reminderOffsets: JSON.parse(row.reminder_offsets_json) as number[],
    baaAcceptedAt: row.baa_accepted_at,
    baaVersion: row.baa_version,
    stripeAccountId: row.stripe_account_id,
    subscriptionStatus: row.subscription_status,
  };
}

export function getPractitioner(db: DB, id: string): Practitioner {
  const row = db.prepare(`SELECT * FROM practitioners WHERE id = ?`).get(id) as PractitionerRow | undefined;
  if (!row) throw new AppError("Account not found.", "not_found");
  return mapPractitioner(row);
}

export function signUp(db: DB, input: { email: string; password: string; displayName: string }): Practitioner {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError("Enter a valid email.", "email");
  if (input.password.length < 12 || input.password.length > 200) {
    throw new AppError("Use a password of at least 12 characters.", "password");
  }
  if (displayName.length < 1 || displayName.length > 120) throw new AppError("Enter your name.", "name");
  const id = randomUUID();
  const now = nowIso();
  try {
    db.prepare(
      `INSERT INTO practitioners
        (id, email, password_hash, display_name, timezone, reminder_offsets_json, subscription_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'America/New_York', '[1440,60]', 'none', ?, ?)`,
    ).run(id, email, hashPassword(input.password), displayName, now, now);
  } catch (error) {
    if (isUniqueConstraint(error)) throw new AppError("An account with that email already exists.", "email_taken");
    throw error;
  }
  return getPractitioner(db, id);
}

export function signIn(db: DB, email: string, password: string): { practitioner: Practitioner; token: string } {
  const row = db.prepare(`SELECT * FROM practitioners WHERE email = ?`).get(email.trim().toLowerCase()) as PractitionerRow | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new AppError("Email or password is incorrect.", "auth");
  }
  const token = randomToken();
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    `INSERT INTO sessions (id, practitioner_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(randomUUID(), row.id, sha256(token), expires, nowIso());
  return { practitioner: mapPractitioner(row), token };
}

export function practitionerFromToken(db: DB, token: string): Practitioner | null {
  const row = db.prepare(
    `SELECT p.* FROM sessions s
     JOIN practitioners p ON p.id = s.practitioner_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  ).get(sha256(token), nowIso()) as PractitionerRow | undefined;
  return row ? mapPractitioner(row) : null;
}

export function signOut(db: DB, token: string): void {
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(sha256(token));
}

export function signOutEverywhere(db: DB, practitionerId: string): void {
  db.prepare(`DELETE FROM sessions WHERE practitioner_id = ?`).run(practitionerId);
}

export const BAA_VERSION = "2026-10-10";

export function acceptBaa(
  db: DB,
  practitionerId: string,
  input: { npi: string; taxId: string; timezone: string },
): Practitioner {
  const npi = input.npi.trim();
  const tax = input.taxId.replace(/[-\s]/g, "");
  if (!/^\d{10}$/.test(npi)) throw new AppError("Enter a 10-digit NPI.", "npi");
  if (!/^\d{9}$/.test(tax)) throw new AppError("Enter a 9-digit tax ID.", "tax");
  if (!input.timezone || input.timezone.length > 80) throw new AppError("Choose a time zone.", "timezone");
  const now = nowIso();
  db.prepare(
    `UPDATE practitioners
     SET npi_enc = ?, tax_id_enc = ?, timezone = ?, baa_accepted_at = ?, baa_version = ?, updated_at = ?
     WHERE id = ?`,
  ).run(encryptString(npi), encryptString(tax), input.timezone, now, BAA_VERSION, now, practitionerId);
  return getPractitioner(db, practitionerId);
}

export function practiceIdentity(db: DB, practitionerId: string): { displayName: string; npi: string; taxId: string; timezone: string } {
  const row = db.prepare(`SELECT * FROM practitioners WHERE id = ?`).get(practitionerId) as PractitionerRow | undefined;
  if (!row?.npi_enc || !row.tax_id_enc) throw new AppError("Add your NPI and tax ID before generating a superbill.", "identity");
  return {
    displayName: row.display_name,
    npi: decryptString(row.npi_enc),
    taxId: decryptString(row.tax_id_enc),
    timezone: row.timezone,
  };
}

export function setReminderOffsets(db: DB, practitionerId: string, offsets: number[]): number[] {
  const unique = [...new Set(offsets)].sort((a, b) => b - a);
  if (unique.length === 0 || unique.some((value) => !Number.isInteger(value) || value <= 0 || value > 14 * 24 * 60)) {
    throw new AppError("Choose at least one reminder time.", "reminders");
  }
  db.prepare(`UPDATE practitioners SET reminder_offsets_json = ?, updated_at = ? WHERE id = ?`).run(
    JSON.stringify(unique),
    nowIso(),
    practitionerId,
  );
  return unique;
}

export function setStripeAccount(db: DB, practitionerId: string, accountId: string): void {
  const trimmed = accountId.trim();
  if (trimmed && !/^acct_[A-Za-z0-9]+$/.test(trimmed)) {
    throw new AppError("Stripe account ids look like acct_ followed by letters and numbers.", "stripe");
  }
  db.prepare(`UPDATE practitioners SET stripe_account_id = ?, updated_at = ? WHERE id = ?`).run(
    trimmed || null,
    nowIso(),
    practitionerId,
  );
}

export function setSubscriptionStatus(db: DB, practitionerId: string, status: Practitioner["subscriptionStatus"]): void {
  db.prepare(`UPDATE practitioners SET subscription_status = ?, updated_at = ? WHERE id = ?`).run(status, nowIso(), practitionerId);
}

export function deleteAccount(db: DB, practitionerId: string): void {
  db.prepare(`DELETE FROM practitioners WHERE id = ?`).run(practitionerId);
  audit(db, practitionerId, "write", "account", practitionerId);
}

export function reminderOffsets(db: DB, practitionerId: string): number[] {
  const row = db.prepare(`SELECT reminder_offsets_json FROM practitioners WHERE id = ?`).get(practitionerId) as
    | { reminder_offsets_json: string }
    | undefined;
  if (!row) throw new AppError("Account not found.", "not_found");
  return JSON.parse(row.reminder_offsets_json) as number[];
}

export function maskedTaxId(db: DB, practitionerId: string): string | null {
  const row = db.prepare(`SELECT tax_id_enc FROM practitioners WHERE id = ?`).get(practitionerId) as { tax_id_enc: string | null } | undefined;
  const value = decryptOptional(row?.tax_id_enc);
  if (!value) return null;
  return `•••${value.slice(-4)}`;
}

export function storedNpi(db: DB, practitionerId: string): string | null {
  const row = db.prepare(`SELECT npi_enc FROM practitioners WHERE id = ?`).get(practitionerId) as { npi_enc: string | null } | undefined;
  return decryptOptional(row?.npi_enc);
}
