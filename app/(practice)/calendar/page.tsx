import Link from "next/link";
import { requirePractice } from "@/src/server/actions";
import { listAppointmentsBetween } from "@/src/server/appointments";
import { getDb } from "@/src/server/db";
import { addDays, formatDay, formatTime, weekDays, zonedDayKey, zonedLocalToUtc } from "@/src/server/time";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const practitioner = await requirePractice();
  const query = await searchParams;
  const view = query.view === "week" ? "week" : "day";
  const day = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
    ? query.date
    : zonedDayKey(new Date().toISOString(), practitioner.timezone);
  const days = view === "week" ? weekDays(day, practitioner.timezone) : [day];
  const start = zonedLocalToUtc(`${days[0]}T00:00`, practitioner.timezone).toISOString();
  const end = zonedLocalToUtc(`${addDays(days[days.length - 1], 1)}T00:00`, practitioner.timezone).toISOString();
  const sessions = listAppointmentsBetween(getDb(), practitioner, start, end);
  return (
    <div className="stack">
      <div className="row">
        <h1>Calendar</h1>
        <Link href={`/calendar?view=day&date=${day}`}>Day</Link>
        <Link href={`/calendar?view=week&date=${day}`}>Week</Link>
      </div>
      <div className={view === "week" ? "week" : "cards"}>
        {days.map((column) => (
          <section className="day-col" key={column}>
            <h2>{formatDay(column)}</h2>
            {sessions.filter((session) => zonedDayKey(session.startsAt, practitioner.timezone) === column).length === 0 ? (
              <p className="muted">Open</p>
            ) : null}
            {sessions
              .filter((session) => zonedDayKey(session.startsAt, practitioner.timezone) === column)
              .map((session) => (
                <Link className="session-link" key={session.id} href={`/clients/${session.clientId}`}>
                  {session.clientName}
                  <span className="muted"> · {formatTime(session.startsAt, practitioner.timezone)} · {session.serviceCode}</span>
                  </Link>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
