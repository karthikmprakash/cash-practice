import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { assertProductionTls } from "./tls";

export type DB = Database.Database;

let singleton: DB | null = null;

export function openDatabase(file: string): DB {
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  const schema = fs.readFileSync(path.join(process.cwd(), "src/server/schema.sql"), "utf8");
  db.exec(schema);
  return db;
}

export function getDb(): DB {
  if (!singleton) {
    assertProductionTls();
    const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "cashpractice.db");
    singleton = openDatabase(file);
  }
  return singleton;
}

export function closeDb(): void {
  singleton?.close();
  singleton = null;
}

export function isUniqueConstraint(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
  return code === "SQLITE_CONSTRAINT_UNIQUE" || code === "SQLITE_CONSTRAINT_PRIMARYKEY";
}

export function isTriggerAbort(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
  return code === "SQLITE_CONSTRAINT_TRIGGER";
}
