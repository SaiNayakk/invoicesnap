"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[480px] border-r border-white/7 bg-[#0c0c0e] p-10 relative overflow-hidden">
        {/* Ambient */}
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

          {/* Mini testimonial */}
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
            <div className="flex mb-2">
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" className="mr-0.5">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              ))}
            </div>
            <p className="text-sm text-zinc-300 mb-3">
              &ldquo;My clients now receive a proper PDF invoice with a payment link on WhatsApp. 90% pay the same day.&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-xs font-semibold text-emerald-400">P</div>
              <div>
                <p className="text-xs font-medium text-zinc-300">Priya Menon</p>
                <p className="text-[10px] text-zinc-500">Freelance Photographer, Chennai</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid lines decoration */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-xl border border-white/8 bg-zinc-900/40 p-1 mb-8">
            <button
              onClick={() => setTab("signin")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                tab === "signin"
                  ? "bg-[#111113] text-zinc-100 shadow-sm border border-white/8"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                tab === "signup"
                  ? "bg-[#111113] text-zinc-100 shadow-sm border border-white/8"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Create account
            </button>
          </div>

          {tab === "signin" ? (
            <div className="animate-fade-up">
              <h1 className="font-display text-2xl font-semibold text-zinc-50 mb-1">
                Welcome back
              </h1>
              <p className="text-sm text-zinc-500 mb-7">Sign in to your InvoiceSnap account</p>

              <form className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
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

                <Button className="w-full mt-2" size="lg" asChild>
                  <Link href="/dashboard">
                    Sign in <ArrowRight size={15} />
                  </Link>
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/7" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#09090b] px-3 text-xs text-zinc-600">or continue with</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" size="lg">
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          ) : (
            <div className="animate-fade-up">
              <h1 className="font-display text-2xl font-semibold text-zinc-50 mb-1">
                Create your account
              </h1>
              <p className="text-sm text-zinc-500 mb-7">Free forever — no credit card needed</p>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first-name">First name</Label>
                    <Input id="first-name" placeholder="Rahul" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input id="last-name" placeholder="Sharma" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="business-name">Business / freelancer name</Label>
                  <Input id="business-name" placeholder="Rahul Photography" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email address</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="pr-10"
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

                <Button className="w-full" size="lg" asChild>
                  <Link href="/dashboard">
                    Create free account <ArrowRight size={15} />
                  </Link>
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
