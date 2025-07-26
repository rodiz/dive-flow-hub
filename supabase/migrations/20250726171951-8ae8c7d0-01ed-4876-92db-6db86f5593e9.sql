-- Agregar campos específicos para centros de buceo en la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_license TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Colombia',
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS max_students_per_instructor INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS operating_hours JSONB,
ADD COLUMN IF NOT EXISTS services_offered TEXT[];

-- Crear tabla para especialidades de centros de buceo
CREATE TABLE IF NOT EXISTS public.diving_center_specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diving_center_id UUID NOT NULL,
  specialty_name TEXT NOT NULL,
  certification_agency TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_diving_center FOREIGN KEY (diving_center_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

-- Enable RLS on diving_center_specialties
ALTER TABLE public.diving_center_specialties ENABLE ROW LEVEL SECURITY;

-- Create policies for diving_center_specialties
CREATE POLICY "Diving centers can manage their specialties" 
ON public.diving_center_specialties 
FOR ALL 
USING (diving_center_id = auth.uid());

CREATE POLICY "Anyone can view diving center specialties" 
ON public.diving_center_specialties 
FOR SELECT 
USING (active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_diving_center_specialties_updated_at
BEFORE UPDATE ON public.diving_center_specialties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear tabla para horarios de operación
CREATE TABLE IF NOT EXISTS public.diving_center_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diving_center_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo, 6 = Sábado
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_diving_center_schedule FOREIGN KEY (diving_center_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  UNIQUE(diving_center_id, day_of_week)
);

-- Enable RLS on diving_center_schedules
ALTER TABLE public.diving_center_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for diving_center_schedules
CREATE POLICY "Diving centers can manage their schedules" 
ON public.diving_center_schedules 
FOR ALL 
USING (diving_center_id = auth.uid());

CREATE POLICY "Anyone can view diving center schedules" 
ON public.diving_center_schedules 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_diving_center_schedules_updated_at
BEFORE UPDATE ON public.diving_center_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();