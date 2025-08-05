-- Drop all existing policies for dives table
DROP POLICY IF EXISTS "diving_centers_can_create_dives" ON public.dives;
DROP POLICY IF EXISTS "Instructors can update their dives" ON public.dives;
DROP POLICY IF EXISTS "Instructors can view their own dives" ON public.dives;
DROP POLICY IF EXISTS "Students can view dives they participate in" ON public.dives;

-- Create comprehensive policies for dives table
-- 1. Allow instructors to create their own dives
CREATE POLICY "instructors_create_own_dives" 
ON public.dives 
FOR INSERT 
WITH CHECK (instructor_id = auth.uid());

-- 2. Allow diving centers to create dives for their assigned instructors
CREATE POLICY "diving_centers_create_instructor_dives" 
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

-- 3. Allow instructors to view their own dives
CREATE POLICY "instructors_view_own_dives" 
ON public.dives 
FOR SELECT 
USING (instructor_id = auth.uid());

-- 4. Allow diving centers to view dives of their assigned instructors
CREATE POLICY "diving_centers_view_instructor_dives" 
ON public.dives 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM instructor_assignments ia 
    WHERE ia.instructor_id = dives.instructor_id 
    AND ia.diving_center_id = auth.uid() 
    AND ia.assignment_status = 'active'
  )
);

-- 5. Allow students to view dives they participate in
CREATE POLICY "students_view_participation_dives" 
ON public.dives 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM dive_participants dp 
    WHERE dp.dive_id = dives.id 
    AND dp.student_id = auth.uid()
  )
);

-- 6. Allow instructors to update their own dives
CREATE POLICY "instructors_update_own_dives" 
ON public.dives 
FOR UPDATE 
USING (instructor_id = auth.uid());

-- 7. Allow diving centers to update dives of their assigned instructors
CREATE POLICY "diving_centers_update_instructor_dives" 
ON public.dives 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM instructor_assignments ia 
    WHERE ia.instructor_id = dives.instructor_id 
    AND ia.diving_center_id = auth.uid() 
    AND ia.assignment_status = 'active'
  )
);