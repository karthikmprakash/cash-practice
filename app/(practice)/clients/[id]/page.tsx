import { headers } from "next/headers";
import Link from "next/link";
import { Notice } from "@/app/components/shell";
import { bookAction, cardPaymentAction, intakeLinkAction, manualPaymentAction, messageAction, requirePractice, startNoteAction, statusAction } from "@/src/server/actions";
import { listAppointmentsForClient } from "@/src/server/appointments";
import { getClient } from "@/src/server/clients";
import { getDb } from "@/src/server/db";
import { formatMoney } from "@/src/server/format";
import { listNotes } from "@/src/server/notes";
import { appointmentBalance, listPaymentsForClient } from "@/src/server/payments";
import { latestIntake, listMessages } from "@/src/server/portal";
import { formatTime } from "@/src/server/time";

export const dynamic = "force-dynamic";

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; intake?: string }>;
}) {
  const practitioner = await requirePractice();
  const { id } = await params;
  const query = await searchParams;
  const db = getDb();
  const client = getClient(db, practitioner, id);
  const sessions = listAppointmentsForClient(db, practitioner, id);
  const notes = listNotes(db, practitioner, id);
  const payments = listPaymentsForClient(db, practitioner, id);
  const intake = latestIntake(db, practitioner, id);
  const messages = listMessages(db, practitioner, id);
  const headerStore = await headers();
  const origin = `${headerStore.get("x-forwarded-proto") ?? "http"}://${headerStore.get("host")}`;
  return (
    <div className="stack">
      <h1>{client.displayName}</h1>
      <p className="muted">{[client.diagnosis, client.email, client.dob].filter(Boolean).join(" · ")}</p>
      <Notice code={query.error} />
      {query.intake ? <p className="banner">Intake link: <a href={query.intake}>{query.intake}</a></p> : null}
      <div className="grid-2">
        <div className="stack">
          <section className="card">
            <h2>Sessions</h2>
            {sessions.length === 0 ? <p className="muted">No sessions booked.</p> : null}
            <ul className="cards">
              {sessions.map((session) => {
                const balance = appointmentBalance(db, practitioner, session.id);
                return (
                  <li key={session.id}>
                    <p>{formatTime(session.startsAt, practitioner.timezone)} · {session.serviceCode} · {formatMoney(session.feeCents)} · {session.status} · {balance.status}</p>
                    <div className="row">
                      <Link href={`/appointments/${session.id}/video`}>Open video room</Link>
                      <form action={statusAction}><input type="hidden" name="clientId" value={id} /><input type="hidden" name="appointmentId" value={session.id} /><input type="hidden" name="status" value="attended" /><button className="btn btn-secondary" type="submit">Mark attended</button></form>
                      <form action={statusAction}><input type="hidden" name="clientId" value={id} /><input type="hidden" name="appointmentId" value={session.id} /><input type="hidden" name="status" value="no_show" /><button className="btn btn-ghost" type="submit">Mark no-show</button></form>
                      <form action={statusAction}><input type="hidden" name="clientId" value={id} /><input type="hidden" name="appointmentId" value={session.id} /><input type="hidden" name="status" value="cancelled" /><button className="btn btn-ghost" type="submit">Cancel session</button></form>
                    </div>
                    <form action={manualPaymentAction} className="row">
                      <input type="hidden" name="clientId" value={id} />
                      <input type="hidden" name="appointmentId" value={session.id} />
                      <label className="field"><span>Amount</span><input className="input" name="amount" defaultValue={(session.feeCents / 100).toFixed(2)} /></label>
                      <label className="field"><span>Paid on</span><input className="input" name="paidOn" type="date" required /></label>
                      <input type="hidden" name="method" value="cash" />
                      <button className="btn btn-secondary" type="submit">Record cash</button>
                    </form>
                    <form action={manualPaymentAction}>
                      <input type="hidden" name="clientId" value={id} />
                      <input type="hidden" name="appointmentId" value={session.id} />
                      <input type="hidden" name="method" value="transfer" />
                      <input type="hidden" name="amount" value={(session.feeCents / 100).toFixed(2)} />
                      <label className="field"><span>Transfer date</span><input className="input" name="paidOn" type="date" required /></label>
                      <button className="btn btn-ghost" type="submit">Record transfer</button>
                    </form>
                    <form action={cardPaymentAction}>
                      <input type="hidden" name="clientId" value={id} />
                      <input type="hidden" name="appointmentId" value={session.id} />
                      <input type="hidden" name="origin" value={origin} />
                      <button className="btn btn-secondary" type="submit">Charge card</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="card">
            <h2>Notes</h2>
            <div className="row">
              {(["soap", "dap", "free"] as const).map((template) => (
                <form key={template} action={startNoteAction}>
                  <input type="hidden" name="clientId" value={id} />
                  <input type="hidden" name="template" value={template} />
                  <button className="btn btn-secondary" type="submit">New {template.toUpperCase()} note</button>
                </form>
              ))}
            </div>
            <ul>
              {notes.map((note) => (
                <li key={note.id}><Link href={`/clients/${id}/notes/${note.id}`}>{note.template} · {note.status}</Link></li>
              ))}
            </ul>
          </section>
        </div>
        <div className="stack">
          <section className="card">
            <h2>Book a session</h2>
            <form action={bookAction}>
              <input type="hidden" name="clientId" value={id} />
              <label className="field"><span>Session date</span><input className="input" name="day" type="date" required /></label>
              <label className="field"><span>Start time</span><input className="input" name="time" type="time" required defaultValue="15:00" /></label>
              <label className="field"><span>Duration</span>
                <select className="input" name="duration" defaultValue="60">
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="50">50 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </label>
              <label className="field"><span>Service code</span><input className="input" name="serviceCode" required defaultValue="90837" /></label>
              <label className="field"><span>Fee</span><input className="input" name="fee" required defaultValue="150.00" /></label>
              <label className="check"><input type="checkbox" name="video" /> <span>Video session</span></label>
              <button className="btn btn-primary" type="submit">Book session</button>
            </form>
          </section>
          <section className="card">
            <h2>Intake</h2>
            {intake ? <p className="ok">Intake complete. Signed by {intake.consentName}.</p> : <p className="muted">No intake yet.</p>}
            {intake ? <p>{intake.answers.reason}</p> : null}
            <form action={intakeLinkAction}>
              <input type="hidden" name="clientId" value={id} />
              <button className="btn btn-secondary" type="submit">Create intake link</button>
            </form>
          </section>
          <section className="card">
            <h2>Superbill</h2>
            <form method="get" action={`/api/clients/${id}/superbill`}>
              <label className="field"><span>From</span><input className="input" name="from" type="date" required /></label>
              <label className="field"><span>To</span><input className="input" name="to" type="date" required /></label>
              <button className="btn btn-secondary" type="submit">Download superbill</button>
            </form>
          </section>
          <section className="card">
            <h2>Payments</h2>
            {payments.length === 0 ? <p className="muted">Nothing recorded.</p> : (
              <ul>{payments.map((payment) => <li key={payment.id}>{payment.method} · {formatMoney(payment.amountCents)} · {payment.paidAt.slice(0, 10)}</li>)}</ul>
            )}
          </section>
          <section className="card">
            <h2>Messages</h2>
            <ul>{messages.map((message) => <li key={message.id}><strong>{message.sender}</strong>: {message.body}</li>)}</ul>
            <form action={messageAction}>
              <input type="hidden" name="clientId" value={id} />
              <label className="field"><span>Message</span><textarea name="body" /></label>
              <button className="btn btn-secondary" type="submit">Send</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
