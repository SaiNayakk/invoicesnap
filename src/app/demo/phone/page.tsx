import { redirect } from "next/navigation";
import { getOwner } from "@/lib/owner";
import { isDemoUser } from "@/lib/data";
import { PhoneChats } from "./phone-chats";

export const dynamic = "force-dynamic";
export const metadata = { title: "WhatsApp (demo)" };

/** The demo's phone: WhatsApp-style chats with every message the sandbox has "sent". */
export default async function PhonePage() {
  const owner = await getOwner();
  if (!owner || !isDemoUser(owner)) redirect("/demo");
  return <PhoneChats />;
}
