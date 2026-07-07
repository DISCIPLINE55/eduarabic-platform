
-- Insert demo institution
INSERT INTO public.institutions (id, name, code, contact_email, contact_phone, address, region, is_active, subscription_status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Masjid Al-Quds Institute', 'MQI', 'admin@mqi.edu.gh', '+233501234567', '123 Islamic Way, Accra', 'Greater Accra', true, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Al-Iman School', 'AIS', 'admin@ais.edu.gh', '+233509876543', '45 Faith Street, Kumasi', 'Ashanti', true, 'active');

-- Insert demo hifz surah reference data is handled in app logic
