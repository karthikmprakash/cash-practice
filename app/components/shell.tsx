import Link from "next/link";
import { logoutAction } from "@/src/server/actions";
import { ERROR_TEXT } from "@/src/server/errors";

export function Notice({ code }: { code?: string }) {
  if (!code || !ERROR_TEXT[code]) return null;
  return <p className="error" role="alert">{ERROR_TEXT[code]}</p>;
}

export function Shell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="wordmark" href="/today">CashPractice</Link>
        <nav className="nav" aria-label="Practice">
          <Link href="/today">Today</Link>
          <Link href="/calendar">Calendar</Link>
          <Link href="/clients">Clients</Link>
          <Link href="/settings">Settings</Link>
        </nav>
        <p className="who">{name}</p>
        <form action={logoutAction}>
          <button className="btn btn-ghost" type="submit">Sign out</button>
        </form>
      </aside>
      <main className="main" id="content">{children}</main>
    </div>
  );
}
