-- Create table for instructor-student relationships independent of course enrollments
CREATE TABLE public.instructor_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  student_id UUID NULL, -- NULL if student hasn't registered yet
  student_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'invited'
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, student_email)
);

-- Enable RLS
ALTER TABLE public.instructor_students ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Instructors can manage their students"
ON public.instructor_students
FOR ALL
USING (instructor_id = auth.uid());

CREATE POLICY "Students can view their instructor relationships"
ON public.instructor_students
FOR SELECT
USING (student_id = auth.uid() OR student_email = auth.email());

-- Add trigger for updated_at
CREATE TRIGGER update_instructor_students_updated_at
BEFORE UPDATE ON public.instructor_students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for student invitations
CREATE TABLE public.student_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, email)
);

-- Enable RLS for invitations
ALTER TABLE public.student_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their invitations"
ON public.student_invitations
FOR ALL
USING (instructor_id = auth.uid());

CREATE POLICY "Anyone can view valid invitations by token"
ON public.student_invitations
FOR SELECT
USING (token IS NOT NULL AND expires_at > now() AND used_at IS NULL);