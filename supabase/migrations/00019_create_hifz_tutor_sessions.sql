
CREATE TABLE IF NOT EXISTS public.hifz_tutor_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  surah_number     int  NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  surah_name       text NOT NULL,
  ayah_from        int  NOT NULL DEFAULT 1,
  ayah_to          int  NOT NULL DEFAULT 1,
  self_rating      int  CHECK (self_rating BETWEEN 1 AND 5),
  self_notes       text,
  ai_feedback      text,
  audio_url        text,
  duration_seconds int,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hifz_tutor_student ON public.hifz_tutor_sessions(student_id, created_at DESC);

ALTER TABLE public.hifz_tutor_sessions ENABLE ROW LEVEL SECURITY;

-- Students can manage their own sessions
CREATE POLICY "student_own_sessions" ON public.hifz_tutor_sessions
  FOR ALL USING (student_id = auth.uid());

-- Teachers/admins can read sessions for students in their org
CREATE POLICY "teacher_read_org_sessions" ON public.hifz_tutor_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = hifz_tutor_sessions.student_id
        AND p.organization_id = get_user_org(auth.uid())
        AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
    )
  );
