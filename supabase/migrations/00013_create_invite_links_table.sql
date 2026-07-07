-- invite_links table
CREATE TABLE IF NOT EXISTS invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin','secretary','teacher','parent','student')),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL,
  max_uses integer DEFAULT NULL,
  uses_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_manage_invite_links" ON invite_links
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Anyone can read a specific invite link by token (for the signup flow)
CREATE POLICY "public_read_invite_by_token" ON invite_links
  FOR SELECT TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON invite_links(token);
CREATE INDEX IF NOT EXISTS idx_invite_links_org ON invite_links(organization_id);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_invite_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invite_links_updated_at
  BEFORE UPDATE ON invite_links
  FOR EACH ROW EXECUTE FUNCTION update_invite_links_updated_at();