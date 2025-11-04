-- ============================================================================
-- GymMatch Database Schema
-- ============================================================================
--
-- This SQL schema should be executed in Supabase SQL Editor
-- to set up all required tables, indexes, and policies.
--
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geo-location queries

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Basics
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS geography type
  location_name TEXT NOT NULL,
  gym TEXT,
  gym_chain TEXT,

  -- Fitness
  fitness_level TEXT NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  fitness_goals TEXT[] NOT NULL,
  workout_styles TEXT[] NOT NULL,
  experience TEXT,
  schedule JSONB NOT NULL DEFAULT '{}', -- Store weekly schedule

  -- Preferences
  partner_gender TEXT NOT NULL CHECK (partner_gender IN ('same', 'any', 'opposite')),
  age_range INTEGER[] NOT NULL DEFAULT '{18, 65}', -- [min, max]
  max_distance INTEGER NOT NULL DEFAULT 5, -- miles
  level_match TEXT NOT NULL CHECK (level_match IN ('similar', 'higher', 'lower', 'any')),
  min_match_score INTEGER DEFAULT 40,

  -- Social
  instagram TEXT,
  bio TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  badges JSONB DEFAULT '[]',
  verified BOOLEAN DEFAULT FALSE,

  -- Premium
  is_premium BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT bio_length CHECK (char_length(bio) >= 20 AND char_length(bio) <= 300),
  CONSTRAINT name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50)
);

-- Index for location-based queries (CRITICAL for performance)
CREATE INDEX profiles_location_idx ON profiles USING GIST(location);
CREATE INDEX profiles_user_id_idx ON profiles(user_id);
CREATE INDEX profiles_last_active_idx ON profiles(last_active DESC);

-- ============================================================================
-- SWIPES TABLE
-- ============================================================================

CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'superlike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate swipes
  UNIQUE(user_id, target_user_id)
);

CREATE INDEX swipes_user_id_idx ON swipes(user_id);
CREATE INDEX swipes_target_user_id_idx ON swipes(target_user_id);
CREATE INDEX swipes_action_idx ON swipes(action);

-- ============================================================================
-- MATCHES TABLE (Mutual Likes)
-- ============================================================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  chat_started BOOLEAN DEFAULT FALSE,
  workout_scheduled BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMPTZ,

  -- Ensure user1_id < user2_id for consistency
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX matches_user1_id_idx ON matches(user1_id);
CREATE INDEX matches_user2_id_idx ON matches(user2_id);
CREATE INDEX matches_matched_at_idx ON matches(matched_at DESC);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'workout_invite', 'system')) DEFAULT 'text',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT message_length CHECK (char_length(content) <= 500)
);

CREATE INDEX messages_match_id_idx ON messages(match_id, created_at DESC);
CREATE INDEX messages_receiver_id_idx ON messages(receiver_id, read);

-- ============================================================================
-- WORKOUT INVITES TABLE
-- ============================================================================

CREATE TABLE workout_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX workout_invites_match_id_idx ON workout_invites(match_id);
CREATE INDEX workout_invites_receiver_id_idx ON workout_invites(receiver_id, status);

-- ============================================================================
-- SCHEDULED WORKOUTS TABLE
-- ============================================================================

CREATE TABLE scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  participants UUID[] NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  checked_in UUID[] DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX scheduled_workouts_datetime_idx ON scheduled_workouts(datetime);

-- ============================================================================
-- SWIPE QUOTAS TABLE
-- ============================================================================

CREATE TABLE swipe_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  daily_limit INTEGER NOT NULL DEFAULT 3,
  swipes_used INTEGER NOT NULL DEFAULT 0,
  resets_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX swipe_quotas_user_id_idx ON swipe_quotas(user_id);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'premium')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);

-- ============================================================================
-- USER STATS TABLE
-- ============================================================================

CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_swipes INTEGER DEFAULT 0,
  likes_given INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  matches INTEGER DEFAULT 0,
  workouts_scheduled INTEGER DEFAULT 0,
  workouts_completed INTEGER DEFAULT 0,
  avg_match_score DECIMAL(5,2),
  profile_views INTEGER DEFAULT 0,
  response_rate DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX user_stats_user_id_idx ON user_stats(user_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_id_idx ON notifications(user_id, read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Swipes: Users can only see their own swipes
CREATE POLICY "Users can view own swipes" ON swipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own swipes" ON swipes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matches: Users can see matches they're part of
CREATE POLICY "Users can view own matches" ON matches FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Messages: Users can see messages in their matches
CREATE POLICY "Users can view match messages" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Workout Invites: Users can see invites they're involved in
CREATE POLICY "Users can view own workout invites" ON workout_invites FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can create workout invites" ON workout_invites FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Swipe Quotas: Users can only see their own quota
CREATE POLICY "Users can view own quota" ON swipe_quotas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own quota" ON swipe_quotas FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions: Users can only see their own subscription
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- User Stats: Users can only see their own stats
CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_swipe_quotas_updated_at BEFORE UPDATE ON swipe_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily swipe quotas (should be called via cron job)
CREATE OR REPLACE FUNCTION reset_daily_swipe_quotas()
RETURNS void AS $$
BEGIN
  UPDATE swipe_quotas
  SET swipes_used = 0, resets_at = NOW() + INTERVAL '1 day'
  WHERE resets_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- REALTIME PUBLICATIONS
-- ============================================================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================================
-- INITIAL DATA / SEED (Optional)
-- ============================================================================

-- Create free plan subscription for all new users (trigger)
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  INSERT INTO swipe_quotas (user_id, daily_limit, resets_at)
  VALUES (NEW.id, 3, NOW() + INTERVAL '1 day');

  INSERT INTO user_stats (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Add composite indexes for common queries
CREATE INDEX matches_users_idx ON matches(user1_id, user2_id);
CREATE INDEX messages_match_sender_idx ON messages(match_id, sender_id);
CREATE INDEX swipes_user_action_idx ON swipes(user_id, action);

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. After running this schema, create a Supabase Storage bucket:
--    - Bucket name: "profile-photos"
--    - Public: true
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp

-- 2. Set up Supabase Edge Functions for:
--    - Matching algorithm (compute-intensive)
--    - Stripe webhooks
--    - Daily cron job to reset swipe quotas

-- 3. Enable PostGIS extension in Supabase Dashboard:
--    Settings > Database > Extensions > PostGIS

-- 4. For geo-location queries, use ST_DWithin:
--    SELECT * FROM profiles WHERE ST_DWithin(location::geography, ST_MakePoint(lng, lat)::geography, distance_in_meters);
