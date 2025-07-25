-- Create enum for dive certification levels
CREATE TYPE dive_certification AS ENUM ('open_water', 'advanced', 'rescue', 'divemaster', 'instructor');

-- Create enum for dive types
CREATE TYPE dive_type AS ENUM ('training', 'fun', 'certification', 'specialty');

-- Create table for dive sites
CREATE TABLE public.dive_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  max_depth INTEGER NOT NULL,
  water_temperature INTEGER,
  visibility INTEGER,
  description TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for dives
CREATE TABLE public.dives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES profiles(user_id),
  student_id UUID NOT NULL REFERENCES profiles(user_id),
  dive_site_id UUID NOT NULL REFERENCES dive_sites(id),
  dive_date DATE NOT NULL,
  dive_time TIME,
  depth_achieved INTEGER NOT NULL,
  bottom_time INTEGER NOT NULL, -- in minutes
  surface_interval INTEGER, -- in minutes
  dive_type dive_type NOT NULL DEFAULT 'training',
  certification_level dive_certification,
  water_temperature INTEGER,
  visibility INTEGER,
  equipment_check BOOLEAN DEFAULT false,
  medical_check BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for medical records
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(user_id),
  instructor_id UUID NOT NULL REFERENCES profiles(user_id),
  dive_id UUID REFERENCES dives(id),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  allergies TEXT,
  medications TEXT,
  medical_conditions TEXT,
  fitness_level INTEGER DEFAULT 5 CHECK (fitness_level >= 1 AND fitness_level <= 10),
  cleared_to_dive BOOLEAN DEFAULT true,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.dive_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dive_sites
CREATE POLICY "Anyone can view dive sites" 
ON public.dive_sites 
FOR SELECT 
USING (true);

CREATE POLICY "Instructors can manage dive sites" 
ON public.dive_sites 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'instructor'
));

-- RLS Policies for dives
CREATE POLICY "Users can view their own dives" 
ON public.dives 
FOR SELECT 
USING (instructor_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Instructors can create dives" 
ON public.dives 
FOR INSERT 
WITH CHECK (instructor_id = auth.uid() AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'instructor'
));

CREATE POLICY "Instructors can update their dives" 
ON public.dives 
FOR UPDATE 
USING (instructor_id = auth.uid());

-- RLS Policies for medical_records
CREATE POLICY "Students can view their own medical records" 
ON public.medical_records 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Instructors can view their students' medical records" 
ON public.medical_records 
FOR SELECT 
USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can create medical records" 
ON public.medical_records 
FOR INSERT 
WITH CHECK (instructor_id = auth.uid() AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'instructor'
));

CREATE POLICY "Instructors can update medical records they created" 
ON public.medical_records 
FOR UPDATE 
USING (instructor_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_dive_sites_updated_at
BEFORE UPDATE ON public.dive_sites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dives_updated_at
BEFORE UPDATE ON public.dives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample dive sites
INSERT INTO public.dive_sites (name, location, max_depth, water_temperature, visibility, description, difficulty_level) VALUES
('Arrecife El Paraíso', 'Islas del Rosario, Cartagena', 25, 28, 15, 'Hermoso arrecife de coral con gran biodiversidad marina', 2),
('Cueva Azul', 'San Andrés', 18, 27, 20, 'Impresionante cueva submarina con aguas cristalinas', 3),
('Jardín de Coral', 'Santa Marta', 30, 26, 12, 'Extenso jardín de coral blando y duro', 4),
('El Naufragio', 'Providencia', 35, 28, 18, 'Pecio histórico del siglo XIX', 5),
('Bahía Concha', 'Tayrona', 15, 25, 10, 'Sitio perfecto para buzos principiantes', 1);