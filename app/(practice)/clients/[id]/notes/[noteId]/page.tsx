import { Notice } from "@/app/components/shell";
import { requirePractice, saveNoteAction } from "@/src/server/actions";
import { getDb } from "@/src/server/db";
import { fieldsFor, getNote, previousSignedNote } from "@/src/server/notes";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  subjective: "Subjective",
  objective: "Objective",
  assessment: "Assessment",
  plan: "Plan",
  data: "Data",
  body: "Note",
};

export default async function NotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; noteId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const practitioner = await requirePractice();
  const { id, noteId } = await params;
  const { error } = await searchParams;
  const db = getDb();
  const note = getNote(db, practitioner, noteId);
  const previous = previousSignedNote(db, practitioner, id, note.id);
  const signed = note.status === "signed";
  return (
    <div className="grid-2">
      <div>
        <h1>{note.template.toUpperCase()} note</h1>
        <Notice code={error} />
        {signed ? (
          <div className="card stack">
            <p className="ok">Signed. This note cannot be edited.</p>
            <p>Author recorded. Signed at {note.signedAt}. Content hash {note.contentHash}.</p>
            {fieldsFor(note.template).map((key) => (
              <p key={key}><strong>{LABELS[key]}</strong><br />{note.body[key]}</p>
            ))}
            <p className="muted">Start a new note if you need to add something.</p>
          </div>
        ) : (
          <form action={saveNoteAction} className="card">
            <input type="hidden" name="clientId" value={id} />
            <input type="hidden" name="noteId" value={note.id} />
            <input type="hidden" name="template" value={note.template} />
            {fieldsFor(note.template).map((key) => (
              <label className="field" key={key}>
                <span>{LABELS[key]}</span>
                <textarea name={key} defaultValue={note.body[key]} required />
              </label>
            ))}
            <div className="row">
              <button className="btn btn-secondary" name="intent" value="save" type="submit">Save draft</button>
              <button className="btn btn-primary" name="intent" value="sign" type="submit">Sign note</button>
            </div>
          </form>
        )}
      </div>
      <aside className="card">
        <h2>Last signed note</h2>
        {previous ? fieldsFor(previous.template).map((key) => (
          <p key={key}><strong>{LABELS[key]}</strong><br />{previous.body[key]}</p>
        )) : <p className="muted">No earlier signed note.</p>}
      </aside>
    </div>
  );
}
