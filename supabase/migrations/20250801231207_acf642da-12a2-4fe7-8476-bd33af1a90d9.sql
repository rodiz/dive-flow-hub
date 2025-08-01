-- Add additional fields to dive_participants table
ALTER TABLE public.dive_participants 
ADD COLUMN oxygen_amount integer,
ADD COLUMN ballast_weight integer,
ADD COLUMN images text[],
ADD COLUMN videos text[],
ADD COLUMN tank_pressure_start integer,
ADD COLUMN tank_pressure_end integer,
ADD COLUMN wetsuit_thickness integer,
ADD COLUMN gas_mix text DEFAULT 'Air',
ADD COLUMN visibility_conditions integer,
ADD COLUMN water_temperature integer,
ADD COLUMN current_strength integer,
ADD COLUMN safety_stop_time integer;