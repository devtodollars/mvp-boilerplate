/**
 * MERGE XMR TABLES INTO UNIFIED PRODUCTS/PRICES
 * - Adds payment_provider enum and currency_type enum
 * - Adds provider column to products
 * - Changes prices.unit_amount from bigint to numeric
 * - Replaces prices.currency text with currency_type enum
 * - Migrates xmr_products -> products, xmr_prices -> prices
 * - Updates xmr_invoices foreign keys
 * - Migrates subscriptions.xmr_price_id to price_id
 * - Drops xmr_products, xmr_prices tables and billing_interval enum
 */

-- 1. Create new enum types
CREATE TYPE payment_provider AS ENUM ('STRIPE', 'MONERO');
CREATE TYPE currency_type AS ENUM ('USD', 'XMR', 'CAD');

-- 2. Add provider column to products (default STRIPE for existing rows)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS provider payment_provider NOT NULL DEFAULT 'STRIPE';

-- 3. Change prices.unit_amount from bigint to numeric
ALTER TABLE prices
  ALTER COLUMN unit_amount TYPE numeric USING unit_amount::numeric;

-- 4. Replace currency text column with currency_type enum
-- First drop the check constraint on currency
ALTER TABLE prices
  DROP CONSTRAINT IF EXISTS prices_currency_check;

ALTER TABLE prices
  ALTER COLUMN currency TYPE currency_type
  USING CASE
    WHEN currency IS NULL THEN NULL
    WHEN upper(currency) = 'USD' THEN 'USD'::currency_type
    WHEN upper(currency) = 'XMR' THEN 'XMR'::currency_type
    WHEN upper(currency) = 'CAD' THEN 'CAD'::currency_type
    ELSE 'USD'::currency_type
  END;

-- 5. Migrate xmr_products into products table
INSERT INTO products (id, active, name, description, image, metadata, provider)
SELECT
  id::text,
  COALESCE(active, true),
  name,
  description,
  image,
  features AS metadata,
  'MONERO'::payment_provider
FROM xmr_products;

-- 6. Migrate xmr_prices into prices table
INSERT INTO prices (id, product_id, active, description, unit_amount, currency, type, interval, interval_count, trial_period_days, metadata)
SELECT
  p.id::text,
  p.product_id::text,
  COALESCE(p.active, true),
  p.description,
  p.amount_xmr,
  'XMR'::currency_type,
  'recurring'::pricing_type,
  p.interval::text::pricing_plan_interval,
  COALESCE(p.interval_count, 1),
  p.trial_period_days,
  p.metadata
FROM xmr_prices p;

-- 7. Migrate subscriptions: move xmr_price_id data to price_id
UPDATE subscriptions
SET price_id = xmr_price_id::text
WHERE xmr_price_id IS NOT NULL AND price_id IS NULL;

-- 8. Drop the xmr_price_id column from subscriptions
ALTER TABLE subscriptions
  DROP COLUMN IF EXISTS xmr_price_id;

-- 9. Update xmr_invoices: change foreign keys from UUID to text referencing unified tables
-- Drop old foreign key constraints
ALTER TABLE xmr_invoices
  DROP CONSTRAINT IF EXISTS xmr_invoices_product_id_fkey;
ALTER TABLE xmr_invoices
  DROP CONSTRAINT IF EXISTS xmr_invoices_price_id_fkey;

-- Change column types from UUID to text
ALTER TABLE xmr_invoices
  ALTER COLUMN product_id TYPE text USING product_id::text;
ALTER TABLE xmr_invoices
  ALTER COLUMN price_id TYPE text USING price_id::text;

-- Add new foreign key constraints referencing unified tables
ALTER TABLE xmr_invoices
  ADD CONSTRAINT xmr_invoices_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE xmr_invoices
  ADD CONSTRAINT xmr_invoices_price_id_fkey FOREIGN KEY (price_id) REFERENCES prices(id);

-- 10. Remove xmr_products and xmr_prices from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE xmr_products, xmr_prices;

-- 11. Drop old XMR tables (xmr_prices first due to FK dependency)
DROP TABLE IF EXISTS xmr_prices CASCADE;
DROP TABLE IF EXISTS xmr_products CASCADE;

-- 12. Drop the billing_interval enum (no longer needed)
DROP TYPE IF EXISTS billing_interval;
