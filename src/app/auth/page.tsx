"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign-in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign-up fields
  const [firstName, setFirstName]           = useState("");
  const [lastName, setLastName]             = useState("");
  const [businessName, setBusinessName]     = useState("");
  const [signupEmail, setSignupEmail]       = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Sign in failed");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email:         signupEmail,
          password:      signupPassword,
          name:          `${firstName} ${lastName}`.trim(),
          business_name: businessName,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Registration failed");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[480px] border-r border-white/7 bg-[#0c0c0e] p-10 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full bg-emerald-500/8 blur-[100px]" />
        <Logo className="relative" />
        <div className="relative mt-auto">
          <p className="font-display text-3xl font-semibold text-zinc-50 mb-4 leading-snug">
            Invoice on WhatsApp.<br />
            <span className="text-emerald-400">Get paid faster.</span>
          </p>
          <p className="text-sm text-zinc-400 mb-10 leading-relaxed">
            Join 2,400+ Indian freelancers who send professional invoices and get paid via UPI — all from WhatsApp.
          </p>
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
            <div className="flex mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" className="mr-0.5">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-zinc-300 mb-3">
              &ldquo;My clients now receive a proper PDF invoice with a payment link on WhatsApp. 90% pay the same day.&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-xs font-semibold text-emerald-400">
                P
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-300">Priya Menon</p>
                <p className="text-[10px] text-zinc-500">Freelance Photographer, Chennai</p>
              </div>
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-xl border border-white/8 bg-zinc-900/40 p-1 mb-8">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-[#111113] text-zinc-100 shadow-sm border border-white/8"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {tab === "signin" ? (
            <div className="animate-fade-up">
              <h1 className="font-display text-2xl font-semibold text-zinc-50 mb-1">Welcome back</h1>
              <p className="text-sm text-zinc-500 mb-7">Sign in to your InvoiceSnap account</p>

              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <Button className="w-full mt-2" size="lg" type="submit" disabled={loading}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <>Sign in <ArrowRight size={15} /></>}
                </Button>
              </form>
            </div>
          ) : (
            <div className="animate-fade-up">
              <h1 className="font-display text-2xl font-semibold text-zinc-50 mb-1">Create your account</h1>
              <p className="text-sm text-zinc-500 mb-7">Free forever — no credit card needed</p>

              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first-name">First name</Label>
                    <Input id="first-name" placeholder="Rahul" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input id="last-name" placeholder="Sharma" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="business-name">Business / freelancer name</Label>
                  <Input id="business-name" placeholder="Rahul Photography" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="pr-10"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-600">
                  By signing up you agree to our{" "}
                  <Link href="#" className="text-zinc-400 hover:text-zinc-200">Terms</Link>{" "}
                  and{" "}
                  <Link href="#" className="text-zinc-400 hover:text-zinc-200">Privacy Policy</Link>.
                </p>
                <Button className="w-full" size="lg" type="submit" disabled={loading}>
                  {loading
                    ? <Loader2 size={15} className="animate-spin" />
                    : <>Create free account <ArrowRight size={15} /></>}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
