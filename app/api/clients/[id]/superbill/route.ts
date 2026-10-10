import { NextResponse } from "next/server";
import { currentPractitioner } from "@/src/server/actions";
import { getDb } from "@/src/server/db";
import { buildSuperbill } from "@/src/server/superbill";
import { addDays, zonedLocalToUtc } from "@/src/server/time";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const practitioner = await currentPractitioner();
  if (!practitioner?.baaAcceptedAt) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await context.params;
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return new NextResponse("Choose a start and end date.", { status: 400 });
  }
  const start = zonedLocalToUtc(`${from}T00:00`, practitioner.timezone);
  const end = zonedLocalToUtc(`${addDays(to, 1)}T00:00`, practitioner.timezone);
  const pdf = await buildSuperbill(getDb(), practitioner, id, start.toISOString(), end.toISOString());
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=\"superbill.pdf\"",
    },
  });
}
