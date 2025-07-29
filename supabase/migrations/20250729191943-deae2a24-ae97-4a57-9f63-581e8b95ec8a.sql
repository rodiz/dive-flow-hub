-- Crear un perfil para la escuela de buceo MAR diving and rescue
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  role,
  business_name,
  description,
  city,
  country,
  services_offered,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'info@mardivingrescue.com',
  'MAR',
  'Diving Center',
  'diving_center',
  'MAR Diving and Rescue',
  'Centro de buceo especializado en formación y rescate submarino',
  'Cartagena',
  'Colombia',
  ARRAY['Open Water', 'Advanced Open Water', 'Rescue Diver', 'Divemaster', 'Emergency Response'],
  now(),
  now()
);