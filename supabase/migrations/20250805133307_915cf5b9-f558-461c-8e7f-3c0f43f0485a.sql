-- Remove the current complex policy for dive creation
DROP POLICY IF EXISTS "Allow dive creation by instructors and diving centers" ON public.dives;

-- Create a simple policy that allows diving centers to create dives for their assigned instructors
CREATE POLICY "diving_centers_can_create_dives" 
ON public.dives 
FOR INSERT 
WITH CHECK (
  -- Allow instructors to create their own dives
  (instructor_id = auth.uid()) 
  OR 
  -- Allow diving centers to create dives for their assigned instructors
  (EXISTS (
    SELECT 1 
    FROM instructor_assignments ia 
    WHERE ia.instructor_id = dives.instructor_id 
    AND ia.diving_center_id = auth.uid() 
    AND ia.assignment_status = 'active'
  ))
);