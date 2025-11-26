-- Migration: Add bug_reports table for in-app bug reporting
-- Author: GymMatch Team
-- Date: 2025-11-26
-- Purpose: Enable beta testers to report bugs easily with screenshots

-- ============================================================================
-- MIGRATION: ADD BUG REPORTS TABLE
-- ============================================================================

BEGIN;

-- Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description text NOT NULL,
  page_url text NOT NULL,
  screenshot_url text,
  browser_info jsonb,
  user_agent text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON public.bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_priority ON public.bug_reports(priority);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Users can create their own bug reports
CREATE POLICY "Users can create bug reports"
  ON public.bug_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
  ON public.bug_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Admin can view all bug reports (TODO: Add admin role check)
CREATE POLICY "Admin can view all bug reports"
  ON public.bug_reports
  FOR SELECT
  USING (true);

-- 4. Admin can update bug reports
CREATE POLICY "Admin can update bug reports"
  ON public.bug_reports
  FOR UPDATE
  USING (true);

-- Add comments to columns for documentation
COMMENT ON TABLE public.bug_reports IS 'User-submitted bug reports with screenshots';
COMMENT ON COLUMN public.bug_reports.id IS 'Unique bug report ID';
COMMENT ON COLUMN public.bug_reports.user_id IS 'User who reported the bug (nullable if anonymous)';
COMMENT ON COLUMN public.bug_reports.description IS 'User description of the bug';
COMMENT ON COLUMN public.bug_reports.page_url IS 'URL where bug occurred';
COMMENT ON COLUMN public.bug_reports.screenshot_url IS 'Screenshot uploaded to Supabase Storage';
COMMENT ON COLUMN public.bug_reports.browser_info IS 'Browser/device information (JSON)';
COMMENT ON COLUMN public.bug_reports.user_agent IS 'User agent string';
COMMENT ON COLUMN public.bug_reports.status IS 'Bug status: new, in_progress, resolved, closed';
COMMENT ON COLUMN public.bug_reports.priority IS 'Bug priority: low, medium, high, critical';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After migration, run these to verify:

-- 1. Check if table exists
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'bug_reports';

-- 2. Check if indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bug_reports';

-- 3. Check if RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'bug_reports';

-- 4. Test insert (replace user_id with your test user)
-- INSERT INTO public.bug_reports (user_id, description, page_url, browser_info)
-- VALUES (
--   'your-user-id-here',
--   'Test bug report',
--   'https://gymmatch-sigma.vercel.app/discover',
--   '{"browser": "Chrome", "version": "120.0"}'::jsonb
-- );

-- 5. Check data
SELECT
  id,
  user_id,
  description,
  page_url,
  status,
  priority,
  created_at
FROM public.bug_reports
ORDER BY created_at DESC
LIMIT 10;
