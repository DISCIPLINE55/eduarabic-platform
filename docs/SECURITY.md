# EduArabic – Security Guidelines

## Authentication
- **Provider**: Supabase Auth (email/password, Google OAuth, Apple OAuth)
- **Sessions**: JWT tokens, 1-hour expiry with refresh tokens
- **Password Policy**: Minimum 8 characters enforced at signup
- **Profile Completion**: Users must complete profile before accessing any portal

## Authorization

### Row Level Security (RLS)
Every table has RLS enabled. Data access is enforced at the PostgreSQL level — no reliance on application-layer filtering alone.

Policy helper functions use `SECURITY DEFINER` to prevent privilege escalation:
```sql
CREATE OR REPLACE FUNCTION can_access_org(org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND organization_id = org_id
  );
$$;
```

### Role Hierarchy
```
super_admin > admin > secretary > teacher > parent = student
```
- Higher roles can impersonate lower roles for support (audit-logged)
- Parents and Students have read-only access to their own data

## Data Privacy
- Student profiles contain PII — never exposed in public views
- Guardian phone numbers masked in list views
- Audit logs are immutable — no UPDATE/DELETE on `audit_logs`
- Soft deletes only — no permanent data destruction without Super Admin confirmation

## File Upload Security
- All files stored in Supabase Storage with private buckets
- Signed URLs expire after 1 hour for audio playback
- Maximum file sizes enforced:
  - Audio: 50MB
  - PDF: 20MB
  - Images: 5MB
- MIME type validation on both client and server

## AI Data Governance
- No student PII sent to external AI APIs — only academic content
- Audio transcription: audio files are processed without student identity metadata
- AI outputs are never auto-published — teacher review is mandatory
- All AI decisions logged with timestamp, teacher ID, and original AI suggestion

## Edge Function Security
- All third-party API keys stored as Supabase Secrets (never in client code)
- CORS restricted to application domain
- Rate limiting: 100 requests/minute per user for AI generation endpoints
- Service role key never exposed to frontend

## Audit Logging
Every create/update/delete operation on core tables writes to `audit_logs`:
```json
{
  "table_name": "students",
  "action": "UPDATE",
  "user_id": "uuid",
  "old_values": {...},
  "new_values": {...},
  "timestamp": "ISO8601"
}
```

## Security Checklist for New Features
- [ ] Does the feature access student PII? → Add RLS policy
- [ ] Does it call an external API? → Must use Edge Function
- [ ] Does it accept file uploads? → Validate MIME type and size
- [ ] Does it modify scores/results? → Add audit log entry
- [ ] Is it AI-powered? → Teacher review gate required
