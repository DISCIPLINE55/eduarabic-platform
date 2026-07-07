
-- Reading progress: tracks which pages & surahs a user has visited
CREATE TABLE IF NOT EXISTS quran_reading_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_number  int NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  pages_visited int[] NOT NULL DEFAULT '{}',
  ayahs_read    int  NOT NULL DEFAULT 0,
  total_ayahs   int  NOT NULL DEFAULT 0,
  last_read_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, surah_number)
);
ALTER TABLE quran_reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own progress"   ON quran_reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own progress" ON quran_reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON quran_reading_progress FOR UPDATE USING (auth.uid() = user_id);
-- Admins/super_admins can read all progress
CREATE POLICY "Admins read all progress"  ON quran_reading_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

-- App settings table (used for password policy + other platform config)
CREATE TABLE IF NOT EXISTS app_settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage settings" ON app_settings
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "All authenticated read settings" ON app_settings FOR SELECT USING (auth.role() = 'authenticated');

-- Seed default password policy
INSERT INTO app_settings (key, value) VALUES (
  'password_policy',
  '{"min_length":8,"require_uppercase":true,"require_lowercase":true,"require_number":true,"require_special":false,"max_length":128}'::jsonb
) ON CONFLICT (key) DO NOTHING;
