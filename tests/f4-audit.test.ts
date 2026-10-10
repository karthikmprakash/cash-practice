import { expect, test } from "vitest";
import { countAudit } from "../src/server/audit";
import { createAppointment } from "../src/server/appointments";
import { createClient, getClient, listClients, updateClient } from "../src/server/clients";
import { isTriggerAbort } from "../src/server/db";
import { AppError } from "../src/server/errors";
import { practice, removeDb, tempDb } from "./helpers";

test("client reads and writes are audited and the audit log cannot be changed", () => {
  const { db, file } = tempDb();
  const actor = practice(db);
  const before = countAudit(db);
  const client = createClient(db, actor, { displayName: "River Sample", email: "river.sample@example.com" });
  getClient(db, actor, client.id);
  updateClient(db, actor, client.id, { phone: "555-0199" });
  const session = createAppointment(db, actor, {
    clientId: client.id,
    startsAt: "2026-06-15T15:00:00.000Z",
    endsAt: "2026-06-15T16:00:00.000Z",
    serviceCode: "90837",
    feeCents: 15000,
  });
  expect(countAudit(db) - before).toBe(4);
  expect(session.id).toBeTruthy();
  let blocked = 0;
  try {
    db.prepare(`UPDATE audit_log SET action = 'tamper'`).run();
  } catch (error) {
    if (isTriggerAbort(error)) blocked += 1;
  }
  try {
    db.prepare(`DELETE FROM audit_log`).run();
  } catch (error) {
    if (isTriggerAbort(error)) blocked += 1;
  }
  expect(blocked).toBe(2);
  expect(countAudit(db) - before).toBe(4);
  const other = practice(db, "other@example.com");
  expect(listClients(db, other)).toHaveLength(0);
  expect(() => getClient(db, other, client.id)).toThrow(AppError);
  removeDb(file, db);
});
