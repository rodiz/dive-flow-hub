-- Fase 1: Expandir roles y sistema de cursos

-- 1. Agregar rol diving_center al enum existente
ALTER TYPE user_role ADD VALUE 'diving_center';

-- 2. Tabla para verificaciones de instructores
CREATE TABLE public.instructor_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.profiles(user_id),
  certification_document_url TEXT,
  certification_number TEXT,
  certification_agency TEXT NOT NULL,
  certification_level TEXT NOT NULL,
  expiration_date DATE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by UUID REFERENCES public.profiles(user_id),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabla para asignaciones instructor-centro
CREATE TABLE public.instructor_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diving_center_id UUID NOT NULL REFERENCES public.profiles(user_id),
  instructor_id UUID NOT NULL REFERENCES public.profiles(user_id),
  assignment_status TEXT NOT NULL DEFAULT 'active' CHECK (assignment_status IN ('active', 'inactive', 'pending')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(diving_center_id, instructor_id)
);

-- 4. Tabla de cursos
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE, -- OW, AOW, RES, DM, etc.
  description TEXT,
  certification_agency TEXT NOT NULL,
  prerequisites TEXT[], -- Array de códigos de cursos prerequisitos
  min_dives_required INTEGER DEFAULT 0,
  max_depth_limit INTEGER,
  theory_hours INTEGER DEFAULT 0,
  practical_hours INTEGER DEFAULT 0,
  price_cop INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tabla para inscripciones de estudiantes a cursos
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id),
  student_id UUID NOT NULL REFERENCES public.profiles(user_id),
  instructor_id UUID NOT NULL REFERENCES public.profiles(user_id),
  diving_center_id UUID REFERENCES public.profiles(user_id),
  enrollment_status TEXT NOT NULL DEFAULT 'active' CHECK (enrollment_status IN ('active', 'completed', 'cancelled', 'paused')),
  start_date DATE NOT NULL,
  completion_date DATE,
  certification_issued BOOLEAN DEFAULT false,
  certification_number TEXT,
  final_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id, start_date)
);

-- 6. Agregar course_id a la tabla dives existente
ALTER TABLE public.dives 
ADD COLUMN course_id UUID REFERENCES public.courses(id),
ADD COLUMN equipment_type TEXT,
ADD COLUMN weight_used INTEGER, -- peso en kg
ADD COLUMN tank_pressure_start INTEGER, -- presión inicial en bar
ADD COLUMN tank_pressure_end INTEGER, -- presión final en bar
ADD COLUMN gas_mix TEXT DEFAULT 'Air', -- tipo de gas (Air, Nitrox, etc.)
ADD COLUMN wetsuit_type TEXT,
ADD COLUMN wetsuit_thickness INTEGER; -- grosor en mm

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE public.instructor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Triggers para updated_at
CREATE TRIGGER update_instructor_verifications_updated_at
  BEFORE UPDATE ON public.instructor_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instructor_assignments_updated_at
  BEFORE UPDATE ON public.instructor_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- POLÍTICAS RLS

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