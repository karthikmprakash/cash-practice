import { randomUUID } from "node:crypto";
import { audit } from "./audit";
import type { Actor } from "./auth";
import { requireClientRow } from "./clients";
import { decryptString, encryptString, sha256 } from "./crypto";
import type { DB } from "./db";
import { isTriggerAbort } from "./db";
import { AppError, nowIso } from "./errors";

export type NoteTemplate = "soap" | "dap" | "free";

export type NoteBody = Record<string, string>;

export type Note = {
  id: string;
  practitionerId: string;
  clientId: string;
  appointmentId: string | null;
  template: NoteTemplate;
  body: NoteBody;
  status: "draft" | "signed";
  authorId: string | null;
  signedAt: string | null;
  contentHash: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  practitioner_id: string;
  client_id: string;
  appointment_id: string | null;
  template: NoteTemplate;
  body_enc: string;
  status: "draft" | "signed";
  author_id: string | null;
  signed_at: string | null;
  content_hash: string | null;
  created_at: string;
  updated_at: string;
};

const FIELDS: Record<NoteTemplate, string[]> = {
  soap: ["subjective", "objective", "assessment", "plan"],
  dap: ["data", "assessment", "plan"],
  free: ["body"],
};

export function fieldsFor(template: NoteTemplate): string[] {
  return FIELDS[template];
}

export function canonicalNote(template: NoteTemplate, body: NoteBody): string {
  const ordered: NoteBody = {};
  for (const key of fieldsFor(template)) ordered[key] = body[key] ?? "";
  return JSON.stringify({ template, fields: ordered });
}

export function contentHash(template: NoteTemplate, body: NoteBody): string {
  return sha256(canonicalNote(template, body));
}

function emptyBody(template: NoteTemplate): NoteBody {
  return Object.fromEntries(fieldsFor(template).map((key) => [key, ""]));
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    clientId: row.client_id,
    appointmentId: row.appointment_id,
    template: row.template,
    body: JSON.parse(decryptString(row.body_enc)) as NoteBody,
    status: row.status,
    authorId: row.author_id,
    signedAt: row.signed_at,
    contentHash: row.content_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requireNoteRow(db: DB, practitionerId: string, noteId: string): NoteRow {
  const row = db.prepare(`SELECT * FROM notes WHERE id = ? AND practitioner_id = ?`).get(noteId, practitionerId) as NoteRow | undefined;
  if (!row) throw new AppError("That note was not found.", "not_found");
  return row;
}

export function createDraft(
  db: DB,
  actor: Actor,
  input: { clientId: string; template: NoteTemplate; appointmentId?: string; body?: NoteBody },
): Note {
  if (!FIELDS[input.template]) throw new AppError("Choose a SOAP, DAP, or free-form note.", "template");
  requireClientRow(db, actor.id, input.clientId);
  const body = input.body ?? emptyBody(input.template);
  const id = randomUUID();
  const now = nowIso();
  db.prepare(
    `INSERT INTO notes
      (id, practitioner_id, client_id, appointment_id, template, body_enc, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
  ).run(id, actor.id, input.clientId, input.appointmentId ?? null, input.template, encryptString(JSON.stringify(normalize(input.template, body))), now, now);
  audit(db, actor.id, "write", "note", id);
  return mapNote(requireNoteRow(db, actor.id, id));
}

function normalize(template: NoteTemplate, body: NoteBody): NoteBody {
  const next: NoteBody = {};
  for (const key of fieldsFor(template)) {
    const value = body[key] ?? "";
    if (value.length > 20000) throw new AppError("That section is too long.", "body");
    next[key] = value;
  }
  return next;
}

export function updateDraft(db: DB, actor: Actor, noteId: string, body: NoteBody): Note {
  const row = requireNoteRow(db, actor.id, noteId);
  if (row.status === "signed") throw new AppError("Signed notes cannot be edited.", "immutable");
  const next = normalize(row.template, body);
  db.prepare(`UPDATE notes SET body_enc = ?, updated_at = ? WHERE id = ? AND practitioner_id = ? AND status = 'draft'`).run(
    encryptString(JSON.stringify(next)),
    nowIso(),
    noteId,
    actor.id,
  );
  audit(db, actor.id, "write", "note", noteId);
  return mapNote(requireNoteRow(db, actor.id, noteId));
}

export function signNote(db: DB, actor: Actor, noteId: string, body?: NoteBody): Note {
  const row = requireNoteRow(db, actor.id, noteId);
  if (row.status === "signed") throw new AppError("This note is already signed.", "immutable");
  const next = normalize(row.template, body ?? (JSON.parse(decryptString(row.body_enc)) as NoteBody));
  for (const key of fieldsFor(row.template)) {
    if (!next[key].trim()) throw new AppError("Fill every section before signing.", "body");
  }
  const signedAt = nowIso();
  const hash = contentHash(row.template, next);
  try {
    db.prepare(
      `UPDATE notes
       SET body_enc = ?, status = 'signed', author_id = ?, signed_at = ?, content_hash = ?, updated_at = ?
       WHERE id = ? AND practitioner_id = ? AND status = 'draft'`,
    ).run(encryptString(JSON.stringify(next)), actor.id, signedAt, hash, signedAt, noteId, actor.id);
  } catch (error) {
    if (isTriggerAbort(error)) throw new AppError("Signed notes cannot be edited.", "immutable");
    throw error;
  }
  audit(db, actor.id, "write", "note", noteId);
  return mapNote(requireNoteRow(db, actor.id, noteId));
}

export function getNote(db: DB, actor: Actor, noteId: string): Note {
  const row = requireNoteRow(db, actor.id, noteId);
  audit(db, actor.id, "read", "note", noteId);
  return mapNote(row);
}

export function listNotes(db: DB, actor: Actor, clientId: string): Note[] {
  requireClientRow(db, actor.id, clientId);
  const rows = db.prepare(
    `SELECT * FROM notes WHERE practitioner_id = ? AND client_id = ? ORDER BY created_at`,
  ).all(actor.id, clientId) as NoteRow[];
  return rows.map((row) => {
    audit(db, actor.id, "read", "note", row.id);
    return mapNote(row);
  });
}

export function previousSignedNote(db: DB, actor: Actor, clientId: string, exceptNoteId?: string): Note | null {
  const row = db.prepare(
    `SELECT * FROM notes
     WHERE practitioner_id = ? AND client_id = ? AND status = 'signed' AND id != ?
     ORDER BY signed_at DESC LIMIT 1`,
  ).get(actor.id, clientId, exceptNoteId ?? "") as NoteRow | undefined;
  if (!row) return null;
  audit(db, actor.id, "read", "note", row.id);
  return mapNote(row);
}

export function listAllNotes(db: DB, actor: Actor): Note[] {
  const rows = db.prepare(`SELECT * FROM notes WHERE practitioner_id = ? ORDER BY created_at`).all(actor.id) as NoteRow[];
  return rows.map((row) => {
    audit(db, actor.id, "read", "note", row.id);
    return mapNote(row);
  });
}
