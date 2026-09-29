/**
 * When will this invoice be paid, and how likely is it to be late?
 *
 * Delay = days between the due date and the day the money arrived (negative
 * means early). Each client's delays are a small sample, so a prediction mixes
 * the client's own history (newest counts most) with the whole business's, in
 * proportion n : K. With one past invoice a client barely moves the estimate;
 * with ten, it's mostly theirs.
 *
 * For an invoice that's already late we condition on that: if a client usually
 * pays 3 days late and it's now day 9, the answer is "a few more days", not
 * "6 days ago".
 *
 * Late risk (paid more than a week after the due date) is a logistic regression
 * per business, trained in time order so no invoice is scored with knowledge of
 * payments that came after it was sent.
 */

import { addDays, daysBetween, dateOf } from "../dates.ts";

export interface PayInvoice {
  id: string;
  client: string;
  total: number;
  invoice_date: string;
  due_date: string;
  status: string;
  paid_at: string; // "" if unpaid
}

export interface PayClient { id: string; name: string; gst_number?: string }

/** Shrinkage strength: a client's history counts as much as K invoices of business-wide history. */
const K = 3;
const DECAY = 0.85;
const LATE_DAYS = 7;
const DEFAULT_DELAYS = [-2, 0, 0, 1, 3, 5, 8, 12]; // before a business has any payments of its own

interface Sample { d: number; w: number }

export interface ClientHistory {
  delays: number[]; // newest first
  amounts: number[];
  late: number;
}

export interface PayModel {
  asOf: string;
  business: number[]; // all known delays
  clients: Map<string, ClientHistory>;
  lateRate: number; // business-wide share of late payments
}

function paidOn(inv: PayInvoice): string | null {
  return inv.paid_at ? dateOf(inv.paid_at) : null;
}

/** Everything known on `asOf`: only payments that had arrived by then. */
export function fitPayModel(invoices: PayInvoice[], asOf: string): PayModel {
  const known = invoices
    .filter((i) => { const p = paidOn(i); return p !== null && p <= asOf; })
    .sort((a, b) => (paidOn(b)! < paidOn(a)! ? -1 : 1));
  const clients = new Map<string, ClientHistory>();
  const business: number[] = [];
  let late = 0;
  for (const inv of known) {
    const d = daysBetween(inv.due_date, paidOn(inv)!);
    business.push(d);
    if (d > LATE_DAYS) late++;
    const h = clients.get(inv.client) ?? { delays: [], amounts: [], late: 0 };
    h.delays.push(d);
    h.amounts.push(inv.total);
    if (d > LATE_DAYS) h.late++;
    clients.set(inv.client, h);
  }
  return { asOf, business, clients, lateRate: business.length ? late / business.length : 0.25 };
}

/** Weighted mixture of the client's delays (recency-decayed) and the business's. */
function pool(model: PayModel, client: string): Sample[] {
  const h = model.clients.get(client);
  const biz = model.business.length >= 5 ? model.business : [...model.business, ...DEFAULT_DELAYS];
  const n = h?.delays.length ?? 0;
  const own = h ? h.delays.map((d, i) => ({ d, w: DECAY ** i })) : [];
  const ownW = own.reduce((s, x) => s + x.w, 0);
  const share = n / (n + K);
  return [
    ...own.map((x) => ({ d: x.d, w: (share * x.w) / (ownW || 1) })),
    ...biz.map((d) => ({ d, w: (1 - share) / biz.length })),
  ];
}

function quantile(samples: Sample[], q: number): number {
  const s = [...samples].sort((a, b) => a.d - b.d);
  const total = s.reduce((t, x) => t + x.w, 0);
  let acc = 0;
  for (const x of s) {
    acc += x.w;
    if (acc >= q * total) return x.d;
  }
  return s[s.length - 1]?.d ?? 0;
}

/** Samples still possible given the invoice is `soFar` days past due and unpaid. */
function conditional(samples: Sample[], soFar: number): Sample[] {
  if (soFar <= 0) return samples;
  const later = samples.filter((x) => x.d > soFar);
  if (later.length && later.reduce((t, x) => t + x.w, 0) > 0.02) return later;
  // Later than anything seen: expect it within about another week.
  return [{ d: soFar + 3, w: 1 }, { d: soFar + 7, w: 1 }, { d: soFar + 14, w: 1 }];
}

export interface PayPrediction {
  expected: string; // date
  earliest: string;
  latest: string;
  delay: number; // expected days past due (negative = early)
  lateRisk: number;
  level: "low" | "medium" | "high";
  reasons: string[];
}

export function predictPayment(model: PayModel, inv: PayInvoice, today: string, weights = DEFAULT_WEIGHTS): PayPrediction {
  if (inv.status === "payment_pending") {
    return { expected: today, earliest: today, latest: addDays(today, 1), delay: daysBetween(inv.due_date, today), lateRisk: 0, level: "low", reasons: ["Client says they've paid"] };
  }
  const soFar = daysBetween(inv.due_date, today);
  const s = conditional(pool(model, inv.client), soFar);
  const p10 = quantile(s, 0.1), p50 = quantile(s, 0.5), p90 = quantile(s, 0.9);
  const clamp = (d: number) => (addDays(inv.due_date, d) < today ? today : addDays(inv.due_date, d));
  const x = features(model, inv);
  const risk = soFar > LATE_DAYS ? 1 : sigmoid(dot(weights, x));
  return {
    expected: clamp(p50),
    earliest: clamp(p10),
    latest: clamp(Math.max(p90, p50)),
    delay: Math.max(p50, soFar),
    lateRisk: risk,
    level: risk >= 0.55 ? "high" : risk >= 0.3 ? "medium" : "low",
    reasons: explain(model, inv, x, soFar),
  };
}

// ── late-risk model ─────────────────────────────────────────────────────────

export const FEATURE_NAMES = ["bias", "clientLateRate", "clientTypicalDelay", "newClient", "biggerThanUsual", "longTerms", "noGstin"] as const;
export type Weights = number[];
// Sensible starting point for a new business: history dominates, size and newness nudge.
export const DEFAULT_WEIGHTS: Weights = [-1.6, 2.4, 1.2, 0.5, 0.6, 0.2, 0.3];

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

export function features(model: PayModel, inv: PayInvoice & { gst_number?: string }): number[] {
  const h = model.clients.get(inv.client);
  const n = h?.delays.length ?? 0;
  const lateRate = ((h?.late ?? 0) + 2 * model.lateRate) / (n + 2);
  const typical = quantile(pool(model, inv.client), 0.5);
  const usual = h?.amounts.length ? median(h.amounts) : 0;
  const bigger = usual > 0 ? Math.max(-1, Math.min(2, Math.log(inv.total / usual))) : 0;
  const terms = daysBetween(inv.invoice_date, inv.due_date);
  return [1, lateRate, Math.max(-0.5, Math.min(1.5, typical / 20)), n < 2 ? 1 : 0, bigger, terms / 30, inv.gst_number ? 0 : 1];
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const dot = (w: number[], x: number[]) => w.reduce((s, wi, i) => s + wi * x[i], 0);

function explain(model: PayModel, inv: PayInvoice, x: number[], soFar: number): string[] {
  const out: string[] = [];
  const h = model.clients.get(inv.client);
  if (soFar > 0) out.push(`${soFar} day${soFar === 1 ? "" : "s"} past due`);
  if (h && h.delays.length) {
    const recent = h.delays.slice(0, 6);
    const lates = recent.filter((d) => d > LATE_DAYS).length;
    if (lates > 0) out.push(`Paid late ${lates} of their last ${recent.length} invoice${recent.length === 1 ? "" : "s"}`);
    else out.push(`Paid on time ${recent.length} of ${recent.length} time${recent.length === 1 ? "" : "s"}`);
    const typ = median(recent);
    if (typ > 2) out.push(`Usually pays ${typ} days after the due date`);
  } else {
    out.push("New client, no payment history yet");
  }
  if (x[4] > 0.5) out.push(`About ${Math.exp(x[4]).toFixed(1)}x their usual invoice`);
  return out.slice(0, 3);
}

export interface TrainingRow { x: number[]; y: number; date: string }

/** One row per invoice whose outcome is known by `asOf`, featurised as of the day it was issued. */
export function trainingRows(invoices: PayInvoice[], clientsGst: Map<string, string>, asOf: string): TrainingRow[] {
  const rows: TrainingRow[] = [];
  const sorted = [...invoices].filter((i) => i.status !== "draft" && i.status !== "cancelled").sort((a, b) => (a.invoice_date < b.invoice_date ? -1 : 1));
  for (const inv of sorted) {
    const paid = paidOn(inv);
    const lateBy = paid && paid <= asOf ? daysBetween(inv.due_date, paid) : daysBetween(inv.due_date, asOf);
    const resolved = (paid && paid <= asOf) || lateBy > LATE_DAYS;
    if (!resolved) continue;
    const m = fitPayModel(invoices, addDays(inv.invoice_date, -1));
    rows.push({ x: features(m, { ...inv, gst_number: clientsGst.get(inv.client) }), y: lateBy > LATE_DAYS ? 1 : 0, date: inv.invoice_date });
  }
  return rows;
}

export function train(rows: TrainingRow[], l2 = 0.02, iters = 600, lr = 0.4): Weights {
  if (rows.length < 30 || rows.every((r) => r.y === rows[0].y)) return DEFAULT_WEIGHTS;
  const w = [...DEFAULT_WEIGHTS];
  for (let it = 0; it < iters; it++) {
    const g = new Array(w.length).fill(0);
    for (const r of rows) {
      const err = sigmoid(dot(w, r.x)) - r.y;
      for (let j = 0; j < w.length; j++) g[j] += err * r.x[j];
    }
    for (let j = 0; j < w.length; j++) w[j] -= lr * (g[j] / rows.length + (j ? l2 * w[j] : 0));
  }
  return w;
}

export function auc(scores: number[], labels: number[]): number | null {
  const pos = scores.filter((_, i) => labels[i] === 1);
  const neg = scores.filter((_, i) => labels[i] === 0);
  if (!pos.length || !neg.length) return null;
  let wins = 0;
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}

// ── backtest ────────────────────────────────────────────────────────────────

export interface Backtest {
  invoices: number;
  maeModel: number;
  maeDueDate: number;
  improvement: number; // share of error removed vs "paid on the due date"
  coverage: number; // actual payment day inside the predicted range
  auc: number | null;
  lateShare: number;
  weights: Weights;
}

/**
 * Replays history: each paid invoice is predicted with only what was known the
 * day it was issued, then compared to when the money really came. The late
 * model is trained on the first 80% of invoices and scored on the rest.
 */
export function backtest(invoices: PayInvoice[], clientsGst: Map<string, string>, asOf: string): Backtest | null {
  const paid = invoices.filter((i) => paidOn(i) && paidOn(i)! <= asOf).sort((a, b) => (a.invoice_date < b.invoice_date ? -1 : 1));
  if (paid.length < 20) return null;
  const tested = paid.slice(Math.floor(paid.length * 0.3)); // the first 30% only builds history
  let errModel = 0, errDue = 0, inside = 0;
  for (const inv of tested) {
    const m = fitPayModel(invoices, addDays(inv.invoice_date, -1));
    const s = pool(m, inv.client);
    const actual = daysBetween(inv.due_date, paidOn(inv)!);
    errModel += Math.abs(actual - quantile(s, 0.5));
    errDue += Math.abs(actual);
    if (actual >= quantile(s, 0.1) && actual <= quantile(s, 0.9)) inside++;
  }
  const rows = trainingRows(invoices, clientsGst, asOf);
  const cut = Math.floor(rows.length * 0.8);
  const weights = train(rows.slice(0, cut));
  const test = rows.slice(cut);
  const maeModel = errModel / tested.length, maeDueDate = errDue / tested.length;
  return {
    invoices: tested.length,
    maeModel,
    maeDueDate,
    improvement: maeDueDate > 0 ? 1 - maeModel / maeDueDate : 0,
    coverage: inside / tested.length,
    auc: auc(test.map((r) => sigmoid(dot(weights, r.x))), test.map((r) => r.y)),
    lateShare: rows.length ? rows.filter((r) => r.y).length / rows.length : 0,
    weights: train(rows), // production weights use every row
  };
}

// ── cash-flow forecast ──────────────────────────────────────────────────────

export interface Week { start: string; p10: number; p50: number; p90: number; expected: number }
export interface Forecast { weeks: Week[]; next30: { p10: number; p50: number; p90: number }; later: number; open: number }

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function draw(samples: Sample[], u: number): number {
  const total = samples.reduce((t, x) => t + x.w, 0);
  let acc = 0;
  for (const x of samples) {
    acc += x.w;
    if (acc >= u * total) return x.d;
  }
  return samples[samples.length - 1].d;
}

const pct = (xs: number[], q: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))] ?? 0;
};

/** Money expected in each of the next `weeks` weeks, simulated 500 times from each client's history. */
export function forecastCash(model: PayModel, open: PayInvoice[], today: string, weeks = 6, runs = 500): Forecast {
  const r = rng(open.length * 7919 + Number(today.replaceAll("-", "")));
  const pools = open.map((inv) => ({ inv, s: conditional(pool(model, inv.client), daysBetween(inv.due_date, today)) }));
  const byWeek: number[][] = Array.from({ length: weeks }, () => []);
  const in30: number[] = [];
  let later = 0;
  for (let k = 0; k < runs; k++) {
    const sums = new Array(weeks).fill(0);
    let month = 0;
    for (const { inv, s } of pools) {
      const day = inv.status === "payment_pending" ? Math.floor(r() * 2) : Math.max(0, daysBetween(today, addDays(inv.due_date, draw(s, r()))));
      const wk = Math.floor(day / 7);
      if (wk < weeks) sums[wk] += inv.total;
      else later += inv.total / runs;
      if (day < 30) month += inv.total;
    }
    sums.forEach((v, i) => byWeek[i].push(v));
    in30.push(month);
  }
  return {
    weeks: byWeek.map((xs, i) => ({
      start: addDays(today, i * 7), p10: pct(xs, 0.1), p50: pct(xs, 0.5), p90: pct(xs, 0.9),
      expected: xs.reduce((a, b) => a + b, 0) / xs.length,
    })),
    next30: { p10: pct(in30, 0.1), p50: pct(in30, 0.5), p90: pct(in30, 0.9) },
    later,
    open: open.reduce((s, i) => s + i.total, 0),
  };
}
