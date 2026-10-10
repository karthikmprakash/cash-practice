import { randomUUID } from "node:crypto";
import { reminderOffsets } from "./auth";
import { encryptString } from "./crypto";
import type { DB } from "./db";
import { AppError, nowIso } from "./errors";

export type ReminderJob = {
  id: string;
  appointmentId: string;
  offsetMinutes: number;
  sendAt: string;
  status: string;
};

type AppointmentStart = { id: string; practitioner_id: string; starts_at: string };

export function planSendTimes(startsAt: string, offsetsMinutes: number[]): string[] {
  const start = new Date(startsAt).getTime();
  if (Number.isNaN(start)) throw new AppError("That session has no start time.", "time");
  return [...offsetsMinutes].sort((a, b) => b - a).map((offset) => new Date(start - offset * 60_000).toISOString());
}

export function enqueueReminders(db: DB, practitionerId: string, appointmentId: string): { inserted: number; jobs: ReminderJob[] } {
  const appointment = db.prepare(
    `SELECT id, practitioner_id, starts_at FROM appointments WHERE id = ? AND practitioner_id = ?`,
  ).get(appointmentId, practitionerId) as AppointmentStart | undefined;
  if (!appointment) throw new AppError("That session was not found.", "not_found");
  const offsets = [...reminderOffsets(db, practitionerId)].sort((a, b) => b - a);
  const insert = db.prepare(
    `INSERT OR IGNORE INTO reminder_jobs
      (id, practitioner_id, appointment_id, offset_minutes, send_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'queued', ?)`,
  );
  let inserted = 0;
  for (const offset of offsets) {
    const sendAt = new Date(new Date(appointment.starts_at).getTime() - offset * 60_000).toISOString();
    const result = insert.run(randomUUID(), practitionerId, appointmentId, offset, sendAt, nowIso());
    inserted += result.changes;
  }
  return { inserted, jobs: listReminderJobs(db, appointmentId) };
}

export function listReminderJobs(db: DB, appointmentId: string): ReminderJob[] {
  const rows = db.prepare(
    `SELECT id, appointment_id, offset_minutes, send_at, status
     FROM reminder_jobs WHERE appointment_id = ? ORDER BY send_at`,
  ).all(appointmentId) as { id: string; appointment_id: string; offset_minutes: number; send_at: string; status: string }[];
  return rows.map((row) => ({
    id: row.id,
    appointmentId: row.appointment_id,
    offsetMinutes: row.offset_minutes,
    sendAt: row.send_at,
    status: row.status,
  }));
}

export function dispatchDueReminders(db: DB, now: string): number {
  const jobs = db.prepare(
    `SELECT id, practitioner_id, appointment_id, send_at FROM reminder_jobs
     WHERE status = 'queued' AND send_at <= ?`,
  ).all(now) as { id: string; practitioner_id: string; appointment_id: string; send_at: string }[];
  const mark = db.prepare(`UPDATE reminder_jobs SET status = 'sent' WHERE id = ? AND status = 'queued'`);
  const outbox = db.prepare(
    `INSERT INTO outbox (id, practitioner_id, kind, reminder_job_id, payload_enc, created_at)
     VALUES (?, ?, 'reminder', ?, ?, ?)`,
  );
  let sent = 0;
  const run = db.transaction(() => {
    for (const job of jobs) {
      const updated = mark.run(job.id);
      if (updated.changes !== 1) continue;
      const payload = encryptString(JSON.stringify({
        appointmentId: job.appointment_id,
        sendAt: job.send_at,
        text: "You have a session coming up. Reply to your clinician if you need a different time.",
      }));
      outbox.run(randomUUID(), job.practitioner_id, job.id, payload, now);
      sent += 1;
    }
  });
  run();
  return sent;
}

export function rebuildQueuedReminders(db: DB, practitionerId: string): void {
  db.prepare(`DELETE FROM reminder_jobs WHERE practitioner_id = ? AND status = 'queued'`).run(practitionerId);
  const rows = db.prepare(
    `SELECT id FROM appointments WHERE practitioner_id = ? AND status = 'scheduled' AND starts_at > ?`,
  ).all(practitionerId, new Date().toISOString()) as { id: string }[];
  for (const row of rows) enqueueReminders(db, practitionerId, row.id);
}

export function countOutbox(db: DB): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM outbox`).get() as { n: number };
  return row.n;
}
