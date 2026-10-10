import { expect, test } from "vitest";
import { createAppointment } from "../src/server/appointments";
import { createClient } from "../src/server/clients";
import { recordManualPayment } from "../src/server/payments";
import { buildSuperbill, extractPdfText } from "../src/server/superbill";
import { practice, removeDb, tempDb } from "./helpers";

test("a superbill PDF contains the required fields and only the requested dates", async () => {
  const { db, file } = tempDb();
  const actor = practice(db);
  const client = createClient(db, actor, { displayName: "River Sample", diagnosis: "F41.1" });
  const inside = ["2026-06-01T15:00:00.000Z", "2026-06-15T15:00:00.000Z"];
  for (const startsAt of inside) {
    const session = createAppointment(db, actor, {
      clientId: client.id,
      startsAt,
      endsAt: new Date(new Date(startsAt).getTime() + 3600_000).toISOString(),
      serviceCode: "90837",
      serviceDescription: "Clinical session",
      feeCents: 15000,
    });
    recordManualPayment(db, actor, { appointmentId: session.id, method: "cash", amountCents: 15000, paidAt: startsAt });
  }
  const outside = createAppointment(db, actor, {
    clientId: client.id,
    startsAt: "2026-07-02T15:00:00.000Z",
    endsAt: "2026-07-02T16:00:00.000Z",
    serviceCode: "90791",
    serviceDescription: "Intake session",
    feeCents: 20000,
  });
  recordManualPayment(db, actor, { appointmentId: outside.id, method: "transfer", amountCents: 20000, paidAt: "2026-07-02T16:00:00.000Z" });
  const pdf = await buildSuperbill(db, actor, client.id, "2026-06-01T00:00:00.000Z", "2026-07-01T00:00:00.000Z");
  const text = extractPdfText(pdf);
  for (const field of ["River Sample", "Avery Lane", "1234567893", "123456789", "2026-06-01", "2026-06-15", "90837", "F41.1", "$150.00"]) {
    expect(text).toContain(field);
  }
  expect(text).toContain("Charged:");
  expect(text).toContain("Paid:");
  expect(text).not.toContain("2026-07-02");
  expect(text).not.toContain("90791");
  removeDb(file, db);
});
