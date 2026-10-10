import { inflateSync } from "node:zlib";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { practiceIdentity, type Actor } from "./auth";
import { getClient } from "./clients";
import type { DB } from "./db";
import { formatMoney } from "./format";
import type { Note } from "./notes";
import { paidCentsForAppointment } from "./payments";

export type SuperbillLine = {
  date: string;
  serviceCode: string;
  description: string;
  chargedCents: number;
  paidCents: number;
};

export type SuperbillData = {
  practitionerName: string;
  npi: string;
  taxId: string;
  clientName: string;
  diagnosis: string;
  rangeStart: string;
  rangeEnd: string;
  lines: SuperbillLine[];
};

export function superbillData(db: DB, actor: Actor, clientId: string, rangeStart: string, rangeEnd: string): SuperbillData {
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("Choose a start and end date.");
  }
  const client = getClient(db, actor, clientId);
  const identity = practiceIdentity(db, actor.id);
  const rows = db.prepare(
    `SELECT id, starts_at, service_code, service_description, fee_cents
     FROM appointments
     WHERE practitioner_id = ? AND client_id = ? AND status != 'cancelled' AND starts_at >= ? AND starts_at < ?
     ORDER BY starts_at`,
  ).all(actor.id, clientId, start.toISOString(), end.toISOString()) as {
    id: string;
    starts_at: string;
    service_code: string;
    service_description: string;
    fee_cents: number;
  }[];
  return {
    practitionerName: identity.displayName,
    npi: identity.npi,
    taxId: identity.taxId,
    clientName: client.displayName,
    diagnosis: client.diagnosis ?? "Not recorded",
    rangeStart: start.toISOString().slice(0, 10),
    rangeEnd: end.toISOString().slice(0, 10),
    lines: rows.map((row) => ({
      date: row.starts_at.slice(0, 10),
      serviceCode: row.service_code,
      description: row.service_description,
      chargedCents: row.fee_cents,
      paidCents: paidCentsForAppointment(db, row.id),
    })),
  };
}

async function drawLines(lines: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  let page = doc.addPage([612, 792]);
  let y = 740;
  for (const line of lines) {
    if (y < 64) {
      page = doc.addPage([612, 792]);
      y = 740;
    }
    page.drawText(line.slice(0, 110), { x: 48, y, size: 11, font, color: rgb(0.11, 0.1, 0.08) });
    y -= 18;
  }
  return doc.save();
}

export async function renderSuperbillPdf(data: SuperbillData): Promise<Uint8Array> {
  const lines = [
    "Superbill",
    `Practitioner: ${data.practitionerName}`,
    `NPI: ${data.npi}`,
    `Tax ID: ${data.taxId}`,
    `Client: ${data.clientName}`,
    `Diagnosis: ${data.diagnosis}`,
    `Period: ${data.rangeStart} to ${data.rangeEnd}`,
  ];
  if (data.lines.length === 0) lines.push("No sessions in this period.");
  for (const line of data.lines) {
    lines.push(`Date of service: ${line.date}`);
    lines.push(`CPT: ${line.serviceCode} ${line.description}`);
    lines.push(`Charged: ${formatMoney(line.chargedCents)}`);
    lines.push(`Paid: ${formatMoney(line.paidCents)}`);
  }
  return drawLines(lines);
}

export async function buildSuperbill(db: DB, actor: Actor, clientId: string, rangeStart: string, rangeEnd: string): Promise<Uint8Array> {
  return renderSuperbillPdf(await Promise.resolve(superbillData(db, actor, clientId, rangeStart, rangeEnd)));
}

export async function renderNotesPdf(notes: Array<Note & { clientName: string }>): Promise<Uint8Array> {
  const lines: string[] = ["Session notes"];
  for (const note of notes) {
    lines.push("---");
    lines.push(`Client: ${note.clientName}`);
    lines.push(`Template: ${note.template}`);
    lines.push(`Status: ${note.status}`);
    if (note.signedAt) lines.push(`Signed at: ${note.signedAt}`);
    if (note.contentHash) lines.push(`Content hash: ${note.contentHash}`);
    for (const [key, value] of Object.entries(note.body)) {
      lines.push(`${key}: ${value.replace(/\s+/g, " ").slice(0, 100)}`);
    }
  }
  return drawLines(lines);
}

export function extractPdfText(bytes: Uint8Array): string {
  const inflated = inflatePdfStreams(Buffer.from(bytes));
  const chunks: string[] = [];
  const hex = inflated.matchAll(/<([0-9A-Fa-f]+)>/g);
  for (const match of hex) {
    if (match[1].length < 4 || match[1].length % 2 !== 0) continue;
    const text = hexToAscii(match[1]);
    if (/[A-Za-z0-9]/.test(text)) chunks.push(text);
  }
  const blocks = inflated.match(/\[(?:[^\]]*)\]\s*TJ|\((?:\\.|[^\\)])*\)\s*Tj/g) ?? [];
  for (const block of blocks) {
    const parts = block.match(/\((?:\\.|[^\\)])*\)/g) ?? [];
    for (const part of parts) chunks.push(unescapePdf(part.slice(1, -1)));
  }
  return chunks.join("\n");
}

function hexToAscii(hex: string): string {
  let text = "";
  for (let index = 0; index < hex.length; index += 2) {
    text += String.fromCharCode(parseInt(hex.slice(index, index + 2), 16));
  }
  return text;
}

function inflatePdfStreams(buf: Buffer): string {
  const chunks: string[] = [buf.toString("latin1")];
  let index = 0;
  while (index < buf.length) {
    const start = buf.indexOf("stream", index);
    if (start < 0) break;
    let dataStart = start + "stream".length;
    if (buf[dataStart] === 0x0d) dataStart += 1;
    if (buf[dataStart] === 0x0a) dataStart += 1;
    const end = buf.indexOf("endstream", dataStart);
    if (end < 0) break;
    let dataEnd = end;
    if (buf[dataEnd - 1] === 0x0a) dataEnd -= 1;
    if (buf[dataEnd - 1] === 0x0d) dataEnd -= 1;
    const slice = buf.subarray(dataStart, dataEnd);
    try {
      chunks.push(inflateSync(slice).toString("latin1"));
    } catch {
      chunks.push(slice.toString("latin1"));
    }
    index = end + "endstream".length;
  }
  return chunks.join("\n");
}

function unescapePdf(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\(\d{3})/g, (_, oct: string) => String.fromCharCode(parseInt(oct, 8)));
}
