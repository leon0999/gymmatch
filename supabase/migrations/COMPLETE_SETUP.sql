-- ============================================
-- GymMatch - Complete Database Setup
-- 한 번에 실행하는 전체 마이그레이션
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: 기존 테이블 모두 삭제 (Clean Slate)
-- ============================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS workout_sessions CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- STEP 2: Profiles 테이블 생성
-- ============================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary')) NOT NULL,
  location TEXT NOT NULL,
  gym_name TEXT,
  bio TEXT,
  photo_url TEXT,

  -- Fitness Info
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  fitness_goals TEXT[],
  workout_styles TEXT[],
  strength_level TEXT CHECK (strength_level IN ('beginner', 'intermediate', 'advanced')),
  favorite_workout_parts TEXT[],

  -- Partner Preferences
  preferred_gender TEXT CHECK (preferred_gender IN ('male', 'female', 'any')),
  preferred_age_min INT,
  preferred_age_max INT,
  preferred_distance_km INT,

  -- Stats
  posts_count INT DEFAULT 0 NOT NULL,
  total_likes INT DEFAULT 0 NOT NULL,
  attractiveness_score DECIMAL DEFAULT 0,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for profiles
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_gym_name ON profiles(gym_name);
CREATE INDEX idx_profiles_fitness_level ON profiles(fitness_level);
CREATE INDEX idx_profiles_gender ON profiles(gender);

-- ============================================
-- STEP 3: User Preferences 테이블
-- ============================================
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,

  -- Notification Settings
  push_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  match_notifications BOOLEAN DEFAULT TRUE,
  message_notifications BOOLEAN DEFAULT TRUE,

  -- Privacy Settings
  show_online_status BOOLEAN DEFAULT TRUE,
  show_location BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- STEP 4: Matches 테이블
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,

  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- Indexes for matches
CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_matches_matched_at ON matches(matched_at DESC);

-- ============================================
-- STEP 5: Likes 테이블
-- ============================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  UNIQUE(from_user_id, to_user_id)
);

-- Indexes for likes
CREATE INDEX idx_likes_from_user_id ON likes(from_user_id);
CREATE INDEX idx_likes_to_user_id ON likes(to_user_id);

-- ============================================
-- STEP 6: Blocks 테이블
-- ============================================
CREATE TABLE blocks (
  blocker_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (blocker_id, blocked_id)
);

-- ============================================
-- STEP 7: Reports 테이블
-- ============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  reported_post_id UUID,

  reason TEXT CHECK (reason IN ('inappropriate', 'spam', 'fake', 'harassment', 'other')) NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewing', 'resolved')) DEFAULT 'pending',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- STEP 8: Posts 테이블
-- ============================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  photographer_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,

  -- Media
  media_type TEXT CHECK (media_type IN ('photo', 'video')) NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Workout Info
  workout_type TEXT,
  exercise_name TEXT,
  caption TEXT,

  -- Stats
  likes_count INT DEFAULT 0 NOT NULL,
  comments_count INT DEFAULT 0 NOT NULL,
  views_count INT DEFAULT 0 NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for posts
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_photographer_id ON posts(photographer_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_workout_type ON posts(workout_type);

-- ============================================
-- STEP 9: Post Likes 테이블
-- ============================================
CREATE TABLE post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (post_id, user_id)
);

-- Indexes for post_likes
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at DESC);

-- ============================================
-- STEP 10: Post Comments 테이블
-- ============================================
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for post_comments
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at DESC);

-- ============================================
-- STEP 11: Notifications 테이블
-- ============================================
CREATE TABLE notifications (
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
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- STEP 12: Workout Sessions 테이블
-- ============================================
CREATE TABLE workout_sessions (
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
CREATE INDEX idx_workout_sessions_match_id ON workout_sessions(match_id);
CREATE INDEX idx_workout_sessions_workout_date ON workout_sessions(workout_date DESC);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);

-- ============================================
-- STEP 13: Helper Functions
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

-- ============================================
-- STEP 14: Triggers
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
-- STEP 15: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- User Preferences RLS
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Matches RLS
CREATE POLICY "Users can view their own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches" ON matches
  FOR INSERT WITH CHECK (true);

-- Likes RLS
CREATE POLICY "Users can view all likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON likes
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (auth.uid() = from_user_id);

-- Blocks RLS
CREATE POLICY "Users can view their own blocks" ON blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks" ON blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Reports RLS
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Posts RLS
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = posts.user_id)
         OR (blocker_id = auth.uid() AND blocked_id = posts.photographer_id)
    )
  );

CREATE POLICY "Only matched partners can create posts" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = photographer_id AND
    auth.uid() != user_id AND
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND (m.user1_id = photographer_id OR m.user2_id = photographer_id)
      AND (m.user1_id = user_id OR m.user2_id = user_id)
    )
  );

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post Likes RLS
CREATE POLICY "Anyone can like posts" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can unlike posts" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Post Comments RLS
CREATE POLICY "Anyone can comment on posts" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications RLS
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can mark their notifications as read" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Workout Sessions RLS
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
-- COMPLETE! 🎉
-- ============================================
