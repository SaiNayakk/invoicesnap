import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDraft, matchClient, type ExtractionLike } from "../src/lib/ai/draft.ts";

const CLIENTS = [
  { id: "a", name: "Sneha Reddy", phone: "9731066778" },
  { id: "b", name: "Vikram Events Pvt Ltd", phone: "9848022334" },
  { id: "c", name: "Priya Menon", phone: "" },
  { id: "d", name: "Priya Sharma", phone: "" },
];

test("client matching: phone, full name, company suffixes, ambiguous first names", () => {
  assert.equal(matchClient("", "+91 97310 66778", CLIENTS)?.client.id, "a");
  assert.equal(matchClient("sneha", "", CLIENTS)?.client.id, "a");
  assert.equal(matchClient("Vikram Events", "", CLIENTS)?.client.id, "b");
  assert.equal(matchClient("Priya", "", CLIENTS), null);
  assert.equal(matchClient("Priya Menon", "", CLIENTS)?.client.id, "c");
  assert.equal(matchClient("Rohit", "", CLIENTS), null);
});

const base: ExtractionLike = {
  client: { name: "Sneha", phone: "", email: "" },
  items: [{ description: "Reels", quantity: 3, rate: 4500, flags: [] }],
  gst_rate: 18, due_in_days: null, due_date: null, notes: "", flags: [], dropped: 0,
};

test("draft uses default terms and explains what was left out", () => {
  const d = buildDraft({ ...base, dropped: 1, flags: ["due_unverified"] }, CLIENTS, "2026-09-28", 15);
  assert.equal(d.clientId, "a");
  assert.equal(d.dueDate, "2026-10-13");
  assert.equal(d.gstRate, 18);
  assert.equal(d.warnings.length, 2);
});

test("an unknown client becomes a new-client suggestion", () => {
  const d = buildDraft({ ...base, client: { name: "Rohit Kumar", phone: "9880122334", email: "" }, due_in_days: 7 }, CLIENTS, "2026-09-28", 15);
  assert.equal(d.clientId, null);
  assert.deepEqual(d.newClient, { name: "Rohit Kumar", phone: "9880122334", email: "" });
  assert.equal(d.dueDate, "2026-10-05");
});
