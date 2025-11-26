-- Migration: Create bug-reports storage bucket for screenshots
-- Author: GymMatch Team
-- Date: 2025-11-26
-- Purpose: Enable screenshot uploads for bug reports

-- ============================================================================
-- STORAGE BUCKET CREATION (Fixed Version)
-- ============================================================================

-- Create bug-reports bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-reports', 'bug-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Note: storage.objects RLS is already enabled by Supabase
-- We just need to add our policies

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can upload bug report screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view bug report screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete bug report screenshots" ON storage.objects;

-- Policy: Anyone can upload to bug-reports bucket
CREATE POLICY "Anyone can upload bug report screenshots"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'bug-reports');

-- Policy: Anyone can view bug report screenshots
CREATE POLICY "Anyone can view bug report screenshots"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'bug-reports');

-- Policy: Authenticated users can delete their own screenshots
CREATE POLICY "Users can delete their own bug report screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'bug-reports' AND auth.uid()::text = owner);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if bucket was created
SELECT id, name, public
FROM storage.buckets
WHERE id = 'bug-reports';

-- Check if policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%bug report%';
