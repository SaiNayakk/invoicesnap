-- ============================================================
-- InvoiceSnap — Supabase Schema
-- Run this in your Supabase SQL editor to bootstrap the DB.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users / profiles ─────────────────────────────────────────
-- Extends Supabase auth.users with business-specific fields
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  business_name         TEXT NOT NULL DEFAULT '',
  logo_url              TEXT,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  pincode               TEXT,
  phone                 TEXT,
  gst_number            TEXT,
  pan_number            TEXT,
  upi_id                TEXT,
  bank_name             TEXT,
  bank_account_number   TEXT,
  bank_ifsc             TEXT,
  invoice_prefix        TEXT NOT NULL DEFAULT 'INV',
  invoice_counter       INTEGER NOT NULL DEFAULT 0,
  plan                  TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  razorpay_contact_id   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Clients ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  pincode     TEXT,
  gst_number  TEXT,
  pan_number  TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clients" ON public.clients
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX clients_user_id_idx ON public.clients(user_id);

-- ── Invoices ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id                   UUID NOT NULL REFERENCES public.clients(id),
  invoice_number              TEXT NOT NULL,
  status                      TEXT NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  invoice_date                DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date                    DATE NOT NULL,
  subtotal                    NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_rate                    NUMERIC(5,2) NOT NULL DEFAULT 0,
  cgst_amount                 NUMERIC(12,2) NOT NULL DEFAULT 0,
  sgst_amount                 NUMERIC(12,2) NOT NULL DEFAULT 0,
  igst_amount                 NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_amount                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  total                       NUMERIC(12,2) NOT NULL DEFAULT 0,
  supply_type                 TEXT NOT NULL DEFAULT 'intra' CHECK (supply_type IN ('intra','inter')),
  notes                       TEXT,
  terms                       TEXT,
  pdf_url                     TEXT,
  razorpay_payment_link_id    TEXT,
  razorpay_payment_link_url   TEXT,
  sent_at                     TIMESTAMPTZ,
  paid_at                     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoices" ON public.invoices
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX invoices_user_id_idx  ON public.invoices(user_id);
CREATE INDEX invoices_status_idx   ON public.invoices(status);
CREATE INDEX invoices_due_date_idx ON public.invoices(due_date);

-- Unique invoice numbers per user
CREATE UNIQUE INDEX invoices_number_user_idx ON public.invoices(user_id, invoice_number);

-- ── Invoice items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id   UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  hsn_sac      TEXT,
  quantity     NUMERIC(10,3) NOT NULL DEFAULT 1,
  rate         NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoice items" ON public.invoice_items
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND i.user_id = auth.uid()
    )
  );

CREATE INDEX invoice_items_invoice_id_idx ON public.invoice_items(invoice_id);

-- ── Expenses (Phase 3) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  category    TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expenses" ON public.expenses
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Convenience view: invoices with client name ───────────────
CREATE OR REPLACE VIEW public.invoices_with_client AS
  SELECT
    i.*,
    c.name        AS client_name,
    c.phone       AS client_phone,
    c.email       AS client_email,
    c.address     AS client_address,
    c.city        AS client_city,
    c.state       AS client_state,
    c.gst_number  AS client_gst_number
  FROM public.invoices i
  JOIN public.clients  c ON c.id = i.client_id;

-- ── Helper: auto-generate invoice number ─────────────────────
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix  TEXT;
  v_counter INTEGER;
  v_year    INTEGER;
BEGIN
  UPDATE public.profiles
     SET invoice_counter = invoice_counter + 1,
         updated_at      = NOW()
   WHERE id = p_user_id
  RETURNING invoice_prefix, invoice_counter, EXTRACT(YEAR FROM NOW())::INTEGER
    INTO v_prefix, v_counter, v_year;

  RETURN v_prefix || '-' || v_year || '-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Auto-mark overdue invoices (call daily via pg_cron or Vercel cron) ───────
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.invoices
     SET status     = 'overdue',
         updated_at = NOW()
   WHERE status   = 'sent'
     AND due_date < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
