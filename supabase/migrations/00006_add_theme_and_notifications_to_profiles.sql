
-- Add theme preference
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Add notification preferences as JSONB with sensible defaults
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{
  "email_announcements": true,
  "email_assessment_results": true,
  "email_attendance_updates": true,
  "email_fee_reminders": true,
  "email_hifz_feedback": true,
  "push_announcements": true,
  "push_assessment_results": true,
  "push_attendance_updates": false,
  "push_fee_reminders": true,
  "push_hifz_feedback": true
}'::jsonb;

-- Add avatar_url if not exists (already in schema but ensure)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Enable realtime on announcements table if not already
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
