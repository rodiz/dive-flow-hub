-- Add student_name column to instructor_students table
ALTER TABLE instructor_students ADD COLUMN student_name TEXT;

-- Update existing records to populate student_name from profiles
UPDATE instructor_students 
SET student_name = CONCAT(p.first_name, ' ', p.last_name)
FROM profiles p 
WHERE instructor_students.student_id = p.user_id 
AND p.first_name IS NOT NULL 
AND p.last_name IS NOT NULL;

-- Update records where only email exists
UPDATE instructor_students 
SET student_name = instructor_students.student_email
WHERE student_name IS NULL;