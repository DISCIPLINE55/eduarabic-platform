ALTER TABLE public.profiles
  ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;

-- Policy: users can update their own must_change_password flag (to clear it)
CREATE POLICY "users_can_clear_own_must_change_password"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
