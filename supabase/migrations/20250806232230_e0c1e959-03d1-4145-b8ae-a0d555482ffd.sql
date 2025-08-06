-- Add PDF URL column to course_completion_reports table
ALTER TABLE public.course_completion_reports 
ADD COLUMN pdf_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.course_completion_reports.pdf_url IS 'URL to the generated PDF report file stored in Supabase Storage';