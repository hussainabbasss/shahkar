-- Module 07: Admin Tickets (Epics, Stories, Tasks, Board)

CREATE SEQUENCE admin_ticket_number_seq START 1001;

CREATE TABLE admin_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number integer NOT NULL UNIQUE DEFAULT nextval('admin_ticket_number_seq'),
  issue_type text NOT NULL CHECK (issue_type IN ('epic', 'story', 'task', 'subtask')),
  department text NOT NULL CHECK (department IN ('development', 'sales', 'marketing')),
  parent_id uuid REFERENCES admin_tickets(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(trim(title)) >= 2),
  description text,
  status text NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog', 'todo', 'in_progress', 'done', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid REFERENCES admin_profiles(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE RESTRICT,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT admin_tickets_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX idx_admin_tickets_status ON admin_tickets(status);
CREATE INDEX idx_admin_tickets_assignee ON admin_tickets(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_admin_tickets_parent ON admin_tickets(parent_id);
CREATE INDEX idx_admin_tickets_department ON admin_tickets(department);
CREATE INDEX idx_admin_tickets_issue_type ON admin_tickets(issue_type);
CREATE INDEX idx_admin_tickets_updated ON admin_tickets(updated_at DESC);

CREATE TABLE admin_ticket_assignee_reads (
  ticket_id uuid NOT NULL REFERENCES admin_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  last_notified_at timestamptz,
  last_viewed_at timestamptz,
  PRIMARY KEY (ticket_id, user_id)
);

ALTER TABLE admin_message_entities
  DROP CONSTRAINT IF EXISTS admin_message_entities_entity_type_check;

ALTER TABLE admin_message_entities
  ADD CONSTRAINT admin_message_entities_entity_type_check
  CHECK (entity_type IN ('product', 'order', 'ticket'));

ALTER PUBLICATION supabase_realtime ADD TABLE admin_tickets;

-- RLS (service role from server actions; client reads via realtime)
ALTER TABLE admin_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ticket_assignee_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_tickets_select ON admin_tickets
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY admin_ticket_reads_select ON admin_ticket_assignee_reads
  FOR SELECT TO authenticated
  USING (true);
