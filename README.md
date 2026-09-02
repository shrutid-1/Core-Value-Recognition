# Touchcore ValueSpot

**Recognize the behaviour. Reinforce the value. Strengthen the culture.**

An internal employee recognition and Core Values culture platform for Touchcore Systems Pvt. Ltd.

---

## Prerequisites

- Node.js 20 LTS or later: https://nodejs.org
- A Supabase project: https://supabase.com

---

## Setup — Step by Step

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase project URL and anon key:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase dashboard → Project Settings → API.

### 3. Set up the database

In your Supabase dashboard, open the **SQL Editor** and run each migration in order:

1. `supabase/migrations/001_core_tables.sql`
2. `supabase/migrations/002_core_values.sql`
3. `supabase/migrations/003_nominations.sql`
4. `supabase/migrations/004_badges.sql`
5. `supabase/migrations/005_supporting.sql`
6. `supabase/migrations/006_views_and_auth.sql`

Then run the seed files:

1. `supabase/seed/001_badge_definitions.sql`
2. `supabase/seed/002_app_config.sql`
3. `supabase/seed/003_core_values.sql`

For development demo data (optional but recommended):

4. `supabase/seed/004_demo_data.sql`
5. `supabase/seed/005_demo_nominations.sql`

### 4. Configure the Auth hook

In Supabase dashboard → Authentication → Hooks, add a custom access token hook pointing to the `custom_access_token_hook` function created in migration 006.

This adds `user_role` and `employee_id` to JWT tokens, which is required for RLS policies to work.

### 5. Create test users

In Supabase dashboard → Authentication → Users, create these test accounts:

| Email | Password |
|---|---|
| admin@test.com | Test@1234 |
| hr@test.com | Test@1234 |
| manager@test.com | Test@1234 |
| employee@test.com | Test@1234 |

Then link each to their employee record in the SQL Editor:

```sql
UPDATE employees SET auth_user_id = '<supabase_auth_user_id>'
WHERE email = 'admin@test.com';
-- repeat for each test user
```

Get the auth user IDs from Authentication → Users in the dashboard.

### 6. Deploy Edge Functions (optional for local dev)

If using Supabase CLI:

```bash
npx supabase functions deploy check-rate-limits
npx supabase functions deploy process-approval
npx supabase functions deploy calculate-badges
npx supabase functions deploy check-duplicate
```

### 7. Start the development server

```bash
npm run dev
```

Open http://localhost:5173

---

## Test Accounts

| Email | Password | Role |
|---|---|---|
| employee@test.com | Test@1234 | Employee |
| manager@test.com | Test@1234 | Manager |
| hr@test.com | Test@1234 | HR Admin |
| admin@test.com | Test@1234 | Super Admin |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript validation |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |
| `npm run supabase:types` | Regenerate DB types from schema |

---

## Project Structure

```
src/
├── app/           Router, providers
├── components/    UI, layout, shared components
│   ├── ui/        Base UI components
│   ├── layout/    AppShell, Sidebar, TopBar
│   ├── recognition/ Recognition wizard components
│   ├── badges/    Badge display components
│   ├── notifications/ Notification center
│   └── shared/    EmptyState, Skeleton, etc.
├── context/       AuthContext, NotificationContext
├── hooks/         Custom React hooks
├── lib/           Supabase client, utilities, constants
├── pages/         Page-level components
│   ├── auth/      Login, Reset Password
│   ├── employee/  Dashboard, Give Recognition, Feed, Journey
│   ├── manager/   Approvals, Team views
│   └── hr/        HR Dashboard, Analytics, Reports, Admin
├── styles/        Global CSS
└── types/         TypeScript types
supabase/
├── migrations/    Database schema migrations (run in order)
├── seed/          Seed data (production + dev demo)
└── functions/     Edge Functions
```

---

## Architecture Notes

- **Authorization is database-enforced** via Supabase RLS. Frontend route guards are UX only.
- **No hard-coded thresholds** — badge levels, rate limits, and financial year config are all read from the database.
- **Historical data integrity** — nominations carry snapshot fields so records remain accurate after employee relationship changes.
- **Badge calculation** runs in the `process-approval` Edge Function after each approval, using database-driven thresholds.

---

## Security

- Never commit `.env` (it's in `.gitignore`)
- `SUPABASE_SERVICE_ROLE_KEY` is only used in Edge Functions via `Deno.env.get()`
- It must never appear in any file under `src/`
