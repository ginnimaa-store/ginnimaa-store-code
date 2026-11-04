/*
# Phase 1+2: Security Tightening + Delivery Schema (re-apply)

This migration secures customer data and adds delivery infrastructure.
See summary in the prior attempt. This version creates delivery_partners BEFORE referencing it.
*/

-- ============================================================
-- HELPER FUNCTIONS for role checks
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_delivery_partner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'delivery_partner',
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_delivery_partner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_delivery_partner() TO authenticated;

-- ============================================================
-- CREATE delivery_partners TABLE (before referencing it)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  vehicle_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.delivery_partners TO authenticated;

DROP POLICY IF EXISTS "dp_select_own_or_admin" ON public.delivery_partners;
CREATE POLICY "dp_select_own_or_admin" ON public.delivery_partners
  FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "dp_insert_admin_only" ON public.delivery_partners;
CREATE POLICY "dp_insert_admin_only" ON public.delivery_partners
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "dp_update_admin_only" ON public.delivery_partners;
CREATE POLICY "dp_update_admin_only" ON public.delivery_partners
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "dp_delete_admin_only" ON public.delivery_partners;
CREATE POLICY "dp_delete_admin_only" ON public.delivery_partners
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================
-- CREATE serviceable_pincodes TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.serviceable_pincodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_code text NOT NULL UNIQUE,
  area_name text NOT NULL,
  delivery_charge numeric NOT NULL DEFAULT 40,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.serviceable_pincodes ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.serviceable_pincodes TO anon, authenticated;

DROP POLICY IF EXISTS "pin_select_public" ON public.serviceable_pincodes;
CREATE POLICY "pin_select_public" ON public.serviceable_pincodes
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

GRANT INSERT, UPDATE, DELETE ON public.serviceable_pincodes TO authenticated;

DROP POLICY IF EXISTS "pin_insert_admin" ON public.serviceable_pincodes;
CREATE POLICY "pin_insert_admin" ON public.serviceable_pincodes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pin_update_admin" ON public.serviceable_pincodes;
CREATE POLICY "pin_update_admin" ON public.serviceable_pincodes
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pin_delete_admin" ON public.serviceable_pincodes;
CREATE POLICY "pin_delete_admin" ON public.serviceable_pincodes
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================
-- ADD NEW COLUMNS TO orders (idempotent)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='customer_lat') THEN
    ALTER TABLE public.orders ADD COLUMN customer_lat numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='customer_lng') THEN
    ALTER TABLE public.orders ADD COLUMN customer_lng numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='delivery_partner_id') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_partner_id uuid REFERENCES public.delivery_partners(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='delivery_status') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_status text NOT NULL DEFAULT 'PENDING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='delivery_otp') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_otp text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='payment_status') THEN
    ALTER TABLE public.orders ADD COLUMN payment_status text NOT NULL DEFAULT 'PENDING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='payment_ref_id') THEN
    ALTER TABLE public.orders ADD COLUMN payment_ref_id text;
  END IF;
END $$;

-- ============================================================
-- ADD NEW COLUMNS TO order_items (idempotent)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='cut_preference') THEN
    ALTER TABLE public.order_items ADD COLUMN cut_preference text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='weight_option') THEN
    ALTER TABLE public.order_items ADD COLUMN weight_option text;
  END IF;
END $$;

-- ============================================================
-- ADD NEW COLUMNS TO products (idempotent)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='net_weight') THEN
    ALTER TABLE public.products ADD COLUMN net_weight numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='weight_unit') THEN
    ALTER TABLE public.products ADD COLUMN weight_unit text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='unit_options') THEN
    ALTER TABLE public.products ADD COLUMN unit_options jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='cut_options') THEN
    ALTER TABLE public.products ADD COLUMN cut_options jsonb;
  END IF;
END $$;

-- ============================================================
-- TIGHTEN RLS ON orders TABLE
-- ============================================================

DROP POLICY IF EXISTS "anon_select_orders" ON public.orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "admin_update_orders" ON public.orders;
DROP POLICY IF EXISTS "admin_delete_orders" ON public.orders;

DROP POLICY IF EXISTS "anon_insert_orders_new" ON public.orders;
CREATE POLICY "anon_insert_orders_new" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_orders" ON public.orders;
CREATE POLICY "auth_select_orders" ON public.orders
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_update_orders_new" ON public.orders;
CREATE POLICY "admin_update_orders_new" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_delivery_partner())
  WITH CHECK (public.is_admin() OR public.is_delivery_partner());

DROP POLICY IF EXISTS "admin_delete_orders_new" ON public.orders;
CREATE POLICY "admin_delete_orders_new" ON public.orders
  FOR DELETE TO authenticated
  USING (public.is_admin());

REVOKE SELECT, UPDATE, DELETE ON public.orders FROM anon;
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;

-- ============================================================
-- TIGHTEN RLS ON order_items TABLE
-- ============================================================

DROP POLICY IF EXISTS "anon_select_order_items" ON public.order_items;
DROP POLICY IF EXISTS "anon_insert_order_items" ON public.order_items;
DROP POLICY IF EXISTS "admin_update_order_items" ON public.order_items;
DROP POLICY IF EXISTS "admin_delete_order_items" ON public.order_items;

DROP POLICY IF EXISTS "anon_insert_order_items_new" ON public.order_items;
CREATE POLICY "anon_insert_order_items_new" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_order_items" ON public.order_items;
CREATE POLICY "auth_select_order_items" ON public.order_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_update_order_items_new" ON public.order_items;
CREATE POLICY "admin_update_order_items_new" ON public.order_items
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_order_items_new" ON public.order_items;
CREATE POLICY "admin_delete_order_items_new" ON public.order_items
  FOR DELETE TO authenticated
  USING (public.is_admin());

REVOKE SELECT, UPDATE, DELETE ON public.order_items FROM anon;
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

-- ============================================================
-- CUSTOMERS TABLE — ensure SELECT is authenticated only
-- ============================================================

DROP POLICY IF EXISTS "admin_select_customers" ON public.customers;
CREATE POLICY "admin_select_customers" ON public.customers
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- SEED initial serviceable PIN codes
-- ============================================================

INSERT INTO public.serviceable_pincodes (pin_code, area_name, delivery_charge, is_active) VALUES
  ('700124', 'Barasat', 40, true),
  ('700126', 'Madhyamgram', 40, true),
  ('700120', 'Barrackpore', 40, true),
  ('700110', 'Sodepur', 40, true),
  ('700051', 'Birati', 40, true)
ON CONFLICT (pin_code) DO NOTHING;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON public.orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_serviceable_pincodes_pin_code ON public.serviceable_pincodes(pin_code);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_user_id ON public.delivery_partners(user_id);
