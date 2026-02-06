/**
 * XMR_PRICES
 * Separate pricing from products to match Stripe's products/prices structure
 */

-- Create xmr_prices table (similar to Stripe prices)
CREATE TABLE xmr_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The ID of the product that this price belongs to
  product_id UUID REFERENCES xmr_products(id) ON DELETE CASCADE,
  -- Whether the price can be used for new purchases
  active BOOLEAN DEFAULT true,
  -- A brief description of the price
  description TEXT,
  -- The amount in XMR
  amount_xmr DECIMAL(12, 12) NOT NULL,
  -- The billing interval (month, year)
  interval billing_interval NOT NULL DEFAULT 'month',
  -- Number of intervals between billings (e.g., 3 for quarterly)
  interval_count INTEGER DEFAULT 1,
  -- Default number of trial days
  trial_period_days INTEGER,
  -- Set of key-value pairs for additional info
  metadata JSONB,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE xmr_prices ENABLE ROW LEVEL SECURITY;

-- Public read access (same as Stripe prices)
CREATE POLICY "Public read xmr_prices" ON xmr_prices FOR SELECT USING (true);

-- Migrate existing price data from xmr_products to xmr_prices
-- This creates a price for each existing product
INSERT INTO xmr_prices (product_id, amount_xmr, interval, active)
SELECT id, amount_xmr, interval, true
FROM xmr_products;

-- Add active and description columns to xmr_products (to match Stripe products structure)
ALTER TABLE xmr_products
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image TEXT;

-- Add xmr_price_id column to xmr_invoices to reference the specific price
ALTER TABLE xmr_invoices
  ADD COLUMN IF NOT EXISTS price_id UUID REFERENCES xmr_prices(id);

-- Update existing invoices to reference the corresponding price
UPDATE xmr_invoices i
SET price_id = p.id
FROM xmr_prices p
WHERE i.product_id = p.product_id;

-- Add xmr_price_id to subscriptions for XMR subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS xmr_price_id UUID REFERENCES xmr_prices(id);

-- Backfill existing XMR subscriptions with the correct xmr_price_id
-- Match by looking up the product_id from metadata and finding the corresponding price
UPDATE subscriptions s
SET xmr_price_id = p.id
FROM xmr_prices p
WHERE s.metadata->>'payment_method' = 'xmr'
  AND s.metadata->>'xmr_product_id' IS NOT NULL
  AND p.product_id = (s.metadata->>'xmr_product_id')::uuid
  AND s.xmr_price_id IS NULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE xmr_products, xmr_prices;

-- Remove redundant columns from xmr_products (now in xmr_prices)
ALTER TABLE xmr_products DROP COLUMN IF EXISTS interval;
ALTER TABLE xmr_products DROP COLUMN IF EXISTS amount_xmr;
