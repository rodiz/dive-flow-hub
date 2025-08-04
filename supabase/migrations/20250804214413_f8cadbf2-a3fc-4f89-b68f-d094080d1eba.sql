-- Add policy to allow diving centers to create dive participants for their instructor's dives
CREATE POLICY "Diving centers can create dive participants for their instructors" 
ON public.dive_participants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM instructor_assignments ia 
    WHERE ia.instructor_id = dive_participants.instructor_id 
    AND ia.diving_center_id = auth.uid() 
    AND ia.assignment_status = 'active'
  )
);