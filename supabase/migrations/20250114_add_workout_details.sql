-- ============================================
-- Add Detailed Workout Information Fields
-- 헬스인들이 중요하게 생각하는 정보 추가
-- ============================================

-- 1. 오늘 운동할 부위
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS today_workout_part TEXT
CHECK (today_workout_part IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'rest'));

-- 2. 평소 메인 운동 (예: Bench Press, Squat, Deadlift)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS main_exercises JSONB DEFAULT '[]'::jsonb;

-- 3. 운동 중량 정보 (JSON으로 저장)
-- 예: {"bench_press": "100kg", "squat": "120kg", "deadlift": "140kg"}
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS exercise_weights JSONB DEFAULT '{}'::jsonb;

-- 4. 선호 운동 시간대
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workout_time_preference TEXT
CHECK (workout_time_preference IN ('early_morning', 'morning', 'afternoon', 'evening', 'night', 'flexible'));

-- 5. 일주일 운동 빈도
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weekly_workout_frequency INT CHECK (weekly_workout_frequency >= 0 AND weekly_workout_frequency <= 7);

-- 6. 운동 경력 (개월 수)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS workout_experience_months INT DEFAULT 0;

-- 7. 현재 컨디션/목표
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_goal TEXT
CHECK (current_goal IN ('bulk', 'cut', 'maintain', 'strength', 'endurance', 'beginner_gains'));

-- 8. 1RM (One Rep Max) 주요 3대 운동
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bench_press_1rm INT,
ADD COLUMN IF NOT EXISTS squat_1rm INT,
ADD COLUMN IF NOT EXISTS deadlift_1rm INT;

-- Comment
COMMENT ON COLUMN profiles.today_workout_part IS '오늘 운동할 부위 (매일 업데이트 가능)';
COMMENT ON COLUMN profiles.main_exercises IS '평소 주로 하는 운동들 (배열)';
COMMENT ON COLUMN profiles.exercise_weights IS '운동별 작업 중량 정보 (JSON)';
COMMENT ON COLUMN profiles.workout_time_preference IS '선호하는 운동 시간대';
COMMENT ON COLUMN profiles.weekly_workout_frequency IS '주당 운동 빈도 (0-7일)';
COMMENT ON COLUMN profiles.workout_experience_months IS '운동 경력 (개월)';
COMMENT ON COLUMN profiles.current_goal IS '현재 운동 목표';
COMMENT ON COLUMN profiles.bench_press_1rm IS '벤치프레스 1RM (kg)';
COMMENT ON COLUMN profiles.squat_1rm IS '스쿼트 1RM (kg)';
COMMENT ON COLUMN profiles.deadlift_1rm IS '데드리프트 1RM (kg)';

-- Index for today's workout part (자주 필터링됨)
CREATE INDEX IF NOT EXISTS idx_profiles_today_workout ON profiles(today_workout_part);
CREATE INDEX IF NOT EXISTS idx_profiles_workout_time ON profiles(workout_time_preference);
