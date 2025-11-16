-- ============================================
-- GymMatch - Daily Workout Focus Feature
-- 사용자가 매일 운동할 부위를 선택하면 같은 부위를 선택한 파트너와 우선 매칭
-- ============================================

-- STEP 1: profiles 테이블에 오늘의 운동 부위 컬럼 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS today_workout_focus TEXT,
ADD COLUMN IF NOT EXISTS workout_focus_updated_at TIMESTAMP WITH TIME ZONE;

-- COMMENT 추가
COMMENT ON COLUMN profiles.today_workout_focus IS 'Today''s workout focus: chest, back, legs, shoulders, arms, core, cardio, any';
COMMENT ON COLUMN profiles.workout_focus_updated_at IS 'Last time user updated their daily workout focus';

-- STEP 2: 인덱스 추가 (매칭 성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_today_workout_focus
ON profiles(today_workout_focus)
WHERE today_workout_focus IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_workout_focus_date
ON profiles(workout_focus_updated_at DESC)
WHERE workout_focus_updated_at IS NOT NULL;

-- STEP 3: 오늘 같은 부위를 선택한 활성 사용자 수를 조회하는 함수
CREATE OR REPLACE FUNCTION get_active_users_by_focus(focus_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM profiles
    WHERE today_workout_focus = focus_type
    AND workout_focus_updated_at >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: 사용자의 매칭 점수 계산 함수 업데이트 (운동 부위 우선순위 포함)
CREATE OR REPLACE FUNCTION calculate_match_score(
  my_user_id UUID,
  other_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  my_profile RECORD;
  other_profile RECORD;
BEGIN
  -- 프로필 조회
  SELECT * INTO my_profile FROM profiles WHERE user_id = my_user_id;
  SELECT * INTO other_profile FROM profiles WHERE user_id = other_user_id;

  IF my_profile IS NULL OR other_profile IS NULL THEN
    RETURN 0;
  END IF;

  -- 1. 오늘 같은 운동 부위 선택 시 +50점 (최우선 순위!)
  IF my_profile.today_workout_focus IS NOT NULL
     AND other_profile.today_workout_focus IS NOT NULL
     AND my_profile.today_workout_focus = other_profile.today_workout_focus
     AND DATE(my_profile.workout_focus_updated_at) = CURRENT_DATE
     AND DATE(other_profile.workout_focus_updated_at) = CURRENT_DATE THEN
    score := score + 50;
  END IF;

  -- 2. 같은 헬스장 +30점
  IF my_profile.gym_name IS NOT NULL
     AND other_profile.gym_name IS NOT NULL
     AND my_profile.gym_name = other_profile.gym_name THEN
    score := score + 30;
  END IF;

  -- 3. 비슷한 피트니스 레벨 +20점
  IF my_profile.fitness_level = other_profile.fitness_level THEN
    score := score + 20;
  END IF;

  -- 4. 같은 workout_styles 있으면 +15점
  IF my_profile.workout_styles && other_profile.workout_styles THEN
    score := score + 15;
  END IF;

  -- 5. 같은 fitness_goals 있으면 +10점
  IF my_profile.fitness_goals && other_profile.fitness_goals THEN
    score := score + 10;
  END IF;

  -- 6. 선호 성별 일치 +10점
  IF (my_profile.preferred_gender = 'any' OR my_profile.preferred_gender = other_profile.gender)
     AND (other_profile.preferred_gender = 'any' OR other_profile.preferred_gender = my_profile.gender) THEN
    score := score + 10;
  END IF;

  -- 7. 선호 나이 범위 내 +5점
  IF my_profile.age BETWEEN other_profile.preferred_age_min AND other_profile.preferred_age_max
     AND other_profile.age BETWEEN my_profile.preferred_age_min AND my_profile.preferred_age_max THEN
    score := score + 5;
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: RLS 정책 (모든 사용자가 다른 사용자의 today_workout_focus 볼 수 있음)
-- 기존 profiles SELECT 정책이 이미 있으므로 추가 정책 불필요

-- STEP 6: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Daily Workout Focus 기능 추가 완료!';
  RAISE NOTICE '📋 추가된 컬럼:';
  RAISE NOTICE '   - profiles.today_workout_focus';
  RAISE NOTICE '   - profiles.workout_focus_updated_at';
  RAISE NOTICE '🔍 추가된 인덱스:';
  RAISE NOTICE '   - idx_profiles_today_workout_focus';
  RAISE NOTICE '   - idx_profiles_workout_focus_date';
  RAISE NOTICE '⚡ 추가된 함수:';
  RAISE NOTICE '   - get_active_users_by_focus(focus_type)';
  RAISE NOTICE '   - calculate_match_score(my_user_id, other_user_id) [업데이트]';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 이제 프론트엔드 코드를 배포하면 됩니다!';
END $$;
