/*
# Normalize Orders: Add Customers and Order Items Tables

## Overview
This migration restructures the order system to use proper normalized tables:
- Creates a `customers` table to store customer delivery details.
- Creates an `order_items` table to store individual line items per order (replacing the `items_json` JSONB column on orders).
- Adds an `active` boolean column to the `products` table so products can be hidden without deletion.
- Adds a `payment_method` column to the `orders` table.
- Adds a `customer_id` foreign key to the `orders` table linking to `customers`.
- Adds an `order_number` column if not already present (it is, from the original migration).

## New Tables

### customers
- `id` (uuid, primary key)
- `name` (text, not null) — customer's full name
- `mobile` (text, not null) — 10-digit mobile number
- `address` (text, not null) — full delivery address
- `pin_code` (text, not null) — 6-digit PIN code
- `created_at` (timestamptz, default now())

### order_items
- `id` (uuid, primary key)
- `order_id` (uuid, FK to orders, ON DELETE CASCADE)
- `product_id` (uuid, FK to products, ON DELETE SET NULL)
- `quantity` (int, not null)
- `price` (numeric, not null) — selling price at time of order
- `created_at` (timestamptz, default now())

## Modified Tables

### products
- Added `active` boolean column (default true) — when false, product is hidden from storefront.

### orders
- Added `customer_id` uuid column (FK to customers, ON DELETE SET NULL).
- Added `payment_method` text column (default 'Cash on Delivery').
- The existing `items_json` column is retained for backward compatibility with old orders but new orders will use `order_items` rows.

## Security
- RLS enabled on `customers` and `order_items` with full anon+authenticated CRUD (single-tenant no-auth app).
- Existing RLS on `products` and `orders` already allows anon CRUD; new columns inherit those policies automatically.

## Notes
1. The `items_json` column on orders is NOT dropped — existing orders that used it remain readable. New orders will write to `order_items` instead.
2. `order_items.product_id` uses ON DELETE SET NULL so deleting a product does not lose order history (the line item remains with its price snapshot).
3. `orders.customer_id` uses ON DELETE SET NULL to preserve order records even if a customer is deleted.
*/

-- 1. Add active column to products
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'active') THEN
    ALTER TABLE products ADD COLUMN active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- 2. Add payment_method and customer_id to orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
    ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'Cash on Delivery';
  END IF;
END $$;

-- 3. Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text NOT NULL,
  address text NOT NULL,
  pin_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE
  TO anon, authenticated USING (true);

-- 4. Add customer_id FK to orders (after customers table exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
    ALTER TABLE orders ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity int NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE
  TO anon, authenticated USING (true);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
