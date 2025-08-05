-- Remove duplicate/conflicting policy
DROP POLICY IF EXISTS "Diving centers can create dive participants for their instructo" ON public.dive_participants;

-- Remove the existing conflicting policy  
DROP POLICY IF EXISTS "Diving centers can create dive participants for their instructors" ON public.dive_participants;

-- Create a proper policy that allows diving centers to create dive participants
CREATE POLICY "diving_centers_create_dive_participants" 
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