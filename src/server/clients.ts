import { randomUUID } from "node:crypto";
import { audit } from "./audit";
import type { Actor } from "./auth";
import { decryptOptional, decryptString, encryptOptional, encryptString } from "./crypto";
import type { DB } from "./db";
import { AppError, nowIso } from "./errors";

export type Client = {
  id: string;
  practitionerId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  diagnosis: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClientRow = {
  id: string;
  practitioner_id: string;
  display_name_enc: string;
  email_enc: string | null;
  phone_enc: string | null;
  dob_enc: string | null;
  diagnosis_enc: string | null;
  created_at: string;
  updated_at: string;
};

export function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    displayName: decryptString(row.display_name_enc),
    email: decryptOptional(row.email_enc),
    phone: decryptOptional(row.phone_enc),
    dob: decryptOptional(row.dob_enc),
    diagnosis: decryptOptional(row.diagnosis_enc),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function requireClientRow(db: DB, practitionerId: string, clientId: string): ClientRow {
  const row = db.prepare(`SELECT * FROM clients WHERE id = ? AND practitioner_id = ?`).get(clientId, practitionerId) as ClientRow | undefined;
  if (!row) throw new AppError("That client was not found.", "not_found");
  return row;
}

function cleanName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 120) throw new AppError("Enter a client name up to 120 characters.", "name");
  return trimmed;
}

export function createClient(
  db: DB,
  actor: Actor,
  input: { displayName: string; email?: string; phone?: string; dob?: string; diagnosis?: string },
): Client {
  const displayName = cleanName(input.displayName);
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new AppError("Enter a valid email or leave it blank.", "email");
  }
  if (input.dob && !/^\d{4}-\d{2}-\d{2}$/.test(input.dob)) throw new AppError("Enter a date of birth.", "dob");
  if (input.diagnosis && !/^[A-Za-z0-9.]{2,10}$/.test(input.diagnosis.trim())) {
    throw new AppError("Enter a diagnosis code, or leave it blank.", "diagnosis");
  }
  const id = randomUUID();
  const now = nowIso();
  db.prepare(
    `INSERT INTO clients
      (id, practitioner_id, display_name_enc, email_enc, phone_enc, dob_enc, diagnosis_enc, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    actor.id,
    encryptString(displayName),
    encryptOptional(input.email?.trim()),
    encryptOptional(input.phone?.trim()),
    encryptOptional(input.dob?.trim()),
    encryptOptional(input.diagnosis?.trim().toUpperCase()),
    now,
    now,
  );
  audit(db, actor.id, "write", "client", id);
  return mapClient(requireClientRow(db, actor.id, id));
}

export function updateClient(
  db: DB,
  actor: Actor,
  clientId: string,
  input: { displayName?: string; email?: string; phone?: string; dob?: string; diagnosis?: string },
): Client {
  const existing = requireClientRow(db, actor.id, clientId);
  const current = mapClient(existing);
  const next = {
    displayName: input.displayName === undefined ? current.displayName : cleanName(input.displayName),
    email: input.email === undefined ? current.email : input.email.trim() || null,
    phone: input.phone === undefined ? current.phone : input.phone.trim() || null,
    dob: input.dob === undefined ? current.dob : input.dob.trim() || null,
    diagnosis: input.diagnosis === undefined ? current.diagnosis : input.diagnosis.trim().toUpperCase() || null,
  };
  if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) throw new AppError("Enter a valid email or leave it blank.", "email");
  if (next.dob && !/^\d{4}-\d{2}-\d{2}$/.test(next.dob)) throw new AppError("Enter a date of birth.", "dob");
  db.prepare(
    `UPDATE clients
     SET display_name_enc = ?, email_enc = ?, phone_enc = ?, dob_enc = ?, diagnosis_enc = ?, updated_at = ?
     WHERE id = ? AND practitioner_id = ?`,
  ).run(
    encryptString(next.displayName),
    encryptOptional(next.email),
    encryptOptional(next.phone),
    encryptOptional(next.dob),
    encryptOptional(next.diagnosis),
    nowIso(),
    clientId,
    actor.id,
  );
  audit(db, actor.id, "write", "client", clientId);
  return mapClient(requireClientRow(db, actor.id, clientId));
}

export function getClient(db: DB, actor: Actor, clientId: string): Client {
  const row = requireClientRow(db, actor.id, clientId);
  audit(db, actor.id, "read", "client", clientId);
  return mapClient(row);
}

export function listClients(db: DB, actor: Actor): Client[] {
  const rows = db.prepare(`SELECT * FROM clients WHERE practitioner_id = ? ORDER BY created_at`).all(actor.id) as ClientRow[];
  if (rows.length === 0) audit(db, actor.id, "read", "client_list", actor.id);
  return rows.map((row) => {
    audit(db, actor.id, "read", "client", row.id);
    return mapClient(row);
  });
}
