-- Development seed data — run after migrations
-- Usage: psql $DATABASE_URL -f supabase/seed.sql

INSERT INTO products (name, slug, description, features, images, category, original_price, sale_price, stock, featured, active, popular_score, created_at)
VALUES
  (
    '5-Head USB Rechargeable Hair Remover',
    '5-head-usb-hair-remover',
    'Ghar pe salon jaisa result — 5 heads, USB rechargeable, har skin type ke liye.',
    ARRAY['5 interchangeable heads included', 'USB rechargeable — no batteries', 'Gentle on sensitive skin', 'Compact travel pouch'],
    ARRAY['/products/hair-remover.svg', '/products/hair-remover.svg', '/products/hair-remover.svg'],
    'Personal Care',
    2499, NULL, 45, true, true, 98, '2026-06-20T10:00:00Z'
  ),
  (
    'Non-Stick Granite Coating Fry Pan',
    'granite-fry-pan',
    'Anday, parathay, sab kuch chipke baghair — granite coating, heat resistant handle.',
    ARRAY['Granite non-stick coating', 'Heat resistant handle', 'Induction compatible', 'Easy wash'],
    ARRAY['/products/fry-pan.svg', '/products/fry-pan.svg', '/products/fry-pan.svg'],
    'Kitchen',
    1899, 1499, 32, true, true, 87, '2026-06-18T10:00:00Z'
  ),
  (
    'Magic Cleaning Mop — Self Wringing',
    'magic-cleaning-mop',
    'Poore ghar ki safai aasaan — self wringing bucket ke sath, zyada mehnat nahi.',
    ARRAY['Self-wringing mechanism', 'Microfiber mop head', '360° swivel', 'Bucket included'],
    ARRAY['/products/mop.svg', '/products/mop.svg', '/products/mop.svg'],
    'Home',
    3299, NULL, 28, true, true, 92, '2026-06-15T10:00:00Z'
  ),
  (
    'Portable Mini Blender — USB',
    'portable-mini-blender',
    'Smoothies, lassi, baby food — chhota blender jo har jagah chalega.',
    ARRAY['USB rechargeable', '304 stainless blades', 'BPA-free cup', 'One-button operation'],
    ARRAY['/products/blender.svg', '/products/blender.svg', '/products/blender.svg'],
    'Kitchen',
    2199, NULL, 50, true, true, 76, '2026-06-22T10:00:00Z'
  ),
  (
    'Vacuum Storage Bags Set (6 pcs)',
    'vacuum-storage-bags',
    'Kapray aur razai compact — vacuum bags se jagah bachao, safai rakho.',
    ARRAY['6 bags assorted sizes', 'Double-zip seal', 'Reusable', 'Space saver'],
    ARRAY['/products/storage-bags.svg', '/products/storage-bags.svg', '/products/storage-bags.svg'],
    'Home',
    1599, NULL, 60, true, true, 65, '2026-06-10T10:00:00Z'
  ),
  (
    'LED Night Light — Motion Sensor',
    'led-motion-night-light',
    'Raat ko bathroom ya corridor mein auto light — bachon ke liye bhi safe.',
    ARRAY['Motion activated', 'Warm LED', 'USB powered', 'Adhesive mount'],
    ARRAY['/products/night-light.svg', '/products/night-light.svg', '/products/night-light.svg'],
    'Home',
    899, NULL, 80, false, true, 54, '2026-06-25T10:00:00Z'
  ),
  (
    'Silicone Kitchen Utensil Set (12 pcs)',
    'silicone-utensil-set',
    'Non-stick cookware safe — 12 pieces, heat resistant, easy wash.',
    ARRAY['12-piece set', 'Heat resistant to 230°C', 'Non-stick safe', 'Dishwasher safe'],
    ARRAY['/products/utensils.svg', '/products/utensils.svg', '/products/utensils.svg'],
    'Kitchen',
    1799, NULL, 40, false, true, 71, '2026-06-12T10:00:00Z'
  ),
  (
    'Facial Steamer — Nano Ionic',
    'facial-steamer',
    'Ghar pe facial spa — nano ionic steam se skin fresh aur clean.',
    ARRAY['Nano ionic steam', 'Auto shut-off', 'Compact design', 'Deep pore cleanse'],
    ARRAY['/products/steamer.svg', '/products/steamer.svg', '/products/steamer.svg'],
    'Personal Care',
    2799, NULL, 22, false, true, 83, '2026-06-08T10:00:00Z'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO sales (name, discount_type, discount_value, applies_to, display_coupon_code, start_date, end_date, active)
VALUES (
  'Eid Sale 🎉 — 20% Off Sab Products Pe!',
  'percentage',
  20,
  'all',
  'EID20',
  now(),
  now() + interval '7 days',
  true
)
ON CONFLICT DO NOTHING;

INSERT INTO coupons (code, discount_type, discount_value, min_order, usage_limit, per_user_limit, expiry_date, active)
VALUES (
  'EID20',
  'percentage',
  20,
  500,
  1000,
  1,
  now() + interval '30 days',
  true
)
ON CONFLICT (code) DO NOTHING;
