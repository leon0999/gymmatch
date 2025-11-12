-- ============================================
-- Phase 4: Social Feed System Migration
-- Created: 2025-01-12
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Posts Table (핵심!)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  photographer_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,

  -- 미디어
  media_type TEXT CHECK (media_type IN ('photo', 'video')) NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- 운동 정보
  workout_type TEXT,
  exercise_name TEXT,
  caption TEXT,

  -- 통계
  likes_count INT DEFAULT 0 NOT NULL,
  comments_count INT DEFAULT 0 NOT NULL,
  views_count INT DEFAULT 0 NOT NULL,

  -- 메타
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_photographer_id ON posts(photographer_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_workout_type ON posts(workout_type);

-- ============================================
-- 2. Post Likes Table
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- Indexes for post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at DESC);

-- ============================================
-- 3. Post Comments Table
-- ============================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

-- ============================================
-- 4. Notifications Table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('like', 'comment', 'new_post', 'new_match')) NOT NULL,

  -- Relations
  from_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,

  -- State
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- 5. Workout Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,

  workout_date DATE NOT NULL,
  workout_parts TEXT[] NOT NULL,
  duration_minutes INT,
  media_urls TEXT[],

  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed')) DEFAULT 'scheduled' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for workout_sessions
CREATE INDEX IF NOT EXISTS idx_workout_sessions_match_id ON workout_sessions(match_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_date ON workout_sessions(workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status);

-- ============================================
-- 6. Extend Profiles Table
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS posts_count INT DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_likes INT DEFAULT 0 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS attractiveness_score DECIMAL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS strength_level TEXT CHECK (strength_level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_workout_parts TEXT[];

-- ============================================
-- 7. Helper Functions
-- ============================================

-- Increment likes count
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement likes count
CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment comments count
CREATE OR REPLACE FUNCTION increment_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement comments count
CREATE OR REPLACE FUNCTION decrement_comments(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment posts count on profile
CREATE OR REPLACE FUNCTION increment_posts_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET posts_count = posts_count + 1 WHERE profiles.user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Triggers
-- ============================================

-- Auto-decrement likes when a like is deleted
CREATE OR REPLACE FUNCTION on_like_deleted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM decrement_likes(OLD.post_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_like_deleted
AFTER DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION on_like_deleted();

-- Auto-decrement comments when a comment is deleted
CREATE OR REPLACE FUNCTION on_comment_deleted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM decrement_comments(OLD.post_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_deleted
AFTER DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION on_comment_deleted();

-- ============================================
-- 9. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Posts: Anyone can read public posts
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Posts: Only photographer can insert (파트너만 업로드 가능!)
CREATE POLICY "Only matched partners can create posts" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = photographer_id AND
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND (m.user1_id = photographer_id OR m.user2_id = photographer_id)
      AND (m.user1_id = user_id OR m.user2_id = user_id)
    )
  );

-- Posts: Only owner can delete
CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Likes: Anyone can like
CREATE POLICY "Anyone can like posts" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can unlike posts" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments: Anyone can comment
CREATE POLICY "Anyone can comment on posts" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications: Users can only see their own
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can mark their notifications as read" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Workout Sessions: Participants can view
CREATE POLICY "Participants can view workout sessions" ON workout_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Participants can create workout sessions" ON workout_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- ============================================
-- 10. Sample Data (Optional - for testing)
-- ============================================

-- Commented out - uncomment if you want sample data
/*
INSERT INTO posts (user_id, photographer_id, media_type, media_url, workout_type, caption) VALUES
  ('user1-uuid', 'user2-uuid', 'photo', 'https://example.com/photo1.jpg', 'chest', 'Great workout with @user2!'),
  ('user2-uuid', 'user1-uuid', 'photo', 'https://example.com/photo2.jpg', 'back', 'Deadlift PR!');
*/
