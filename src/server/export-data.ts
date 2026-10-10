import type { Actor } from "./auth";
import { listClients } from "./clients";
import type { DB } from "./db";
import { toCsv } from "./format";
import { listAllNotes } from "./notes";
import { listAllPayments } from "./payments";
import { renderNotesPdf } from "./superbill";

export type PracticeExport = {
  json: {
    exportedAt: string;
    clients: ReturnType<typeof listClients>;
    appointments: Array<Record<string, string | number | null>>;
    notes: ReturnType<typeof listAllNotes>;
    payments: ReturnType<typeof listAllPayments>;
    incomeCents: number;
  };
  csv: {
    clients: string;
    appointments: string;
    notes: string;
    payments: string;
  };
  notesPdf: Uint8Array;
};

export async function exportPractice(db: DB, actor: Actor): Promise<PracticeExport> {
  const clients = listClients(db, actor);
  const names = new Map(clients.map((client) => [client.id, client.displayName]));
  const appointments = db.prepare(
    `SELECT id, client_id, starts_at, ends_at, status, service_code, service_description, place_of_service, fee_cents, video
     FROM appointments WHERE practitioner_id = ? ORDER BY starts_at`,
  ).all(actor.id) as Array<Record<string, string | number | null>>;
  const notes = listAllNotes(db, actor);
  const payments = listAllPayments(db, actor);
  const incomeCents = payments.reduce((sum, payment) => sum + payment.amount_cents, 0);
  const exportedAt = new Date().toISOString();
  const clientRows = clients.map((client) => ({
    id: client.id,
    displayName: client.displayName,
    email: client.email,
    phone: client.phone,
    dob: client.dob,
    diagnosis: client.diagnosis,
    createdAt: client.createdAt,
  }));
  const noteRows = notes.map((note) => ({
    id: note.id,
    clientId: note.clientId,
    template: note.template,
    status: note.status,
    signedAt: note.signedAt,
    contentHash: note.contentHash,
    body: JSON.stringify(note.body),
  }));
  const paymentRows = payments.map((payment) => ({
    id: payment.id,
    clientId: payment.client_id,
    appointmentId: payment.appointment_id,
    method: payment.method,
    amountCents: payment.amount_cents,
    currency: payment.currency,
    paidAt: payment.paid_at,
    platformFeeCents: payment.platform_fee_cents,
  }));
  const notesPdf = await renderNotesPdf(notes.map((note) => ({ ...note, clientName: names.get(note.clientId) ?? "Client" })));
  return {
    json: { exportedAt, clients, appointments, notes, payments, incomeCents },
    csv: {
      clients: toCsv(clientRows),
      appointments: toCsv(appointments),
      notes: toCsv(noteRows),
      payments: toCsv(paymentRows),
    },
    notesPdf,
  };
}
