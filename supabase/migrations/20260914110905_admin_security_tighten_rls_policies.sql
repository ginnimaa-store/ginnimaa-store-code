/*
# Admin Authentication & Security Tightening — Policies

Tightens RLS so:
- Customers (anon): READ active products, READ categories, READ orders/order_items (for confirmation page), INSERT orders/customers/order_items. No UPDATE/DELETE.
- Admin (authenticated): full CRUD on everything.
*/

-- ============ PRODUCTS ============
DROP POLICY IF EXISTS "anon_select_products" ON products;
DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;

CREATE POLICY "anon_select_active_products" ON products FOR SELECT
  TO anon, authenticated USING (active = true OR auth.role() = 'authenticated');

CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (true);

-- ============ CATEGORIES ============
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;

CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (true);

-- ============ ORDERS ============
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;

CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);

-- ============ CUSTOMERS ============
DROP POLICY IF EXISTS "anon_select_customers" ON customers;
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
DROP POLICY IF EXISTS "anon_delete_customers" ON customers;

CREATE POLICY "admin_select_customers" ON customers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_update_customers" ON customers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_customers" ON customers FOR DELETE
  TO authenticated USING (true);

-- ============ ORDER ITEMS ============
DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;

CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_update_order_items" ON order_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_order_items" ON order_items FOR DELETE
  TO authenticated USING (true);
