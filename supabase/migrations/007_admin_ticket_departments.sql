-- Configurable ticket departments (replaces hardcoded CHECK on admin_tickets.department)

CREATE TABLE admin_ticket_departments (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (char_length(trim(name)) >= 2),
  bg_color text NOT NULL DEFAULT '#F3F4F6',
  text_color text NOT NULL DEFAULT '#374151',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO admin_ticket_departments (slug, name, bg_color, text_color, sort_order) VALUES
  ('development', 'Development', '#E8F5EE', '#1B6B3A', 1),
  ('sales', 'Sales', '#FFF8ED', '#D4820A', 2),
  ('marketing', 'Marketing', '#EFF6FF', '#2563EB', 3);

ALTER TABLE admin_tickets
  DROP CONSTRAINT IF EXISTS admin_tickets_department_check;

ALTER TABLE admin_tickets
  ADD CONSTRAINT admin_tickets_department_fkey
  FOREIGN KEY (department) REFERENCES admin_ticket_departments(slug);

ALTER TABLE admin_ticket_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_ticket_departments_select ON admin_ticket_departments
  FOR SELECT TO authenticated
  USING (true);
