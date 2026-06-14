
-- Allow super_admin to read all profiles across all institutions
CREATE POLICY "super_admin_can_read_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'super_admin'
    )
  );

-- Allow admin to read all profiles in their org
CREATE POLICY "admin_can_read_org_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'admin'
      AND p2.organization_id = profiles.organization_id
    )
  );

-- Allow super_admin to update any profile role/org
CREATE POLICY "super_admin_can_update_any_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'super_admin'
    )
  );

-- Allow admin to update profiles in their org (but not other admins or super_admins)
CREATE POLICY "admin_can_update_org_member_profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'admin'
      AND p2.organization_id = profiles.organization_id
    )
    AND profiles.role NOT IN ('super_admin', 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'admin'
      AND p2.organization_id = profiles.organization_id
    )
  );

-- Allow super_admin to insert profiles (for creating new admin accounts)
CREATE POLICY "super_admin_can_insert_profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'super_admin'
    )
  );

-- Allow admin to insert profiles in their org
CREATE POLICY "admin_can_insert_org_profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'admin'
      AND p2.organization_id = organization_id
    )
    AND role NOT IN ('super_admin', 'admin')
  );

-- Ensure audio_submissions storage bucket exists and has proper policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio_submissions',
  'audio_submissions',
  true,
  52428800,
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/m4a', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for audio_submissions bucket
CREATE POLICY "authenticated_upload_audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio_submissions');

CREATE POLICY "public_read_audio"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'audio_submissions');

CREATE POLICY "authenticated_delete_own_audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'audio_submissions' AND owner = auth.uid());
