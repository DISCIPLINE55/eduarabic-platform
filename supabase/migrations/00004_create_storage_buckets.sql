
-- Create storage buckets for EduArabic
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('audio_submissions', 'audio_submissions', false, 20971520,
   ARRAY['audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm','audio/aac']),
  ('lesson_resources',  'lesson_resources',  false, 52428800,
   ARRAY['application/pdf','audio/mpeg','video/mp4','video/webm','text/plain','image/jpeg','image/png']),
  ('avatars',           'avatars',           true,  2097152,
   ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies — audio_submissions
CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio_submissions');

CREATE POLICY "Authenticated users can view audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audio_submissions');

CREATE POLICY "Owners can delete audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'audio_submissions' AND owner = auth.uid());

-- Storage RLS policies — lesson_resources
CREATE POLICY "Authenticated users can upload lesson resources"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lesson_resources');

CREATE POLICY "Authenticated users can view lesson resources"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lesson_resources');

-- Storage RLS policies — avatars
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Owners can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());
