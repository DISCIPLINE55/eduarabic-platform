-- ============================================================
-- SEED DATA for Masjid Al-Quds Institute (org: 11111111-...)
-- ============================================================

-- 1. Classes
INSERT INTO public.classes (id, organization_id, name, description, academic_level, is_weekend_class, is_active, created_at, updated_at)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Hifz Class A', 'Primary Quran memorization class', 'Beginner', false, true, now(), now()),
  ('aaaaaaaa-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'Hifz Class B', 'Intermediate Quran memorization class', 'Intermediate', false, true, now(), now()),
  ('aaaaaaaa-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'Tajweed Class', 'Tajweed and recitation rules', 'Advanced', false, true, now(), now()),
  ('aaaaaaaa-0001-0001-0001-000000000004', '11111111-1111-1111-1111-111111111111', 'Weekend Hifz', 'Weekend intensive memorization', 'All Levels', true, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 2. Students
INSERT INTO public.students (id, organization_id, student_id_code, full_name, gender, date_of_birth, guardian_name, guardian_phone, status, enrollment_date, created_at, updated_at)
VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'MQI-2024-001', 'Abdurrahman Yusuf Mensah', 'male',   '2010-03-15', 'Yusuf Mensah',    '0244123456', 'active', '2024-09-01', now(), now()),
  ('bbbbbbbb-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'MQI-2024-002', 'Fatimah Amina Asante',      'female', '2011-07-22', 'Amina Asante',    '0244234567', 'active', '2024-09-01', now(), now()),
  ('bbbbbbbb-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'MQI-2024-003', 'Ibrahim Khalid Boateng',    'male',   '2009-11-08', 'Khalid Boateng',  '0244345678', 'active', '2024-09-01', now(), now()),
  ('bbbbbbbb-0001-0001-0001-000000000004', '11111111-1111-1111-1111-111111111111', 'MQI-2024-004', 'Maryam Zahra Osei',         'female', '2012-01-30', 'Abdul Osei',      '0244456789', 'active', '2024-09-01', now(), now()),
  ('bbbbbbbb-0001-0001-0001-000000000005', '11111111-1111-1111-1111-111111111111', 'MQI-2024-005', 'Hassan Nuru Darko',         'male',   '2010-06-18', 'Nuru Darko',      '0244567890', 'active', '2024-09-01', now(), now()),
  ('bbbbbbbb-0001-0001-0001-000000000006', '11111111-1111-1111-1111-111111111111', 'MQI-2024-006', 'Aisha Sadia Appiah',        'female', '2011-09-14', 'Sadia Appiah',    '0244678901', 'active', '2024-09-01', now(), now()),
  ('bbbbbbbb-0001-0001-0001-000000000007', '11111111-1111-1111-1111-111111111111', 'MQI-2024-007', 'Umar Farouk Owusu',         'male',   '2009-04-25', 'Farouk Owusu',    '0244789012', 'active', '2024-09-01', now(), now()),
  ('bbbbbbbb-0001-0001-0001-000000000008', '11111111-1111-1111-1111-111111111111', 'MQI-2024-008', 'Khadijah Hafsa Quaye',      'female', '2012-12-03', 'Abdul Quaye',     '0244890123', 'active', '2024-09-01', now(), now()),
  ('bbbbbbbb-0001-0001-0001-000000000009', '11111111-1111-1111-1111-111111111111', 'MQI-2025-009', 'Bilal Salim Adjei',         'male',   '2013-02-17', 'Salim Adjei',     '0244901234', 'active', '2025-01-15', now(), now()),
  ('bbbbbbbb-0001-0001-0001-000000000010', '11111111-1111-1111-1111-111111111111', 'MQI-2025-010', 'Ruqayyah Nana Acheampong',  'female', '2011-08-09', 'Nana Acheampong', '0244012345', 'active', '2025-01-15', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3. Class enrollments (include organization_id)
INSERT INTO public.class_enrollments (id, organization_id, class_id, student_id, enrolled_at, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000001', 'bbbbbbbb-0001-0001-0001-000000000001', now(), 'active', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000001', 'bbbbbbbb-0001-0001-0001-000000000002', now(), 'active', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000001', 'bbbbbbbb-0001-0001-0001-000000000003', now(), 'active', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000002', 'bbbbbbbb-0001-0001-0001-000000000004', now(), 'active', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000002', 'bbbbbbbb-0001-0001-0001-000000000005', now(), 'active', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000002', 'bbbbbbbb-0001-0001-0001-000000000006', now(), 'active', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000003', 'bbbbbbbb-0001-0001-0001-000000000007', now(), 'active', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000003', 'bbbbbbbb-0001-0001-0001-000000000008', now(), 'active', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000004', 'bbbbbbbb-0001-0001-0001-000000000009', now(), 'active', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0001-0001-0001-000000000004', 'bbbbbbbb-0001-0001-0001-000000000010', now(), 'active', now(), now())
ON CONFLICT DO NOTHING;

-- 4. Hifz progress
INSERT INTO public.hifz_progress (id, organization_id, student_id, surah_number, surah_name, ayah_from, ayah_to, total_ayahs, status, memorization_date, revision_count, completion_percentage, created_at, updated_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000001', 114, 'An-Nas',    1, 6,  6,   'memorized',    '2024-10-05', 3, 100, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000001', 113, 'Al-Falaq', 1, 5,  5,   'memorized',    '2024-10-12', 2, 100, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000001', 112, 'Al-Ikhlas',1, 4,  4,   'memorized',    '2024-10-20', 4, 100, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000001', 111, 'Al-Masad', 1, 5,  5,   'in_progress',  null,         1,  60, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000002', 114, 'An-Nas',   1, 6,  6,   'memorized',    '2024-11-01', 2, 100, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000002', 113, 'Al-Falaq', 1, 5,  5,   'in_progress',  null,         0,  40, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000003', 1,   'Al-Fatihah',1,7, 7,   'memorized',    '2024-09-15', 5, 100, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000003', 2,   'Al-Baqarah',1,50,286, 'in_progress',  null,         1,  17, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000004', 114, 'An-Nas',   1, 6,  6,   'memorized',    '2024-12-01', 3, 100, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000005', 36,  'Ya-Sin',   1, 20, 83, 'in_progress',  null,         0,  24, now(), now())
ON CONFLICT DO NOTHING;

-- 5. Announcements
INSERT INTO public.announcements (id, organization_id, title, content, type, is_published, created_at, updated_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Welcome Back for New Term', 'Assalamu Alaikum! We are excited to welcome all students back for the new academic term. Classes begin Monday. Please ensure all registration fees are paid.', 'general', true, now() - interval '2 days', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Hifz Competition - Registration Open', 'Registration for the Annual Hifz Competition is now open. Students who have memorized at least 3 Juz are eligible. Register with your teacher by end of week.', 'student', true, now() - interval '5 days', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Fee Payment Reminder', 'Dear parents, please ensure all outstanding fees are cleared before the 15th. Kindly contact the secretary for payment arrangements.', 'parent', true, now() - interval '1 day', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Staff Meeting - Wednesday', 'All teaching staff are reminded of the mandatory staff meeting this Wednesday at 3:00 PM in the main hall.', 'general', true, now() - interval '3 days', now())
ON CONFLICT DO NOTHING;

-- 6. Attendance records (last 5 days, all 10 students)
INSERT INTO public.attendance (id, organization_id, student_id, date, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  s.id,
  (CURRENT_DATE - (n || ' days')::interval)::date,
  (ARRAY['present'::attendance_status,'present','present','absent','present'])[floor(random()*5+1)::int],
  now(), now()
FROM public.students s, generate_series(0,4) n
WHERE s.organization_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT DO NOTHING;

-- 7. Fee structures
INSERT INTO public.fee_structures (id, organization_id, name, description, amount, currency, frequency, is_active, created_at, updated_at)
VALUES
  ('cccccccc-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Monthly Tuition Fee',  'Standard monthly tuition for all students', 250.00, 'GHS', 'monthly', true, now(), now()),
  ('cccccccc-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'Registration Fee',     'One-time registration fee for new students',  150.00, 'GHS', 'once',    true, now(), now()),
  ('cccccccc-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'Weekend Class Fee',    'Monthly fee for weekend Hifz class',           100.00, 'GHS', 'monthly', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 8. Student payments
INSERT INTO public.student_payments (id, organization_id, student_id, fee_structure_id, amount, currency, payment_date, payment_method, reference_number, notes, created_at, updated_at)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  s.id,
  'cccccccc-0001-0001-0001-000000000001',
  250.00,
  'GHS',
  (CURRENT_DATE - (floor(random()*20)::int || ' days')::interval)::date,
  (ARRAY['cash','mobile_money','bank_transfer'])[floor(random()*3+1)::int],
  'REF-' || upper(substring(gen_random_uuid()::text,1,8)),
  'Monthly tuition payment',
  now(), now()
FROM public.students s
WHERE s.organization_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT DO NOTHING;

-- 9. Assessments
INSERT INTO public.assessments (id, organization_id, title, description, type, status, duration_minutes, passing_score, created_at, updated_at)
VALUES
  ('dddddddd-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Tajweed Rules Quiz', 'Basic tajweed rules covering Noon Sakinah', 'quiz', 'published', 30, 70, now()-interval '7 days', now()),
  ('dddddddd-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'Juz Amma Memorization Test', 'Test on short surahs in Juz Amma', 'exam', 'published', 60, 80, now()-interval '14 days', now()),
  ('dddddddd-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'Islamic Studies Mid-Term', 'Mid-term covering Islamic history and fiqh', 'exam', 'draft', 90, 60, now()-interval '2 days', now()),
  ('dddddddd-0001-0001-0001-000000000004', '11111111-1111-1111-1111-111111111111', 'Arabic Language Practice', 'Weekly Arabic vocabulary and grammar', 'practice', 'published', 20, 50, now()-interval '3 days', now())
ON CONFLICT (id) DO NOTHING;

-- 10. Certificates
INSERT INTO public.certificates (id, organization_id, student_id, certificate_type, title, description, issued_date, is_revoked, created_at, updated_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000001', 'hifz',       'Certificate of Hifz - Juz Amma',    'Awarded for memorizing Juz Amma',             CURRENT_DATE - 30, false, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000003', 'hifz',       'Certificate of Hifz - Al-Fatihah',  'Perfect recitation of Al-Fatihah',            CURRENT_DATE - 45, false, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0001-0001-0001-000000000004', 'attendance', 'Perfect Attendance Certificate',     '100% attendance in Term 1',                   CURRENT_DATE - 60, false, now(), now())
ON CONFLICT DO NOTHING;

-- 11. Subjects
INSERT INTO public.subjects (id, organization_id, name, description, created_at, updated_at)
VALUES
  ('eeeeeeee-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Quran & Hifz',    'Quran memorization and recitation',   now(), now()),
  ('eeeeeeee-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'Tajweed',         'Rules of Quran recitation',           now(), now()),
  ('eeeeeeee-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'Islamic Studies', 'Islamic history, fiqh, and aqeedah',  now(), now()),
  ('eeeeeeee-0001-0001-0001-000000000004', '11111111-1111-1111-1111-111111111111', 'Arabic Language', 'Arabic reading, writing and grammar', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 12. Lessons
INSERT INTO public.lessons (id, organization_id, subject_id, title, description, content, content_type, is_published, order_index, created_at, updated_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeeeeeee-0001-0001-0001-000000000002', 'Introduction to Tajweed', 'Basic overview of tajweed principles', 'Tajweed is the set of rules for correct pronunciation during recitation of the Quran. It covers articulation points, characteristics of letters, and rules like Noon Sakinah.', 'text', true, 1, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeeeeeee-0001-0001-0001-000000000002', 'Noon Sakinah Rules', 'The four rules of Noon Sakinah and Tanween', 'Noon Sakinah has four rules: Izhaar (clear), Idghaam (merging), Iqlaab (conversion), and Ikhfaa (concealment). Each rule applies based on the following letter.', 'text', true, 2, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeeeeeee-0001-0001-0001-000000000003', 'Pillars of Islam', 'The five pillars every Muslim must know', 'The five pillars of Islam are: Shahada (testimony of faith), Salah (prayer), Zakat (almsgiving), Sawm (fasting), and Hajj (pilgrimage to Makkah).', 'text', true, 1, now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeeeeeee-0001-0001-0001-000000000004', 'Arabic Alphabet', 'Learn the 28 Arabic letters', 'The Arabic alphabet consists of 28 letters written from right to left. Each letter has different forms depending on its position in the word.', 'text', false, 1, now(), now())
ON CONFLICT DO NOTHING;