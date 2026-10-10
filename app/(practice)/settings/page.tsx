import { Notice } from "@/app/components/shell";
import { cancelPlanAction, deleteAccountAction, requirePractice, settingsAction } from "@/src/server/actions";
import { maskedTaxId, storedNpi } from "@/src/server/auth";
import { getDb } from "@/src/server/db";
import { ledger } from "@/src/server/payments";
import { formatMoney } from "@/src/server/format";

export const dynamic = "force-dynamic";

const OFFSETS = [
  { minutes: 2880, label: "48 hours before" },
  { minutes: 1440, label: "24 hours before" },
  { minutes: 120, label: "2 hours before" },
  { minutes: 60, label: "1 hour before" },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; canceled?: string }> }) {
  const practitioner = await requirePractice();
  const query = await searchParams;
  const db = getDb();
  const books = ledger(db, practitioner.id);
  return (
    <div className="stack">
      <h1>Settings</h1>
      <Notice code={query.error} />
      {query.saved ? <p className="ok">Saved.</p> : null}
      {query.canceled ? <p className="ok">Cancellation requested. It takes effect at the end of the period you already paid.</p> : null}
      <section className="card">
        <h2>Reminders and Stripe</h2>
        <form action={settingsAction}>
          {OFFSETS.map((offset) => (
            <label className="check" key={offset.minutes}>
              <input type="checkbox" name="offset" value={offset.minutes} defaultChecked={practitioner.reminderOffsets.includes(offset.minutes)} />
              <span>{offset.label}</span>
            </label>
          ))}
          <label className="field"><span>Stripe account id</span><input className="input" name="stripeAccount" defaultValue={practitioner.stripeAccountId ?? ""} placeholder="acct_" /></label>
          <button className="btn btn-primary" type="submit">Save settings</button>
        </form>
        <p className="muted">NPI {storedNpi(db, practitioner.id) ?? "missing"} · Tax ID {maskedTaxId(db, practitioner.id) ?? "missing"}</p>
      </section>
      <section className="card">
        <h2>Money in</h2>
        <p>Charged {formatMoney(books.chargesCents)} · Received {formatMoney(books.paidCents)} · Still open {formatMoney(books.differenceCents)}</p>
        <p className="muted">Session charges do not include a platform fee.</p>
        <p><a href="/api/export">Download JSON</a> · <a href="/api/export?format=csv">Download CSV</a> · <a href="/api/export?format=notes">Download note PDF</a></p>
      </section>
      <section className="card">
        <h2>Plan</h2>
        <p>Solo is $29 a month. Status: {practitioner.subscriptionStatus}.</p>
        <form action={cancelPlanAction}><button className="btn btn-secondary" type="submit">Cancel plan</button></form>
      </section>
      <section className="card">
        <h2>Close the account</h2>
        <form action={deleteAccountAction}>
          <label className="field"><span>Type your email to confirm</span><input className="input" name="confirm" /></label>
          <button className="btn btn-danger" type="submit">Delete account</button>
        </form>
      </section>
    </div>
  );
}
