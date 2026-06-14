# EduArabic – Deployment Guide

## Prerequisites
- Node.js 18+
- pnpm 8+
- Supabase CLI (for migrations)
- Git

## Environment Variables

Create `.env` in project root:

```env
VITE_SUPABASE_URL=https://mvxzpmngsoutksienfay.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Never commit `.env` to version control.

## Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run type checking
pnpm tsc --noEmit

# Run linter
pnpm lint
```

## Production Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

Output goes to `dist/` directory.

## Database Migrations

Migrations are managed via Supabase dashboard or CLI:

```bash
# Apply all pending migrations
supabase db push

# Check migration status
supabase migration list
```

**Note**: Never edit files in `supabase/migrations/` manually. Always create new incremental migrations.

## Supabase Edge Functions

Deploy edge functions when creating or updating them:

```bash
supabase functions deploy <function-name>
```

Edge function secrets are set via:
```bash
supabase secrets set KEY_NAME=value
```

## First-Time Setup

1. **Create Supabase Project** → copy URL and anon key to `.env`
2. **Run migrations** → `supabase db push`
3. **Create Super Admin** → via Supabase Auth dashboard, then update `profiles.role = 'super_admin'`
4. **Create first Institution** → via Super Admin portal
5. **Invite Admin user** → set `profiles.role = 'admin'` and `profiles.organization_id`

## Creating Initial Admin Account

Execute in Supabase SQL editor:

```sql
-- After the admin user signs up via the app:
UPDATE profiles 
SET role = 'admin', organization_id = '<institution-uuid>', is_profile_complete = true
WHERE email = 'admin@yourinstitution.com';
```

## PWA Configuration

The app is configured as a Progressive Web App:
- `vite-plugin-pwa` handles service worker generation
- Manifest includes install prompts for Android, iOS, Desktop
- Offline cache covers all static assets and API responses via Workbox

## Hosting Recommendations

| Platform | Notes |
|----------|-------|
| Vercel | Recommended — automatic deployments from Git |
| Netlify | Full support for SPA routing |
| Cloudflare Pages | Excellent global CDN performance |
| Self-hosted | Nginx with `try_files` for SPA fallback |

## Nginx SPA Configuration

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Health Checks

After deployment, verify:
- [ ] Login page loads
- [ ] Supabase connection works (login with test account)
- [ ] Role-based redirect works (admin → /admin)
- [ ] Offline mode: disconnect network, navigate to a cached page
- [ ] Audio upload: test file upload to Supabase Storage
