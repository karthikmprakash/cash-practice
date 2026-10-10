import { randomUUID } from "node:crypto";
import { audit } from "./audit";
import type { Actor } from "./auth";
import { randomToken } from "./crypto";
import { requireClientRow, mapClient } from "./clients";
import type { DB } from "./db";
import { AppError, nowIso } from "./errors";
import { addDays, zonedLocalToUtc } from "./time";

export type Appointment = {
  id: string;
  practitionerId: string;
  clientId: string;
  clientName: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "attended" | "cancelled" | "no_show";
  serviceCode: string;
  serviceDescription: string;
  placeOfService: string;
  feeCents: number;
  video: boolean;
  telehealthToken: string;
};

type AppointmentRow = {
  id: string;
  practitioner_id: string;
  client_id: string;
  starts_at: string;
  ends_at: string;
  status: Appointment["status"];
  service_code: string;
  service_description: string;
  place_of_service: string;
  fee_cents: number;
  video: number;
  telehealth_token: string;
};

function mapAppointment(row: AppointmentRow, clientName: string): Appointment {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    clientId: row.client_id,
    clientName,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    serviceCode: row.service_code,
    serviceDescription: row.service_description,
    placeOfService: row.place_of_service,
    feeCents: row.fee_cents,
    video: row.video === 1,
    telehealthToken: row.telehealth_token,
  };
}

export function requireAppointmentRow(db: DB, practitionerId: string, appointmentId: string): AppointmentRow {
  const row = db.prepare(`SELECT * FROM appointments WHERE id = ? AND practitioner_id = ?`).get(appointmentId, practitionerId) as
    | AppointmentRow
    | undefined;
  if (!row) throw new AppError("That session was not found.", "not_found");
  return row;
}

export function createAppointment(
  db: DB,
  actor: Actor,
  input: {
    clientId: string;
    startsAt: string;
    endsAt: string;
    serviceCode: string;
    serviceDescription?: string;
    feeCents: number;
    video?: boolean;
    placeOfService?: string;
  },
): Appointment {
  const client = requireClientRow(db, actor.id, input.clientId);
  const start = new Date(input.startsAt);
  const end = new Date(input.endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new AppError("Choose a start and end time.", "time");
  }
  const serviceCode = input.serviceCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,10}$/.test(serviceCode)) throw new AppError("Enter a service code.", "service");
  if (!Number.isInteger(input.feeCents) || input.feeCents < 0) throw new AppError("Enter a fee.", "amount");
  const description = (input.serviceDescription ?? "Clinical session").trim() || "Clinical session";
  if (description.length > 120) throw new AppError("Keep the service description under 120 characters.", "service");
  const id = randomUUID();
  const now = nowIso();
  const video = input.video ? 1 : 0;
  const place = input.placeOfService ?? (video ? "02" : "11");
  db.prepare(
    `INSERT INTO appointments
      (id, practitioner_id, client_id, starts_at, ends_at, status, service_code, service_description,
       place_of_service, fee_cents, video, telehealth_token, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    actor.id,
    input.clientId,
    start.toISOString(),
    end.toISOString(),
    serviceCode,
    description,
    place,
    input.feeCents,
    video,
    randomToken(),
    now,
    now,
  );
  audit(db, actor.id, "write", "appointment", id);
  return mapAppointment(requireAppointmentRow(db, actor.id, id), mapClient(client).displayName);
}

export function bookLocalAppointment(
  db: DB,
  actor: Actor,
  input: {
    clientId: string;
    day: string;
    time: string;
    durationMinutes: number;
    timeZone: string;
    serviceCode: string;
    feeCents: number;
    video?: boolean;
    serviceDescription?: string;
  },
): Appointment {
  const start = zonedLocalToUtc(`${input.day}T${input.time}`, input.timeZone);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  return createAppointment(db, actor, {
    clientId: input.clientId,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    serviceCode: input.serviceCode,
    serviceDescription: input.serviceDescription,
    feeCents: input.feeCents,
    video: input.video,
  });
}

function withNames(db: DB, actor: Actor, rows: AppointmentRow[], auditRead: boolean): Appointment[] {
  return rows.map((row) => {
    const client = requireClientRow(db, actor.id, row.client_id);
    if (auditRead) audit(db, actor.id, "read", "appointment", row.id);
    return mapAppointment(row, mapClient(client).displayName);
  });
}

export function listAppointmentsForClient(db: DB, actor: Actor, clientId: string): Appointment[] {
  requireClientRow(db, actor.id, clientId);
  const rows = db.prepare(
    `SELECT * FROM appointments WHERE practitioner_id = ? AND client_id = ? ORDER BY starts_at`,
  ).all(actor.id, clientId) as AppointmentRow[];
  return withNames(db, actor, rows, true);
}

export function listAppointmentsBetween(db: DB, actor: Actor, startIso: string, endIso: string): Appointment[] {
  const rows = db.prepare(
    `SELECT * FROM appointments
     WHERE practitioner_id = ? AND starts_at >= ? AND starts_at < ? AND status != 'cancelled'
     ORDER BY starts_at`,
  ).all(actor.id, startIso, endIso) as AppointmentRow[];
  if (rows.length === 0) audit(db, actor.id, "read", "calendar", actor.id);
  return withNames(db, actor, rows, true);
}

export function listDay(db: DB, actor: Actor, day: string, timeZone: string): Appointment[] {
  const start = zonedLocalToUtc(`${day}T00:00`, timeZone);
  const end = zonedLocalToUtc(`${addDays(day, 1)}T00:00`, timeZone);
  return listAppointmentsBetween(db, actor, start.toISOString(), end.toISOString());
}

export function setAppointmentStatus(
  db: DB,
  actor: Actor,
  appointmentId: string,
  status: Appointment["status"],
): Appointment {
  const row = requireAppointmentRow(db, actor.id, appointmentId);
  db.prepare(`UPDATE appointments SET status = ?, updated_at = ? WHERE id = ? AND practitioner_id = ?`).run(
    status,
    nowIso(),
    appointmentId,
    actor.id,
  );
  if (status === "cancelled") {
    db.prepare(`UPDATE reminder_jobs SET status = 'cancelled' WHERE appointment_id = ? AND status = 'queued'`).run(appointmentId);
  }
  audit(db, actor.id, "write", "appointment", appointmentId);
  const client = requireClientRow(db, actor.id, row.client_id);
  return mapAppointment(requireAppointmentRow(db, actor.id, appointmentId), mapClient(client).displayName);
}

export function getAppointment(db: DB, actor: Actor, appointmentId: string): Appointment {
  const row = requireAppointmentRow(db, actor.id, appointmentId);
  const client = requireClientRow(db, actor.id, row.client_id);
  audit(db, actor.id, "read", "appointment", appointmentId);
  return mapAppointment(row, mapClient(client).displayName);
}
