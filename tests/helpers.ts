import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { acceptBaa, signUp, type Practitioner } from "../src/server/auth";
import { openDatabase, type DB } from "../src/server/db";

export function tempDb(): { db: DB; file: string } {
  const file = path.join(os.tmpdir(), `cp-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
  const db = openDatabase(file);
  return { db, file };
}

export function practice(db: DB, email = "owner@example.com"): Practitioner {
  const created = signUp(db, {
    email,
    password: "synthetic-test-passphrase",
    displayName: "Avery Lane",
  });
  return acceptBaa(db, created.id, { npi: "1234567893", taxId: "12-3456789", timezone: "UTC" });
}

export function removeDb(file: string, db: DB) {
  db.close();
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(file + suffix, { force: true });
}
