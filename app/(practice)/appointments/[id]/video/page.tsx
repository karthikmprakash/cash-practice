import Link from "next/link";
import { VideoRoom } from "@/app/components/video-room";
import { requirePractice } from "@/src/server/actions";
import { getAppointment } from "@/src/server/appointments";
import { getDb } from "@/src/server/db";
import { roomUrlForToken } from "@/src/server/telehealth";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const practitioner = await requirePractice();
  const { id } = await params;
  const session = getAppointment(getDb(), practitioner, id);
  const roomUrl = roomUrlForToken(session.telehealthToken);
  return (
    <div className="stack">
      <h1>Video room</h1>
      <p className="muted">This room belongs to one session. The name is random. A public test room is not a BAA. Point VIDEO_ROOM_BASE_URL at a covered vendor before a real visit.</p>
      <VideoRoom roomUrl={roomUrl} />
      <p><Link href={`/clients/${session.clientId}`}>Back to chart</Link></p>
    </div>
  );
}
