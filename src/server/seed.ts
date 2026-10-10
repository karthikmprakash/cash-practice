import type { Actor } from "./auth";
import { bookLocalAppointment } from "./appointments";
import { createClient } from "./clients";
import type { DB } from "./db";
import { createDraft, signNote } from "./notes";
import { recordManualPayment } from "./payments";

export function seedPractice(db: DB, actor: Actor, count: number): void {
  for (let index = 1; index <= count; index += 1) {
    const client = createClient(db, actor, {
      displayName: `Sample Client ${String(index).padStart(3, "0")}`,
      email: `sample${index}@example.com`,
      dob: "1990-01-15",
      diagnosis: "F41.1",
      phone: "555-0100",
    });
    const day = new Date(Date.UTC(2026, 0, 1 + ((index - 1) % 27))).toISOString().slice(0, 10);
    const appointment = bookLocalAppointment(db, actor, {
      clientId: client.id,
      day,
      time: "15:00",
      durationMinutes: 60,
      timeZone: "UTC",
      serviceCode: "90837",
      feeCents: 15000,
    });
    const draft = createDraft(db, actor, {
      clientId: client.id,
      appointmentId: appointment.id,
      template: "soap",
      body: {
        subjective: `Sample note ${index}`,
        objective: "Arrived on time.",
        assessment: "F41.1",
        plan: "Continue weekly.",
      },
    });
    signNote(db, actor, draft.id);
    recordManualPayment(db, actor, {
      appointmentId: appointment.id,
      method: "cash",
      amountCents: 15000,
      paidAt: `${day}T16:00:00.000Z`,
    });
  }
}
