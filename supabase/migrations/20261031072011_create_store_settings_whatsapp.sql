/*
# Store settings table with WhatsApp order number

1. New Tables
- `store_settings`
  - `key` (text, primary key): setting name, e.g. 'whatsapp_number'
  - `value` (text, not null, default ''): setting value
  - `updated_at` (timestamptz, default now()): last change time

2. Security
- Enable RLS on `store_settings`.
- Grant SELECT to `anon` and `authenticated` so the order confirmation page can read the WhatsApp number.
- Grant INSERT and UPDATE to `authenticated` only, so only signed-in admins can change settings.
- No DELETE access is granted.

3. Important Notes
- The WhatsApp number is shown to customers on the order confirmation page, so it is not treated as sensitive.
- Upserts from the admin settings screen require both the INSERT and UPDATE policies.
*/

CREATE TABLE IF NOT EXISTS store_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON store_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON store_settings TO authenticated;

DROP POLICY IF EXISTS "public_select_store_settings" ON store_settings;
CREATE POLICY "public_select_store_settings" ON store_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_store_settings" ON store_settings;
CREATE POLICY "admin_insert_store_settings" ON store_settings
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_store_settings" ON store_settings;
CREATE POLICY "admin_update_store_settings" ON store_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);