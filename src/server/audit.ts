import { randomUUID } from "node:crypto";
import type { DB } from "./db";

export function audit(db: DB, actorId: string, action: "read" | "write", entityType: string, entityId: string): void {
  db.prepare(
    `INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), actorId, action, entityType, entityId, new Date().toISOString());
}

export function countAudit(db: DB): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM audit_log`).get() as { n: number };
  return row.n;
}
