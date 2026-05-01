import Link from "next/link";
import {
  Zap,
  MessageCircle,
  CreditCard,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Star,
  FileText,
  Users,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileText,
    title: "Professional Invoices",
    desc: "Generate GST-compliant PDF invoices with your logo, line items, and UPI details in seconds.",
  },
  {
    icon: MessageCircle,
    title: "Send via WhatsApp",
    desc: "Tap once. Your client gets the PDF + payment link on WhatsApp. No email setup, no portals.",
  },
  {
    icon: CreditCard,
    title: "Razorpay Payment Links",
    desc: "Every invoice comes with a hosted Razorpay page. Clients pay via UPI, cards, or net banking.",
  },
  {
    icon: BarChart3,
    title: "Track Everything",
    desc: "See which invoices are paid, pending, or overdue. Get WhatsApp reminders sent automatically.",
  },
  {
    icon: Users,
    title: "Client Directory",
    desc: "Save client details once. Auto-fill on every invoice. Never type a phone number twice.",
  },
  {
    icon: Bell,
    title: "Auto Reminders",
    desc: "Overdue? InvoiceSnap sends a polite WhatsApp nudge on the due date — without you lifting a finger.",
  },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Try it out. No card needed.",
    features: [
      "5 invoices per month",
      "PDF download",
      "Client directory",
      "Basic dashboard",
    ],
    disabled: ["GST invoices", "WhatsApp send", "Payment tracking"],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹299",
    period: "per month",
    desc: "For active freelancers who want to get paid.",
    features: [
      "Unlimited invoices",
      "GST-compliant PDFs",
      "WhatsApp send",
      "Razorpay payment links",
      "Payment status tracking",
      "Invoice dashboard",
    ],
    disabled: ["Recurring invoices", "Auto reminders"],
    cta: "Start Pro — ₹299/mo",
    highlight: true,
  },
  {
    name: "Business",
    price: "₹599",
    period: "per month",
    desc: "For small teams and high-volume vendors.",
    features: [
      "Everything in Pro",
      "Recurring invoices",
      "WhatsApp payment reminders",
      "Expense tracking",
      "Team member (read-only)",
      "Priority support",
    ],
    disabled: [],
    cta: "Start Business",
    highlight: false,
  },
];

const testimonials = [
  {
    name: "Priya Menon",
    role: "Freelance Photographer, Chennai",
    text: "I used to send screenshots of my notes as invoices. Now my clients get a proper PDF with a payment link — and 90% pay the same day.",
    avatar: "P",
  },
  {
    name: "Arjun Nair",
    role: "Wedding Videographer, Kochi",
    text: "The WhatsApp integration is exactly what I needed. No client ever checks their email, but everyone reads WhatsApp.",
    avatar: "A",
  },
  {
    name: "Deepa Krishnan",
    role: "Home Tutor, Bangalore",
    text: "Setting up GST invoices used to take me an hour in Excel. Now it's literally 2 minutes. The auto-reminder feature is gold.",
    avatar: "D",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/7 bg-[#09090b]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <Link href="#features" className="hover:text-zinc-100 transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</Link>
            <Link href="#testimonials" className="hover:text-zinc-100 transition-colors">Reviews</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth?tab=signup">
                Get started <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 px-5">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="w-[600px] h-[400px] rounded-full bg-emerald-500/6 blur-[120px] mt-10" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-1.5 text-xs text-emerald-400 font-medium mb-8 animate-fade-up">
            <Zap size={12} className="fill-emerald-400" />
            Built for Indian freelancers
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-semibold text-zinc-50 leading-tight tracking-tight mb-6 animate-fade-up delay-100">
            Invoice on WhatsApp.
            <br />
            <span className="text-emerald-400">Get paid faster.</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            Create GST-compliant invoices in 2 minutes. Send them via WhatsApp with a Razorpay
            payment link. Track who paid and who hasn't — all from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up delay-300">
            <Button size="xl" className="btn-glow w-full sm:w-auto" asChild>
              <Link href="/auth?tab=signup">
                Start for free — no card needed
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="#features">See how it works</Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-3 animate-fade-up delay-400">
            <div className="flex -space-x-2">
              {["R", "P", "A", "D", "S"].map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-emerald-500/15 flex items-center justify-center text-xs font-semibold text-emerald-400"
                >
                  {l}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm text-zinc-400">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>2,400+ freelancers trust InvoiceSnap</span>
            </div>
          </div>
        </div>

        {/* Mock invoice card */}
        <div className="mt-20 mx-auto max-w-md animate-fade-up delay-500">
          <div className="rounded-2xl border border-white/10 bg-[#111113] p-5 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Invoice #INV-2025-042</p>
                <p className="font-display font-semibold text-zinc-100">Rahul Photography</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-500/12 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Paid
              </span>
            </div>
            <div className="border-t border-white/7 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Wedding Photography × 1</span>
                <span className="text-zinc-200">₹45,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Photo Album × 1</span>
                <span className="text-zinc-200">₹8,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">GST (18%)</span>
                <span className="text-zinc-200">₹9,540</span>
              </div>
            </div>
            <div className="border-t border-white/7 mt-4 pt-4 flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-300">Total</span>
              <span className="text-xl font-display font-semibold text-zinc-100">₹62,540</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 h-9 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-2">
                <MessageCircle size={15} />
                Send on WhatsApp
              </button>
              <button className="h-9 w-9 rounded-lg border border-white/8 bg-zinc-900/60 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
                <FileText size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-5 border-t border-white/7">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-zinc-50 mb-4">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              We stripped out the complexity of traditional invoicing software and built exactly what a freelancer needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-xl border border-white/7 bg-[#111113] p-6 card-hover"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-emerald-400" />
                </div>
                <h3 className="font-semibold text-zinc-100 mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-5 border-t border-white/7">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-zinc-50 mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-zinc-400">Start free. Upgrade when you need to send.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-emerald-500/35 bg-emerald-500/5 shadow-xl shadow-emerald-500/8"
                    : "border-white/8 bg-[#111113]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-zinc-950">
                      Most popular
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <p className="text-sm font-medium text-zinc-300 mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display text-4xl font-semibold text-zinc-50">{plan.price}</span>
                    <span className="text-sm text-zinc-500">/{plan.period}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{plan.desc}</p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.disabled.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-600 line-through">
                      <CheckCircle2 size={15} className="text-zinc-700 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlight ? "default" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link href="/auth?tab=signup">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-5 border-t border-white/7">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest mb-3">Reviews</p>
            <h2 className="font-display text-4xl font-semibold text-zinc-50">
              Freelancers love InvoiceSnap
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-white/8 bg-[#111113] p-6 card-hover">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-sm font-semibold text-emerald-400">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-5 border-t border-white/7">
        <div className="mx-auto max-w-2xl text-center">
          <div className="relative rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-transparent" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-zinc-50 mb-3 relative">
              Ready to get paid on time?
            </h2>
            <p className="text-zinc-400 mb-7 relative">
              Join 2,400+ freelancers already using InvoiceSnap. Free plan available — no credit card required.
            </p>
            <Button size="xl" className="btn-glow" asChild>
              <Link href="/auth?tab=signup">
                Create your free account <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/7 py-10 px-5">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo textSize="text-lg" />
          <p className="text-xs text-zinc-600">
            © 2025 InvoiceSnap. Made with ♥ in India.
          </p>
          <div className="flex gap-5 text-xs text-zinc-500">
            <Link href="#" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
