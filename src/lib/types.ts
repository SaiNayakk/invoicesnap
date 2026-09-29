export type InvoiceStatus = "draft" | "sent" | "payment_pending" | "paid" | "overdue" | "cancelled";
export type Source = "manual" | "simulated" | "ai";

export interface Profile {
  id: string;
  email: string;
  name?: string;
  business_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  gst_number: string;
  pan_number: string;
  upi_id: string;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  invoice_prefix: string;
  invoice_counter: number;
  default_due_days: number;
  plan: "free" | "pro" | "business" | "";
}

export interface Client {
  id: string;
  user: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst_number: string;
  notes: string;
  source?: Source;
  created: string;
}

export interface Invoice {
  id: string;
  user: string;
  client: string;
  invoice_number: string;
  status: InvoiceStatus;
  invoice_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  subtotal: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  gst_amount: number;
  total: number;
  supply_type: "intra" | "inter";
  notes: string;
  terms: string;
  sent_at: string;
  paid_at: string;
  claimed_at: string;
  reminder_count: number;
  last_reminder_at: string;
  source?: Source;
  created: string;
}

export interface InvoiceItem {
  id: string;
  invoice: string;
  description: string;
  hsn_sac: string;
  quantity: number;
  rate: number;
  amount: number;
  sort_order: number;
}

export interface Message {
  id: string;
  user: string;
  client: string;
  invoice: string;
  kind: "invoice" | "reminder" | "thank_you" | "client_reply";
  channel: "whatsapp_link" | "whatsapp_api" | "demo";
  body: string;
  tone: string;
  ai_written: boolean;
  at: string;
  created: string;
}

/** Statuses that still expect money. */
export const OPEN: InvoiceStatus[] = ["sent", "overdue", "payment_pending"];

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  payment_pending: "Client says paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};
