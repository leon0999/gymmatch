-- ============================================================================
-- GymMatch - 좋아요/댓글 카운트 자동 동기화 트리거
-- ============================================================================
-- 문제: 좋아요/댓글 추가 시 posts.likes_count, posts.comments_count가 수동 업데이트
-- 해결: Database Trigger로 자동 동기화

-- ============================================================================
-- 1. 좋아요 카운트 자동 업데이트 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 좋아요 추가
    UPDATE posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 좋아요 제거
    UPDATE posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 좋아요 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_likes_count ON post_likes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- ============================================================================
-- 2. 댓글 카운트 자동 업데이트 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 댓글 추가
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 댓글 제거
    UPDATE posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_comments_count ON post_comments;
CREATE TRIGGER trigger_update_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- ============================================================================
-- 3. 기존 데이터 동기화 (한 번만 실행)
-- ============================================================================
-- ⚠️ 중요: 이미 존재하는 posts의 카운트를 실제 값과 동기화
UPDATE posts p
SET
  likes_count = (
    SELECT COUNT(*)
    FROM post_likes
    WHERE post_id = p.id
  ),
  comments_count = (
    SELECT COUNT(*)
    FROM post_comments
    WHERE post_id = p.id
  );

-- ============================================================================
-- 4. 헬퍼 함수 (선택사항 - API에서 사용 가능)
-- ============================================================================

-- 수동 동기화 함수 (문제 발생 시 사용)
CREATE OR REPLACE FUNCTION sync_post_counts(target_post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET
    likes_count = (
      SELECT COUNT(*) FROM post_likes WHERE post_id = target_post_id
    ),
    comments_count = (
      SELECT COUNT(*) FROM post_comments WHERE post_id = target_post_id
    )
  WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 모든 포스트 동기화 함수
CREATE OR REPLACE FUNCTION sync_all_post_counts()
RETURNS void AS $$
BEGIN
  UPDATE posts p
  SET
    likes_count = (
      SELECT COUNT(*) FROM post_likes WHERE post_id = p.id
    ),
    comments_count = (
      SELECT COUNT(*) FROM post_comments WHERE post_id = p.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 완료!
-- ============================================================================
-- 이제 Supabase SQL Editor에서 이 스크립트를 실행하세요.
-- 실행 후:
-- 1. 좋아요/댓글 추가 시 자동으로 posts 테이블이 업데이트됩니다
-- 2. API 코드에서 수동 업데이트 제거 가능
-- 3. 기존 데이터가 실제 카운트와 동기화됩니다
