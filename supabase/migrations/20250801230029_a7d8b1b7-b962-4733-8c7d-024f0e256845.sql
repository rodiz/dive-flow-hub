-- Update RLS policy to allow instructors to view their students' profiles
DROP POLICY IF EXISTS "Instructors can view related profiles" ON public.profiles;

CREATE POLICY "Instructors can view related profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() IN ( 
    SELECT course_enrollments.instructor_id
    FROM course_enrollments
    WHERE (course_enrollments.student_id = profiles.user_id)
  )) OR 
  (auth.uid() IN ( 
    SELECT instructor_assignments.diving_center_id
    FROM instructor_assignments
    WHERE (instructor_assignments.instructor_id = profiles.user_id)
  )) OR
  (auth.uid() IN (
    SELECT instructor_students.instructor_id
    FROM instructor_students
    WHERE (instructor_students.student_id = profiles.user_id)
  ))
);