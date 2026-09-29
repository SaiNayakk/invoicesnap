import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Code2, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LaunchDemoButton } from "@/components/demo/launch-button";

export const metadata: Metadata = { title: "Demo" };

const LIVE_POINTS = [
  "Your own studio account with 14 clients and a year of invoices",
  "Write an invoice as a one-line message and send it",
  "Pay it as the client on the phone beside the app",
  "See who is likely to pay late, and send a reminder",
  "Fast-forward a week and check the predictions",
  "Keep the account when you're done",
];

const BUILD_POINTS = [
  "Next.js, TypeScript and PocketBase",
  "Invoice drafting where every number is checked against the message",
  "Payment-date model, backtested on past invoices",
  "Late-payment risk trained per business",
  "Cash-flow forecast from 500 simulated futures",
  "Per-visitor demo sandboxes with automatic cleanup",
];

export default function DemoLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <nav className="flex h-14 items-center justify-between border-b border-zinc-800 px-5 sm:px-6">
        <Link href="/" aria-label="InvoiceSnap home"><Logo /></Link>
        <Link href="/auth" className="text-sm text-zinc-400 hover:text-zinc-200">Sign in</Link>
      </nav>

      <main className="flex flex-1 flex-col items-center px-5 py-14 sm:px-6 sm:py-20">
        <div className="mb-12 max-w-xl text-center">
          <h1 className="font-display text-4xl font-semibold leading-tight text-zinc-50 sm:text-5xl">See InvoiceSnap in use</h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">Run the real product on an account of your own, or read how it&apos;s built. No sign-up for either.</p>
        </div>

        <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
          <section className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-900 bg-emerald-950"><MessageCircle className="h-5 w-5 text-emerald-400" /></div>
            <h2 className="font-display text-xl font-semibold text-zinc-100">Live demo</h2>
            <p className="mb-6 mt-1.5 text-sm leading-relaxed text-zinc-400">The real app and a client&apos;s WhatsApp side by side, on a studio that&apos;s yours for 45 minutes.</p>
            <ul className="mb-8 flex-1 space-y-2.5">
              {LIVE_POINTS.map((s) => <li key={s} className="flex items-start gap-2.5 text-sm text-zinc-300"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />{s}</li>)}
            </ul>
            <LaunchDemoButton />
            <p className="mt-3 h-4 text-center text-xs leading-4 text-zinc-500">Deleted after 45 minutes unless you keep it</p>
          </section>

          <section className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800"><Code2 className="h-5 w-5 text-zinc-300" /></div>
            <h2 className="font-display text-xl font-semibold text-zinc-100">How it&apos;s built</h2>
            <p className="mb-6 mt-1.5 text-sm leading-relaxed text-zinc-400">For developers and reviewers: the architecture, the models and how they were tested.</p>
            <ul className="mb-8 flex-1 space-y-2.5">
              {BUILD_POINTS.map((s) => <li key={s} className="flex items-start gap-2.5 text-sm text-zinc-300"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500" />{s}</li>)}
            </ul>
            <Link href="/demo/technical" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white">
              Read the write-up <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 h-4 text-center text-xs leading-4 text-zinc-500">About a 6 minute read</p>
          </section>
        </div>
      </main>
    </div>
  );
}
