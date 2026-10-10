import { expect, test } from "vitest";
import { createClient } from "../src/server/clients";
import { isTriggerAbort } from "../src/server/db";
import { AppError } from "../src/server/errors";
import { contentHash, createDraft, getNote, signNote, updateDraft } from "../src/server/notes";
import { practice, removeDb, tempDb } from "./helpers";

test("signed notes keep author, UTC timestamp, and hash, and reject edits", () => {
  const { db, file } = tempDb();
  const actor = practice(db);
  const client = createClient(db, actor, { displayName: "River Sample" });
  const soap = createDraft(db, actor, {
    clientId: client.id,
    template: "soap",
    body: { subjective: "Anxious", objective: "Calm voice", assessment: "F41.1", plan: "Weekly" },
  });
  const dap = createDraft(db, actor, {
    clientId: client.id,
    template: "dap",
    body: { data: "Reported worry", assessment: "F41.1", plan: "Practice" },
  });
  const free = createDraft(db, actor, { clientId: client.id, template: "free", body: { body: "Free text" } });
  expect([soap.template, dap.template, free.template]).toEqual(["soap", "dap", "free"]);
  updateDraft(db, actor, soap.id, { subjective: "More anxious", objective: "Calm voice", assessment: "F41.1", plan: "Weekly" });
  const signed = signNote(db, actor, soap.id);
  expect(signed.authorId).toBe(actor.id);
  expect(signed.signedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  expect(signed.contentHash).toBe(contentHash("soap", signed.body));
  expect(signed.contentHash).toMatch(/^[a-f0-9]{64}$/);
  expect(() => updateDraft(db, actor, soap.id, signed.body)).toThrow(AppError);
  let trigger = false;
  try {
    db.prepare(`UPDATE notes SET body_enc = ? WHERE id = ?`).run("tamper", soap.id);
  } catch (error) {
    trigger = isTriggerAbort(error);
  }
  expect(trigger).toBe(true);
  expect(getNote(db, actor, soap.id).contentHash).toBe(signed.contentHash);
  expect(signNote(db, actor, dap.id).status).toBe("signed");
  expect(signNote(db, actor, free.id).status).toBe("signed");
  removeDb(file, db);
});
