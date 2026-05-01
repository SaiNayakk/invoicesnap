export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type SupplyType = "intra" | "inter";
export type Plan = "free" | "pro" | "business";

export interface Profile {
  id: string;
  email: string;
  business_name: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  gst_number: string | null;
  pan_number: string | null;
  upi_id: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  invoice_prefix: string;
  invoice_counter: number;
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  pan_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  hsn_sac: string | null;
  quantity: number;
  rate: number;
  amount: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  gst_amount: number;
  total: number;
  supply_type: SupplyType;
  notes: string | null;
  terms: string | null;
  pdf_url: string | null;
  razorpay_payment_link_id: string | null;
  razorpay_payment_link_url: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  client?: Client;
}

export interface InvoiceWithClient extends Invoice {
  client_name: string;
  client_phone: string;
  client_email: string | null;
  client_address: string | null;
  client_city: string | null;
  client_state: string | null;
  client_gst_number: string | null;
}

// Minimal Supabase Database type stub (enough for our client calls)
// Loose update type so Supabase client doesn't reject partial patches
type AnyUpdate = Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      profiles:      { Row: Profile;     Insert: Partial<Profile>;                                  Update: AnyUpdate };
      clients:       { Row: Client;      Insert: Omit<Client, "id" | "created_at" | "updated_at">; Update: AnyUpdate };
      invoices:      { Row: Invoice;     Insert: Omit<Invoice, "id" | "created_at" | "updated_at">; Update: AnyUpdate };
      invoice_items: { Row: InvoiceItem; Insert: Omit<InvoiceItem, "id">;                           Update: AnyUpdate };
    };
    Views: {
      invoices_with_client: { Row: InvoiceWithClient };
    };
    Functions: {
      next_invoice_number: { Args: { p_user_id: string }; Returns: string };
      mark_overdue_invoices: { Args: Record<string, never>; Returns: number };
    };
  };
};
