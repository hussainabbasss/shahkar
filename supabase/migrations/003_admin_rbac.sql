-- Module 04: RBAC, order attribution, commission

ALTER TABLE admin_profiles
  DROP CONSTRAINT IF EXISTS admin_profiles_role_check;

ALTER TABLE admin_profiles
  ALTER COLUMN role SET DEFAULT 'sales';

ALTER TABLE admin_profiles
  ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('admin', 'manager', 'sales', 'custom'));

ALTER TABLE admin_profiles
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS commission_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_config jsonb NOT NULL DEFAULT '{
    "reset_period": "monthly",
    "timezone": "Asia/Karachi",
    "tiers": [
      { "from_order": 1, "to_order": 14, "rate": 50 },
      { "from_order": 15, "to_order": null, "rate": 100 }
    ]
  }',
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'storefront'
    CHECK (source IN ('storefront', 'manual')),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES admin_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);

CREATE TABLE IF NOT EXISTS commission_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  period_month date NOT NULL,
  period_order_number integer NOT NULL,
  tier_from_order integer NOT NULL,
  tier_to_order integer,
  tier_rate numeric NOT NULL,
  delivered_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_commission_entries_user_period
  ON commission_entries(user_id, period_month);
