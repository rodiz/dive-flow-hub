-- Add foreign key constraint between dive_participants and dives
ALTER TABLE public.dive_participants 
ADD CONSTRAINT dive_participants_dive_id_fkey 
FOREIGN KEY (dive_id) REFERENCES public.dives(id) ON DELETE CASCADE;