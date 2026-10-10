import { createClientAction } from "@/src/server/actions";
import { Notice } from "@/app/components/shell";

export const dynamic = "force-dynamic";

export default async function NewClientPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="stack">
      <h1>New client</h1>
      <Notice code={error} />
      <form action={createClientAction} className="card">
        <label className="field"><span>Client name</span><input className="input" name="name" required maxLength={120} /></label>
        <label className="field"><span>Email</span><input className="input" name="email" type="email" /></label>
        <label className="field"><span>Phone</span><input className="input" name="phone" /></label>
        <label className="field"><span>Date of birth</span><input className="input" name="dob" type="date" /></label>
        <label className="field"><span>Diagnosis code</span><input className="input" name="diagnosis" maxLength={10} /></label>
        <button className="btn btn-primary" type="submit">Save client</button>
      </form>
    </div>
  );
}
