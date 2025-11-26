-- Migration: Create bug-reports storage bucket for screenshots
-- Author: GymMatch Team
-- Date: 2025-11-26
-- Purpose: Enable screenshot uploads for bug reports

-- ============================================================================
-- STORAGE BUCKET CREATION
-- ============================================================================

-- Create bug-reports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-reports', 'bug-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can upload to bug-reports
CREATE POLICY "Anyone can upload bug report screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'bug-reports');

-- Policy: Anyone can view bug report screenshots
CREATE POLICY "Anyone can view bug report screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bug-reports');

-- Policy: Admin can delete bug report screenshots
CREATE POLICY "Admin can delete bug report screenshots"
ON storage.objects
FOR DELETE
USING (bucket_id = 'bug-reports');
