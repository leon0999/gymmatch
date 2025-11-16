-- ============================================
-- GymMatch - PR & Workout Details Schema
-- 미국 피트니스 문화 기반 프로필 확장
-- ============================================

-- STEP 1: PR (Personal Records) 컬럼 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bench_pr INTEGER,
ADD COLUMN IF NOT EXISTS squat_pr INTEGER,
ADD COLUMN IF NOT EXISTS deadlift_pr INTEGER,
ADD COLUMN IF NOT EXISTS overhead_press_pr INTEGER,
ADD COLUMN IF NOT EXISTS body_weight INTEGER;

COMMENT ON COLUMN profiles.bench_pr IS 'Bench Press 1RM in lbs';
COMMENT ON COLUMN profiles.squat_pr IS 'Squat 1RM in lbs';
COMMENT ON COLUMN profiles.deadlift_pr IS 'Deadlift 1RM in lbs';
COMMENT ON COLUMN profiles.overhead_press_pr IS 'Overhead Press 1RM in lbs';
COMMENT ON COLUMN profiles.body_weight IS 'Body weight in lbs (for relative strength)';

-- STEP 2: 운동 스타일 & 스케줄 컬럼 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workout_split TEXT,
ADD COLUMN IF NOT EXISTS years_training INTEGER,
ADD COLUMN IF NOT EXISTS weekly_frequency INTEGER,
ADD COLUMN IF NOT EXISTS preferred_time TEXT;

COMMENT ON COLUMN profiles.workout_split IS 'PPL (Push/Pull/Legs), Upper/Lower, Bro Split, Full Body, etc';
COMMENT ON COLUMN profiles.years_training IS 'Years of training experience';
COMMENT ON COLUMN profiles.weekly_frequency IS 'How many times per week (3-7)';
COMMENT ON COLUMN profiles.preferred_time IS 'Morning (6-9am), Midday (12-2pm), Evening (5-8pm), Night (8-11pm)';

-- STEP 3: 계산된 컬럼 (Big 3 Total)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS big_three_total INTEGER GENERATED ALWAYS AS (
  COALESCE(bench_pr, 0) + COALESCE(squat_pr, 0) + COALESCE(deadlift_pr, 0)
) STORED;

COMMENT ON COLUMN profiles.big_three_total IS 'Total of Bench + Squat + Deadlift (auto-calculated)';

-- STEP 4: 상대 강도 레벨 계산 함수
CREATE OR REPLACE FUNCTION get_strength_level(
  p_exercise TEXT,
  p_weight INTEGER,
  p_body_weight INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_ratio DECIMAL;
  v_levels JSONB;
BEGIN
  -- 체중 대비 비율 계산
  IF p_body_weight IS NULL OR p_body_weight = 0 THEN
    RETURN 'Unknown';
  END IF;

  v_ratio := p_weight::DECIMAL / p_body_weight::DECIMAL;

  -- 운동별 강도 기준 (ExRx Standards 기준)
  v_levels := CASE p_exercise
    WHEN 'bench' THEN '{"novice": 0.75, "intermediate": 1.0, "advanced": 1.5, "elite": 2.0}'::JSONB
    WHEN 'squat' THEN '{"novice": 1.0, "intermediate": 1.5, "advanced": 2.0, "elite": 2.5}'::JSONB
    WHEN 'deadlift' THEN '{"novice": 1.25, "intermediate": 1.75, "advanced": 2.25, "elite": 2.75}'::JSONB
    ELSE '{}'::JSONB
  END;

  -- 레벨 반환
  IF v_ratio >= (v_levels->>'elite')::DECIMAL THEN
    RETURN 'Elite';
  ELSIF v_ratio >= (v_levels->>'advanced')::DECIMAL THEN
    RETURN 'Advanced';
  ELSIF v_ratio >= (v_levels->>'intermediate')::DECIMAL THEN
    RETURN 'Intermediate';
  ELSIF v_ratio >= (v_levels->>'novice')::DECIMAL THEN
    RETURN 'Novice';
  ELSE
    RETURN 'Beginner';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- STEP 5: 인덱스 추가 (매칭 성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_bench_pr ON profiles(bench_pr) WHERE bench_pr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_squat_pr ON profiles(squat_pr) WHERE squat_pr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_deadlift_pr ON profiles(deadlift_pr) WHERE deadlift_pr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_workout_split ON profiles(workout_split) WHERE workout_split IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_time ON profiles(preferred_time) WHERE preferred_time IS NOT NULL;

-- STEP 6: 매칭 점수 함수 업데이트 (PR 고려)
CREATE OR REPLACE FUNCTION calculate_advanced_match_score(
  my_user_id UUID,
  other_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  my_profile RECORD;
  other_profile RECORD;
  bench_diff INTEGER;
  squat_diff INTEGER;
  deadlift_diff INTEGER;
BEGIN
  -- 프로필 조회
  SELECT * INTO my_profile FROM profiles WHERE user_id = my_user_id;
  SELECT * INTO other_profile FROM profiles WHERE user_id = other_user_id;

  IF my_profile IS NULL OR other_profile IS NULL THEN
    RETURN 0;
  END IF;

  -- 1. 오늘 같은 운동 부위 선택 시 +50점 (최우선)
  IF my_profile.today_workout_focus IS NOT NULL
     AND other_profile.today_workout_focus IS NOT NULL
     AND my_profile.today_workout_focus = other_profile.today_workout_focus
     AND DATE(my_profile.workout_focus_updated_at) = CURRENT_DATE
     AND DATE(other_profile.workout_focus_updated_at) = CURRENT_DATE THEN
    score := score + 50;
  END IF;

  -- 2. 같은 workout split +30점 (PPL, Upper/Lower 등)
  IF my_profile.workout_split IS NOT NULL
     AND other_profile.workout_split IS NOT NULL
     AND my_profile.workout_split = other_profile.workout_split THEN
    score := score + 30;
  END IF;

  -- 3. 비슷한 PR (±45lbs 이내) +20점
  IF my_profile.bench_pr IS NOT NULL AND other_profile.bench_pr IS NOT NULL THEN
    bench_diff := ABS(my_profile.bench_pr - other_profile.bench_pr);
    IF bench_diff <= 45 THEN
      score := score + 20;
    END IF;
  END IF;

  IF my_profile.squat_pr IS NOT NULL AND other_profile.squat_pr IS NOT NULL THEN
    squat_diff := ABS(my_profile.squat_pr - other_profile.squat_pr);
    IF squat_diff <= 45 THEN
      score := score + 20;
    END IF;
  END IF;

  IF my_profile.deadlift_pr IS NOT NULL AND other_profile.deadlift_pr IS NOT NULL THEN
    deadlift_diff := ABS(my_profile.deadlift_pr - other_profile.deadlift_pr);
    IF deadlift_diff <= 45 THEN
      score := score + 20;
    END IF;
  END IF;

  -- 4. 같은 헬스장 +30점
  IF my_profile.gym_name IS NOT NULL
     AND other_profile.gym_name IS NOT NULL
     AND my_profile.gym_name = other_profile.gym_name THEN
    score := score + 30;
  END IF;

  -- 5. 같은 시간대 선호 +15점
  IF my_profile.preferred_time IS NOT NULL
     AND other_profile.preferred_time IS NOT NULL
     AND my_profile.preferred_time = other_profile.preferred_time THEN
    score := score + 15;
  END IF;

  -- 6. 비슷한 운동 빈도 (±1회) +10점
  IF my_profile.weekly_frequency IS NOT NULL
     AND other_profile.weekly_frequency IS NOT NULL
     AND ABS(my_profile.weekly_frequency - other_profile.weekly_frequency) <= 1 THEN
    score := score + 10;
  END IF;

  -- 7. 비슷한 피트니스 레벨 +10점
  IF my_profile.fitness_level = other_profile.fitness_level THEN
    score := score + 10;
  END IF;

  -- 8. 선호 성별 일치 +10점
  IF (my_profile.preferred_gender = 'any' OR my_profile.preferred_gender = other_profile.gender)
     AND (other_profile.preferred_gender = 'any' OR other_profile.preferred_gender = my_profile.gender) THEN
    score := score + 10;
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ PR & Workout Details 스키마 추가 완료!';
  RAISE NOTICE '📋 추가된 PR 컬럼:';
  RAISE NOTICE '   - bench_pr, squat_pr, deadlift_pr, overhead_press_pr';
  RAISE NOTICE '   - big_three_total (자동 계산)';
  RAISE NOTICE '🏋️ 추가된 운동 정보:';
  RAISE NOTICE '   - workout_split (PPL, Upper/Lower 등)';
  RAISE NOTICE '   - years_training, weekly_frequency';
  RAISE NOTICE '   - preferred_time';
  RAISE NOTICE '⚡ 추가된 함수:';
  RAISE NOTICE '   - get_strength_level(exercise, weight, body_weight)';
  RAISE NOTICE '   - calculate_advanced_match_score(my_id, other_id)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 다음: 온보딩 페이지에 PR 입력 추가!';
END $$;
