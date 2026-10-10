import { Notice } from "@/app/components/shell";
import { portalIntakeAction, portalMessageAction } from "@/src/server/actions";
import { getDb } from "@/src/server/db";
import { AppError } from "@/src/server/errors";
import { CONSENT_TEXT, listPortalMessages, portalContext } from "@/src/server/portal";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  let practice = "";
  try {
    practice = portalContext(getDb(), token).practitionerName;
  } catch (error) {
    const message = error instanceof AppError ? error.message : "This link has expired. Ask your clinician for a new one.";
    return <div className="hero" id="content"><h1>Link unavailable</h1><p role="alert">{message}</p></div>;
  }
  const messages = listPortalMessages(getDb(), token);
  return (
    <div className="hero stack" id="content">
      <h1>Paperwork for {practice}</h1>
      <Notice code={query.error} />
      {query.done ? <p className="ok">Intake received. Your clinician can see it.</p> : null}
      <form action={portalIntakeAction} className="card">
        <input type="hidden" name="token" value={token} />
        <label className="field"><span>What brings you in</span><textarea name="reason" required /></label>
        <label className="field"><span>Emergency contact</span><input className="input" name="emergencyName" required /></label>
        <label className="field"><span>Emergency phone</span><input className="input" name="emergencyPhone" required /></label>
        <p>{CONSENT_TEXT}</p>
        <label className="check"><input type="checkbox" name="consent" /> <span>I agree</span></label>
        <label className="field"><span>Type your name to sign</span><input className="input" name="signature" required /></label>
        <button className="btn btn-primary" type="submit">Submit intake</button>
      </form>
      <section className="card">
        <h2>Message</h2>
        <ul>{messages.map((message, index) => <li key={index}>{message.sender}: {message.body}</li>)}</ul>
        <form action={portalMessageAction}>
          <input type="hidden" name="token" value={token} />
          <label className="field"><span>Your message</span><textarea name="body" /></label>
          <button className="btn btn-secondary" type="submit">Send message</button>
        </form>
      </section>
    </div>
  );
}
