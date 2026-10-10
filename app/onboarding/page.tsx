import { baaAction } from "@/src/server/actions";
import { Notice } from "@/app/components/shell";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="hero" id="content">
      <h1>Business associate agreement</h1>
      <div className="card">
        <p>CashPractice stores records for your practice. We use them only to run the product: scheduling, notes, intake, payments, and superbills.</p>
        <p>We encrypt client details, keep an audit log we cannot edit, and return or delete records when you close the account. We do not sell records and we do not file insurance.</p>
        <p>You are responsible for a signed agreement with any host, email, text, payment, or video vendor you connect before a real client is entered. Version 2026-10-10. This text has not been reviewed by counsel.</p>
      </div>
      <Notice code={error} />
      <form action={baaAction} className="card">
        <label className="field"><span>National provider identifier</span><input className="input" name="npi" inputMode="numeric" required pattern="\d{10}" /></label>
        <label className="field"><span>Tax ID</span><input className="input" name="taxId" required autoComplete="off" /></label>
        <label className="field">
          <span>Time zone</span>
          <select className="input" name="timezone" defaultValue="UTC">
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern</option>
            <option value="America/Chicago">Central</option>
            <option value="America/Denver">Mountain</option>
            <option value="America/Los_Angeles">Pacific</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" name="accept" /> <span>I accept the business associate agreement</span></label>
        <button className="btn btn-primary" type="submit">Accept and continue</button>
      </form>
    </div>
  );
}
