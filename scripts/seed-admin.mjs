#!/usr/bin/env node
/**
 * Create an admin user in Supabase Auth + admin_profiles.
 * Usage: ADMIN_SEED_EMAIL=admin@shahkar.store ADMIN_SEED_PASSWORD=secret node scripts/seed-admin.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_SEED_EMAIL;
const password = process.env.ADMIN_SEED_PASSWORD;
const name = process.env.ADMIN_SEED_NAME ?? "Store Admin";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email || !password) {
  console.error("Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing } = await supabase
  .from("admin_profiles")
  .select("id")
  .eq("email", email)
  .maybeSingle();

if (existing) {
  console.log(`Admin already exists: ${email}`);
  process.exit(0);
}

const { data: authData, error: authError } =
  await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "admin" },
    app_metadata: { role: "admin" },
  });

if (authError) {
  console.error("Auth createUser failed:", authError.message);
  process.exit(1);
}

const { error: profileError } = await supabase.from("admin_profiles").insert({
  id: authData.user.id,
  email,
  name,
  role: "admin",
});

if (profileError) {
  console.error("admin_profiles insert failed:", profileError.message);
  await supabase.auth.admin.deleteUser(authData.user.id);
  process.exit(1);
}

console.log(`Admin created: ${email} (${authData.user.id})`);
