import { loginAction } from "@/src/server/actions";
import { Notice } from "@/app/components/shell";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="hero" id="content">
      <h1>Sign in</h1>
      <Notice code={error} />
      <form action={loginAction} className="card">
        <label className="field"><span>Email</span><input className="input" name="email" type="email" required autoComplete="email" /></label>
        <label className="field"><span>Password</span><input className="input" name="password" type="password" required autoComplete="current-password" /></label>
        <button className="btn btn-primary" type="submit">Sign in</button>
      </form>
    </div>
  );
}
