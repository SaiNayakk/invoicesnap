import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const STEPS = [
  {
    n: "1",
    title: "Type it like a message",
    body: "\"Bill Brewline for 2 reel shoots at 6.5k each, GST 18, due in a week.\" InvoiceSnap drafts the invoice: client, items, tax, due date. Or snap a photo of a handwritten bill. You check it before it goes out.",
  },
  {
    n: "2",
    title: "Send it on WhatsApp",
    body: "Your client gets the invoice with a link to a payment page. They scan the UPI QR or tap to pay in any UPI app, then press I've paid. The money goes straight to your UPI ID.",
  },
  {
    n: "3",
    title: "Know when money will come",
    body: "InvoiceSnap learns how each client pays. It tells you who will probably be late before the due date, what to expect in the next few weeks, and drafts a reminder in the right tone when it's time.",
  },
];

const GST = [
  "CGST and SGST or IGST, picked by comparing your GSTIN with your client's",
  "GSTINs checked for format, state code and check digit as you type",
  "Only the real GST slabs: 0, 5, 12, 18 and 28%",
  "A month-by-month GST report, ready for GSTR-1",
  "Clean PDF invoices with SAC codes, bank and UPI details",
];

function ChatMock() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-2xl shadow-black/40" aria-hidden="true">
      <div className="mb-3 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">B</span>
        <div>
          <p className="text-sm font-medium text-zinc-100">Brewline Coffee</p>
          <p className="text-[11px] text-zinc-500">WhatsApp</p>
        </div>
      </div>
      <div className="ml-8 rounded-lg rounded-tr-sm bg-emerald-950/70 px-3 py-2 text-[13px] leading-relaxed text-emerald-50">
        Hi Brewline Coffee, here is invoice NLS-2026-104 from Northlight Studio.
        <br /><br /><b>Amount:</b> ₹36,580<br /><b>Due:</b> 5 Oct 2026
        <br /><br />View and pay by UPI: <span className="text-emerald-300 underline">invoicesnap/pay/…</span>
      </div>
      <div className="mt-2 mr-8 rounded-lg rounded-tl-sm bg-zinc-800 px-3 py-2 text-[13px] text-zinc-200">Paid ₹36,580 for NLS-2026-104.</div>
      <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
        <p className="text-zinc-400">Expected payment for Brewline&apos;s next invoice</p>
        <p className="mt-1 text-zinc-100">On time. Paid 11 of 11 within a week of the due date.</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="InvoiceSnap home"><Logo /></Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-5">
            <Link href="#how" className="hidden text-zinc-400 hover:text-zinc-100 sm:inline">How it works</Link>
            <Link href="/demo" className="hidden text-zinc-400 hover:text-zinc-100 sm:inline">Live demo</Link>
            <Link href="/auth" className="px-2 text-zinc-400 hover:text-zinc-100">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] text-zinc-50 sm:text-5xl">GST invoices your clients open on WhatsApp</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            For freelancers and small businesses in India. Describe the job in a line, send the invoice on WhatsApp, and get paid by UPI.
            InvoiceSnap also learns which clients pay late, so you know when money will actually arrive.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              Try the live demo <ArrowRight size={15} />
            </Link>
            <Link href="/auth" className="flex h-11 items-center justify-center rounded-lg border border-zinc-700 px-5 text-sm font-medium text-zinc-200 hover:bg-zinc-900">
              Create an account
            </Link>
          </div>
          <p className="mt-3 text-xs text-zinc-500">The demo is a private account with a year of sample invoices. No sign-up.</p>
        </div>
        <ChatMock />
      </section>

      <section id="how" className="border-t border-zinc-800/80">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="font-display text-3xl font-semibold text-zinc-50">How it works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-sm text-zinc-300">{s.n}</span>
                <h3 className="mt-4 text-lg font-medium text-zinc-100">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-20 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-zinc-50">GST without the homework</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">The rules are applied in code, so an invoice can&apos;t go out with the wrong tax split or a made-up rate.</p>
          </div>
          <ul className="space-y-3">
            {GST.map((g) => (
              <li key={g} className="flex gap-3 text-sm text-zinc-300"><Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />{g}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-zinc-800/80">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-50">See it on real data</h2>
            <p className="mt-2 text-sm text-zinc-400">A private demo account with 14 clients and a year of invoices. Send one, pay it as the client, and fast-forward a week.</p>
          </div>
          <Link href="/demo" className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-zinc-100 px-5 text-sm font-semibold text-zinc-900 hover:bg-white">Open the demo <ArrowRight size={15} /></Link>
        </div>
      </section>

      <footer className="border-t border-zinc-800/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-zinc-500">
          <p>InvoiceSnap is built by <a href="https://saiworks.nncs.in" className="text-zinc-300 hover:text-zinc-100">SaiWorks</a>.</p>
          <div className="flex gap-5">
            <Link href="/demo/technical" className="hover:text-zinc-300">How it&apos;s built</Link>
            <Link href="/auth" className="hover:text-zinc-300">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
