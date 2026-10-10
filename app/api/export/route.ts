import { NextResponse } from "next/server";
import { currentPractitioner } from "@/src/server/actions";
import { getDb } from "@/src/server/db";
import { exportPractice } from "@/src/server/export-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const practitioner = await currentPractitioner();
  if (!practitioner?.baaAcceptedAt) return new NextResponse("Unauthorized", { status: 401 });
  const bundle = await exportPractice(getDb(), practitioner);
  const format = new URL(request.url).searchParams.get("format");
  if (format === "notes") {
    return new NextResponse(Buffer.from(bundle.notesPdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"notes.pdf\"",
      },
    });
  }
  if (format === "csv") {
    const body = [
      "# clients",
      bundle.csv.clients,
      "# appointments",
      bundle.csv.appointments,
      "# notes",
      bundle.csv.notes,
      "# payments",
      bundle.csv.payments,
    ].join("\n");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"practice.csv\"",
      },
    });
  }
  return NextResponse.json(bundle.json, {
    headers: { "Content-Disposition": "attachment; filename=\"practice.json\"" },
  });
}
