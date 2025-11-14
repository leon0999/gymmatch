-- Discover 페이지 디버깅을 위한 SQL 쿼리

-- 1. 현재 프로필이 몇 개 있는지 확인
SELECT
  user_id,
  email,
  name,
  age,
  gender,
  location,
  fitness_level,
  preferred_gender,
  onboarding_completed
FROM profiles
ORDER BY created_at DESC;

-- 2. likes 테이블 확인
SELECT * FROM likes;

-- 3. matches 테이블 확인
SELECT * FROM matches;

-- 예상 결과:
-- - profiles: 2개 (luna, mike)
-- - likes: 0개 (아직 아무도 좋아요 안 누름)
-- - matches: 0개 (아직 매칭 안 됨)
