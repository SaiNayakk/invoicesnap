import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Returns aggregated analytics for dashboard
// Query params: fy=2024-25 (financial year, default current)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fyParam = searchParams.get("fy"); // e.g. "2024-25"

    // Derive FY start/end (Indian FY: Apr 1 – Mar 31)
    const now = new Date();
    let fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // Apr=3
    if (fyParam) {
      fyYear = parseInt(fyParam.split("-")[0]);
    }
    const fyStart = `${fyYear}-04-01`;
    const fyEnd   = `${fyYear + 1}-03-31`;

    // All invoices in current FY
    const { data: fyInvoices } = await supabase
      .from("invoices")
      .select("invoice_date, total, status, gst_amount, subtotal, paid_at")
      .eq("user_id", user.id)
      .gte("invoice_date", fyStart)
      .lte("invoice_date", fyEnd);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inv = (fyInvoices ?? []) as any[];

    // ── FY-level stats ────────────────────────────────────────────────────────
    const fyTotal   = inv.reduce((s, i) => s + Number(i.total), 0);
    const fyPaid    = inv.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
    const fyPending = inv.filter(i => i.status === "sent").reduce((s, i) => s + Number(i.total), 0);
    const fyOverdue = inv.filter(i => i.status === "overdue").reduce((s, i) => s + Number(i.total), 0);
    const fyGst     = inv.reduce((s, i) => s + Number(i.gst_amount), 0);

    // ── Monthly breakdown (Apr-Mar) ───────────────────────────────────────────
    const months = Array.from({ length: 12 }, (_, i) => {
      const mIdx  = (i + 3) % 12; // April=3, ..., March=2
      const mYear = i < 9 ? fyYear : fyYear + 1;
      const mStr  = `${mYear}-${String(mIdx + 1).padStart(2, "0")}`;
      const mInv  = inv.filter(x => x.invoice_date.startsWith(mStr));
      return {
        month:   new Date(mYear, mIdx, 1).toLocaleString("en-IN", { month: "short" }),
        year:    mYear,
        total:   mInv.reduce((s, x) => s + Number(x.total), 0),
        paid:    mInv.filter(x => x.status === "paid").reduce((s, x) => s + Number(x.total), 0),
        count:   mInv.length,
      };
    });

    // ── Today ─────────────────────────────────────────────────────────────────
    const today = now.toISOString().split("T")[0];
    const { data: todayInv } = await supabase
      .from("invoices")
      .select("total, status")
      .eq("user_id", user.id)
      .eq("invoice_date", today);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const todayRows = (todayInv ?? []) as any[];
    const todayTotal = todayRows.reduce((s: number, i: any) => s + Number(i.total), 0);
    const todayCount = todayRows.length;

    // ── Current month ─────────────────────────────────────────────────────────
    const monthStr = today.slice(0, 7);
    const { data: monthInv } = await supabase
      .from("invoices")
      .select("total, status, gst_amount")
      .eq("user_id", user.id)
      .like("invoice_date", `${monthStr}%`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monthRows = (monthInv ?? []) as any[];
    const monthTotal   = monthRows.reduce((s: number, i: any) => s + Number(i.total), 0);
    const monthPaid    = monthRows.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.total), 0);
    const monthGst     = monthRows.reduce((s: number, i: any) => s + Number(i.gst_amount), 0);
    const monthPending = monthRows.filter((i: any) => ["sent","overdue"].includes(i.status)).reduce((s: number, i: any) => s + Number(i.total), 0);

    // ── Status breakdown ──────────────────────────────────────────────────────
    const statusBreakdown = ["draft","sent","paid","overdue"].map(status => ({
      status,
      count: inv.filter(i => i.status === status).length,
      total: inv.filter(i => i.status === status).reduce((s, i) => s + Number(i.total), 0),
    }));

    // ── Top clients by revenue (FY) ───────────────────────────────────────────
    const { data: paidInvoices } = await supabase
      .from("invoices_with_client" as "invoices")
      .select("client_name, total, status") // cast for type
      .eq("user_id", user.id)
      .eq("status", "paid")
      .gte("invoice_date", fyStart)
      .lte("invoice_date", fyEnd);

    const clientMap: Record<string, number> = {};
    for (const i of (paidInvoices ?? []) as { client_name: string; total: number }[]) {
      clientMap[i.client_name] = (clientMap[i.client_name] ?? 0) + Number(i.total);
    }
    const topClients = Object.entries(clientMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, revenue]) => ({ name, revenue }));

    return NextResponse.json({
      fy: { label: `${fyYear}-${String(fyYear + 1).slice(2)}`, start: fyStart, end: fyEnd },
      fyStats: { total: fyTotal, paid: fyPaid, pending: fyPending, overdue: fyOverdue, gst: fyGst, count: inv.length },
      today:   { total: todayTotal, count: todayCount },
      month:   { total: monthTotal, paid: monthPaid, pending: monthPending, gst: monthGst, count: (monthInv ?? []).length },
      monthly: months,
      statusBreakdown,
      topClients,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
