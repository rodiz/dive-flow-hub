-- Crear la asignación del instructor al centro de buceo existente
INSERT INTO instructor_assignments (
  instructor_id,
  diving_center_id,
  assignment_status,
  assigned_at
) VALUES (
  '4a25e8ee-d2ef-491f-af76-4791f18c911e', -- ID del instructor cesar nates
  '2f665ccb-1c9d-44e0-9c23-4fca21486e72', -- ID del centro MAR Diving and Rescue
  'active',
  now()
);