import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner";
import { isDemoUser, listClients } from "@/lib/data";
import { todayIST } from "@/lib/dates";
import { InvoiceBuilder } from "./builder";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const owner = await requireOwner();
  const clients = await listClients(owner.id);
  return (
    <InvoiceBuilder
      clients={clients.map((c) => ({ id: c.id, name: c.name, phone: c.phone, gst_number: c.gst_number, state: c.state }))}
      seller={{ gst_number: owner.gst_number, state: owner.state, hasUpi: Boolean(owner.upi_id) }}
      today={todayIST()}
      defaultDueDays={owner.default_due_days || 15}
      demo={isDemoUser(owner)}
    />
  );
}
