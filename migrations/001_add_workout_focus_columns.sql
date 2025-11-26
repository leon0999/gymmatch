-- Migration: Add today_workout_focus and workout_focus_updated_at columns to profiles table
-- Author: GymMatch Team
-- Date: 2025-11-26
-- Purpose: Enable "Today's Workout Focus" feature for discover page

-- ============================================================================
-- MIGRATION: ADD WORKOUT FOCUS COLUMNS
-- ============================================================================

BEGIN;

-- Add today_workout_focus column (nullable)
-- Valid values: 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'any'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS today_workout_focus text;

-- Add workout_focus_updated_at column (nullable)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS workout_focus_updated_at timestamp with time zone;

-- Add check constraint to ensure valid workout focus values
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_today_workout_focus_check
CHECK (
  today_workout_focus IS NULL OR
  today_workout_focus IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'any')
);

-- Create index for better query performance on today_workout_focus
CREATE INDEX IF NOT EXISTS idx_profiles_today_workout_focus
ON public.profiles(today_workout_focus)
WHERE today_workout_focus IS NOT NULL;

-- Create index for workout_focus_updated_at
CREATE INDEX IF NOT EXISTS idx_profiles_workout_focus_updated_at
ON public.profiles(workout_focus_updated_at)
WHERE workout_focus_updated_at IS NOT NULL;

-- Add comment to columns for documentation
COMMENT ON COLUMN public.profiles.today_workout_focus IS 'Current workout focus for today (chest, back, legs, shoulders, arms, core, cardio, any)';
COMMENT ON COLUMN public.profiles.workout_focus_updated_at IS 'Timestamp when today_workout_focus was last updated';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After migration, run these to verify:

-- 1. Check if columns exist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('today_workout_focus', 'workout_focus_updated_at')
ORDER BY column_name;

-- 2. Check if indexes exist
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname IN ('idx_profiles_today_workout_focus', 'idx_profiles_workout_focus_updated_at');

-- 3. Check if constraint exists
SELECT
  conname,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname = 'profiles_today_workout_focus_check';

-- 4. Verify existing users have NULL values (safe migration)
SELECT
  COUNT(*) as total_users,
  COUNT(today_workout_focus) as users_with_focus,
  COUNT(workout_focus_updated_at) as users_with_timestamp
FROM public.profiles;

-- Expected result:
-- total_users: (your current count)
-- users_with_focus: 0
-- users_with_timestamp: 0
