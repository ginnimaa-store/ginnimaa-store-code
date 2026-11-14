/*
# Fix customer auth: add email column, relax NOT NULL constraints, reset admin password

## Summary
1. Adds `email` column to `customers` table (the signup code upserts email but the column didn't exist).
2. Relaxes `address` and `pin_code` from NOT NULL to nullable, since customers create their profile
   at signup (before they have an address) and fill in address/PIN at checkout or profile edit.
3. Resets the admin user password to `admin123` so the admin can log in.

## Changes
- customers: + email (text, nullable)
- customers: address → nullable
- customers: pin_code → nullable
- auth.users: admin@ginnimaa.com password reset to admin123
*/

-- Add email column to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email text;

-- Relax NOT NULL on address and pin_code (filled at checkout or profile edit)
ALTER TABLE customers ALTER COLUMN address DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN pin_code DROP NOT NULL;

-- Reset admin password to admin123 using bcrypt
UPDATE auth.users
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@ginnimaa.com';
