-- Admin panel speed: order date indexes + period stats RPC

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_status ON orders(created_at DESC, status);

CREATE OR REPLACE FUNCTION get_order_stats_for_period(
  p_start timestamptz,
  p_end timestamptz,
  p_created_by uuid DEFAULT NULL,
  p_manual_only boolean DEFAULT false
)
RETURNS TABLE(order_count bigint, order_revenue numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*)::bigint,
    COALESCE(SUM(total), 0)
  FROM orders
  WHERE created_at >= p_start
    AND created_at <= p_end
    AND status != 'returned'
    AND (p_created_by IS NULL OR created_by = p_created_by)
    AND (NOT p_manual_only OR source = 'manual');
$$;
