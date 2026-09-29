import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner";
import { listClients } from "@/lib/data";
import { getInsights } from "@/lib/ai/insights";
import { PageHeader } from "@/components/app/ui";
import { ClientsView, type ClientRow } from "./clients-view";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const owner = await requireOwner();
  const [clients, ins] = await Promise.all([listClients(owner.id), getInsights(owner.id)]);
  const rows: ClientRow[] = clients.map((c) => {
    const s = ins.clients[c.id];
    return {
      id: c.id, name: c.name, phone: c.phone, email: c.email, city: c.city, gst: c.gst_number,
      billed: s?.billed ?? 0, outstanding: s?.outstanding ?? 0, paid: s?.paid ?? 0, onTime: s?.onTime ?? 0, typicalDelay: s?.typicalDelay ?? null,
    };
  }).sort((a, b) => b.outstanding - a.outstanding || b.billed - a.billed);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Clients" sub={`${clients.length} client${clients.length === 1 ? "" : "s"}, sorted by money owed`} />
      <ClientsView rows={rows} />
    </div>
  );
}
