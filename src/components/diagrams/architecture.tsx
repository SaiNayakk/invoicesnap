"use client";

import { FlowDiagram, type DEdge, type DNode, type Flow, type Layout } from "./kit";

const NODES: DNode[] = [
  { id: "owner", title: "Your app", sub: ["Phone or laptop"] },
  { id: "client", title: "Client's WhatsApp", sub: ["Message, pay page"] },
  { id: "next", title: "Next.js server", sub: ["API routes, models"], tone: "accent" },
  { id: "pb", title: "PocketBase", sub: ["Invoices, clients"] },
  { id: "ai", title: "AI service", sub: ["Python, checks"], tone: "accent" },
  { id: "gem", title: "Gemini API", sub: ["Language model"], tone: "muted" },
];

const EDGES: DEdge[] = [
  { id: "owner_next", a: "owner", b: "next" },
  { id: "client_next", a: "client", b: "next" },
  { id: "next_pb", a: "next", b: "pb" },
  { id: "next_ai", a: "next", b: "ai" },
  { id: "ai_gem", a: "ai", b: "gem" },
];

const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

const WIDE: Layout = {
  width: 736,
  height: 272,
  place: {
    owner: box(20, 16, 156, 70),
    next: box(206, 16, 156, 70),
    ai: box(392, 16, 156, 70),
    gem: box(578, 16, 156, 70),
    client: box(20, 184, 156, 70),
    pb: box(206, 184, 156, 70),
  },
};

const TALL: Layout = {
  width: 384,
  height: 488,
  place: {
    owner: box(10, 26, 170, 72),
    client: box(200, 26, 170, 72),
    next: box(10, 216, 170, 72),
    pb: box(200, 216, 170, 72),
    ai: box(10, 406, 170, 72),
    gem: box(200, 406, 170, 72),
  },
};

const FLOWS: Flow[] = [
  {
    id: "draft",
    name: "Invoice from a message",
    steps: [
      { edge: "owner_next", from: "owner", title: "You type a line and press Draft", detail: "“Bill Brewline for 2 reel shoots at 6.5k each plus the retainer 18000, GST 18%, due in a week.”" },
      { edge: "next_ai", from: "next", title: "The server sends it to the AI service", detail: "Server to server, with a per-app token and your IP for rate limits. The browser never talks to the AI service." },
      { edge: "ai_gem", from: "ai", title: "The model turns it into fields", detail: "Client, items, quantities, prices, GST and due date, as JSON." },
      { nodes: ["ai"], title: "Every number is checked against your message", detail: "A price the message doesn't contain is dropped. GST must be a real slab." },
      { edge: "next_pb", from: "next", title: "The client is matched in code", detail: "“Brewline” becomes Brewline Coffee. An unknown name becomes a new-client suggestion." },
      { edge: "owner_next", from: "next", title: "You review the draft", detail: "Totals and the CGST/SGST or IGST split are computed by the app, not the model." },
      { edge: "client_next", from: "next", ok: true, title: "Saved and sent on WhatsApp", detail: "The message carries a link to the invoice's payment page." },
    ],
  },
  {
    id: "pay",
    name: "The client pays",
    steps: [
      { edge: "client_next", from: "client", title: "The client opens the payment link", detail: "Amount, items, GST and a UPI QR code. No app or login." },
      { nodes: ["client"], title: "They pay in their own UPI app", detail: "Straight to your UPI ID. The money never passes through InvoiceSnap." },
      { edge: "client_next", from: "client", title: "They press I've paid", detail: "The invoice moves to “Client says paid”." },
      { edge: "next_pb", from: "next", title: "The status is saved", detail: "And the payment models are refreshed." },
      { edge: "owner_next", from: "next", ok: true, title: "You confirm when the money shows up", detail: "Or press Not received, which puts it back to unpaid." },
    ],
  },
  {
    id: "remind",
    name: "A payment reminder",
    steps: [
      { edge: "owner_next", from: "owner", title: "You press Remind on a late invoice", detail: "From Needs your attention, or the invoice page." },
      { edge: "next_pb", from: "next", title: "Code picks the tone", detail: "Friendly, firm or final, from how late it is and how many reminders were ignored." },
      { edge: "next_ai", from: "next", title: "Facts and tone go to the AI service", detail: "Invoice number, amount, dates, the client's name. Nothing else." },
      { edge: "ai_gem", from: "ai", title: "The model words it", detail: "In English or Hinglish." },
      { nodes: ["ai"], title: "The draft is checked", detail: "Numbers must be in the facts, exactly one link placeholder, no threats. Otherwise a fixed template is used." },
      { edge: "owner_next", from: "next", title: "You can edit it", detail: "Then it opens in WhatsApp, ready to send." },
      { edge: "client_next", from: "next", ok: true, title: "The client gets the reminder", detail: "With the same payment link." },
    ],
  },
];

export function ArchitectureDiagram() {
  return (
    <FlowDiagram
      nodes={NODES}
      edges={EDGES}
      wide={WIDE}
      tall={TALL}
      flows={FLOWS}
      title="InvoiceSnap architecture"
      description="Your app and the client's payment page talk to a Next.js server, which reads and writes PocketBase and calls a separate AI service. The AI service calls the Gemini API."
    />
  );
}
