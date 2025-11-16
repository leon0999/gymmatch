-- Add photo session approval columns to matches table
ALTER TABLE matches
ADD COLUMN user1_photo_session_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN user2_photo_session_approved BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX idx_matches_photo_session ON matches(user1_photo_session_approved, user2_photo_session_approved);

-- Comment
COMMENT ON COLUMN matches.user1_photo_session_approved IS 'Whether user1 has approved photo session access';
COMMENT ON COLUMN matches.user2_photo_session_approved IS 'Whether user2 has approved photo session access';
