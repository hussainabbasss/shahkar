-- Module 03 — Admin auth (Supabase Auth) + storage

-- Admin profiles linked to auth.users (create user in Supabase Auth first)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'admin' CHECK (role = 'admin'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_profiles_select_own ON admin_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Product images storage bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY product_images_public_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY product_images_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY product_images_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );

CREATE POLICY product_images_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid())
  );
