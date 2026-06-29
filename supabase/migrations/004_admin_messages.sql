-- Module 05: Admin internal messaging (DMs, groups, attachments, shared entities)

CREATE TABLE admin_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('dm', 'group')),
  name text,
  created_by uuid REFERENCES admin_profiles(id) ON DELETE SET NULL,
  participant_low uuid REFERENCES admin_profiles(id) ON DELETE CASCADE,
  participant_high uuid REFERENCES admin_profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT admin_conversations_dm_pair_unique
    UNIQUE (participant_low, participant_high),
  CONSTRAINT admin_conversations_dm_pair_check CHECK (
    (type = 'dm' AND participant_low IS NOT NULL AND participant_high IS NOT NULL
     AND participant_low < participant_high AND name IS NULL)
    OR
    (type = 'group' AND participant_low IS NULL AND participant_high IS NULL
     AND name IS NOT NULL AND length(trim(name)) > 0)
  )
);

CREATE INDEX idx_admin_conversations_last_message
  ON admin_conversations(last_message_at DESC NULLS LAST);

CREATE INDEX idx_admin_conversations_type
  ON admin_conversations(type);

CREATE TABLE admin_conversation_members (
  conversation_id uuid NOT NULL REFERENCES admin_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_admin_conversation_members_user
  ON admin_conversation_members(user_id);

CREATE TABLE admin_conversation_reads (
  conversation_id uuid NOT NULL REFERENCES admin_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  last_notified_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES admin_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

CREATE INDEX idx_admin_messages_conversation_created
  ON admin_messages(conversation_id, created_at);

CREATE TABLE admin_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES admin_messages(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_message_attachments_message
  ON admin_message_attachments(message_id);

CREATE TABLE admin_message_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES admin_messages(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('product', 'order')),
  entity_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_message_entities_message
  ON admin_message_entities(message_id);

CREATE INDEX idx_admin_message_entities_lookup
  ON admin_message_entities(entity_type, entity_id);

-- Private storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE admin_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_conversations;

-- Helper: is current user Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid() AND role = 'admin' AND active = true
  );
$$;

-- Helper: is member of conversation
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_conversation_members
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
$$;

ALTER TABLE admin_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_conversation_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_message_entities ENABLE ROW LEVEL SECURITY;

-- admin_conversations
CREATE POLICY admin_conversations_select ON admin_conversations
  FOR SELECT USING (
    is_conversation_member(id) OR is_super_admin()
  );

-- admin_conversation_members
CREATE POLICY admin_conversation_members_select ON admin_conversation_members
  FOR SELECT USING (
    is_conversation_member(conversation_id) OR is_super_admin()
  );

-- admin_conversation_reads
CREATE POLICY admin_conversation_reads_select ON admin_conversation_reads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY admin_conversation_reads_insert ON admin_conversation_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY admin_conversation_reads_update ON admin_conversation_reads
  FOR UPDATE USING (user_id = auth.uid());

-- admin_messages
CREATE POLICY admin_messages_select ON admin_messages
  FOR SELECT USING (
    is_conversation_member(conversation_id) OR is_super_admin()
  );

CREATE POLICY admin_messages_insert ON admin_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND is_conversation_member(conversation_id)
  );

CREATE POLICY admin_messages_update ON admin_messages
  FOR UPDATE USING (
    sender_id = auth.uid() AND is_conversation_member(conversation_id)
  );

-- admin_message_attachments
CREATE POLICY admin_message_attachments_select ON admin_message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_messages m
      WHERE m.id = message_id
        AND (is_conversation_member(m.conversation_id) OR is_super_admin())
    )
  );

-- admin_message_entities
CREATE POLICY admin_message_entities_select ON admin_message_entities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_messages m
      WHERE m.id = message_id
        AND (is_conversation_member(m.conversation_id) OR is_super_admin())
    )
  );

-- Storage policies for message-attachments bucket
CREATE POLICY message_attachments_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'message-attachments'
    AND (
      is_super_admin()
      OR EXISTS (
        SELECT 1 FROM admin_messages m
        JOIN admin_conversation_members cm ON cm.conversation_id = m.conversation_id
        WHERE m.id::text = (storage.foldername(name))[2]
          AND cm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY message_attachments_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-attachments'
    AND auth.uid() IS NOT NULL
  );
