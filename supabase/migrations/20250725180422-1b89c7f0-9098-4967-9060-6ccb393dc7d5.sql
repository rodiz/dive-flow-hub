-- Paso 3: Agregar todas las políticas RLS

-- instructor_verifications
CREATE POLICY "Instructors can view their own verifications"
ON public.instructor_verifications FOR SELECT
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can create their own verifications"
ON public.instructor_verifications FOR INSERT
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Diving centers can view their instructors' verifications"
ON public.instructor_verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.instructor_assignments ia
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE ia.instructor_id = instructor_verifications.instructor_id
    AND ia.diving_center_id = auth.uid()
    AND p.role = 'diving_center'
  )
);

CREATE POLICY "Diving centers can update verification status"
ON public.instructor_verifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.instructor_assignments ia
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE ia.instructor_id = instructor_verifications.instructor_id
    AND ia.diving_center_id = auth.uid()
    AND p.role = 'diving_center'
  )
);

-- instructor_assignments
CREATE POLICY "Diving centers can manage their instructor assignments"
ON public.instructor_assignments FOR ALL
USING (diving_center_id = auth.uid());

CREATE POLICY "Instructors can view their assignments"
ON public.instructor_assignments FOR SELECT
USING (instructor_id = auth.uid());

-- courses
CREATE POLICY "Anyone can view active courses"
ON public.courses FOR SELECT
USING (active = true);

CREATE POLICY "Diving centers can manage courses"
ON public.courses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'diving_center'
  )
);

-- course_enrollments
CREATE POLICY "Students can view their own enrollments"
ON public.course_enrollments FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Instructors can view their course enrollments"
ON public.course_enrollments FOR SELECT
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can create enrollments"
ON public.course_enrollments FOR INSERT
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Instructors can update their course enrollments"
ON public.course_enrollments FOR UPDATE
USING (instructor_id = auth.uid());

CREATE POLICY "Diving centers can view their enrollments"
ON public.course_enrollments FOR SELECT
USING (diving_center_id = auth.uid());

-- Insertar cursos básicos
INSERT INTO public.courses (name, code, description, certification_agency, prerequisites, min_dives_required, max_depth_limit, theory_hours, practical_hours, price_cop) VALUES
('Open Water Diver', 'OW', 'Certificación básica para buceo recreativo hasta 18 metros', 'PADI', '{}', 0, 18, 8, 16, 450000),
('Advanced Open Water', 'AOW', 'Certificación avanzada para buceo hasta 30 metros', 'PADI', '{"OW"}', 5, 30, 4, 12, 550000),
('Rescue Diver', 'RES', 'Curso de rescate y primeros auxilios subacuáticos', 'PADI', '{"AOW"}', 20, 30, 12, 16, 650000),
('Divemaster', 'DM', 'Primera certificación profesional', 'PADI', '{"RES"}', 40, 40, 40, 60, 1200000),
('Enriched Air Nitrox', 'EAN', 'Especialidad en buceo con aire enriquecido', 'PADI', '{"OW"}', 0, 40, 6, 4, 350000),
('Deep Diver', 'DEEP', 'Especialidad en buceo profundo hasta 40m', 'PADI', '{"AOW"}', 15, 40, 4, 8, 450000);