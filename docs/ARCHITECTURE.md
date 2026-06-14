# EduArabic – System Architecture

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI components |
| Styling | Tailwind CSS + shadcn/ui | Design system |
| Build | Vite | Fast development & bundling |
| State | React Context + Hooks | Auth & global state |
| Router | React Router v6 | Client-side routing |
| Charts | Recharts | Analytics visualizations |
| Offline | Dexie.js + IndexedDB | Offline data storage |
| Backend | Supabase (PostgreSQL) | Database & Auth |
| Storage | Supabase Storage | Audio, PDF, image files |
| Realtime | Supabase Realtime | Live attendance & notifications |
| Functions | Supabase Edge Functions | AI integrations, webhooks |
| Auth | Supabase Auth | Email, Google, Apple SSO |

## Architectural Patterns

### Multi-Tenant SaaS
- Every database row carries `organization_id`
- Row Level Security (RLS) enforces tenant isolation at the database level
- All queries automatically scoped by the authenticated user's institution

### Feature-Based Module Structure
```
src/
├── contexts/        Auth, offline state providers
├── components/
│   ├── layouts/     AppLayout, AppSidebar (role-based nav)
│   ├── common/      PageHeader, StatCard, StatusBadge, RouteGuard
│   └── ui/          shadcn/ui component library
├── pages/
│   ├── super-admin/ Platform management
│   ├── admin/       Institution management
│   ├── secretary/   Student ops
│   ├── teacher/     Teaching & assessment
│   ├── parent/      Child monitoring
│   ├── student/     Learning & Hifz
│   └── shared/      Cross-role pages
├── types/           TypeScript definitions + SURAH_LIST
├── db/              Supabase client
└── routes.tsx       Centralized route config
```

### Role-Based Access Control
```
super_admin  → /super-admin/*   Platform-wide
admin        → /admin/*          Institution-wide
secretary    → /secretary/*      Student & attendance ops
teacher      → /teacher/*        Classes, lessons, assessments
parent       → /parent/*         Read-only child data
student      → /student/*        Learning & self-tracking
```

### AI Governance Architecture
1. Teacher triggers AI action (generate questions / analyze audio)
2. Edge Function calls AI provider (Gemini / Whisper)
3. Results stored with `is_ai_generated = true` flag
4. Teacher reviews every AI output before it becomes student-visible
5. All AI decisions logged in `teacher_decisions` JSONB column

### Offline-First Flow
1. User performs action offline (attendance mark, assessment answer)
2. Action stored in Dexie.js IndexedDB queue
3. Service Worker detects connectivity restore
4. Background sync fires queued operations to Supabase
5. Conflict detection compares `version` fields
6. Conflicts surfaced in UI for teacher/admin resolution
