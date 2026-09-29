import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getOwner } from "@/lib/owner";
import { isDemoUser } from "@/lib/data";
import { getSession } from "@/lib/demo/sandbox";
import { LiveDemo } from "./live-demo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live demo" };

/** The real owner app beside the phone that receives its WhatsApp messages. */
export default async function LiveDemoPage() {
  const owner = await getOwner();
  if (!owner) redirect("/demo");
  if (!isDemoUser(owner)) redirect("/dashboard");
  const session = await getSession(owner.id);
  if (!session) redirect("/demo");
  return <LiveDemo sandbox={owner.id} expiresAt={new Date(String(session.expires_at).replace(" ", "T")).toISOString()} daysForwarded={Number(session.days_forwarded) || 0} />;
}
