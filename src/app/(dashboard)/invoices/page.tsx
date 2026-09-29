import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireOwner } from "@/lib/owner";
import { listClients, listInvoices } from "@/lib/data";
import { getInsights } from "@/lib/ai/insights";
import { PageHeader } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { InvoiceTable, type Row } from "./invoice-table";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const owner = await requireOwner();
  const [invoices, clients, ins] = await Promise.all([listInvoices(owner.id), listClients(owner.id), getInsights(owner.id)]);
  const name = new Map(clients.map((c) => [c.id, c.name]));
  const rows: Row[] = invoices.map((i) => {
    const p = ins.predictions[i.id];
    return {
      id: i.id, number: i.invoice_number, client: name.get(i.client) ?? "Client", total: i.total, status: i.status,
      date: i.invoice_date, due: i.due_date, paidAt: i.paid_at, expected: p?.expected ?? null, level: p?.level ?? null,
      why: p?.reasons.join(". ") ?? "",
    };
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Invoices" sub={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
        actions={<Button size="sm" asChild className="hidden md:inline-flex"><Link href="/invoices/new"><Plus size={14} /> New invoice</Link></Button>} />
      <InvoiceTable rows={rows} today={ins.today} />
    </div>
  );
}
