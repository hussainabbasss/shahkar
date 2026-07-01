-- Ticket comments thread

CREATE TABLE admin_ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES admin_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (char_length(trim(body)) >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_ticket_comments_ticket ON admin_ticket_comments(ticket_id, created_at);

ALTER TABLE admin_ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_ticket_comments_select ON admin_ticket_comments
  FOR SELECT TO authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE admin_ticket_comments;
