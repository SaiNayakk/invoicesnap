"use client";

import { Fragment, useEffect, useState } from "react";
import { WhatsAppText } from "@/components/app/whatsapp-text";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { formatDay, todayIST } from "@/lib/dates";
import { useSessionState } from "@/lib/use-session-state";

interface Msg { id: string; kind: string; body: string; at: string; invoice: string; ai: boolean }
interface Chat { id: string; name: string; phone: string; messages: Msg[] }

const time = (iso: string) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));
const when = (iso: string) => (todayIST(new Date(iso)) === todayIST() ? time(iso) : formatDay(iso));

async function fetchChats(): Promise<Chat[] | null> {
  const res = await fetch("/api/demo/phone", { cache: "no-store" });
  return res.ok ? (await res.json()).chats : null;
}

export function PhoneChats() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [open, setOpen] = useSessionState("is-phone-chat");
  const [q, setQ] = useState("");

  useEffect(() => {
    let live = true;
    const load = () => fetchChats().then((c) => { if (live && c) setChats(c); });
    load();
    const onMsg = (e: MessageEvent) => { if (e.origin === window.location.origin && e.data?.type === "is-demo-refresh") load(); };
    window.addEventListener("message", onMsg);
    // The owner app sends messages from another frame; a light poll keeps the phone current.
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 4000);
    return () => { live = false; window.removeEventListener("message", onMsg); clearInterval(t); };
  }, []);

  const choose = setOpen;
  const pay = (id: string) => router.push(`/pay/${id}?demo=phone`);

  if (!chats) return <div className="flex h-screen items-center justify-center bg-[#0b141a] text-sm text-zinc-500">Loading chats…</div>;
  const chat = chats.find((c) => c.id === open);

  if (chat) {
    const dayOf = (m: Msg) => formatDay(m.at, true);
    return (
      <div className="flex h-screen flex-col bg-[#0b141a]">
        <header className="flex h-14 shrink-0 items-center gap-3 bg-[#1f2c34] px-3">
          <button onClick={() => choose(null)} aria-label="Back to chats" className="text-zinc-300"><ArrowLeft size={20} /></button>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-600 text-sm font-semibold text-zinc-100">{chat.name[0]}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">{chat.name}</p>
            <p className="text-[11px] text-zinc-400">+91 {chat.phone.slice(0, 5)} {chat.phone.slice(5)}</p>
          </div>
        </header>
        <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
          {chat.messages.map((m, k) => {
            const day = dayOf(m);
            const showDay = k === 0 || dayOf(chat.messages[k - 1]) !== day;
            const mine = m.kind !== "client_reply";
            return (
              <Fragment key={m.id}>
                {showDay && <p className="mx-auto my-2 w-fit rounded-md bg-[#1f2c34] px-2 py-0.5 text-[11px] text-zinc-400">{todayIST(new Date(m.at)) === todayIST() ? "Today" : day}</p>}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[13.5px] leading-snug text-zinc-100 ${mine ? "rounded-tr-none bg-[#005c4b]" : "rounded-tl-none bg-[#1f2c34]"}`}>
                    <p className="whitespace-pre-line break-words"><WhatsAppText text={m.body} onPay={pay} host={window.location.host} /></p>
                    <p className="mt-0.5 text-right text-[10px] text-zinc-400">{m.ai && mine ? "AI draft · " : ""}{time(m.at)}</p>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
        <p className="shrink-0 bg-[#1f2c34] px-3 py-2 text-center text-[11px] text-zinc-400">Tap a payment link to see what {chat.name.split(" ")[0]} sees.</p>
      </div>
    );
  }

  const shown = chats.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex h-screen flex-col bg-[#0b141a]">
      <header className="shrink-0 bg-[#1f2c34] px-4 pb-3 pt-4">
        <p className="text-lg font-semibold text-zinc-100">Chats</p>
        <label className="relative mt-3 block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search chats"
            className="h-9 w-full rounded-full bg-[#0b141a] pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none" />
        </label>
      </header>
      <ul className="flex-1 overflow-y-auto">
        {shown.map((c) => {
          const last = c.messages[c.messages.length - 1];
          return (
            <li key={c.id}>
              <button onClick={() => choose(c.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#1f2c34]/60">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-600 font-semibold text-zinc-100">{c.name[0]}</span>
                <span className="min-w-0 flex-1 border-b border-zinc-800/80 pb-3">
                  <span className="flex justify-between gap-2">
                    <span className="truncate text-[15px] text-zinc-100">{c.name}</span>
                    <span className="shrink-0 text-[11px] text-zinc-500">{when(last.at)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-zinc-400">{last.kind === "client_reply" ? "" : "You: "}{last.body.replace(/\*/g, "").split("\n")[0]}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
