import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ArchitectureDiagram } from "@/components/diagrams/architecture";
import {
  DeploymentDiagram, ExtractionDiagram, ForecastDiagram, LifecycleDiagram, PaymentModelDiagrams, ReminderDiagram, SequenceDiagram,
} from "@/components/diagrams/internals";

export const metadata: Metadata = {
  title: "How InvoiceSnap is built",
  description: "Architecture, models and testing behind InvoiceSnap.",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="font-display text-2xl font-semibold text-zinc-100">{title}</h2>
      <div className="space-y-4 text-[15px] leading-7 text-zinc-300">{children}</div>
    </section>
  );
}

function Metrics({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="bg-zinc-900 px-4 py-3">
          <dt className="text-xs text-zinc-500">{k}</dt>
          <dd className="mt-1 text-sm font-medium text-zinc-100">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const TOC = [
  ["overview", "Overview"],
  ["architecture", "Architecture"],
  ["sequence", "One invoice, end to end"],
  ["drafting", "Drafting from a message"],
  ["payments", "When will it be paid?"],
  ["forecast", "Cash-flow forecast"],
  ["reminders", "Reminders"],
  ["summary", "Weekly summary"],
  ["gst", "GST rules"],
  ["demo", "The live demo"],
  ["security", "Security"],
  ["deployment", "Deployment"],
  ["stack", "Stack"],
] as const;

const code = "rounded bg-zinc-900 px-1 py-0.5 text-[13px] text-zinc-100";

export default function TechnicalPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6">
        <Link href="/demo" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"><ArrowLeft size={15} /> Demo</Link>
        <Link href="/" aria-label="InvoiceSnap home"><Logo size={24} /></Link>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-14 lg:grid lg:grid-cols-[180px_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-2 text-sm">
            {TOC.map(([id, label]) => <a key={id} href={`#${id}`} className="block text-zinc-500 hover:text-zinc-200">{label}</a>)}
          </nav>
        </aside>

        <article className="max-w-2xl space-y-14">
          <header className="space-y-4">
            <p className="text-sm text-zinc-500">Technical write-up</p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-zinc-50">How InvoiceSnap is built</h1>
            <p className="text-base leading-7 text-zinc-400">
              InvoiceSnap sends GST invoices over WhatsApp with a UPI payment page, for freelancers and small businesses in India.
              This page covers the parts beyond a CRUD app: drafting invoices from a line of text with every number verified, a
              payment-date model per client, a cash-flow forecast, and a demo that runs the real product.
            </p>
          </header>

          <Section id="overview" title="Overview">
            <p>
              It&apos;s a Next.js app on PocketBase. Anything involving a language model goes through a separate Python service that
              all SaiWorks apps share. The models that predict payments are plain TypeScript and run in the Next.js server.
            </p>
            <p>
              One rule runs through all of it: <strong className="text-zinc-100">the language model reads and words things; it never
              decides a number.</strong> Prices must appear in the message they came from, totals and tax are computed in code, and
              every figure in a summary or reminder must be in the facts the app supplied.
            </p>
          </Section>

          <Section id="architecture" title="Architecture">
            <ArchitectureDiagram />
            <p>
              The browser never talks to the AI service. Next.js calls it server to server with a per-app token, passes the
              caller&apos;s IP for per-person limits, and each account is a separate tenant, so usage and logs stay apart.
            </p>
          </Section>

          <Section id="sequence" title="One invoice, end to end">
            <p>From a typed line to confirmed money. The payment itself happens in the client&apos;s UPI app, outside InvoiceSnap.</p>
            <SequenceDiagram />
          </Section>

          <Section id="drafting" title="Drafting from a message">
            <p>
              Freelancers already describe their work in a message. InvoiceSnap takes that message (or a photo of a handwritten bill)
              and asks Gemini for structured fields: client, items, quantities, unit prices, GST rate and due date. That output is
              then treated as untrusted:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Every number must appear in the message after normalising Indian formats: <code className={code}>4.5k</code>, <code className={code}>1.2 lakh</code>, <code className={code}>₹4,500/-</code>, <code className={code}>teen</code>, <code className={code}>2 weeks</code>. A price that doesn&apos;t is dropped.</li>
              <li>A unit price is also accepted when quantity times price equals a total the message states.</li>
              <li>GST must be 0, 5, 12, 18 or 28%. Due dates must be written, not guessed.</li>
              <li>Clients are matched in code on name tokens and phone numbers; an ambiguous first name asks you to pick.</li>
              <li>For photos, numbers are checked against the text the model says it read, and the draft says it came from a photo.</li>
            </ul>
            <ExtractionDiagram />
            <p>
              The checks are unit tested with a fake model that invents prices, clients, GST rates and due dates on purpose. The draft
              is only ever a form you review; nothing is saved or sent until you press Save.
            </p>
          </Section>

          <Section id="payments" title="When will it be paid?">
            <p>
              For each client, InvoiceSnap looks at how many days after the due date they actually paid. A client with one past
              invoice says little, so their history is blended with the whole business&apos;s in proportion <em>n</em> : 3. If an invoice
              is already late, the prediction only draws on the client&apos;s slower payments, so the answer is always in the future.
            </p>
            <p>
              A separate logistic regression, trained per business in time order, scores the chance of paying more than a week late.
              New businesses start from sensible default weights.
            </p>
            <PaymentModelDiagrams />
            <Metrics rows={[
              ["Error vs “paid on the due date”", "28% lower (6.0 vs 8.2 days)"],
              ["Payments inside the predicted range", "81%"],
              ["Late-payment ranking (AUC), later invoices", "0.87"],
              ["Replayed invoices", "2,204 across 30 businesses"],
            ]} />
            <p className="text-sm text-zinc-500">
              Every invoice is predicted using only payments that had arrived by the day it was issued. The businesses are simulated
              (each client has hidden payment habits), because there isn&apos;t enough real history yet. The same backtest runs on each
              account&apos;s own invoices and its result is shown on the Overview. All figures come from <code className={code}>scripts/evaluate.ts</code>.
            </p>
          </Section>

          <Section id="forecast" title="Cash-flow forecast">
            <p>
              &ldquo;How much will come in over the next few weeks?&rdquo; is a sum of uncertain dates, so it&apos;s answered by simulation: draw a
              payment day for every open invoice from its client&apos;s blended history, add up each week, and repeat 500 times. The
              random seed is fixed per day, so the numbers don&apos;t jump on every refresh.
            </p>
            <ForecastDiagram />
          </Section>

          <Section id="reminders" title="Reminders">
            <p>
              Code decides who to remind and how firmly: friendly while it&apos;s only a little late, firm after a week or one ignored
              reminder, final after three weeks or two. The model only words it, in English or Hinglish, from the invoice&apos;s facts. The
              reminder opens in WhatsApp with the message ready, so there&apos;s nothing to set up and you always press Send yourself.
            </p>
            <ReminderDiagram />
          </Section>

          <Section id="summary" title="Weekly summary">
            <p>
              The Overview can write a short summary of the week: what&apos;s owed, what&apos;s likely to arrive, who will probably be late,
              and GST charged this month. The app computes each figure and sends them as numbered facts; the model picks what matters
              and cites the facts it used. Any sentence with a number not in its cited facts is dropped. The summary is stored and only
              rewritten when the facts change, so refreshing the page never costs a model call.
            </p>
          </Section>

          <Section id="gst" title="GST rules">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>GSTINs are validated for format, state code and the mod-36 check character as you type.</li>
              <li>Seller and buyer states come from their GSTINs, or their addresses if unregistered. Same state: CGST and SGST. Different states: IGST.</li>
              <li>The two halves are computed so they always add back to the total tax, to the paisa.</li>
              <li>Reports show taxable value, CGST, SGST and IGST by month for the financial year, April to March.</li>
            </ul>
          </Section>

          <Section id="demo" title="The live demo">
            <p>
              Each visitor gets a real, private account for 45 minutes: a design studio with 14 clients and a year of invoices,
              payments and WhatsApp messages. Every client has hidden payment habits (a typical delay, how much it varies, and how
              often a payment slips badly) and all history is drawn from them. The models only ever see the resulting dates.
            </p>
            <p>
              The phone beside the app shows every message the account sends. Payment links open the real client page, so a visitor can
              pay their own invoice and watch it arrive. Fast-forward moves every date back a week and plays that week out from the same
              habits, then shows how the forecast and the late warnings did.
            </p>
            <LifecycleDiagram />
          </Section>

          <Section id="security" title="Security">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Every route verifies the session with PocketBase (not just the token&apos;s expiry) and scopes queries to that user with bound filter parameters. An earlier version pasted query-string values into filters.</li>
              <li>Invoices can&apos;t be edited through the API after they&apos;re sent; only a few status changes are allowed. Profile updates are whitelisted, so a user can&apos;t upgrade their own plan.</li>
              <li>The public payment page is keyed by the invoice&apos;s random 15-character id, shows only what the client needs, and is rate limited.</li>
              <li>Errors shown to users are generic; server details are logged, not returned.</li>
              <li>An unused payment webhook that accepted unsigned requests when its secret was missing was removed.</li>
              <li>Schema changes go through an additive migration script that reads credentials from the environment.</li>
            </ul>
          </Section>

          <Section id="deployment" title="Deployment">
            <p>
              Nothing is exposed directly to the internet. The servers open outbound tunnels to Cloudflare, which handles TLS. The AI
              service runs on an Android phone under Termux, deployed and kept alive with Backseat, a small open-source tool built for this.
            </p>
            <DeploymentDiagram />
          </Section>

          <Section id="stack" title="Stack">
            <Metrics rows={[
              ["Web app", "Next.js 16, React 19, TypeScript, Tailwind"],
              ["Data", "PocketBase (SQLite, auth)"],
              ["AI service", "Python, Flask, shared by all SaiWorks apps"],
              ["Models", "Gemini for reading and wording; payment models in TypeScript"],
              ["Tests", "node:test for models and GST rules, pytest for the AI service"],
              ["PDFs", "@react-pdf/renderer, generated on the server"],
            ]} />
          </Section>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-8">
            <p className="text-sm text-zinc-500">Built by <a href="https://saiworks.nncs.in" className="text-zinc-300 hover:text-zinc-100">SaiWorks</a>.</p>
            <Link href="/demo" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">Try the live demo</Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
