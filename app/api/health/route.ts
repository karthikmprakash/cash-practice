import { getDb } from "@/src/server/db";

export const dynamic = "force-dynamic";

export function GET() {
  getDb().prepare("select 1 as ok").get();
  return Response.json({ ok: true, service: "cashpractice" });
}
