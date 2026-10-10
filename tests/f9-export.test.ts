import { expect, test } from "vitest";
import { exportPractice } from "../src/server/export-data";
import { parseCsv } from "../src/server/format";
import { seedPractice } from "../src/server/seed";
import { extractPdfText } from "../src/server/superbill";
import { practice, removeDb, tempDb } from "./helpers";

test("export of 100 clients is complete and parseable", async () => {
  const { db, file } = tempDb();
  const actor = practice(db);
  seedPractice(db, actor, 100);
  const bundle = await exportPractice(db, actor);
  expect(bundle.json.clients).toHaveLength(100);
  expect(bundle.json.appointments).toHaveLength(100);
  expect(bundle.json.notes).toHaveLength(100);
  expect(bundle.json.payments).toHaveLength(100);
  expect(JSON.parse(JSON.stringify(bundle.json)).clients).toHaveLength(100);
  expect(parseCsv(bundle.csv.clients)).toHaveLength(101);
  expect(parseCsv(bundle.csv.appointments)).toHaveLength(101);
  expect(parseCsv(bundle.csv.notes)).toHaveLength(101);
  expect(parseCsv(bundle.csv.payments)).toHaveLength(101);
  const text = extractPdfText(bundle.notesPdf);
  expect(text).toContain("Sample Client 001");
  expect(text).toContain("Sample Client 100");
  expect(bundle.json.incomeCents).toBe(100 * 15000);
  removeDb(file, db);
});
