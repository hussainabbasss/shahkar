-- Module 06: Admin voice calls (WebRTC signaling via Realtime)

CREATE TABLE admin_voice_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES admin_conversations(id) ON DELETE CASCADE,
  initiated_by uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_voice_calls_conversation
  ON admin_voice_calls(conversation_id, created_at DESC);

CREATE INDEX idx_admin_voice_calls_status
  ON admin_voice_calls(status)
  WHERE status IN ('ringing', 'active');

CREATE TABLE admin_voice_call_participants (
  call_id uuid NOT NULL REFERENCES admin_voice_calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN (
    'invited', 'ringing', 'joined', 'declined', 'missed', 'left'
  )),
  joined_at timestamptz,
  left_at timestamptz,
  PRIMARY KEY (call_id, user_id)
);

CREATE INDEX idx_admin_voice_call_participants_user
  ON admin_voice_call_participants(user_id, call_id);

-- One active involvement per user (ringing or joined)
CREATE UNIQUE INDEX idx_admin_voice_call_participants_one_active
  ON admin_voice_call_participants(user_id)
  WHERE status IN ('invited', 'ringing', 'joined');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE admin_voice_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_voice_call_participants;

ALTER TABLE admin_voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_voice_call_participants ENABLE ROW LEVEL SECURITY;

-- admin_voice_calls
CREATE POLICY admin_voice_calls_select ON admin_voice_calls
  FOR SELECT USING (
    is_conversation_member(conversation_id) OR is_super_admin()
  );

CREATE POLICY admin_voice_calls_insert ON admin_voice_calls
  FOR INSERT WITH CHECK (
    initiated_by = auth.uid()
    AND is_conversation_member(conversation_id)
  );

CREATE POLICY admin_voice_calls_update ON admin_voice_calls
  FOR UPDATE USING (
    initiated_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM admin_voice_call_participants p
      WHERE p.call_id = id AND p.user_id = auth.uid()
    )
  );

-- admin_voice_call_participants
CREATE POLICY admin_voice_call_participants_select ON admin_voice_call_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_voice_calls c
      WHERE c.id = call_id
        AND (is_conversation_member(c.conversation_id) OR is_super_admin())
    )
  );

CREATE POLICY admin_voice_call_participants_update ON admin_voice_call_participants
  FOR UPDATE USING (user_id = auth.uid());
