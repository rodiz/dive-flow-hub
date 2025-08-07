-- Create dive_reports table for individual and historical dive reports
CREATE TABLE public.dive_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id),
  instructor_id UUID REFERENCES public.profiles(user_id),
  report_type TEXT NOT NULL CHECK (report_type IN ('single_dive', 'historical')),
  pdf_url TEXT,
  file_name TEXT NOT NULL,
  dive_ids TEXT[] NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dive_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for dive reports
CREATE POLICY "Users can view their own dive reports" 
ON public.dive_reports 
FOR SELECT 
USING (auth.uid() = student_id OR auth.uid() = instructor_id);

CREATE POLICY "Instructors can create dive reports for their students" 
ON public.dive_reports 
FOR INSERT 
WITH CHECK (auth.uid() = instructor_id OR auth.uid() = student_id);

CREATE POLICY "Users can update their own dive reports" 
ON public.dive_reports 
FOR UPDATE 
USING (auth.uid() = student_id OR auth.uid() = instructor_id);

CREATE POLICY "Users can delete their own dive reports" 
ON public.dive_reports 
FOR DELETE 
USING (auth.uid() = student_id OR auth.uid() = instructor_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dive_reports_updated_at
BEFORE UPDATE ON public.dive_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();