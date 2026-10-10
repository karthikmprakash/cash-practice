import Link from "next/link";
import { requirePractice } from "@/src/server/actions";
import { listClients } from "@/src/server/clients";
import { getDb } from "@/src/server/db";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const practitioner = await requirePractice();
  const clients = listClients(getDb(), practitioner);
  return (
    <div className="stack">
      <div className="row">
        <h1>Clients</h1>
        <Link className="btn btn-primary" href="/clients/new">Add a client</Link>
      </div>
      {clients.length === 0 ? <div className="card"><p>No clients yet.</p></div> : (
        <ul className="cards">
          {clients.map((client) => (
            <li className="card" key={client.id}><Link href={`/clients/${client.id}`}>{client.displayName}</Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
