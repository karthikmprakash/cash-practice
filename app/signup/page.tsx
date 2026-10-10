import { signupAction } from "@/src/server/actions";
import { Notice } from "@/app/components/shell";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="hero" id="content">
      <h1>Create your practice</h1>
      <p className="muted">One login. You can add your first client in the next step.</p>
      <Notice code={error} />
      <form action={signupAction} className="card">
        <label className="field"><span>Your name</span><input className="input" name="name" required maxLength={120} autoComplete="name" /></label>
        <label className="field"><span>Email</span><input className="input" name="email" type="email" required autoComplete="email" /></label>
        <label className="field"><span>Password</span><input className="input" name="password" type="password" required minLength={12} autoComplete="new-password" /></label>
        <button className="btn btn-primary" type="submit">Create practice</button>
      </form>
    </div>
  );
}
