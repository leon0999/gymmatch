-- ============================================================================
-- GymMatch - Follows Table Migration
-- ============================================================================
-- 사용자 간 팔로우 기능을 위한 테이블
-- 프로필 페이지에서 팔로워/팔로잉 수 표시에 사용

-- ============================================================================
-- 기존 테이블 및 함수 삭제 (안전한 재생성)
-- ============================================================================
DROP TABLE IF EXISTS follows CASCADE;
DROP FUNCTION IF EXISTS get_follower_count(UUID);
DROP FUNCTION IF EXISTS get_following_count(UUID);
DROP FUNCTION IF EXISTS is_mutual_follow(UUID, UUID);

-- ============================================================================
-- Table: follows
-- ============================================================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 팔로우하는 사람 (follower)
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 팔로우 당하는 사람 (following)
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 중복 팔로우 방지
  CONSTRAINT unique_follow UNIQUE(follower_id, following_id),

  -- 자기 자신을 팔로우할 수 없음
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ============================================================================
-- Indexes (조회 성능 향상)
-- ============================================================================

-- 특정 사용자가 팔로우하는 사람들 조회 (Following)
CREATE INDEX IF NOT EXISTS idx_follows_follower
  ON follows(follower_id);

-- 특정 사용자를 팔로우하는 사람들 조회 (Followers)
CREATE INDEX IF NOT EXISTS idx_follows_following
  ON follows(following_id);

-- 양방향 조회 최적화 (서로 팔로우 여부 확인)
CREATE INDEX IF NOT EXISTS idx_follows_both
  ON follows(follower_id, following_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자가 팔로우 관계 조회 가능
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

-- 정책 2: 인증된 사용자만 팔로우 추가 가능 (자신이 follower여야 함)
CREATE POLICY "Authenticated users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- 정책 3: 자신의 팔로우만 삭제 가능 (언팔로우)
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================================================
-- Helper Functions (선택사항)
-- ============================================================================

-- 팔로워 수 계산 함수
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM follows WHERE following_id = user_id;
$$ LANGUAGE SQL STABLE;

-- 팔로잉 수 계산 함수
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM follows WHERE follower_id = user_id;
$$ LANGUAGE SQL STABLE;

-- 서로 팔로우 여부 확인 함수 (맞팔)
CREATE OR REPLACE FUNCTION is_mutual_follow(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM follows WHERE follower_id = user1_id AND following_id = user2_id
  ) AND EXISTS (
    SELECT 1 FROM follows WHERE follower_id = user2_id AND following_id = user1_id
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 완료!
-- ============================================================================
-- 이제 Supabase SQL Editor에서 이 스크립트를 실행하세요.
