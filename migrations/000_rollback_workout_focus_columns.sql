-- ROLLBACK MIGRATION: Remove today_workout_focus and workout_focus_updated_at columns
-- Author: GymMatch Team
-- Date: 2025-11-26
-- Purpose: Rollback script if migration needs to be reverted

-- ⚠️ WARNING: This will permanently delete the today_workout_focus data
-- Only run this if you need to rollback the migration

-- ============================================================================
-- ROLLBACK: REMOVE WORKOUT FOCUS COLUMNS
-- ============================================================================

BEGIN;

-- Drop indexes first (dependent objects)
DROP INDEX IF EXISTS public.idx_profiles_workout_focus_updated_at;
DROP INDEX IF EXISTS public.idx_profiles_today_workout_focus;

-- Drop constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_today_workout_focus_check;

-- Drop columns
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS workout_focus_updated_at;

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS today_workout_focus;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After rollback, run these to verify:

-- 1. Check columns are removed
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('today_workout_focus', 'workout_focus_updated_at');
-- Expected: 0 rows

-- 2. Check indexes are removed
SELECT
  indexname
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname IN ('idx_profiles_today_workout_focus', 'idx_profiles_workout_focus_updated_at');
-- Expected: 0 rows

-- 3. Check constraint is removed
SELECT
  conname
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname = 'profiles_today_workout_focus_check';
-- Expected: 0 rows
