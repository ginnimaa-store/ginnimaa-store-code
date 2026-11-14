/*
# Add GPS columns to customers table + delivery partner RLS

## Summary
1. Adds `latitude` and `longitude` numeric columns to the `customers` table
   so customer GPS location can be saved from the profile/checkout.
2. Adds UPDATE policy on `customers` for authenticated users to update their
   own customer record (by matching mobile from auth metadata).
3. Adds SELECT/UPDATE policies on `orders` for delivery partners (via
   `is_delivery_partner()` helper) so they can view and update delivery_status
   on orders assigned to them.
4. Adds SELECT policy on `delivery_partners` for delivery partners to see
   their own profile.

## Changes
- customers: + latitude (numeric, nullable), + longitude (numeric, nullable)
- RLS: customers UPDATE for authenticated (match by mobile)
- RLS: orders SELECT/UPDATE for delivery_partner role
- RLS: delivery_partners SELECT for delivery_partner role
*/

-- Add GPS columns to customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- Allow authenticated users to update their own customer record (by mobile)
DROP POLICY IF EXISTS "update_own_customer" ON customers;
CREATE POLICY "update_own_customer" ON customers
  FOR UPDATE TO authenticated
  USING (mobile = (auth.jwt() -> 'user_metadata' ->> 'mobile'))
  WITH CHECK (mobile = (auth.jwt() -> 'user_metadata' ->> 'mobile'));

-- Delivery partners can view orders assigned to them
DROP POLICY IF EXISTS "delivery_partner_view_assigned_orders" ON orders;
CREATE POLICY "delivery_partner_view_assigned_orders" ON orders
  FOR SELECT TO authenticated
  USING (
    is_delivery_partner() AND delivery_partner_id IS NOT NULL
    AND delivery_partner_id = (
      SELECT id FROM delivery_partners WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Delivery partners can update delivery_status on their assigned orders
DROP POLICY IF EXISTS "delivery_partner_update_assigned_orders" ON orders;
CREATE POLICY "delivery_partner_update_assigned_orders" ON orders
  FOR UPDATE TO authenticated
  USING (
    is_delivery_partner() AND delivery_partner_id IS NOT NULL
    AND delivery_partner_id = (
      SELECT id FROM delivery_partners WHERE user_id = auth.uid() LIMIT 1
    )
  )
  WITH CHECK (
    is_delivery_partner() AND delivery_partner_id IS NOT NULL
    AND delivery_partner_id = (
      SELECT id FROM delivery_partners WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Delivery partners can view their own profile
DROP POLICY IF EXISTS "delivery_partner_view_own_profile" ON delivery_partners;
CREATE POLICY "delivery_partner_view_own_profile" ON delivery_partners
  FOR SELECT TO authenticated
  USING (is_delivery_partner() AND user_id = auth.uid());

-- Delivery partners can view order_items for orders assigned to them
DROP POLICY IF EXISTS "delivery_partner_view_assigned_order_items" ON order_items;
CREATE POLICY "delivery_partner_view_assigned_order_items" ON order_items
  FOR SELECT TO authenticated
  USING (
    is_delivery_partner() AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND o.delivery_partner_id = (
        SELECT id FROM delivery_partners WHERE user_id = auth.uid() LIMIT 1
      )
    )
  );

-- Grant necessary privileges
GRANT UPDATE ON customers TO authenticated;
GRANT SELECT, UPDATE ON orders TO authenticated;
GRANT SELECT ON delivery_partners TO authenticated;
GRANT SELECT ON order_items TO authenticated;
