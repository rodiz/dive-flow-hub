-- Add RLS policy to allow diving centers to create dives for their assigned instructors
CREATE POLICY "Diving centers can create dives for their instructors" 
ON public.dives 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM instructor_assignments ia 
    WHERE ia.instructor_id = dives.instructor_id 
    AND ia.diving_center_id = auth.uid() 
    AND ia.assignment_status = 'active'
  )
);