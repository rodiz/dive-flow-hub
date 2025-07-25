-- Paso 2: Crear todas las tablas y relaciones restantes

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

-- 6. Agregar campos a la tabla dives existente
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