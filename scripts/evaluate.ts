/**
 * Reproduces every model figure quoted in the technical write-up.
 *
 *   node --experimental-strip-types scripts/evaluate.ts
 *
 * For 30 simulated studios (a year of invoices each) it runs the backtest,
 * breaks the error down by kind of client, and checks the cash-flow forecast:
 * fit on the history, forecast the next week, then play that week out from
 * the clients' hidden habits and see whether the money landed in the range.
 */

import { backtest, fitPayModel, forecastCash, predictPayment, FEATURE_NAMES, type PayInvoice } from "../src/lib/ai/payments.ts";
import { DEMO_CLIENTS, drawPaymentDay, rng, simulateHistory } from "../src/lib/demo/simulate.ts";
import { addDays, daysBetween } from "../src/lib/dates.ts";

const TODAY = "2026-09-28";
const SEEDS = Array.from({ length: 30 }, (_, i) => 1000 + i);
const gst = new Map(DEMO_CLIENTS.map((c) => [c.key, c.gst_number]));
const habit = new Map(DEMO_CLIENTS.map((c) => [c.key, c]));

const kind = (key: string) => {
  const h = habit.get(key)!.habit;
  return h.delay <= 2 ? "Usually on time" : h.delay <= 10 ? "Sometimes late" : "Usually late";
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const bt = { n: 0, mae: [] as number[], due: [] as number[], cov: [] as number[], auc: [] as number[], impr: [] as number[] };
const byKind: Record<string, { model: number; due: number; n: number }> = {};
const weights: number[][] = [];
let fcInside = 0, fcRuns = 0;
const fcErr: number[] = [];

for (const seed of SEEDS) {
  const sim = simulateHistory({ today: TODAY, seed });
  const inv: PayInvoice[] = sim.map((s, i) => ({
    id: `i${i}`, client: s.client, total: s.items.reduce((t, it) => t + it.quantity * it.rate, 0),
    invoice_date: s.invoice_date, due_date: s.due_date, status: s.paid_on ? "paid" : "sent", paid_at: s.paid_on ?? "",
  }));
  const b = backtest(inv, gst, TODAY)!;
  bt.n += b.invoices;
  bt.mae.push(b.maeModel); bt.due.push(b.maeDueDate); bt.cov.push(b.coverage); bt.impr.push(b.improvement);
  if (b.auc !== null) bt.auc.push(b.auc);
  weights.push(b.weights);

  // Error by kind of client, same replay as the backtest.
  const paid = inv.filter((i) => i.paid_at).sort((a, c) => (a.invoice_date < c.invoice_date ? -1 : 1));
  for (const i of paid.slice(Math.floor(paid.length * 0.3))) {
    const m = fitPayModel(inv, addDays(i.invoice_date, -1));
    const k = kind(i.client);
    const actual = daysBetween(i.due_date, i.paid_at);
    const p = predictPayment(m, { ...i, status: "sent", paid_at: "" }, addDays(i.invoice_date, -1));
    const predicted = daysBetween(i.due_date, p.expected);
    const e = (byKind[k] ??= { model: 0, due: 0, n: 0 });
    e.model += Math.abs(actual - predicted);
    e.due += Math.abs(actual);
    e.n++;
  }

  // Forecast check: fit 60 days ago, forecast one week, play the week out.
  for (const back of [56, 42, 28, 14]) {
    const asOf = addDays(TODAY, -back);
    const known = inv.filter((i) => i.invoice_date <= asOf).map((i) => ({ ...i, paid_at: i.paid_at && i.paid_at <= asOf ? i.paid_at : "", status: i.paid_at && i.paid_at <= asOf ? "paid" : "sent" }));
    const open = known.filter((i) => !i.paid_at);
    if (!open.length) continue;
    const fc = forecastCash(fitPayModel(known, asOf), open, asOf, 1, 500).weeks[0];
    const r = rng(seed * 31 + back);
    let arrived = 0;
    for (const o of open) {
      const h = habit.get(o.client)!;
      const day = drawPaymentDay(h.habit, o.due_date, asOf, r, 1, h.terms);
      if (day < addDays(asOf, 7)) arrived += o.total;
    }
    fcRuns++;
    if (arrived >= fc.p10 && arrived <= fc.p90) fcInside++;
    fcErr.push(Math.abs(arrived - fc.p50));
  }
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
console.log(`Backtest over ${SEEDS.length} simulated studios, ${bt.n} replayed invoices`);
console.log(`  mean abs error: model ${mean(bt.mae).toFixed(1)} days, "paid on due date" ${mean(bt.due).toFixed(1)} days, improvement ${pct(mean(bt.impr))} (range ${pct(Math.min(...bt.impr))} to ${pct(Math.max(...bt.impr))})`);
console.log(`  inside predicted range: ${pct(mean(bt.cov))}`);
console.log(`  late-payment AUC on the last 20%: ${mean(bt.auc).toFixed(2)} (min ${Math.min(...bt.auc).toFixed(2)}, ${bt.auc.length} runs)`);
console.log("Error by kind of client (days):");
for (const [k, v] of Object.entries(byKind)) console.log(`  ${k}: model ${(v.model / v.n).toFixed(1)}, due date ${(v.due / v.n).toFixed(1)}, n=${v.n}`);
console.log("Mean late-risk weights:");
FEATURE_NAMES.forEach((f, j) => console.log(`  ${f}: ${mean(weights.map((w) => w[j])).toFixed(2)}`));
console.log(`Weekly forecast: actual inside the 10th to 90th percentile band ${pct(fcInside / fcRuns)} of ${fcRuns} weeks`);
