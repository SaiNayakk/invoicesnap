/**
 * Everything the dashboard needs from the payment model, computed once per
 * user and cached until their invoices change. The backtest replays a year of
 * history, so it's the expensive part; it runs in well under 100 ms for a
 * typical freelancer but is still worth not repeating on every page view.
 */

import { createPBAdminClient } from "@/lib/pb/server";
import { daysBetween, todayIST, dateOf } from "@/lib/dates";
import { OPEN, type Client, type Invoice } from "@/lib/types";
import {
  backtest, fitPayModel, forecastCash, predictPayment,
  type Backtest, type Forecast, type PayInvoice, type PayPrediction,
} from "./payments";

export interface ClientStat {
  invoices: number;
  paid: number;
  onTime: number; // paid within a week of the due date
  typicalDelay: number | null; // median days after due date
  outstanding: number;
  billed: number;
}

export interface Insights {
  today: string;
  predictions: Record<string, PayPrediction>;
  forecast: Forecast;
  backtest: Backtest | null;
  clients: Record<string, ClientStat>;
  totals: {
    outstanding: number; openCount: number; overdue: number; overdueCount: number;
    paidThisMonth: number; paidThisMonthCount: number; billedThisMonth: number; gstThisMonth: number;
    awaitingConfirmation: number;
  };
}

type Cached = { at: number; day: string; value: Promise<Insights> };
const g = globalThis as unknown as { __isInsights?: Map<string, Cached> };
const cache = (g.__isInsights ??= new Map());
const TTL = 10 * 60_000;

export function invalidateInsights(userId: string) {
  cache.delete(userId);
}

export function getInsights(userId: string): Promise<Insights> {
  const today = todayIST();
  const hit = cache.get(userId);
  if (hit && hit.day === today && Date.now() - hit.at < TTL) return hit.value;
  const value = compute(userId, today).catch((e) => {
    cache.delete(userId);
    throw e;
  });
  cache.set(userId, { at: Date.now(), day: today, value });
  return value;
}

export function toPay(i: Invoice): PayInvoice {
  return { id: i.id, client: i.client, total: i.total, invoice_date: i.invoice_date, due_date: i.due_date, status: i.status, paid_at: i.paid_at };
}

async function compute(userId: string, today: string): Promise<Insights> {
  const pb = await createPBAdminClient();
  const [invRows, clientRows] = await Promise.all([
    pb.collection("invoices").getFullList({
      filter: pb.filter('user = {:u} && status != "draft" && status != "cancelled"', { u: userId }),
      fields: "id,client,total,gst_amount,invoice_date,due_date,status,paid_at",
    }),
    pb.collection("clients").getFullList({ filter: pb.filter("user = {:u}", { u: userId }), fields: "id,gst_number" }),
  ]);
  const invoices = (invRows as unknown as Invoice[]).map((i) => ({ ...i, status: i.status === "sent" && i.due_date < today ? "overdue" : i.status } as Invoice));
  const gst = new Map((clientRows as unknown as Client[]).map((c) => [c.id, c.gst_number]));
  const pay = invoices.map(toPay);

  const bt = backtest(pay, gst, today);
  const model = fitPayModel(pay, today);
  const open = invoices.filter((i) => OPEN.includes(i.status));
  const predictions: Record<string, PayPrediction> = {};
  for (const inv of open) predictions[inv.id] = predictPayment(model, { ...toPay(inv), gst_number: gst.get(inv.client) } as PayInvoice, today, bt?.weights);

  const clients: Record<string, ClientStat> = {};
  for (const inv of invoices) {
    const c = (clients[inv.client] ??= { invoices: 0, paid: 0, onTime: 0, typicalDelay: null, outstanding: 0, billed: 0 });
    c.invoices++;
    c.billed += inv.total;
    if (inv.paid_at) {
      c.paid++;
      if (daysBetween(inv.due_date, inv.paid_at) <= 7) c.onTime++;
    } else if (OPEN.includes(inv.status)) c.outstanding += inv.total;
  }
  for (const [id, h] of model.clients) {
    if (clients[id]) clients[id].typicalDelay = [...h.delays].sort((a, b) => a - b)[Math.floor(h.delays.length / 2)];
  }

  const month = today.slice(0, 7);
  const sum = (xs: Invoice[]) => xs.reduce((s, i) => s + i.total, 0);
  const overdue = invoices.filter((i) => i.status === "overdue");
  const paidMonth = invoices.filter((i) => i.paid_at && dateOf(i.paid_at).startsWith(month));
  const billedMonth = invoices.filter((i) => i.invoice_date.startsWith(month));
  return {
    today,
    predictions,
    forecast: forecastCash(model, open.map(toPay), today),
    backtest: bt,
    clients,
    totals: {
      outstanding: sum(open), openCount: open.length, overdue: sum(overdue), overdueCount: overdue.length,
      paidThisMonth: sum(paidMonth), paidThisMonthCount: paidMonth.length, billedThisMonth: sum(billedMonth),
      gstThisMonth: billedMonth.reduce((s, i) => s + (i.gst_amount || 0), 0),
      awaitingConfirmation: invoices.filter((i) => i.status === "payment_pending").length,
    },
  };
}
