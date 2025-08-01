-- Add foreign key constraint between dive_participants and profiles
ALTER TABLE public.dive_participants 
ADD CONSTRAINT dive_participants_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;