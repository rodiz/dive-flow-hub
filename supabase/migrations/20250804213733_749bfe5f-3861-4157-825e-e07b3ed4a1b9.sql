-- Add RLS policy to allow diving centers to view their instructors' students
CREATE POLICY "Diving centers can view their instructors' students" 
ON public.instructor_students 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM instructor_assignments ia 
    WHERE ia.instructor_id = instructor_students.instructor_id 
    AND ia.diving_center_id = auth.uid() 
    AND ia.assignment_status = 'active'
  )
);