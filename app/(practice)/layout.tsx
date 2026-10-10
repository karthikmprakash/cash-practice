import { Shell } from "@/app/components/shell";
import { requirePractice } from "@/src/server/actions";

export const dynamic = "force-dynamic";

export default async function PracticeLayout({ children }: { children: React.ReactNode }) {
  const practitioner = await requirePractice();
  return <Shell name={practitioner.displayName}>{children}</Shell>;
}
