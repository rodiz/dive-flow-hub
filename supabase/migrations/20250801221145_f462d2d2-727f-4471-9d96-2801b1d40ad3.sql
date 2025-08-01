-- Create dive_participants table to link dives with multiple students
CREATE TABLE public.dive_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_id UUID NOT NULL,
  student_id UUID NOT NULL,
  instructor_id UUID NOT NULL,
  depth_achieved INTEGER,
  bottom_time INTEGER,
  equipment_check BOOLEAN DEFAULT false,
  medical_check BOOLEAN DEFAULT false,
  individual_notes TEXT,
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  skills_completed JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dive_id, student_id)
);

-- Enable RLS
ALTER TABLE public.dive_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for dive_participants
CREATE POLICY "Instructors can manage their dive participants" 
ON public.dive_participants 
FOR ALL 
USING (instructor_id = auth.uid());

CREATE POLICY "Students can view their own dive participation" 
ON public.dive_participants 
FOR SELECT 
USING (student_id = auth.uid());

-- Remove student_id from dives table since we'll use dive_participants
ALTER TABLE public.dives DROP COLUMN IF EXISTS student_id;

-- Update dives table to be more focused on the dive itself
ALTER TABLE public.dives 
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS actual_participants INTEGER DEFAULT 0;

-- Create trigger for automatic timestamp updates on dive_participants
CREATE TRIGGER update_dive_participants_updated_at
BEFORE UPDATE ON public.dive_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update participant count
CREATE OR REPLACE FUNCTION public.update_dive_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.dives 
    SET actual_participants = (
      SELECT COUNT(*) FROM public.dive_participants 
      WHERE dive_id = NEW.dive_id
    )
    WHERE id = NEW.dive_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.dives 
    SET actual_participants = (
      SELECT COUNT(*) FROM public.dive_participants 
      WHERE dive_id = OLD.dive_id
    )
    WHERE id = OLD.dive_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update participant count
CREATE TRIGGER update_participant_count_trigger
AFTER INSERT OR DELETE ON public.dive_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_dive_participant_count();