import { expect, test } from "vitest";
import { createAppointment } from "../src/server/appointments";
import { createClient } from "../src/server/clients";
import { countOutbox, dispatchDueReminders, enqueueReminders, listReminderJobs, planSendTimes } from "../src/server/reminders";
import { practice, removeDb, tempDb } from "./helpers";

test("reminder jobs use the configured offsets and do not duplicate", () => {
  const { db, file } = tempDb();
  const actor = practice(db);
  const client = createClient(db, actor, { displayName: "River Sample" });
  const starts = "2026-06-15T15:00:00.000Z";
  const session = createAppointment(db, actor, {
    clientId: client.id,
    startsAt: starts,
    endsAt: "2026-06-15T16:00:00.000Z",
    serviceCode: "90837",
    feeCents: 15000,
  });
  expect(planSendTimes(starts, [1440, 60])).toEqual([
    "2026-06-14T15:00:00.000Z",
    "2026-06-15T14:00:00.000Z",
  ]);
  const first = enqueueReminders(db, actor.id, session.id);
  const second = enqueueReminders(db, actor.id, session.id);
  expect(first.inserted).toBe(2);
  expect(second.inserted).toBe(0);
  const jobs = listReminderJobs(db, session.id);
  expect(jobs).toHaveLength(2);
  expect(jobs.map((job) => job.sendAt)).toEqual([
    "2026-06-14T15:00:00.000Z",
    "2026-06-15T14:00:00.000Z",
  ]);
  expect(dispatchDueReminders(db, "2026-06-14T15:00:00.000Z")).toBe(1);
  expect(dispatchDueReminders(db, "2026-06-14T15:00:00.000Z")).toBe(0);
  expect(countOutbox(db)).toBe(1);
  expect(dispatchDueReminders(db, "2026-06-15T14:00:00.000Z")).toBe(1);
  expect(countOutbox(db)).toBe(2);
  expect(dispatchDueReminders(db, "2026-06-15T14:00:00.000Z")).toBe(0);
  expect(countOutbox(db)).toBe(2);
  removeDb(file, db);
});
