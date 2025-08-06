-- Create student multimedia bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-multimedia', 'student-multimedia', true);

-- Create RLS policies for student multimedia
CREATE POLICY "Instructors can upload student multimedia" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'student-multimedia' 
  AND EXISTS (
    SELECT 1 FROM instructor_students 
    WHERE instructor_id = auth.uid() 
    AND student_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Instructors can view student multimedia" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'student-multimedia' 
  AND (
    EXISTS (
      SELECT 1 FROM instructor_students 
      WHERE instructor_id = auth.uid() 
      AND student_id::text = (storage.foldername(name))[1]
    )
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Students can view their own multimedia" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'student-multimedia' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can update student multimedia" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'student-multimedia' 
  AND EXISTS (
    SELECT 1 FROM instructor_students 
    WHERE instructor_id = auth.uid() 
    AND student_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Instructors can delete student multimedia" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'student-multimedia' 
  AND EXISTS (
    SELECT 1 FROM instructor_students 
    WHERE instructor_id = auth.uid() 
    AND student_id::text = (storage.foldername(name))[1]
  )
);