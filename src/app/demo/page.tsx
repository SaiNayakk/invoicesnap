import Link from "next/link";
import { ArrowRight, Code2, Zap, Check, Briefcase } from "lucide-react";
import { Logo } from "@/components/logo";

const TECH_STEPS = [
  "Next.js 16 App Router architecture",
  "PocketBase data model & auth",
  "PDF generation with PDFKit",
  "Razorpay payment links & webhooks",
  "WhatsApp Business Cloud API",
  "Live API walkthrough",
];

const PRODUCT_STEPS = [
  "Dashboard overview & key metrics",
  "Create a GST invoice in 2 minutes",
  "One-tap WhatsApp send with PDF",
  "Razorpay payment link flow",
  "Track paid / sent / overdue",
  "Client directory & auto-fill",
];

export default function DemoLandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <div className="mb-10">
        <Logo />
      </div>

      {/* Heading */}
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-widest mb-3 text-emerald-400/70 font-medium">
          Interactive Demo
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-zinc-50 mb-4">
          See InvoiceSnap in action
        </h1>
        <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">
          Two guided walkthroughs — pick what fits. No login, no credit card, no setup.
        </p>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-5 w-full max-w-3xl">

        {/* Product Tour */}
        <div className="flex flex-col rounded-2xl p-7 bg-[#111113] border border-white/8 hover:border-emerald-500/30 transition-colors group">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-emerald-500/10 border border-emerald-500/20">
            <Briefcase className="h-5 w-5 text-emerald-400" />
          </div>

          <h2 className="font-display text-xl font-semibold text-zinc-100 mb-1">
            Product Tour
          </h2>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            For freelancers & photographers considering InvoiceSnap for their business
          </p>

          <ul className="space-y-2 mb-8 flex-1">
            {PRODUCT_STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-400">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500/60" />
                {s}
              </li>
            ))}
          </ul>

          <Link
            href="/demo/product"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Start Product Tour
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Technical Demo */}
        <div className="flex flex-col rounded-2xl p-7 bg-[#111113] border border-white/8 hover:border-blue-500/30 transition-colors group">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-blue-500/10 border border-blue-500/20">
            <Code2 className="h-5 w-5 text-blue-400" />
          </div>

          <h2 className="font-display text-xl font-semibold text-zinc-100 mb-1">
            Technical Deep Dive
          </h2>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            For developers & code reviewers evaluating the tech stack and architecture
          </p>

          <ul className="space-y-2 mb-8 flex-1">
            {TECH_STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-400">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500/60" />
                {s}
              </li>
            ))}
          </ul>

          <Link
            href="/demo/technical"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-500 text-white"
          >
            Start Tech Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <p className="text-xs mt-8 text-zinc-700 flex items-center gap-1.5">
        <Zap className="h-3 w-3" />
        Fully interactive · No account required · Pre-seeded data
      </p>
    </div>
  );
}
