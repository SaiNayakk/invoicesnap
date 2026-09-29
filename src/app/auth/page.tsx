"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const input = "h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none";

const POINTS = [
  ["GST done for you", "CGST and SGST or IGST, picked from the GSTINs. Valid slabs only."],
  ["Paid by UPI", "Every invoice has a payment page. Money goes straight to your UPI ID."],
  ["Knows who pays late", "Learns each client's habits and tells you when to expect money."],
];

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [business, setBusiness] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(tab === "signin" ? "/api/auth/login" : "/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tab === "signin" ? { email, password } : { email, password, business_name: business }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(d.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="hidden w-[440px] flex-col border-r border-zinc-800 bg-zinc-900/30 p-10 lg:flex">
        <Link href="/"><Logo /></Link>
        <div className="mt-auto space-y-6">
          <p className="font-display text-3xl font-semibold leading-snug text-zinc-50">GST invoices your clients open on WhatsApp.</p>
          <ul className="space-y-4">
            {POINTS.map(([t, d]) => (
              <li key={t}>
                <p className="text-sm font-medium text-zinc-200">{t}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{d}</p>
              </li>
            ))}
          </ul>
          <Link href="/demo" className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300">Try it on a demo account first <ArrowRight size={14} /></Link>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block lg:hidden"><Logo /></Link>
          <div className="mb-7 grid grid-cols-2 rounded-lg border border-zinc-800 p-1">
            {(["signin", "signup"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(null); }}
                className={cn("h-9 rounded-md text-sm font-medium", tab === t ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-200")}>
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50">{tab === "signin" ? "Welcome back" : "Start invoicing"}</h1>
          <p className="mb-6 mt-1 text-sm text-zinc-500">{tab === "signin" ? "Sign in to your account." : "Takes a minute. No card needed."}</p>
          <form onSubmit={submit} className="space-y-4">
            {tab === "signup" && (
              <label className="block space-y-1 text-xs text-zinc-400">Business or trading name
                <input className={input} value={business} onChange={(e) => setBusiness(e.target.value)} required maxLength={80} placeholder="Northlight Studio" />
              </label>
            )}
            <label className="block space-y-1 text-xs text-zinc-400">Email
              <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label className="block space-y-1 text-xs text-zinc-400">Password
              <span className="relative block">
                <input className={cn(input, "pr-10")} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                  minLength={tab === "signup" ? 8 : undefined} autoComplete={tab === "signin" ? "current-password" : "new-password"} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </span>
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60">
              {loading ? <Loader2 size={15} className="animate-spin" /> : tab === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
