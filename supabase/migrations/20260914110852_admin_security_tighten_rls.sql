/*
# Admin Authentication & Security Tightening

## Overview
This migration secures the GINNIMAA database for a two-role model:
- **Customers** (anon key, no login): can read active products, read categories, and create orders + customers + order_items. They CANNOT modify or delete anything.
- **Admin** (authenticated user via Supabase Auth): full CRUD on products, categories, orders, customers, and order_items.

## Changes

### 1. Products RLS — tightened
- SELECT: anon can read only `active = true` rows; authenticated (admin) can read all.
- INSERT/UPDATE/DELETE: authenticated only (admin).
- The old anon INSERT/UPDATE/DELETE policies are dropped.

### 2. Categories RLS — tightened
- SELECT: anon + authenticated (categories are public, read-only for customers).
- INSERT/UPDATE/DELETE: authenticated only (admin).

### 3. Orders RLS — tightened
- SELECT: anon can read (customers need to see their order confirmation page by order ID); authenticated can read all.
- INSERT: anon + authenticated (customers place orders).
- UPDATE: authenticated only (admin changes status).
- DELETE: authenticated only (admin).

### 4. Customers RLS — tightened
- SELECT: authenticated only (admin can view customer details).
- INSERT: anon + authenticated (customers submit their details at checkout).
- UPDATE/DELETE: authenticated only (admin).

### 5. Order Items RLS — tightened
- SELECT: anon can read (needed for order confirmation page); authenticated can read all.
- INSERT: anon + authenticated (customers place orders).
- UPDATE/DELETE: authenticated only (admin).

### 6. Storage bucket
- Creates a `product-images` storage bucket (public read, authenticated write).
- Policy: anon can SELECT (read) files in `product-images`.
- Policy: authenticated can INSERT/UPDATE/DELETE files in `product-images`.

## Security Notes
1. Customers (anon) can now only READ active products and categories, and CREATE orders/customers/order_items. They cannot modify or delete any data.
2. Only authenticated users (admins) can manage products, change order statuses, view customer details, and upload images.
3. The `active` column on products acts as a soft-delete / visibility toggle controlled by admin only.
*/
