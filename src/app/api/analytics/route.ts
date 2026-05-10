import { NextRequest, NextResponse } from "next/server";
import { createPBClient } from "@/lib/pb/server";

export async function GET(req: NextRequest) {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const { searchParams } = new URL(req.url);
    const fyParam = searchParams.get("fy");

    // Derive FY start/end (Indian FY: Apr 1 – Mar 31)
    const now = new Date();
    let fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    if (fyParam) fyYear = parseInt(fyParam.split("-")[0]);
    const fyStart = `${fyYear}-04-01`;
    const fyEnd   = `${fyYear + 1}-03-31`;

    // All invoices in current FY
    const fyInvoices = await pb.collection("invoices").getFullList({
      filter: `user = "${userId}" && invoice_date >= "${fyStart}" && invoice_date <= "${fyEnd}"`,
      fields: "invoice_date,total,status,gst_amount,subtotal,paid_at",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inv = fyInvoices as any[];

    const fyTotal   = inv.reduce((s, i) => s + Number(i.total), 0);
    const fyPaid    = inv.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
    const fyPending = inv.filter(i => i.status === "sent").reduce((s, i) => s + Number(i.total), 0);
    const fyOverdue = inv.filter(i => i.status === "overdue").reduce((s, i) => s + Number(i.total), 0);
    const fyGst     = inv.reduce((s, i) => s + Number(i.gst_amount), 0);

    // Monthly breakdown (Apr–Mar)
    const months = Array.from({ length: 12 }, (_, i) => {
      const mIdx  = (i + 3) % 12;
      const mYear = i < 9 ? fyYear : fyYear + 1;
      const mStr  = `${mYear}-${String(mIdx + 1).padStart(2, "0")}`;
      const mInv  = inv.filter(x => x.invoice_date?.startsWith(mStr));
      return {
        month: new Date(mYear, mIdx, 1).toLocaleString("en-IN", { month: "short" }),
        year:  mYear,
        total: mInv.reduce((s, x) => s + Number(x.total), 0),
        paid:  mInv.filter(x => x.status === "paid").reduce((s, x) => s + Number(x.total), 0),
        count: mInv.length,
      };
    });

    // Today
    const today = now.toISOString().split("T")[0];
    const todayInv = await pb.collection("invoices").getFullList({
      filter: `user = "${userId}" && invoice_date = "${today}"`,
      fields: "total,status",
    });
    const todayTotal = todayInv.reduce((s, i) => s + Number(i.total), 0);

    // Current month
    const monthStr = today.slice(0, 7);
    const monthInv = await pb.collection("invoices").getFullList({
      filter: `user = "${userId}" && invoice_date >= "${monthStr}-01" && invoice_date <= "${monthStr}-31"`,
      fields: "total,status,gst_amount",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mRows = monthInv as any[];
    const monthTotal   = mRows.reduce((s: number, i) => s + Number(i.total), 0);
    const monthPaid    = mRows.filter(i => i.status === "paid").reduce((s: number, i) => s + Number(i.total), 0);
    const monthGst     = mRows.reduce((s: number, i) => s + Number(i.gst_amount), 0);
    const monthPending = mRows.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s: number, i) => s + Number(i.total), 0);

    // Status breakdown
    const statusBreakdown = ["draft", "sent", "paid", "overdue"].map(status => ({
      status,
      count: inv.filter(i => i.status === status).length,
      total: inv.filter(i => i.status === status).reduce((s, i) => s + Number(i.total), 0),
    }));

    // Top clients by revenue — expand client relation
    const paidInvoices = await pb.collection("invoices").getFullList({
      filter: `user = "${userId}" && status = "paid" && invoice_date >= "${fyStart}" && invoice_date <= "${fyEnd}"`,
      expand: "client",
      fields: "total,expand.client.name",
    });

    const clientMap: Record<string, number> = {};
    for (const inv of paidInvoices) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = (inv.expand as any)?.client?.name ?? "Unknown";
      clientMap[name] = (clientMap[name] ?? 0) + Number(inv.total);
    }
    const topClients = Object.entries(clientMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, revenue]) => ({ name, revenue }));

    return NextResponse.json({
      fy:      { label: `${fyYear}-${String(fyYear + 1).slice(2)}`, start: fyStart, end: fyEnd },
      fyStats: { total: fyTotal, paid: fyPaid, pending: fyPending, overdue: fyOverdue, gst: fyGst, count: inv.length },
      today:   { total: todayTotal, count: todayInv.length },
      month:   { total: monthTotal, paid: monthPaid, pending: monthPending, gst: monthGst, count: mRows.length },
      monthly: months,
      statusBreakdown,
      topClients,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
