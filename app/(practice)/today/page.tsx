import Link from "next/link";
import { requirePractice } from "@/src/server/actions";
import { listDay } from "@/src/server/appointments";
import { getDb } from "@/src/server/db";
import { formatTime, zonedDayKey } from "@/src/server/time";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const practitioner = await requirePractice();
  const today = zonedDayKey(new Date().toISOString(), practitioner.timezone);
  const sessions = listDay(getDb(), practitioner, today, practitioner.timezone);
  return (
    <div className="stack">
      <h1>Today</h1>
      {sessions.length === 0 ? (
        <div className="card">
          <p>No sessions today.</p>
          <Link className="btn btn-primary" href="/clients/new">Add a client</Link>
        </div>
      ) : (
        <ul className="cards">
          {sessions.map((session) => (
            <li className="card" key={session.id}>
              <Link href={`/clients/${session.clientId}`}>{session.clientName}</Link>
              <p className="muted">{formatTime(session.startsAt, practitioner.timezone)} · {session.serviceCode}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
