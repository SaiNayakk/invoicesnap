"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type Client = {
  id: string;
  name: string;
  initial: string;
  phone: string;
  email?: string;
  address?: string;
  totalInvoiced: number;
  invoiceCount: number;
  lastInvoice: string;
  color: string;
};

const clients: Client[] = [
  {
    id: "1",
    name: "Sneha Reddy",
    initial: "S",
    phone: "+91 98765 43210",
    email: "sneha@example.com",
    address: "Hyderabad, Telangana",
    totalInvoiced: 142000,
    invoiceCount: 8,
    lastInvoice: "Apr 28, 2025",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  },
  {
    id: "2",
    name: "Vikram Events",
    initial: "V",
    phone: "+91 97654 32109",
    email: "vikram@vikramevents.in",
    address: "Mumbai, Maharashtra",
    totalInvoiced: 315000,
    invoiceCount: 14,
    lastInvoice: "Apr 26, 2025",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  {
    id: "3",
    name: "Meera Tutoring",
    initial: "M",
    phone: "+91 96543 21098",
    address: "Pune, Maharashtra",
    totalInvoiced: 54000,
    invoiceCount: 6,
    lastInvoice: "Apr 15, 2025",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  {
    id: "4",
    name: "Arjun Nair Design",
    initial: "A",
    phone: "+91 95432 10987",
    email: "arjun@arjunnair.design",
    address: "Bengaluru, Karnataka",
    totalInvoiced: 228500,
    invoiceCount: 11,
    lastInvoice: "Apr 22, 2025",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  {
    id: "5",
    name: "Priya Photography",
    initial: "P",
    phone: "+91 94321 09876",
    email: "priya@priyaphoto.in",
    address: "Chennai, Tamil Nadu",
    totalInvoiced: 189000,
    invoiceCount: 9,
    lastInvoice: "Apr 18, 2025",
    color: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  },
  {
    id: "6",
    name: "Deepa Krishnan",
    initial: "D",
    phone: "+91 93210 98765",
    address: "Bengaluru, Karnataka",
    totalInvoiced: 36000,
    invoiceCount: 4,
    lastInvoice: "Apr 10, 2025",
    color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50 mb-1">Clients</h1>
          <p className="text-sm text-zinc-500">{clients.length} clients in your directory</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add client
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <div
            key={client.id}
            className="relative rounded-xl border border-white/8 bg-[#111113] p-5 card-hover"
          >
            {/* Menu button */}
            <button
              onClick={() => setActiveMenu(activeMenu === client.id ? null : client.id)}
              className="absolute top-4 right-4 w-7 h-7 rounded-md flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all"
            >
              <MoreHorizontal size={15} />
            </button>

            {/* Dropdown */}
            {activeMenu === client.id && (
              <div className="absolute top-11 right-4 z-10 rounded-lg border border-white/10 bg-zinc-900 shadow-xl p-1 min-w-36">
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 transition-colors">
                  <FileText size={13} /> New invoice
                </button>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 transition-colors">
                  <Pencil size={13} /> Edit
                </button>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-400 hover:bg-red-500/8 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}

            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-semibold shrink-0 ${client.color}`}>
                {client.initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate">{client.name}</p>
                {client.address && (
                  <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                    <MapPin size={10} /> {client.address}
                  </p>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Phone size={11} className="text-zinc-600 shrink-0" />
                <span>{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Mail size={11} className="text-zinc-600 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="border-t border-white/7 pt-4 flex justify-between">
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Total invoiced</p>
                <p className="text-sm font-semibold text-zinc-200">{formatCurrency(client.totalInvoiced)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-0.5">Invoices</p>
                <p className="text-sm font-semibold text-zinc-200">{client.invoiceCount}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-0.5">Last invoice</p>
                <p className="text-xs text-zinc-400">{client.lastInvoice}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Empty add card */}
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-xl border border-dashed border-white/10 bg-transparent p-5 flex flex-col items-center justify-center gap-3 text-zinc-600 hover:text-zinc-400 hover:border-white/20 transition-all min-h-[200px] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full border border-dashed border-zinc-700 flex items-center justify-center">
            <Plus size={18} />
          </div>
          <span className="text-sm">Add new client</span>
        </button>
      </div>

      {/* Add client drawer */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <div className="w-full max-w-sm bg-[#0f0f11] border-l border-white/8 p-6 overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-zinc-50">New client</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form className="space-y-4">
              <div className="space-y-1.5">
                <Label>Client / business name *</Label>
                <Input placeholder="Priya Photography" />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp / phone *</Label>
                <Input placeholder="+91 98765 43210" type="tel" />
              </div>
              <div className="space-y-1.5">
                <Label>Email address</Label>
                <Input placeholder="priya@example.com" type="email" />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input placeholder="City, State" />
              </div>
              <div className="space-y-1.5">
                <Label>GST number (optional)</Label>
                <Input placeholder="27AAPFU0939F1ZV" />
              </div>

              <div className="pt-2 flex gap-3">
                <Button className="flex-1">Save client</Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
