-- Phase 3: Multimedia Storage & Equipment Management

-- Create storage buckets for multimedia content
INSERT INTO storage.buckets (id, name, public) VALUES ('dive-photos', 'dive-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('equipment-photos', 'equipment-photos', true);

-- Storage policies for dive photos
CREATE POLICY "Users can view dive photos" ON storage.objects
FOR SELECT USING (bucket_id = 'dive-photos');

CREATE POLICY "Users can upload dive photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dive-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their dive photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'dive-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their dive photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dive-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for equipment photos
CREATE POLICY "Users can view equipment photos" ON storage.objects
FOR SELECT USING (bucket_id = 'equipment-photos');

CREATE POLICY "Users can upload equipment photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'equipment-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their equipment photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'equipment-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their equipment photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'equipment-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Equipment management tables
CREATE TABLE public.equipment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'diving', 'safety', 'navigation', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for equipment_types
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;

-- Anyone can view equipment types
CREATE POLICY "Anyone can view equipment types" ON public.equipment_types
FOR SELECT USING (true);

-- Diving centers can manage equipment types
CREATE POLICY "Diving centers can manage equipment types" ON public.equipment_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'diving_center'
  )
);

CREATE TABLE public.equipment_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diving_center_id UUID NOT NULL,
  equipment_type_id UUID NOT NULL,
  serial_number TEXT,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  last_service_date DATE,
  next_service_due DATE,
  condition_rating INTEGER DEFAULT 5 CHECK (condition_rating >= 1 AND condition_rating <= 10),
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'retired'
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for equipment_inventory
ALTER TABLE public.equipment_inventory ENABLE ROW LEVEL SECURITY;

-- Diving centers can manage their equipment
CREATE POLICY "Diving centers can manage their equipment" ON public.equipment_inventory
FOR ALL USING (diving_center_id = auth.uid());

-- Instructors can view equipment from their assigned diving centers
CREATE POLICY "Instructors can view diving center equipment" ON public.equipment_inventory
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM instructor_assignments ia
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE ia.instructor_id = auth.uid() 
    AND ia.diving_center_id = equipment_inventory.diving_center_id
    AND p.role = 'instructor'
  )
);

CREATE TABLE public.equipment_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  condition_before INTEGER DEFAULT 5 CHECK (condition_before >= 1 AND condition_before <= 10),
  condition_after INTEGER DEFAULT 5 CHECK (condition_after >= 1 AND condition_after <= 10),
  issues_reported TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for equipment_usage
ALTER TABLE public.equipment_usage ENABLE ROW LEVEL SECURITY;

-- Users can view equipment usage for their dives
CREATE POLICY "Users can view equipment usage for their dives" ON public.equipment_usage
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dives d
    WHERE d.id = equipment_usage.dive_id 
    AND (d.instructor_id = auth.uid() OR d.student_id = auth.uid())
  )
);

-- Instructors can create equipment usage records
CREATE POLICY "Instructors can create equipment usage" ON public.equipment_usage
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM dives d
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE d.id = equipment_usage.dive_id 
    AND d.instructor_id = auth.uid()
    AND p.role = 'instructor'
  )
);

-- Instructors can update equipment usage for their dives
CREATE POLICY "Instructors can update equipment usage" ON public.equipment_usage
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM dives d
    WHERE d.id = equipment_usage.dive_id 
    AND d.instructor_id = auth.uid()
  )
);

-- Add multimedia fields to dives table
ALTER TABLE public.dives 
ADD COLUMN photos TEXT[], -- Array of photo URLs
ADD COLUMN videos TEXT[], -- Array of video URLs
ADD COLUMN weather_conditions TEXT,
ADD COLUMN sea_conditions TEXT,
ADD COLUMN current_strength INTEGER, -- 1-5 scale
ADD COLUMN current_direction TEXT;

-- Create equipment maintenance logs
CREATE TABLE public.maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL,
  maintenance_type TEXT NOT NULL, -- 'routine', 'repair', 'inspection'
  performed_by UUID NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT NOT NULL,
  cost_cop INTEGER,
  next_maintenance_due DATE,
  maintenance_photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for maintenance_logs
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Diving centers can manage maintenance logs for their equipment
CREATE POLICY "Diving centers can manage maintenance logs" ON public.maintenance_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM equipment_inventory ei
    WHERE ei.id = maintenance_logs.equipment_id 
    AND ei.diving_center_id = auth.uid()
  )
);

-- Instructors can view maintenance logs for equipment they use
CREATE POLICY "Instructors can view maintenance logs" ON public.maintenance_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM equipment_inventory ei
    JOIN instructor_assignments ia ON ia.diving_center_id = ei.diving_center_id
    WHERE ei.id = maintenance_logs.equipment_id 
    AND ia.instructor_id = auth.uid()
  )
);

-- Insert sample equipment types
INSERT INTO public.equipment_types (name, description, category) VALUES
('BCD', 'Buoyancy Control Device', 'diving'),
('Regulator', 'Breathing apparatus', 'diving'),
('Wetsuit', 'Thermal protection', 'diving'),
('Fins', 'Propulsion equipment', 'diving'),
('Mask', 'Vision equipment', 'diving'),
('Tank', 'Air/Nitrox container', 'diving'),
('Weight Belt', 'Ballast system', 'diving'),
('Dive Computer', 'Depth and time tracking', 'safety'),
('Surface Marker Buoy', 'Surface signaling', 'safety'),
('Whistle', 'Emergency signaling', 'safety'),
('Dive Light', 'Illumination equipment', 'navigation'),
('Compass', 'Navigation tool', 'navigation'),
('Underwater Camera', 'Photography equipment', 'photography'),
('GoPro', 'Action camera', 'photography');

-- Create triggers for updated_at
CREATE TRIGGER update_equipment_types_updated_at
BEFORE UPDATE ON public.equipment_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_inventory_updated_at
BEFORE UPDATE ON public.equipment_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_usage_updated_at
BEFORE UPDATE ON public.equipment_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_logs_updated_at
BEFORE UPDATE ON public.maintenance_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();