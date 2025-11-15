-- GymMatch: Fix Messages RLS Policies
-- Created: 2025-01-14
-- Issue: Users getting 403 error when sending messages

-- First, drop all existing policies on messages table
DROP POLICY IF EXISTS "Users can read messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can update read status" ON messages;

-- Ensure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Users can read messages in their matches
CREATE POLICY "Users can read messages in their matches"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- RLS Policy 2: Users can send messages in their matches
CREATE POLICY "Users can send messages in their matches"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- RLS Policy 3: Users can update read status in their matches
CREATE POLICY "Users can update read status"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

-- Verify policies are created
DO $$
BEGIN
  RAISE NOTICE 'Messages RLS policies have been reset and recreated';
  RAISE NOTICE 'Please verify that auth.uid() returns the correct user ID';
END $$;
