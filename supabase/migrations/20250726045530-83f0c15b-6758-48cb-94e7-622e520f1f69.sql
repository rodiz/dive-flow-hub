-- Fix infinite recursion in profiles RLS policy
-- Remove the problematic policy first
DROP POLICY IF EXISTS "Instructors can view all student profiles" ON public.profiles;

-- Create a better policy that doesn't cause recursion
-- This allows instructors to view student profiles when they have a direct relationship
CREATE POLICY "Instructors can view related profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (
    -- Allow instructors to see profiles of their students through enrollments
    auth.uid() IN (
      SELECT instructor_id 
      FROM course_enrollments 
      WHERE student_id = user_id
    )
  ) OR
  (
    -- Allow diving centers to see instructor profiles they've assigned
    auth.uid() IN (
      SELECT diving_center_id 
      FROM instructor_assignments 
      WHERE instructor_id = user_id
    )
  )
);