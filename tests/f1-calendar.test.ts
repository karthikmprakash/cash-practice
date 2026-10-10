import { expect, test } from "vitest";
import { bookLocalAppointment, listDay } from "../src/server/appointments";
import { createClient } from "../src/server/clients";
import { zonedLocalToUtc } from "../src/server/time";
import { practice, removeDb, tempDb } from "./helpers";

test("booking shows on the client chart and on that calendar day", () => {
  const { db, file } = tempDb();
  const actor = practice(db);
  const client = createClient(db, actor, { displayName: "River Sample", diagnosis: "F41.1" });
  const session = bookLocalAppointment(db, actor, {
    clientId: client.id,
    day: "2026-06-15",
    time: "15:00",
    durationMinutes: 60,
    timeZone: "UTC",
    serviceCode: "90837",
    feeCents: 15000,
  });
  expect(session.startsAt).toBe("2026-06-15T15:00:00.000Z");
  expect(session.clientName).toBe("River Sample");
  expect(session.clientId).toBe(client.id);
  const day = listDay(db, actor, "2026-06-15", "UTC");
  expect(day.map((item) => item.id)).toContain(session.id);
  expect(listDay(db, actor, "2026-06-16", "UTC")).toHaveLength(0);
  const eastern = zonedLocalToUtc("2026-06-15T15:00", "America/New_York");
  expect(eastern.toISOString()).toBe("2026-06-15T19:00:00.000Z");
  removeDb(file, db);
});
