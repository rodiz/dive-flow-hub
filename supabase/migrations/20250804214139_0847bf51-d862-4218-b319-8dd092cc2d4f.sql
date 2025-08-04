-- Drop the existing restrictive instructor policy
DROP POLICY IF EXISTS "Instructors can create dives" ON public.dives;

-- Create a new combined policy that allows both instructors and diving centers to create dives
CREATE POLICY "Allow dive creation by instructors and diving centers" 
ON public.dives 
FOR INSERT 
WITH CHECK (
  -- Instructors can create their own dives
  (instructor_id = auth.uid() AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'instructor'::user_role
  ))
  OR
  -- Diving centers can create dives for their assigned instructors
  (EXISTS (
    SELECT 1 FROM instructor_assignments ia 
    WHERE ia.instructor_id = dives.instructor_id 
    AND ia.diving_center_id = auth.uid() 
    AND ia.assignment_status = 'active'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'diving_center'::user_role
    )
  ))
);

-- Remove the duplicate policy we created earlier
DROP POLICY IF EXISTS "Diving centers can create dives for their instructors" ON public.dives;