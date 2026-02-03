/**
 * XMR PAYMENTS
 * Tables for Monero payment integration via xmrcheckout
 */

-- Billing interval enum type
CREATE TYPE billing_interval AS ENUM ('month', 'year');

-- XMR invoice status enum type
CREATE TYPE xmr_invoice_status AS ENUM ('pending', 'payment_detected', 'confirmed', 'expired');

/**
 * XMR_PRODUCTS
 * Pricing tiers for Monero payments
 */
CREATE TABLE xmr_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount_xmr DECIMAL(12, 12) NOT NULL,
  interval billing_interval NOT NULL DEFAULT 'month',
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/**
 * XMR_INVOICES
 * Track Monero payment invoices from xmrcheckout
 */
CREATE TABLE xmr_invoices (
  id UUID PRIMARY KEY,  -- xmrcheckout invoice ID
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES xmr_products(id),
  amount_xmr DECIMAL(12, 12) NOT NULL,
  status xmr_invoice_status NOT NULL DEFAULT 'pending',
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Seed XMR products
INSERT INTO xmr_products (name, amount_xmr, interval) VALUES
  ('Hobby', 0.0001, 'month'),
  ('Freelancer', 0.10, 'month');

-- Enable RLS
ALTER TABLE xmr_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE xmr_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Public read xmr_products" ON xmr_products FOR SELECT USING (true);
CREATE POLICY "Users read own invoices" ON xmr_invoices FOR SELECT USING (auth.uid() = user_id);
