/*
# GINNIMAA E-Commerce Schema

1. New Tables
- `categories`: Product categories (Whole Spices, Spice Powders, Grocery, Pickles, Papad, Daler Bori)
  - `id` (uuid, primary key)
  - `name` (text, unique, not null)
  - `slug` (text, unique, not null)
  - `description` (text)
  - `image_url` (text)
  - `display_order` (int, default 0)
  - `created_at` (timestamptz)

- `products`: Individual products
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `description` (text)
  - `short_description` (text)
  - `category_id` (uuid, FK to categories)
  - `image_url` (text)
  - `mrp` (numeric, not null)
  - `selling_price` (numeric, not null)
  - `pack_size` (text, e.g. "200g", "500g")
  - `is_featured` (boolean, default false)
  - `is_best_seller` (boolean, default false)
  - `is_on_offer` (boolean, default false)
  - `stock` (int, default 100)
  - `created_at` (timestamptz)

- `orders`: Customer orders
  - `id` (uuid, primary key)
  - `order_number` (text, unique, not null)
  - `customer_name` (text, not null)
  - `mobile_number` (text, not null)
  - `address` (text, not null)
  - `pin_code` (text, not null)
  - `subtotal` (numeric, not null)
  - `delivery_charge` (numeric, not null)
  - `total` (numeric, not null)
  - `status` (text, default 'Placed')
  - `items_json` (jsonb, not null) — snapshot of ordered items
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all tables.
- Single-tenant app (no sign-in): allow anon + authenticated full CRUD on all tables.
- All data is intentionally public/shared for this e-commerce storefront.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  short_description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  mrp numeric(10,2) NOT NULL,
  selling_price numeric(10,2) NOT NULL,
  pack_size text,
  is_featured boolean DEFAULT false,
  is_best_seller boolean DEFAULT false,
  is_on_offer boolean DEFAULT false,
  stock int DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  mobile_number text NOT NULL,
  address text NOT NULL,
  pin_code text NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  delivery_charge numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'Placed',
  items_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products(is_best_seller);
CREATE INDEX IF NOT EXISTS idx_products_on_offer ON products(is_on_offer);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
