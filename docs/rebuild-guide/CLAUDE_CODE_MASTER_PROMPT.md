# Claude Code Master Prompt

## Your Mission

Rebuild **Touchcore ValueSpot**, an enterprise employee recognition and culture celebration platform, from scratch using this comprehensive documentation.

This prompt tells you everything you need to know to create a production-ready version of the application. Follow this guide precisely.

---

## What You're Building

**ValueSpot** is a peer-to-peer recognition platform that:
- Lets employees recognize colleagues for embodying organizational Core Values
- Provides manager-led approval workflows
- Tracks badge achievements (5-tier system per Core Value)
- Delivers HR analytics on cultural engagement
- Ensures security through database-enforced Row Level Security (RLS)

**Key characteristics**: 
- Production-ready MVP
- React 18 + TypeScript + Supabase
- 25+ pages, 39+ features, 100% type-safe
- Security-first (RLS on all tables)
- Role-based access (employee, manager, HR admin, super admin)

---

## Your Success Criteria

You will know you've succeeded when:

1. ✅ **Setup complete**: `npm run dev` starts the app
2. ✅ **Database ready**: All 15+ tables exist with RLS enabled
3. ✅ **Auth works**: Can log in with test accounts
4. ✅ **Seeding works**: `npm run seed` populates mock data
5. ✅ **Core workflow works**: Give recognition → manager approves → badge awarded
6. ✅ **Security enforced**: Employee cannot access HR data (RLS blocks it)
7. ✅ **No secrets leaked**: Service role key never in frontend code
8. ✅ **Fully typed**: No `any` types, all interfaces defined
9. ✅ **Tests pass**: All manual acceptance criteria met
10. ✅ **Docs match code**: Your implementation matches this documentation

---

## Architecture Principles

### 1. Security First

- **Every table has RLS enabled** — Row Level Security is the real authorization
- **Frontend route guards are UX only** — Database enforces actual security
- **Service role key NEVER in browser** — Only in `.env` for CLI/seeding, never in `src/`
- **JWT claims in RLS policies** — Never do subquery lookups for role checks

### 2. Type Safety

- **Strict TypeScript mode** — No `any` types unless absolutely necessary
- **Auto-generated database types** — Run `npm run supabase:types`
- **Interface for every object** — Define types before using them
- **Explicit return types** — Functions must have return type annotations

### 3. Data Integrity

- **Snapshots on recognition** — Captures state (dept name, manager ID, CV name) at insert time
- **Idempotency keys** — Unique constraint prevents duplicate submissions
- **Soft deletes only** — is_active=false or archived_at, never hard-delete
- **Foreign key constraints** — Enforced at database level

### 4. User Experience

- **Every page has 3 states** — Loading (skeleton), Error (message + retry), Success (data)
- **Empty states friendly** — Icon + message + CTA when no data
- **Fast feedback** — Optimistic updates, toast notifications
- **Accessible** — Semantic HTML, ARIA labels, keyboard navigation

### 5. Code Organization

- **Separation of concerns** — Components, services, types, utils are separate
- **Single responsibility** — Each file has one main job
- **DRY principle** — Reusable components and utilities
- **Consistent patterns** — Follow established conventions (see [08-project-structure.md](08-project-structure.md))

---

## Implementation Guide

### Phase 1: Project Setup (30 min)

**Goal**: Get the development environment working

```bash
# Create Vite + React + TypeScript project
npm create vite@latest valuespot -- --template react-ts
cd valuespot

# Install dependencies (see package.json in docs)
npm install react@18 react-dom@18 react-router-dom@6 \
  @supabase/supabase-js@2.39 \
  react-hook-form @hookform/resolvers zod \
  tailwindcss shadcn-ui lucide-react recharts \
  date-fns date-fns-tz uuid file-saver xlsx

# Configure
# - vite.config.ts (path aliases: @/)
# - tsconfig.json (strict mode, moduleResolution: bundler)
# - tailwind.config.ts (colors, animations)
# - postcss.config.js
# - .eslintrc.cjs (optional but recommended)

# Verify
npm run dev  # Should start on http://localhost:5173
npm run build  # Should compile without errors
npm run type-check  # Should pass
```

**Files to create**: See [20-rebuild-plan-for-claude-code.md](20-rebuild-plan-for-claude-code.md) Phase 1

**Acceptance**:
- [ ] Dev server starts
- [ ] TypeScript strict mode passes
- [ ] Tailwind CSS works
- [ ] No build errors

---

### Phase 2: Supabase & Database (45 min)

**Goal**: Set up database schema and security

```bash
# Create Supabase project at https://app.supabase.com
# Note: Project URL, Anon Key, Service Role Key

# Set up environment
# Create .env (gitignored):
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Create .env.example (template, no real values):
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run all 6 migrations (in order)
# Reference: supabase/migrations/001_*.sql through 006_*.sql

# Set up custom JWT hook (Migration 006)
# This adds user_role and employee_id to JWT claims
# Required for RLS policies to work
```

**Reference**: [09-database-schema.md](09-database-schema.md), [11-supabase-configuration.md](11-supabase-configuration.md)

**Key tables to verify**:
- employees (role, department, manager_id)
- nominations (with status workflow, snapshots)
- badge_definitions (5 levels)
- employee_value_badges (current badge state)
- All with RLS enabled

**Acceptance**:
- [ ] Supabase project created
- [ ] All 6 migrations run
- [ ] All 15+ tables exist
- [ ] RLS enabled on all tables
- [ ] Custom JWT hook created

---

### Phase 3: Authentication (60 min)

**Goal**: Implement login and JWT-based auth

**Create files**:

1. `src/lib/supabase.ts`
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   import type { Database } from './supabase-types'
   
   export const supabase = createClient<Database>(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY,
     {
       auth: {
         persistSession: true,
         autoRefreshToken: true,
       }
     }
   )
   ```

2. `src/context/AuthContext.tsx`
   - Manage user session and role
   - Provide `useAuth()` hook
   - Auto-refresh tokens
   - Handle logout

3. `src/pages/auth/LoginPage.tsx`
   - Email + password form
   - `supabase.auth.signInWithPassword()`
   - Redirect to dashboard on success
   - Error handling

4. `src/pages/auth/ResetPasswordPage.tsx`
   - Email form for reset
   - Password update form

5. `src/components/layout/ProtectedRoute.tsx`
   - Guard pages requiring auth
   - Check user role
   - Redirect to login if not authenticated
   - **Important**: This is UX only; RLS is the real security

**Key principles**:
- Only VITE_* variables in frontend (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- Service role key only in `.env`, never referenced in `src/`
- JWT contains user_role + employee_id (via custom hook)
- RLS policies check JWT claims

**Acceptance**:
- [ ] Can log in with valid credentials
- [ ] JWT contains user_role + employee_id claims
- [ ] Sessions persist after refresh
- [ ] Invalid credentials show error
- [ ] Cannot access protected pages without login

---

### Phase 4: Application Layout (45 min)

**Goal**: Build core navigation and page structure

**Create files**:

1. `src/app/router.tsx` — React Router configuration
   ```typescript
   const routes = [
     { path: '/', element: <Navigate to="/dashboard" /> },
     { path: '/login', element: <LoginPage /> },
     // ... 25+ routes organized by role
   ]
   ```

2. `src/components/layout/AppShell.tsx` — Main layout
   - Sidebar (left, fixed)
   - TopBar (top, fixed)
   - Content area with `<Outlet />`

3. `src/components/layout/Sidebar.tsx` — Role-aware navigation
   - Employee: Dashboard, Give Recognition, Feed, Journey, Recognitions, Profile
   - Manager: + Manager Dashboard, Approvals, Team Recognition, Team Badges
   - HR: + HR Dashboard, Analytics, Reports, Admin pages

4. `src/components/layout/TopBar.tsx` — Header
   - Logo, search, notification bell, user menu

**Routes to implement**: See [06-navigation-and-routing.md](06-navigation-and-routing.md) for full list

**Key principle**: Wrap everything in `<ProtectedRoute>` except `/login`

**Acceptance**:
- [ ] Navigation menu appears
- [ ] Routes resolve without errors
- [ ] Active menu item highlights
- [ ] Role-aware menu (employee doesn't see HR routes)

---

### Phase 5: Recognition Wizard (90 min)

**Goal**: Build the core 6-step recognition submission flow

**Create files**:

1. `src/pages/employee/GiveRecognitionPage.tsx`
2. `src/components/recognition/NomineeStep.tsx`
3. `src/components/recognition/CoreValueStep.tsx`
4. `src/components/recognition/BehaviorStep.tsx`
5. `src/components/recognition/ScenarioStep.tsx`
6. `src/components/recognition/StoryStep.tsx`
7. `src/components/recognition/ReviewStep.tsx`
8. `src/components/recognition/RecognitionCard.tsx`

**Implementation details**:

- **Step 1 (Nominee)**: Search employees (exclude self)
- **Step 2 (Core Value)**: Select from 5 values
- **Step 3 (Behavior)**: Dependent dropdown (behaviors for chosen value)
- **Step 4 (Scenario)**: Dependent dropdown (scenarios for chosen behavior)
- **Step 5 (Story)**: Two textarea fields (what_happened, what_impact), min 20 chars each
- **Step 6 (Review)**: Show preview card, confirm before submit

**Form validation**: React Hook Form + Zod
```typescript
const schema = z.object({
  nominee_id: z.string().uuid('Must select a colleague'),
  core_value_id: z.string().uuid(),
  behaviour_id: z.string().uuid(),
  scenario_id: z.string().uuid(),
  what_happened: z.string().min(20, 'Please describe what happened'),
  what_impact: z.string().min(20, 'Please describe the impact'),
})
```

**Submission**:
- Generate idempotency_key (UUID v4)
- Call `supabase.from('nominations').insert({ ... })`
- Capture snapshots at INSERT (SQL `DEFAULT CURRENT_TIMESTAMP`)
- On error: Show user-friendly message
- On success: Show success toast + redirect to feed

**Self-nomination prevention**:
- Frontend: Exclude current user from dropdown
- **Database**: CHECK constraint `nominator_id != nominee_id` (real security)

**Acceptance**:
- [ ] All 6 steps work
- [ ] Form validation prevents incomplete submissions
- [ ] Cannot recognize self
- [ ] Can submit recognition (creates DB record)
- [ ] Idempotency keys prevent duplicates
- [ ] Takes <60 seconds to complete

---

### Phase 6: Recognition Feed & Badges (75 min)

**Goal**: Display recognitions and track badge progress

**Create files**:

1. `src/pages/employee/RecognitionFeedPage.tsx`
   - Query: `nominations WHERE status = 'approved'`
   - Pagination: `.range(offset, offset + 19)` (20 items/page)
   - Sort: `.order('approved_at', { ascending: false })`
   - Filter: By Core Value
   - Cards: RecognitionCard components

2. `src/components/recognition/RecognitionCard.tsx`
   - Display nominator, nominee, CV, behavior, story, impact
   - Show appreciation count
   - "Appreciate" button (INSERT into nomination_appreciations)

3. `src/pages/employee/DashboardPage.tsx`
   - Stat tiles: Received this month, given this month
   - Badge progress cards (5 Core Values)
   - Recent activity feed

4. `src/pages/employee/CoreValueJourneyPage.tsx`
   - Query: employee_value_badges
   - Tabs: Annual, Quarterly
   - Progress bars: current count / next threshold
   - Timeline: badge history

5. `src/pages/employee/ProfilePage.tsx`
   - Display: employee_id, full_name, email, department, manager
   - Edit: avatar_url, bio (if applicable)
   - Cannot edit role/department (HR only)

6. `src/components/badges/BadgeProgressMini.tsx` — Small badge progress indicator
7. `src/components/badges/BadgeSVG.tsx` — Render 5 badge designs

**Key queries**:
```typescript
// Feed
const { data } = await supabase
  .from('nominations')
  .select(`id, what_happened, status, ...`)
  .eq('status', 'approved')
  .order('approved_at', { ascending: false })
  .range(offset, offset + 19)

// Badges
const { data: badges } = await supabase
  .from('employee_value_badges')
  .select('*')
  .eq('employee_id', userId)
```

**Acceptance**:
- [ ] Feed shows approved recognitions only
- [ ] Pagination works
- [ ] Newest first
- [ ] Can appreciate
- [ ] Dashboard loads quickly
- [ ] Badges display correctly

---

### Phase 7: Badge System (60 min)

**Goal**: Implement badge definitions and calculations

**Create Edge Function**: `supabase/functions/calculate-badges/index.ts`

This function:
1. Takes employee_id + core_value_id
2. Counts approvals: `SELECT COUNT(*) FROM nominations WHERE nominee_id = ? AND status = 'approved'`
3. Maps count to badge level (based on thresholds)
4. UPDATE employee_value_badges (or INSERT if first)
5. INSERT badge_history (for timeline)
6. Never downgrades badge in same period

**Badge thresholds**:
- Level 1: 1–2 recognitions ("Cheers")
- Level 2: 3–5 recognitions ("Applause")
- Level 3: 6–10 recognitions ("Kudos")
- Level 4: 11–15 recognitions ("Spotlight")
- Level 5: 16+ recognitions ("Value Ambassador")

**Call from**: Manager approval workflow (after approval)
```typescript
// In approval Edge Function
await fetch(`${SUPABASE_URL}/functions/v1/calculate-badges`, {
  method: 'POST',
  body: JSON.stringify({ employee_id, core_value_id })
})
```

**Acceptance**:
- [ ] Badges calculated after approval
- [ ] Correct level awarded
- [ ] Never downgrade in same period
- [ ] History preserved

---

### Phase 8: Manager Features (75 min)

**Goal**: Approval workflow and team views

**Create files**:

1. `src/pages/manager/PendingApprovalsPage.tsx`
   - Query: `WHERE status = 'pending' AND assigned_approver_id = current_user`
   - Expandable cards
   - Inline actions: Approve, Reject, Clarify

2. `src/pages/manager/ManagerDashboardPage.tsx`
   - Team stats: Given, received, this month
   - Pending approvals count
   - Badge distribution chart
   - Recent activity

3. `src/pages/manager/TeamRecognitionPage.tsx`
   - Filter: Given by team, received by team
   - Pagination, filters

4. `src/pages/manager/TeamBadgesPage.tsx`
   - Badge distribution chart
   - By Core Value

**Create Edge Function**: `supabase/functions/process-approval/index.ts`

This function handles approval actions:
- **Approve**: `UPDATE nominations SET status='approved', published_at=now()`
- **Reject**: `UPDATE nominations SET status='rejected', rejection_reason=?`
- **Clarify**: `UPDATE nominations SET status='clarification_requested', clarification_note=?`

Then:
1. Trigger badge calculation (if approved)
2. Create notification for relevant users
3. Write audit log

**Approval routing**:
- Default: Nominee's manager
- Escalate to HR if: Nominator's manager = nominee's manager
- Escalate to HR if: Nominee is executive
- Escalate to HR if: No manager assigned (use hr_fallback_employee_id)

**Acceptance**:
- [ ] Can see pending recognitions
- [ ] Can approve (status changed, nominee notified)
- [ ] Can reject (nominator notified, reason hidden)
- [ ] Can request clarification
- [ ] Approval routing works correctly
- [ ] Team data shows correctly (not other teams)

---

### Phase 9: HR Features (120 min)

**Goal**: Analytics, reports, and administrative features

**Create files**:

1. `src/pages/hr/HRDashboardPage.tsx` — Overview dashboard
   - Stats tiles
   - Trend chart (12 months)
   - Core Value distribution
   - Leaders list

2. `src/pages/hr/AnalyticsPage.tsx` — Recognition leaders
   - By Core Value, department, time period
   - Filters, export

3. `src/pages/hr/BadgeAnalyticsPage.tsx` — Badge distribution
   - Charts by level and CV
   - Annual + quarterly

4. `src/pages/hr/ReportsPage.tsx` — Data export
   - Filters: date range, employee, CV, status
   - Export CSV/XLSX

5. `src/pages/hr/EmployeesPage.tsx` — Employee management
   - List, search, pagination
   - Create: email, name, role, department, manager
   - Edit all fields
   - Deactivate (is_active=false, not hard delete)

6. `src/pages/hr/DepartmentsPage.tsx` — Department CRUD
7. `src/pages/hr/ProjectsPage.tsx` — Project CRUD + membership management
8. `src/pages/hr/CoreValuesPage.tsx` — Manage Core Values and behaviors
9. `src/pages/hr/AuditLogsPage.tsx` — View audit logs (searchable, read-only)
10. `src/pages/hr/SettingsPage.tsx` — App configuration

**Export utilities** (`src/lib/export-utils.ts`):
```typescript
export function exportToCSV(data, filename)
export function exportToXLSX(data, filename)
```

**Key patterns**:
- All data operations use appropriate filters
- HR can see all data (via RLS)
- Every modification writes to audit_logs
- Settings stored in app_config table

**Acceptance**:
- [ ] Dashboard stats accurate
- [ ] Analytics show correct leaders
- [ ] Can export CSV/XLSX
- [ ] Employee CRUD works
- [ ] Cannot see undeactivated employees (unless admin)
- [ ] Audit logs searchable
- [ ] Settings persist

---

### Phase 10: Mock Data & Seeding (45 min)

**Goal**: Populate database with sample data for development

**Create files**:

1. `src/data/valuespot-mock-data.json` — Mock data structure
2. `src/data/seeders/seed.ts` — CLI entry point
3. `src/data/seeders/seedService.ts` — Orchestration
4. `src/data/seeders/departmentSeeder.ts` — Seed departments
5. `src/data/seeders/employeeSeeder.ts` — Seed employees
6. `src/data/seeders/coreValueSeeder.ts` — Seed values+behaviors+scenarios
7. `src/data/seeders/projectSeeder.ts` — Seed projects
8. `src/data/seeders/projectMemberSeeder.ts` — Seed project memberships
9. `src/data/seeders/nominationSeeder.ts` — Seed sample recognitions
10. `src/data/seeders/errorFormatter.ts` — User-friendly errors
11. `src/data/seeders/verify.ts` — Verification CLI
12. `src/data/seeders/utils.ts` — Helpers

**Key implementation details**:

- Use `SUPABASE_SERVICE_ROLE_KEY` (from .env, not frontend)
- Seeders use UPSERT pattern (safe to re-run)
- UUID deterministic: `uuidv5(id, NAMESPACE)`
- Execution order: departments → employees → projects → relationships → recognitions

**npm scripts** (add to package.json):
```json
{
  "seed": "tsx --project tsconfig.seeders.json src/data/seeders/seed.ts",
  "seed:verify": "tsx --project tsconfig.seeders.json src/data/seeders/verify.ts",
  "supabase:types": "supabase gen types typescript --local > src/lib/supabase-types.ts"
}
```

**Test accounts created**:
- employee@test.com (employee, no team)
- manager@test.com (manager, has team)
- hr@test.com (hr_admin)
- admin@test.com (super_admin)

**Acceptance**:
- [ ] `npm run seed` completes successfully
- [ ] All 150+ records inserted
- [ ] Test accounts created
- [ ] `npm run seed:verify` passes all checks
- [ ] Can re-run seed without errors (idempotent)

---

### Phase 11: Testing & Verification (60 min)

**Goal**: Verify application works end-to-end

**Manual testing checklist**:

```
Authentication
  [ ] Login with employee@test.com
  [ ] Verify role = 'employee'
  [ ] Login with manager@test.com
  [ ] Verify role = 'manager'
  [ ] Login with hr@test.com
  [ ] Verify role = 'hr_admin'

Employee Workflow
  [ ] Dashboard loads (<2s)
  [ ] Give recognition: 6-step wizard works
  [ ] Cannot recognize self (blocked)
  [ ] Can view feed (approved recognitions)
  [ ] Can appreciate recognition
  [ ] Can view badges
  [ ] Can view profile

Manager Workflow
  [ ] Dashboard shows team stats
  [ ] Pending approvals list shows
  [ ] Can approve recognition (status changed)
  [ ] Nominee gets notification
  [ ] Badge updates after approval
  [ ] Can reject recognition
  [ ] Can request clarification
  [ ] Cannot see other teams' data (RLS)

HR Workflow
  [ ] Dashboard shows stats
  [ ] Analytics page loads
  [ ] Can export CSV/XLSX
  [ ] Employee CRUD works
  [ ] Can manage departments
  [ ] Can manage projects
  [ ] Audit logs visible

Security
  [ ] Employee cannot access /hr/analytics (RLS blocks)
  [ ] Direct API call with anon key fails for HR data
  [ ] Rejection reasons hidden from nominee
  [ ] Cannot access database directly (RLS enforced)

Data Integrity
  [ ] Snapshots captured correctly
  [ ] Badge never downgrades
  [ ] Historical data preserved
  [ ] Idempotency keys work

Performance
  [ ] Dashboard <2s load time
  [ ] Feed pagination smooth
  [ ] Export completes quickly
  [ ] No console errors
```

**Success indicators**:
- All tests pass
- No RLS permission errors
- No TypeScript errors
- Performance acceptable
- Ready for production

---

## Critical Implementation Requirements

### 1. Security (Non-Negotiable)

✅ **Never expose service role key in frontend**
- Service role key only in `.env`
- Only VITE_* variables in `src/`
- Use `import.meta.env.VITE_SUPABASE_*` only

✅ **RLS enforced on all tables**
- Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- RLS policies check JWT claims

✅ **Self-nomination blocked at database**
- `CHECK (nominator_id != nominee_id)` on nominations table

✅ **Rejection reasons hidden from non-HR**
- RLS policy: SELECT rejection_reason only for HR role

### 2. Type Safety (Non-Negotiable)

✅ **No `any` types**
- Every function has explicit return type
- Every parameter has explicit type
- Use `unknown` and type-narrow if needed

✅ **Auto-generated database types**
- Run: `supabase gen types typescript --local > src/lib/supabase-types.ts`
- Import: `import type { Database } from './supabase-types'`

✅ **Interfaces for all objects**
```typescript
interface Employee {
  id: UUID
  full_name: string
  role: 'employee' | 'manager' | 'hr_admin' | 'super_admin'
  // ...
}
```

### 3. Data Integrity (Non-Negotiable)

✅ **Snapshots on recognitions**
- Capture: nominator_dept, nominee_dept, manager_id, CV name, behavior name
- At INSERT time (never updated)
- Used in display: `COALESCE(snapshot_behaviour_name, b.name)`

✅ **Idempotency keys**
- Generate: `crypto.randomUUID()`
- Send with every recognition submission
- Unique constraint prevents duplicates

✅ **Soft deletes**
- Never hard-delete employees/projects/departments
- Use: `is_active=false` or `archived_at=now()`
- Preserves historical data

### 4. Code Organization (Required)

✅ **Folder structure**
```
src/
  ├── app/           (router, providers)
  ├── components/    (reusable components)
  ├── context/       (auth, notifications)
  ├── hooks/         (custom hooks)
  ├── lib/           (supabase, utils, types)
  ├── pages/         (page components)
  ├── styles/        (global CSS)
  ├── types/         (TypeScript interfaces)
  └── main.tsx       (entry point)
```

✅ **Naming conventions**
- Components: PascalCase (RecognitionCard.tsx)
- Utilities: camelCase (formatDate.ts)
- Types: PascalCase interfaces
- Constants: SCREAMING_SNAKE_CASE

✅ **No hardcoded values**
- Colors: from Tailwind config
- Badge thresholds: from badge_definitions table
- Rate limits: from app_config table
- Routes: defined in router.tsx

---

## Common Pitfalls to Avoid

❌ **Don't**:
- Put service role key in `src/` anywhere
- Use implicit string conversion for errors (use error formatter)
- Hardcode badge thresholds (fetch from DB)
- Skip RLS policies on any table
- Trust frontend validation for security

✅ **Do**:
- Check RLS policies work via direct API calls
- Verify JWT claims in browser DevTools
- Test with both anon and service role keys
- Use error formatter for user-friendly messages
- Write acceptance criteria before implementing

---

## Verification Commands

```bash
# Setup verification
npm run type-check        # TypeScript strict mode
npm run lint              # ESLint
npm run build             # Production build

# Runtime verification
npm run dev               # Dev server
npm run seed              # Populate mock data
npm run seed:verify       # Verify seeded data

# Database verification (via Supabase console)
SELECT * FROM nominations WHERE status = 'approved' LIMIT 5;
SELECT * FROM employee_value_badges;
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

---

## Documentation References

Use these documents extensively during implementation:

| Topic | Document |
|-------|----------|
| Product overview | [01-product-overview.md](01-product-overview.md) |
| All features | [02-functional-requirements.md](02-functional-requirements.md) |
| User roles | [03-user-roles-and-permissions.md](03-user-roles-and-permissions.md) |
| User workflows | [04-user-journeys.md](04-user-journeys.md) |
| Page specs | [05-ui-ux-specification.md](05-ui-ux-specification.md) |
| Routing | [06-navigation-and-routing.md](06-navigation-and-routing.md) |
| Architecture | [07-technical-architecture.md](07-technical-architecture.md) |
| File structure | [08-project-structure.md](08-project-structure.md) |
| Database tables | [09-database-schema.md](09-database-schema.md) |
| Data model | [10-data-model-and-relationships.md](10-data-model-and-relationships.md) |
| Supabase setup | [11-supabase-configuration.md](11-supabase-configuration.md) |
| Auth & security | [12-authentication-and-security.md](12-authentication-and-security.md) |
| Components | [13-components.md](13-components.md) |
| Services | [14-services-and-data-access.md](14-services-and-data-access.md) |
| Design | [15-design-system.md](15-design-system.md) |
| Seeding | [16-mock-data-and-seeding.md](16-mock-data-and-seeding.md) |
| Setup | [17-development-setup.md](17-development-setup.md) |
| Testing | [18-testing-and-verification.md](18-testing-and-verification.md) |
| Issues | [19-known-issues-and-limitations.md](19-known-issues-and-limitations.md) |
| Implementation phases | [20-rebuild-plan-for-claude-code.md](20-rebuild-plan-for-claude-code.md) |

---

## Your Workflow

1. **Read first**: [01-product-overview.md](01-product-overview.md) — Understand what you're building
2. **Plan architecture**: [07-technical-architecture.md](07-technical-architecture.md) — How it's built
3. **Implement phases**: Follow [20-rebuild-plan-for-claude-code.md](20-rebuild-plan-for-claude-code.md) strictly
4. **Reference during implementation**: Use specific docs as needed
5. **Verify each phase**: Check acceptance criteria before moving on
6. **Test end-to-end**: Use [18-testing-and-verification.md](18-testing-and-verification.md) checklist

---

## Success Indicators

You'll know you're on track when:

✅ **Phase 1**: Dev environment works (`npm run dev` starts app)  
✅ **Phase 2**: Database ready (all tables, RLS enabled)  
✅ **Phase 3**: Can log in (JWT contains claims)  
✅ **Phase 4**: Navigation works (can navigate between pages)  
✅ **Phase 5**: Recognition wizard complete (<60s to submit)  
✅ **Phase 6**: Feed displays, badges track  
✅ **Phase 7**: Badges calculate after approval  
✅ **Phase 8**: Manager can approve/reject  
✅ **Phase 9**: HR sees analytics, can export  
✅ **Phase 10**: Seeding works, test accounts created  
✅ **Phase 11**: All manual tests pass, security verified  

---

## Final Checklist

Before declaring success:

- [ ] No `any` types in TypeScript
- [ ] Service role key never in `src/`
- [ ] RLS policies on all tables
- [ ] All 25+ pages implemented
- [ ] All 39+ features working
- [ ] Seeding works (`npm run seed`)
- [ ] Test accounts created
- [ ] All manual tests pass
- [ ] No security issues
- [ ] Performance acceptable
- [ ] Code matches this documentation
- [ ] Ready for production deployment

---

## You've Got This! 🚀

You have everything you need. This documentation is comprehensive, detailed, and accurate. Follow the phases in order, reference the docs frequently, and verify each step before proceeding.

Build something great.

---

**Last Updated**: September 2026  
**Documentation Version**: 1.0  
**Status**: ✅ Ready for implementation

