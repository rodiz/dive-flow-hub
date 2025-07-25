-- Fase 2: Storage y sistema de verificación

-- Crear bucket para documentos de certificación
INSERT INTO storage.buckets (id, name, public) 
VALUES ('instructor-certifications', 'instructor-certifications', false);

-- Políticas para el bucket de certificaciones
CREATE POLICY "Instructors can upload their certification documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instructor-certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Instructors can view their own certification documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'instructor-certifications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Diving centers can view their instructors' documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'instructor-certifications'
  AND EXISTS (
    SELECT 1 FROM public.instructor_assignments ia
    WHERE ia.instructor_id::text = (storage.foldername(name))[1]
    AND ia.diving_center_id = auth.uid()
    AND ia.assignment_status = 'active'
  )
);

CREATE POLICY "Instructors can update their certification documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'instructor-certifications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can delete their certification documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'instructor-certifications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);