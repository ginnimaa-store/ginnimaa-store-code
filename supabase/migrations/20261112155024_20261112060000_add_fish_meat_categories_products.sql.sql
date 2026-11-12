/*
# Add Fresh Fish & Meat Categories with Products

## Summary
GINNIMAA is a Bengali fish and meat home-delivery service. The database currently
only contains spice/grocery categories — no fish or meat. This migration adds the
core food categories (Fresh Water Fish, Sea Fish, Chicken, Mutton, Eggs) and a
full catalog of products under each, with real images, Bengali names, weights,
prices, and flags for featured / best-seller / offer.

## New Categories (5)
1. **Fresh Water Fish** (slug: `fish`) — Rohu, Katla, Hilsa, Pangasius, Telapia, Live Lata
2. **Sea Fish** (slug: `sea-fish`) — Rupchanda, Pomfret, Loitta, Mackerel
3. **Chicken** (slug: `chicken`) — Whole chicken, Chicken curry cut, Boneless, Liver, Egg
4. **Mutton** (slug: `mutton`) — Khashi mutton, Curry cut, Liver, Keema
5. **Eggs** (slug: `eggs`) — Farm brown eggs, Desi eggs

All categories use display_order 1–5 (existing categories bumped to 6+).

## New Products (18)
Each product includes: name, Bengali short description, image, MRP, selling price,
net_weight, weight_unit, stock, active, and flags.

## Security
- No RLS changes — categories and products already have public read policies.
- No new tables — only INSERT into existing `categories` and `products` tables.
*/

-- Bump existing categories display_order so fish/meat appear first
UPDATE categories SET display_order = display_order + 10 WHERE slug NOT IN ('fish', 'sea-fish', 'chicken', 'mutton', 'eggs');

-- Insert fish & meat categories
INSERT INTO categories (name, slug, description, image_url, display_order)
VALUES
  ('Fresh Water Fish', 'fish', 'সকালের তাজা মিঠা জলের মাছ — রুই, কাতলা, ইলিশ, পাঙ্গাস', 'https://images.pexels.com/photos/23885137/pexels-photo-23885137.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 1),
  ('Sea Fish', 'sea-fish', 'বঙ্গোপসাগরের তাজা সামুদ্রিক মাছ — রূপচাঁদা, পমফ্রেট, লইট্যা', 'https://images.pexels.com/photos/229789/pexels-photo-229789.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 2),
  ('Chicken', 'chicken', 'ফার্ম ফ্রেশ ও দেশি মুরগি — জ্যান্ত কাটা, কারি কাট, বোনলেস', 'https://images.pexels.com/photos/13524831/pexels-photo-13524831.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 3),
  ('Mutton', 'mutton', 'কচি খাসির মাংস — হালাল কাটা, কারি কাট, টুকরো', 'https://images.pexels.com/photos/26244103/pexels-photo-26244103.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 4),
  ('Eggs', 'eggs', 'ফার্ম ও দেশি ডিম — তাজা ব্রাউন এবং সাদা ডিম', 'https://images.pexels.com/photos/38341850/pexels-photo-38341850.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 5)
ON CONFLICT (slug) DO NOTHING;

-- Products for Fresh Water Fish (slug: fish)
INSERT INTO products (name, short_description, category_id, image_url, mrp, selling_price, net_weight, weight_unit, stock, active, is_featured, is_best_seller, is_on_offer, unit_options, cut_options)
VALUES
  ('Rohu Fish (রুই মাছ)', 'মিঠা জলের তাজা রুই মাছ, সকালে কাটা',
    (SELECT id FROM categories WHERE slug = 'fish'),
    'https://images.pexels.com/photos/32262909/pexels-photo-32262909.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    380, 340, 1, 'kg', 50, true, true, true, true,
    '["500gm","1kg","2kg"]'::jsonb,
    '["Whole","Pieces","Steak"]'::jsonb),
  ('Katla Fish (কাতলা মাছ)', 'বড় কাতলা মাছ, তাজা ও জ্যান্ত',
    (SELECT id FROM categories WHERE slug = 'fish'),
    'https://images.pexels.com/photos/32262903/pexels-photo-32262903.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    360, 320, 1, 'kg', 40, true, true, false, false,
    '["500gm","1kg","2kg"]'::jsonb,
    '["Whole","Pieces","Steak"]'::jsonb),
  ('Hilsa Fish (ইলিশ মাছ)', 'পদ্মার রূপালি ইলিশ, এই মরসুমের সেরা',
    (SELECT id FROM categories WHERE slug = 'fish'),
    'https://images.pexels.com/photos/18403279/pexels-photo-18403279.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    1600, 1450, 1, 'kg', 25, true, true, true, false,
    '["500gm","1kg","1.5kg"]'::jsonb,
    '["Whole","Steak"]'::jsonb),
  ('Pangasius Fish (পাঙ্গাস মাছ)', 'ফার্ম পাঙ্গাস, কম কাঁটাযুক্ত',
    (SELECT id FROM categories WHERE slug = 'fish'),
    'https://images.pexels.com/photos/14062104/pexels-photo-14062104.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    180, 150, 1, 'kg', 60, true, false, false, true,
    '["500gm","1kg"]'::jsonb,
    '["Fillet","Pieces"]'::jsonb),
  ('Tilapia Fish (তেলাপিয়া মাছ)', 'তাজা তেলাপিয়া, কম কাঁটা',
    (SELECT id FROM categories WHERE slug = 'fish'),
    'https://images.pexels.com/photos/8352786/pexels-photo-8352786.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    220, 190, 1, 'kg', 35, true, false, true, false,
    '["500gm","1kg"]'::jsonb,
    '["Whole","Pieces"]'::jsonb),
  ('Prawn / Chingri (চিংড়ি)', 'তাজা জ্যান্ত চিংড়ি, বড় সাইজ',
    (SELECT id FROM categories WHERE slug = 'fish'),
    'https://images.pexels.com/photos/5273798/pexels-photo-5273798.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    550, 480, 1, 'kg', 20, true, true, true, false,
    '["250gm","500gm","1kg"]'::jsonb,
    '["Whole","Peeled"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Products for Sea Fish (slug: sea-fish)
INSERT INTO products (name, short_description, category_id, image_url, mrp, selling_price, net_weight, weight_unit, stock, active, is_featured, is_best_seller, is_on_offer, unit_options, cut_options)
VALUES
  ('Pomfret / Rupchanda (রূপচাঁদা)', 'সাদা রূপচাঁদা, সামুদ্রিক তাজা',
    (SELECT id FROM categories WHERE slug = 'sea-fish'),
    'https://images.pexels.com/photos/8557000/pexels-photo-8557000.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    700, 620, 1, 'kg', 18, true, true, false, false,
    '["500gm","1kg"]'::jsonb,
    '["Whole","Steak"]'::jsonb),
  ('Mackerel / Bhangui (ভাঙ্গুই)', 'তাজা ভাঙ্গুই মাছ, সামুদ্রিক',
    (SELECT id FROM categories WHERE slug = 'sea-fish'),
    'https://images.pexels.com/photos/5191507/pexels-photo-5191507.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    300, 260, 1, 'kg', 30, true, false, true, false,
    '["500gm","1kg"]'::jsonb,
    '["Whole","Steak"]'::jsonb),
  ('Loitta / Lizard Fish (লইট্যা)', 'শুঁটকি তাজা লইট্যা মাছ',
    (SELECT id FROM categories WHERE slug = 'sea-fish'),
    'https://images.pexels.com/photos/18072772/pexels-photo-18072772.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    180, 150, 1, 'kg', 40, true, false, false, false,
    '["500gm","1kg"]'::jsonb,
    '["Whole"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Products for Chicken (slug: chicken)
INSERT INTO products (name, short_description, category_id, image_url, mrp, selling_price, net_weight, weight_unit, stock, active, is_featured, is_best_seller, is_on_offer, unit_options, cut_options)
VALUES
  ('Whole Chicken (গোটা মুরগি)', 'ফার্ম ফ্রেশ জ্যান্ত মুরগি, হালাল কাটা',
    (SELECT id FROM categories WHERE slug = 'chicken'),
    'https://images.pexels.com/photos/13524831/pexels-photo-13524831.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    240, 210, 1, 'kg', 80, true, true, true, true,
    '["500gm","1kg","2kg"]'::jsonb,
    '["Whole","Curry Cut","Boneless"]'::jsonb),
  ('Chicken Curry Cut (কারি কাট)', 'পরিষ্কার কারি কাট মুরগির মাংস',
    (SELECT id FROM categories WHERE slug = 'chicken'),
    'https://images.pexels.com/photos/8251004/pexels-photo-8251004.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    250, 220, 1, 'kg', 60, true, true, false, false,
    '["500gm","1kg"]'::jsonb,
    '["Curry Cut","Boneless"]'::jsonb),
  ('Chicken Boneless (বোনলেস)', 'হাড় ছাড়া মুরগির মাংস, পরিষ্কার',
    (SELECT id FROM categories WHERE slug = 'chicken'),
    'https://images.pexels.com/photos/36713607/pexels-photo-36713607.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    320, 280, 1, 'kg', 40, true, false, true, false,
    '["500gm","1kg"]'::jsonb,
    '["Boneless","Dices"]'::jsonb),
  ('Chicken Liver (মুরগির কলিজা)', 'তাজা মুরগির কলিজা, পরিষ্কার',
    (SELECT id FROM categories WHERE slug = 'chicken'),
    'https://images.pexels.com/photos/35886032/pexels-photo-35886032.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    180, 150, 1, 'kg', 25, true, false, false, false,
    '["250gm","500gm"]'::jsonb,
    '["Whole"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Products for Mutton (slug: mutton)
INSERT INTO products (name, short_description, category_id, image_url, mrp, selling_price, net_weight, weight_unit, stock, active, is_featured, is_best_seller, is_on_offer, unit_options, cut_options)
VALUES
  ('Khashi Mutton (খাসির মাংস)', 'কচি খাসির মাংস, হালাল কাটা',
    (SELECT id FROM categories WHERE slug = 'mutton'),
    'https://images.pexels.com/photos/26244103/pexels-photo-26244103.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    850, 780, 1, 'kg', 30, true, true, true, false,
    '["500gm","1kg","2kg"]'::jsonb,
    '["Curry Cut","Bones","Keema"]'::jsonb),
  ('Mutton Keema (খাসির কিমা)', 'পরিষ্কার কিমা করা খাসির মাংস',
    (SELECT id FROM categories WHERE slug = 'mutton'),
    'https://images.pexels.com/photos/28674568/pexels-photo-28674568.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    880, 820, 1, 'kg', 15, true, false, true, false,
    '["500gm","1kg"]'::jsonb,
    '["Keema"]'::jsonb),
  ('Mutton Liver (খাসির কলিজা)', 'তাজা খাসির কলিজা',
    (SELECT id FROM categories WHERE slug = 'mutton'),
    'https://images.pexels.com/photos/11538135/pexels-photo-11538135.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    450, 400, 1, 'kg', 12, true, false, false, false,
    '["250gm","500gm"]'::jsonb,
    '["Whole"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Products for Eggs (slug: eggs)
INSERT INTO products (name, short_description, category_id, image_url, mrp, selling_price, net_weight, weight_unit, stock, active, is_featured, is_best_seller, is_on_offer, unit_options, cut_options)
VALUES
  ('Farm Brown Eggs (ফার্ম ডিম)', 'তাজা ব্রাউন ফার্ম ডিম, ১২ পিস',
    (SELECT id FROM categories WHERE slug = 'eggs'),
    'https://images.pexels.com/photos/38341850/pexels-photo-38341850.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    96, 84, 12, 'piece', 100, true, true, true, true,
    '["6 pcs","12 pcs","30 pcs"]'::jsonb,
    '[]'::jsonb),
  ('Desi Eggs (দেশি ডিম)', 'গ্রামের দেশি মুরগির ডিম, ৬ পিস',
    (SELECT id FROM categories WHERE slug = 'eggs'),
    'https://images.pexels.com/photos/6843685/pexels-photo-6843685.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    90, 78, 6, 'piece', 50, true, false, true, false,
    '["6 pcs","12 pcs"]'::jsonb,
    '[]'::jsonb)
ON CONFLICT DO NOTHING;
