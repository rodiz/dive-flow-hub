-- Create table for course completion reports
CREATE TABLE public.course_completion_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  instructor_id UUID NOT NULL,
  course_id UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  report_data JSONB NOT NULL DEFAULT '{}',
  multimedia_urls JSONB DEFAULT '[]',
  certificate_url TEXT,
  qr_code_url TEXT,
  total_dives INTEGER DEFAULT 0,
  total_bottom_time INTEGER DEFAULT 0,
  max_depth_achieved INTEGER DEFAULT 0,
  skills_assessment JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_completion_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can view their own reports" 
ON public.course_completion_reports 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Instructors can create and view their students' reports" 
ON public.course_completion_reports 
FOR ALL 
USING (instructor_id = auth.uid());

CREATE POLICY "Diving centers can view their instructors' reports" 
ON public.course_completion_reports 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM instructor_assignments ia
  WHERE ia.instructor_id = course_completion_reports.instructor_id 
  AND ia.diving_center_id = auth.uid()
));

-- Create report templates table
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  certification_agency TEXT NOT NULL,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for templates
CREATE POLICY "Anyone can view active templates" 
ON public.report_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Diving centers can manage templates" 
ON public.report_templates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'diving_center'
));

-- Add completion tracking fields to course_enrollments
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS skills_completed JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS report_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS report_sent_at TIMESTAMP WITH TIME ZONE;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_course_completion_reports_updated_at
BEFORE UPDATE ON public.course_completion_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default report templates
INSERT INTO public.report_templates (name, certification_agency, template_data) VALUES
('PADI Open Water Diver', 'PADI', '{"sections": ["course_summary", "dive_log", "skills_assessment", "multimedia_gallery", "certificate"], "skills": ["buoyancy_control", "mask_clearing", "regulator_recovery", "underwater_navigation", "safety_procedures"]}'),
('SSI Open Water Diver', 'SSI', '{"sections": ["course_summary", "dive_log", "skills_assessment", "multimedia_gallery", "certificate"], "skills": ["buoyancy_control", "equipment_handling", "emergency_procedures", "navigation", "marine_awareness"]}'),
('NAUI Scuba Diver', 'NAUI', '{"sections": ["course_summary", "dive_log", "skills_assessment", "multimedia_gallery", "certificate"], "skills": ["water_skills", "equipment_use", "dive_planning", "safety_skills", "environmental_awareness"]}');