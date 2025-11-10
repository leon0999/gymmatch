-- GymMatch: Messages Table for 1:1 Chat
-- Created: 2025-01-10

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,

  -- Indexes for performance
  CONSTRAINT messages_match_id_fkey FOREIGN KEY (match_id) REFERENCES matches(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(match_id, read_at) WHERE read_at IS NULL;

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read messages in their matches
CREATE POLICY "Users can read messages in their matches"
ON messages FOR SELECT
USING (
  match_id IN (
    SELECT id FROM matches
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

-- RLS Policy: Users can send messages in their matches
CREATE POLICY "Users can send messages in their matches"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  match_id IN (
    SELECT id FROM matches
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

-- RLS Policy: Users can update their own messages (for read receipts)
CREATE POLICY "Users can update read status"
ON messages FOR UPDATE
USING (
  match_id IN (
    SELECT id FROM matches
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
)
WITH CHECK (
  match_id IN (
    SELECT id FROM matches
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  )
);

-- Function: Get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM messages m
  JOIN matches ma ON m.match_id = ma.id
  WHERE (ma.user1_id = user_uuid OR ma.user2_id = user_uuid)
    AND m.sender_id != user_uuid
    AND m.read_at IS NULL;

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE messages IS 'Stores 1:1 chat messages between matched users';
COMMENT ON COLUMN messages.match_id IS 'References the match this message belongs to';
COMMENT ON COLUMN messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN messages.message IS 'Message content (text only for MVP)';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read (NULL = unread)';
