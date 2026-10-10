import { randomUUID } from "node:crypto";
import { audit } from "./audit";
import type { Actor } from "./auth";
import { requireClientRow } from "./clients";
import { decryptString, encryptString, randomToken, sha256 } from "./crypto";
import type { DB } from "./db";
import { AppError, nowIso } from "./errors";

export const CONSENT_TEXT =
  "I agree to be seen as a private-pay client. This practice does not bill my insurer. I can request a superbill and send it myself.";

export type IntakeAnswers = {
  reason: string;
  emergencyName: string;
  emergencyPhone: string;
};

export type Intake = {
  id: string;
  clientId: string;
  answers: IntakeAnswers;
  consentName: string;
  consentSignedAt: string;
  consentHash: string;
};

type IntakeRow = {
  id: string;
  practitioner_id: string;
  client_id: string;
  answers_enc: string;
  consent_name: string;
  consent_signed_at: string;
  consent_hash: string;
  created_at: string;
};

export function createPortalLink(db: DB, actor: Actor, clientId: string): { token: string; path: string; expiresAt: string } {
  requireClientRow(db, actor.id, clientId);
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO portal_links (id, practitioner_id, client_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, actor.id, clientId, sha256(token), expiresAt, nowIso());
  audit(db, actor.id, "write", "portal_link", id);
  return { token, path: `/portal/${token}`, expiresAt };
}

function linkByToken(db: DB, token: string): { id: string; practitioner_id: string; client_id: string; expires_at: string } {
  const row = db.prepare(`SELECT id, practitioner_id, client_id, expires_at FROM portal_links WHERE token_hash = ?`).get(sha256(token)) as
    | { id: string; practitioner_id: string; client_id: string; expires_at: string }
    | undefined;
  if (!row || row.expires_at <= nowIso()) throw new AppError("This link has expired. Ask your clinician for a new one.", "expired");
  return row;
}

export function portalContext(db: DB, token: string): { practitionerName: string; clientId: string } {
  const link = linkByToken(db, token);
  const practitioner = db.prepare(`SELECT display_name FROM practitioners WHERE id = ?`).get(link.practitioner_id) as
    | { display_name: string }
    | undefined;
  if (!practitioner) throw new AppError("This link has expired. Ask your clinician for a new one.", "expired");
  return { practitionerName: practitioner.display_name, clientId: link.client_id };
}

export function submitIntake(db: DB, token: string, input: IntakeAnswers & { consent: boolean; signature: string }): Intake {
  const link = linkByToken(db, token);
  const reason = input.reason.trim();
  const emergencyName = input.emergencyName.trim();
  const emergencyPhone = input.emergencyPhone.trim();
  const signature = input.signature.trim();
  if (reason.length < 1 || reason.length > 4000) throw new AppError("Tell your clinician what brings you in.", "reason");
  if (emergencyName.length < 1 || emergencyName.length > 120) throw new AppError("Add an emergency contact.", "emergency");
  if (emergencyPhone.length < 7 || emergencyPhone.length > 30) throw new AppError("Add a phone number for that contact.", "phone");
  if (!input.consent) throw new AppError("The consent box has to be checked.", "consent");
  if (signature.length < 2 || signature.length > 120) throw new AppError("Type your name to sign.", "signature");
  const signedAt = nowIso();
  const answers: IntakeAnswers = { reason, emergencyName, emergencyPhone };
  const id = randomUUID();
  const consentHash = sha256(`${CONSENT_TEXT}|${signature}|${signedAt}`);
  db.prepare(
    `INSERT INTO intake_submissions
      (id, practitioner_id, client_id, answers_enc, consent_name, consent_signed_at, consent_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, link.practitioner_id, link.client_id, encryptString(JSON.stringify(answers)), signature, signedAt, consentHash, signedAt);
  audit(db, `portal:${link.client_id}`, "write", "intake", id);
  return { id, clientId: link.client_id, answers, consentName: signature, consentSignedAt: signedAt, consentHash };
}

export function latestIntake(db: DB, actor: Actor, clientId: string): Intake | null {
  requireClientRow(db, actor.id, clientId);
  const row = db.prepare(
    `SELECT * FROM intake_submissions WHERE practitioner_id = ? AND client_id = ? ORDER BY created_at DESC LIMIT 1`,
  ).get(actor.id, clientId) as IntakeRow | undefined;
  if (!row) return null;
  audit(db, actor.id, "read", "intake", row.id);
  return {
    id: row.id,
    clientId: row.client_id,
    answers: JSON.parse(decryptString(row.answers_enc)) as IntakeAnswers,
    consentName: row.consent_name,
    consentSignedAt: row.consent_signed_at,
    consentHash: row.consent_hash,
  };
}

export function addMessage(db: DB, input: { practitionerId: string; clientId: string; sender: "practitioner" | "client"; body: string; actorId: string }): string {
  const body = input.body.trim();
  if (body.length < 1 || body.length > 4000) throw new AppError("Write a message first.", "message");
  const id = randomUUID();
  db.prepare(
    `INSERT INTO messages (id, practitioner_id, client_id, sender, body_enc, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, input.practitionerId, input.clientId, input.sender, encryptString(body), nowIso());
  audit(db, input.actorId, "write", "message", id);
  return id;
}

export function sendPractitionerMessage(db: DB, actor: Actor, clientId: string, body: string): string {
  requireClientRow(db, actor.id, clientId);
  return addMessage(db, { practitionerId: actor.id, clientId, sender: "practitioner", body, actorId: actor.id });
}

export function sendPortalMessage(db: DB, token: string, body: string): string {
  const link = linkByToken(db, token);
  return addMessage(db, {
    practitionerId: link.practitioner_id,
    clientId: link.client_id,
    sender: "client",
    body,
    actorId: `portal:${link.client_id}`,
  });
}

export function listMessages(db: DB, actor: Actor, clientId: string): Array<{ id: string; sender: string; body: string; createdAt: string }> {
  requireClientRow(db, actor.id, clientId);
  const rows = db.prepare(
    `SELECT id, sender, body_enc, created_at FROM messages WHERE practitioner_id = ? AND client_id = ? ORDER BY created_at`,
  ).all(actor.id, clientId) as { id: string; sender: string; body_enc: string; created_at: string }[];
  return rows.map((row) => {
    audit(db, actor.id, "read", "message", row.id);
    return { id: row.id, sender: row.sender, body: decryptString(row.body_enc), createdAt: row.created_at };
  });
}

export function listPortalMessages(db: DB, token: string): Array<{ sender: string; body: string; createdAt: string }> {
  const link = linkByToken(db, token);
  const rows = db.prepare(
    `SELECT sender, body_enc, created_at FROM messages WHERE practitioner_id = ? AND client_id = ? ORDER BY created_at`,
  ).all(link.practitioner_id, link.client_id) as { sender: string; body_enc: string; created_at: string }[];
  return rows.map((row) => ({ sender: row.sender, body: decryptString(row.body_enc), createdAt: row.created_at }));
}
