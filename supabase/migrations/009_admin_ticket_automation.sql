-- Ticket automation: order/product links + dedupe keys for auto-created tickets

ALTER TABLE admin_tickets
  ADD COLUMN linked_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  ADD COLUMN linked_product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN automation_key text;

CREATE INDEX idx_admin_tickets_linked_order
  ON admin_tickets(linked_order_id)
  WHERE linked_order_id IS NOT NULL;

CREATE INDEX idx_admin_tickets_linked_product
  ON admin_tickets(linked_product_id)
  WHERE linked_product_id IS NOT NULL;

CREATE INDEX idx_admin_tickets_automation_key
  ON admin_tickets(automation_key)
  WHERE automation_key IS NOT NULL;
