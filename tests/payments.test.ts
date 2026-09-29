import { test } from "node:test";
import assert from "node:assert/strict";
import { backtest, fitPayModel, forecastCash, predictPayment, type PayInvoice } from "../src/lib/ai/payments.ts";
import { DEMO_CLIENTS, simulateHistory } from "../src/lib/demo/simulate.ts";
import { computeTotals, supplyType, validateGstin } from "../src/lib/gst.ts";
import { addDays } from "../src/lib/dates.ts";

const TODAY = "2026-09-28";

function history(seed: number) {
  const sim = simulateHistory({ today: TODAY, seed });
  const invoices: PayInvoice[] = sim.map((s, i) => ({
    id: `i${i}`, client: s.client, total: s.items.reduce((t, it) => t + it.quantity * it.rate, 0),
    invoice_date: s.invoice_date, due_date: s.due_date,
    status: s.paid_on ? "paid" : s.due_date < TODAY ? "overdue" : "sent", paid_at: s.paid_on ?? "",
  }));
  const gst = new Map(DEMO_CLIENTS.map((c) => [c.key, c.gst_number]));
  return { invoices, gst };
}

test("GSTIN validation checks format, state code and checksum", () => {
  assert.deepEqual(validateGstin("27AAPFU0939F1ZV"), { ok: true, state: "Maharashtra" });
  assert.equal(validateGstin("27AAPFU0939F1ZX").ok, false);
  assert.equal(validateGstin("99AAPFU0939F1ZV").ok, false);
  assert.equal(validateGstin("hello").ok, false);
  for (const c of DEMO_CLIENTS) if (c.gst_number) assert.equal(validateGstin(c.gst_number).ok, true, c.name);
});

test("tax splits by state and halves add back up", () => {
  assert.equal(supplyType("29AAQFN4821K1Z0", "", "33AADCG9913R1Z0", ""), "intra"); // invalid checksums fall back to states
  assert.equal(supplyType("", "Karnataka", "", "Tamil Nadu"), "inter");
  assert.equal(supplyType("", "Karnataka", "", ""), "intra");
  const t = computeTotals([{ description: "x", quantity: 3, rate: 333.33 }], 18, "intra");
  assert.equal(t.cgst_amount + t.sgst_amount, t.gst_amount);
  assert.equal(t.total, Math.round((t.subtotal + t.gst_amount) * 100) / 100);
  assert.equal(computeTotals([{ description: "x", quantity: 1, rate: 1000 }], 18, "inter").igst_amount, 180);
});

test("the model beats 'paid on the due date' on simulated history", () => {
  for (const seed of [3, 4, 5]) {
    const { invoices, gst } = history(seed);
    const bt = backtest(invoices, gst, TODAY)!;
    assert.ok(bt, "enough history");
    assert.ok(bt.improvement > 0.2, `seed ${seed}: improvement ${bt.improvement.toFixed(2)}`);
    assert.ok(bt.coverage > 0.65, `seed ${seed}: coverage ${bt.coverage.toFixed(2)}`);
    assert.ok(bt.auc === null || bt.auc > 0.65, `seed ${seed}: auc ${bt.auc}`);
  }
});

test("chronic late payers are flagged; reliable ones are not", () => {
  const { invoices } = history(7);
  const m = fitPayModel(invoices, TODAY);
  const fresh = (client: string): PayInvoice => ({ id: "n", client, total: 20000, invoice_date: TODAY, due_date: addDays(TODAY, 15), status: "sent", paid_at: "" });
  const slow = predictPayment(m, fresh("urbannest"), TODAY);
  const fast = predictPayment(m, fresh("brewline"), TODAY);
  assert.ok(slow.lateRisk > fast.lateRisk + 0.3, `${slow.lateRisk} vs ${fast.lateRisk}`);
  assert.ok(slow.expected > fast.expected);
  assert.equal(fast.level, "low");
});

test("an already-late invoice is predicted in the future, not the past", () => {
  const { invoices } = history(4);
  const m = fitPayModel(invoices, TODAY);
  const late: PayInvoice = { id: "l", client: "brewline", total: 18000, invoice_date: addDays(TODAY, -40), due_date: addDays(TODAY, -33), status: "overdue", paid_at: "" };
  const p = predictPayment(m, late, TODAY);
  assert.ok(p.expected >= TODAY && p.latest >= p.expected);
  assert.equal(p.level, "high");
});

test("forecast bands are ordered and account for open money", () => {
  const { invoices } = history(5);
  const open = invoices.filter((i) => !i.paid_at);
  const f = forecastCash(fitPayModel(invoices, TODAY), open, TODAY);
  for (const w of f.weeks) assert.ok(w.p10 <= w.p50 && w.p50 <= w.p90);
  const expectedTotal = f.weeks.reduce((s, w) => s + w.expected, 0) + f.later;
  assert.ok(Math.abs(expectedTotal - f.open) < f.open * 0.01 + 1);
  assert.deepEqual(forecastCash(fitPayModel(invoices, TODAY), open, TODAY), f, "deterministic");
});
