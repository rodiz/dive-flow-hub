-- Create storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf-reports', 'pdf-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for PDF report access
CREATE POLICY "Users can view their own PDF reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdf-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "System can create PDF reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdf-reports');

CREATE POLICY "System can update PDF reports" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pdf-reports');

CREATE POLICY "System can delete PDF reports" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pdf-reports');