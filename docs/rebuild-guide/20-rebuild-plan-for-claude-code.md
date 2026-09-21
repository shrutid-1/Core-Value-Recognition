# 20. Rebuild Plan for Claude Code

## Phase-by-Phase Implementation Guide

This document provides a **step-by-step rebuild plan** for reconstructing ValueSpot using Claude Code or another AI coding platform.

Follow these 11 phases in order. Each phase builds on previous ones and has specific acceptance criteria.

---

## Phase 1: Project Setup & Configuration

**Goal**: Set up development environment, tools, and configuration files

**Duration**: 30 minutes  
**Dependencies**: None

### Tasks

1. **Initialize Vite project**
   - Create React 18 + TypeScript project
   - Configure: `vite.config.ts`
   - Create: `tsconfig.json`, `tsconfig.app.json`, `postcss.config.js`

2. **Install dependencies** (see [package.json](../package.json))
   - React: react@18, react-dom@18
   - Routing: react-router-dom@6
   - Forms: react-hook-form, @hookform/resolvers, zod
   - Supabase: @supabase/supabase-js@2.39
   - UI: shadcn/ui, lucide-react, recharts
   - Styling: tailwindcss, tailwind-merge, clsx, tailwindcss-animate
   - Utilities: date-fns, date-fns-tz, uuid, file-saver, xlsx

3. **Configure Tailwind CSS**
   - Create: `tailwind.config.ts`
   - Include color tokens (steel blue palette, Core Value colors)
   - Include animation definitions
   - Configure `content` paths

4. **Set up environment variables**
   - Create: `.env.example` (template, no real values)
   - Document: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   - Add to `.gitignore`: `.env`, `.env.local`

5. **Configure ESLint** (optional but recommended)
   - Set strict mode
   - Configure: `.eslintrc.cjs`

6. **Set up type safety**
   - Enable strict mode in `tsconfig.json`
   - No `any` types

### Files to Create

```
src/
  ├── main.tsx (entry point)
  ├── index.css (global styles)
  ├── types/
  │   └── index.ts (empty, will populate later)
  ├── lib/
  │   └── utils.ts (cn() utility)
  └── app/
      └── router.tsx (empty, configure in Phase 4)

Config files:
  ├── vite.config.ts
  ├── tsconfig.json
  ├── tsconfig.app.json
  ├── postcss.config.js
  ├── tailwind.config.ts
  └── .eslintrc.cjs
```

### Acceptance Criteria

- [ ] `npm run dev` starts dev server on `http://localhost:5173`
- [ ] `npm run build` compiles without errors
- [ ] `npm run type-check` passes (no TypeScript errors)
- [ ] `npm run lint` runs (may have warnings, no errors)
- [ ] Tailwind classes work in a simple test component

---

## Phase 2: Supabase Setup & Database

**Goal**: Create Supabase project and establish database schema

**Duration**: 45 minutes  
**Dependencies**: Phase 1

### Tasks

1. **Create Supabase project**
   - Go to https://app.supabase.com
   - Create new project
   - Note: Project URL, Anon Key, Service Role Key

2. **Enable Row Level Security (RLS)**
   - Enable on ALL tables (automatic with migrations)

3. **Run migrations** (in order)
   - Migration 001: Core tables (departments, employees, projects, core values, behaviours, scenarios)
   - Migration 002: Badge definitions and tables
   - Migration 003: Nomination + approval workflow
   - Migration 004: Audit, config, notifications, rewards
   - Migration 005: RLS policies (attach to tables)
   - Migration 006: Views and custom JWT hook

4. **Set up custom JWT hook**
   - Supabase Dashboard → Settings → SQL Editor
   - Run SQL to create `custom_access_token_hook` function
   - This adds `user_role` and `employee_id` to JWT claims

5. **Verify schema**
   - All 15+ tables exist
   - All columns present
   - All constraints in place
   - RLS enabled on all tables

### Files to Reference

- See: `supabase/migrations/001_*.sql` through `006_*.sql`
- See: [09-database-schema.md](09-database-schema.md) for complete table specifications

### Acceptance Criteria

- [ ] Supabase project created
- [ ] All migrations run successfully (no SQL errors)
- [ ] All tables visible in Supabase dashboard
- [ ] RLS policies visible on each table
- [ ] Custom JWT hook created and functioning
- [ ] Can query tables with `select()` from Supabase client

---

## Phase 3: Authentication & Authorization

**Goal**: Implement login, JWT management, and RLS-based security

**Duration**: 60 minutes  
**Dependencies**: Phase 1, Phase 2

### Tasks

1. **Create auth context** (`src/context/AuthContext.tsx`)
   - Manage user session state
   - Auto-refresh tokens
   - Provide `useAuth()` hook
   - Handle logout

2. **Create login page** (`src/pages/auth/LoginPage.tsx`)
   - Email + password form
   - Supabase Auth `.signInWithPassword()`
   - Redirect to dashboard on success
   - Error handling

3. **Create password reset page** (`src/pages/auth/ResetPasswordPage.tsx`)
   - Email form
   - `.resetPasswordForEmail()`
   - New password form after clicking email link

4. **Set up Supabase client** (`src/lib/supabase.ts`)
   - Initialize with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
   - Only these public keys (never service role in frontend)
   - Configure `persistSession: true`, `autoRefreshToken: true`

5. **Create protected routes** (`src/components/layout/ProtectedRoute.tsx`)
   - Guard pages that require authentication
   - Check user role
   - Redirect to login if not authenticated
   - Note: This is UX only; RLS is the real security

6. **Set up JWT claims**
   - Confirm custom hook running
   - Verify JWT contains `user_role` + `employee_id`
   - Test with decoded JWT

### Files to Create

```
src/
  ├── context/
  │   └── AuthContext.tsx
  ├── pages/auth/
  │   ├── LoginPage.tsx
  │   └── ResetPasswordPage.tsx
  ├── components/layout/
  │   └── ProtectedRoute.tsx
  └── lib/
      └── supabase.ts
```

### Acceptance Criteria

- [ ] Can log in with valid credentials
- [ ] Session persists after page refresh
- [ ] Invalid credentials show error message
- [ ] Password reset flow works
- [ ] `useAuth()` hook provides session, user, role
- [ ] ProtectedRoute guards pages
- [ ] JWT contains user_role + employee_id claims
- [ ] Cannot access HR pages without HR role (RLS enforced)

---

## Phase 4: Application Layout & Routing

**Goal**: Build core layout components and navigation structure

**Duration**: 45 minutes  
**Dependencies**: Phase 1, Phase 3

### Tasks

1. **Create AppShell** (`src/components/layout/AppShell.tsx`)
   - Sidebar (fixed left)
   - TopBar (fixed top)
   - Content area with `<Outlet />`
   - Theme provider

2. **Create Sidebar** (`src/components/layout/Sidebar.tsx`)
   - Role-aware navigation menu
   - Employee routes: Dashboard, Give Recognition, Feed, My Journey, My Recognitions, Profile
   - Manager routes: + Manager Dashboard, Approvals, Team Recognition, Team Badges
   - HR routes: + HR Dashboard, Analytics, Badge Analytics, Reports, Employees, Departments, Projects, Core Values, Behaviours, Scenarios, Audit Logs, Settings
   - Active route highlighting

3. **Create TopBar** (`src/components/layout/TopBar.tsx`)
   - Logo / app name
   - Search box (placeholder)
   - Notification bell (with unread count)
   - User avatar + dropdown (profile, logout)

4. **Configure React Router** (`src/app/router.tsx`)
   - 25+ routes organized by role
   - Route guard with `<ProtectedRoute>`
   - Lazy loading pages
   - Error boundary

5. **Create layout wrapper** (`src/app/providers.tsx`)
   - Auth provider
   - Router provider
   - Theme/style providers

### Routes to Define

```
/ (redirect to /dashboard or /login)
/login
/reset-password

/dashboard
/give-recognition
/feed
/my-recognitions
/my-journey
/profile

/manager/dashboard
/manager/approvals
/manager/team
/manager/badges

/hr/dashboard
/hr/analytics
/hr/badge-analytics
/hr/reports
/hr/employees
/hr/departments
/hr/projects
/hr/core-values
/hr/behaviours
/hr/scenarios
/hr/audit-logs
/hr/settings
```

### Files to Create

```
src/
  ├── app/
  │   ├── providers.tsx
  │   └── router.tsx
  ├── components/layout/
  │   ├── AppShell.tsx
  │   ├── Sidebar.tsx
  │   └── TopBar.tsx
  ├── pages/
  │   ├── auth/
  │   │   ├── LoginPage.tsx
  │   │   └── ResetPasswordPage.tsx
  │   ├── employee/
  │   ├── manager/
  │   └── hr/
  └── main.tsx (update to use providers)
```

### Acceptance Criteria

- [ ] Navigation menu appears correctly
- [ ] Routes resolve without errors
- [ ] Active menu item highlights
- [ ] Can navigate between pages
- [ ] Unauthorized pages blocked (manager cannot see HR pages)
- [ ] Logo links to dashboard
- [ ] User menu accessible

---

## Phase 5: Employee Features - Recognition Wizard

**Goal**: Build 6-step recognition submission wizard

**Duration**: 90 minutes  
**Dependencies**: Phase 1–4

### Tasks

1. **Create GiveRecognitionPage** (`src/pages/employee/GiveRecognitionPage.tsx`)
   - Multi-step wizard component
   - Step state management

2. **Build 6 steps**
   - **Step 1: Select Nominee**
     - Search employees by name/email
     - Exclude self (cannot recognize self)
     - Autocomplete dropdown
   - **Step 2: Select Core Value**
     - Radio buttons or card selection
     - 5 options: Adaptable, Transparent, Collaborative, Innovative, Accountable
   - **Step 3: Select Behavior**
     - Dependent on selected Core Value
     - 5 behaviors per value
     - Card layout with description
   - **Step 4: Select Scenario**
     - Dependent on selected Behavior
     - 5 scenarios per behavior
     - Examples provided
   - **Step 5: Tell Your Story**
     - "What happened?" (required, min 20 chars)
     - "What's the impact?" (required, min 20 chars)
     - Textarea fields, char counter
     - Optional: Select project
   - **Step 6: Review & Submit**
     - Preview recognition card
     - Review form data
     - "Submit" button
     - Error handling, success message

3. **Implement form validation**
   - React Hook Form + Zod
   - Schema: nominee, core_value, behaviour, scenario, what_happened, what_impact
   - Error messages inline
   - Prevent submission with errors

4. **Implement submission**
   - Generate `idempotency_key` (UUID v4)
   - Insert into `nominations` table (status: 'pending')
   - Set `snapshot_*` fields at INSERT time
   - Handle errors (network, RLS, validation)
   - Show success message + redirect to feed

5. **Add helper services**
   - `fetchCoreValues()` - GET core_values
   - `fetchBehaviors(core_value_id)` - GET behaviours
   - `fetchScenarios(behaviour_id)` - GET scenarios
   - `fetchEmployees(search)` - Search employees
   - `submitRecognition(data)` - INSERT nomination

### Files to Create

```
src/
  ├── pages/employee/
  │   └── GiveRecognitionPage.tsx
  ├── components/recognition/
  │   ├── NomineeStep.tsx
  │   ├── CoreValueStep.tsx
  │   ├── BehaviorStep.tsx
  │   ├── ScenarioStep.tsx
  │   ├── StoryStep.tsx
  │   ├── ReviewStep.tsx
  │   └── RecognitionCard.tsx (preview)
  └── lib/
      └── recognition-service.ts (data fetching)
```

### Database Schema Reference

See [09-database-schema.md](09-database-schema.md):
- `nominees` table + foreign key to employees
- `core_value_id` + `behaviour_id` + `scenario_id` (cascading selects)
- `what_happened` + `what_impact` (required text fields)
- `status: 'pending'` on creation
- `idempotency_key` UNIQUE constraint

### Acceptance Criteria

- [ ] Can navigate through 6 steps
- [ ] Cannot submit incomplete forms
- [ ] Cannot recognize self (self-nomination blocked)
- [ ] Behaviors update when Core Value changes
- [ ] Scenarios update when Behavior changes
- [ ] Form validation shows error messages
- [ ] Can submit recognition (creates DB record)
- [ ] Idempotency prevents duplicate submissions
- [ ] Success message shows after submission
- [ ] Takes <60 seconds to complete

---

## Phase 6: Employee Features - Recognition Feed & Dashboard

**Goal**: Display recognitions, badges, and employee overview

**Duration**: 75 minutes  
**Dependencies**: Phase 1–5

### Tasks

1. **Create RecognitionFeedPage** (`src/pages/employee/RecognitionFeedPage.tsx`)
   - Query approved recognitions: `WHERE status = 'approved'`
   - Paginated (20 items/page): `.range(offset, offset + 19)`
   - Sorted newest first: `.order('approved_at', { ascending: false })`
   - RecognitionCard components in a vertical list
   - Filters: By Core Value
   - Empty state if no recognitions

2. **Create RecognitionCard** (`src/components/recognition/RecognitionCard.tsx`)
   - Display: nominator name + avatar, nominee name, Core Value, behavior, story, impact
   - Show: appreciation count, "appreciate" button
   - Design: Card layout (border, shadow, rounded corners)

3. **Create DashboardPage** (`src/pages/employee/DashboardPage.tsx`)
   - Stat tiles: Recognitions received (this month), given (this month)
   - Badge mini cards: Current badge level per Core Value (5 cards)
   - Recent activity feed (last 5 recognitions)
   - Link to "Give Recognition"

4. **Create BadgeJourneyPage** (`src/pages/employee/MyJourneyPage.tsx`)
   - Query employee_value_badges
   - Show per-Core-Value progress
   - Progress bar: current count / next threshold
   - Tabs: Annual, Quarterly
   - Timeline: historical badge history

5. **Create ProfilePage** (`src/pages/employee/ProfilePage.tsx`)
   - Read-only display: employee_id, full_name, email, department, manager, avatar
   - Edit avatar URL
   - Edit bio (if applicable)
   - Cannot edit role, department, manager (HR only)

6. **Add appreciation feature**
   - Click "appreciate" button on card
   - INSERT into nomination_appreciations
   - Update count in real-time

### Files to Create

```
src/
  ├── pages/employee/
  │   ├── DashboardPage.tsx
  │   ├── RecognitionFeedPage.tsx
  │   ├── CoreValueJourneyPage.tsx
  │   └── ProfilePage.tsx
  ├── components/recognition/
  │   ├── RecognitionCard.tsx
  │   └── BadgeMiniCard.tsx
  ├── components/badges/
  │   ├── BadgeProgressMini.tsx
  │   └── BadgeSVG.tsx
  └── lib/
      └── feed-service.ts
```

### Acceptance Criteria

- [ ] Feed displays approved recognitions only
- [ ] Newest recognitions appear first
- [ ] Pagination works (20 items/page)
- [ ] Can filter by Core Value
- [ ] Empty state shown when no recognitions
- [ ] Dashboard stats calculate correctly
- [ ] Badge progress shows current/next threshold
- [ ] Can view annual + quarterly badges
- [ ] Can appreciate a recognition
- [ ] Appreciation count updates in real-time
- [ ] Profile displays correctly
- [ ] Cannot edit role/dept/manager

---

## Phase 7: Badge System & Configuration

**Goal**: Implement badge definitions, calculations, and display

**Duration**: 60 minutes  
**Dependencies**: Phase 1–6

### Tasks

1. **Create badge definitions** (seed with Phase 11)
   - 5 levels per table: badge_definitions
   - Level 1: "Cheers" (1–2 recognitions)
   - Level 2: "Applause" (3–5 recognitions)
   - Level 3: "Kudos" (6–10 recognitions)
   - Level 4: "Spotlight" (11–15 recognitions)
   - Level 5: "Value Ambassador" (16+ recognitions)

2. **Implement badge calculation**
   - Edge Function: `calculate-badges`
   - Triggered after nomination approved
   - Query recognition count per (employee, core_value, period)
   - Determine badge level based on thresholds
   - UPDATE employee_value_badges
   - INSERT badge_history (for timeline)
   - Never downgrade badge in same period

3. **Create BadgeProgressMini** component
   - Shows current badge level (icon + name)
   - Shows progress to next (X / Y recognitions)
   - Color-coded by level

4. **Create BadgeSVG** component
   - Render badge as SVG (visual design)
   - 5 different designs (one per level)
   - Scalable sizes

5. **Create badge-related services**
   - `fetchEmployeeBadges(employee_id)` - Query employee_value_badges
   - `fetchBadgeHistory(employee_id)` - Query badge_history
   - `triggerBadgeCalculation()` - Call Edge Function

### Files to Create

```
src/
  ├── components/badges/
  │   ├── BadgeProgressMini.tsx
  │   ├── BadgeProgressFull.tsx
  │   ├── BadgeSVG.tsx
  │   └── BadgeTimeline.tsx
  └── lib/
      └── badge-service.ts

supabase/
  └── functions/
      └── calculate-badges/
          └── index.ts
```

### Acceptance Criteria

- [ ] 5 badge definitions configured
- [ ] Badge calculation runs after approval
- [ ] Correct badge level awarded (based on count)
- [ ] Badge never downgrades in same period
- [ ] Badge history recorded
- [ ] Badge progress displays correctly
- [ ] SVG badges render properly
- [ ] Can view annual + quarterly badges separately

---

## Phase 8: Manager Features - Approvals & Dashboard

**Goal**: Build manager approval workflow and team views

**Duration**: 75 minutes  
**Dependencies**: Phase 1–7

### Tasks

1. **Create ManagerDashboardPage** (`src/pages/manager/ManagerDashboardPage.tsx`)
   - Pending approvals count (in header)
   - Team stats: Recognitions given, received, this month
   - Team badge distribution (chart: count by badge level)
   - Recent team activity feed

2. **Create PendingApprovalsPage** (`src/pages/manager/PendingApprovalsPage.tsx`)
   - Query recognitions: `WHERE status = 'pending' AND assigned_approver_id = current_user`
   - Expandable cards showing full details
   - Actions: Approve, Reject, Request Clarification (inline)
   - Rejection reason (optional text)
   - Clarification note (optional text)

3. **Implement approval workflow**
   - **Approve**: 
     - Edge Function: update status='approved', published_at=now()
     - Create notification for nominee
     - Trigger badge calculation
   - **Reject**:
     - Edge Function: update status='rejected', rejection_reason, rejected_at
     - Create notification for nominator (reason not visible to them)
   - **Clarify**:
     - Edge Function: update status='clarification_requested', clarification_note
     - Create notification for nominator
     - Nominator can edit and resubmit

4. **Implement approval routing**
   - Default: nominee's manager
   - Escalation if: nominee's manager = nominator's manager → HR
   - Escalation if: nominee = executive → HR
   - Escalation if: no manager assigned → hr_fallback_employee_id

5. **Create TeamRecognitionPage** (`src/pages/manager/TeamRecognitionPage.tsx`)
   - Tab 1: Recognitions given by team
   - Tab 2: Recognitions received by team
   - Filters: By Core Value, by employee, by date
   - Pagination

6. **Create TeamBadgesPage** (`src/pages/manager/TeamBadgesPage.tsx`)
   - Show each team member
   - Badge level per Core Value
   - Heatmap or chart view

### Files to Create

```
src/
  ├── pages/manager/
  │   ├── ManagerDashboardPage.tsx
  │   ├── PendingApprovalsPage.tsx
  │   ├── TeamRecognitionPage.tsx
  │   └── TeamBadgesPage.tsx
  └── lib/
      └── manager-service.ts

supabase/
  └── functions/
      └── process-approval/
          └── index.ts
```

### Acceptance Criteria

- [ ] Can see pending recognitions
- [ ] Can approve (status changed, nominee notified)
- [ ] Can reject (nominator notified, reason hidden)
- [ ] Can request clarification
- [ ] Nominator can edit and resubmit
- [ ] Escalation routes correctly (same-manager → HR, exec → HR)
- [ ] Cannot approve if not assigned approver (RLS enforced)
- [ ] Team stats display correctly
- [ ] Team badge distribution accurate
- [ ] Approvals typically complete <4 hours

---

## Phase 9: HR Features - Analytics, Reports, Admin

**Goal**: Build HR dashboard, analytics, and administrative features

**Duration**: 120 minutes  
**Dependencies**: Phase 1–8

### Tasks

1. **Create HRDashboardPage** (`src/pages/hr/HRDashboardPage.tsx`)
   - Total recognitions (all-time + YTD)
   - Employees with badges (count + %)
   - 12-month trend chart (Recharts)
   - Core Value distribution (pie chart)
   - Recognition leaders (top 5 this month)

2. **Create AnalyticsPage** (`src/pages/hr/AnalyticsPage.tsx`)
   - Recognition leaders by Core Value (top 10)
   - Leaders by department
   - Leaders by time period (filter: month, quarter, year)
   - Filter by: date range, CV, department
   - Export to CSV/XLSX

3. **Create BadgeAnalyticsPage** (`src/pages/hr/BadgeAnalyticsPage.tsx`)
   - Badge distribution chart (employees at each level)
   - By Core Value (5 separate charts or tabs)
   - Both annual + quarterly
   - Trend over time

4. **Create ReportsPage** (`src/pages/hr/ReportsPage.tsx`)
   - Export recognition data
   - Filters: date range, employee, CV, status
   - Format options: CSV, XLSX
   - Column selection
   - Download file

5. **Create EmployeesPage** (`src/pages/hr/EmployeesPage.tsx`)
   - List all employees (pagination, search)
   - Create: email, name, role, department, manager
   - Edit: all fields + avatar URL
   - Deactivate (soft delete): is_active = false
   - Cannot hard-delete (preserves history)
   - Role changes update JWT claims

6. **Create DepartmentsPage** (`src/pages/hr/DepartmentsPage.tsx`)
   - CRUD departments
   - List, create, edit, deactivate

7. **Create ProjectsPage** (`src/pages/hr/ProjectsPage.tsx`)
   - CRUD projects
   - Manage project members (add/remove, join/leave dates)
   - Track membership history

8. **Create CoreValuesPage** (`src/pages/hr/CoreValuesPage.tsx`)
   - View 5 Core Values (fixed)
   - Edit definitions, icon, color
   - Manage behaviors + scenarios
   - Archive (not delete)

9. **Create AuditLogsPage** (`src/pages/hr/AuditLogsPage.tsx`)
   - Search + filter logs
   - By actor, action, entity type, date range
   - Export logs
   - Immutable (read-only)

10. **Create SettingsPage** (`src/pages/hr/SettingsPage.tsx`)
    - Edit app_config values
    - rate_limit_daily, rate_limit_monthly
    - anti_gaming_window_days
    - badge_period_start_month
    - financial_year_q1_start
    - hr_fallback_employee_id

11. **Add export utilities** (`src/lib/export-utils.ts`)
    - CSV export (data → CSV format)
    - XLSX export (data → Excel format)
    - Filename generation
    - Trigger download

### Files to Create

```
src/
  ├── pages/hr/
  │   ├── HRDashboardPage.tsx
  │   ├── AnalyticsPage.tsx
  │   ├── BadgeAnalyticsPage.tsx
  │   ├── ReportsPage.tsx
  │   ├── EmployeesPage.tsx
  │   ├── DepartmentsPage.tsx
  │   ├── ProjectsPage.tsx
  │   ├── CoreValuesPage.tsx
  │   ├── BehavioursPage.tsx
  │   ├── ScenariosPage.tsx
  │   ├── AuditLogsPage.tsx
  │   └── SettingsPage.tsx
  ├── components/analytics/
  │   ├── MetricTile.tsx
  │   ├── SectionCard.tsx
  │   ├── LeaderCard.tsx
  │   └── ChartSkeleton.tsx
  └── lib/
      ├── export-utils.ts
      └── analytics-service.ts
```

### Acceptance Criteria

- [ ] Dashboard displays accurate stats
- [ ] Charts render correctly
- [ ] Analytics leaders list accurate
- [ ] Can export CSV/XLSX
- [ ] Employee CRUD works
- [ ] Department CRUD works
- [ ] Project CRUD works
- [ ] Badge analytics display correctly
- [ ] Audit logs searchable
- [ ] Can configure app settings
- [ ] Settings persist and take effect

---

## Phase 10: Mock Data & Seeding System

**Goal**: Create mock data and seeding system for development

**Duration**: 45 minutes  
**Dependencies**: Phase 1–9 (mostly independent, but needs all tables)

### Tasks

1. **Create mock data file** (`src/data/valuespot-mock-data.json`)
   - Structure: coreValues, badges, people (employees), departments, projects, recognitions
   - Populate with realistic test data
   - See [16-mock-data-and-seeding.md](16-mock-data-and-seeding.md) for format

2. **Create seeding CLI** (`src/data/seeders/`)
   - `seed.ts` — main entry point (CLI)
   - `seedService.ts` — orchestration
   - `departmentSeeder.ts`, `employeeSeeder.ts`, `coreValueSeeder.ts`, etc.
   - `errorFormatter.ts` — user-friendly error messages
   - `utils.ts` — helper functions
   - `verify.ts` — verification CLI

3. **Implement seeding service**
   - Load mock data
   - Use SUPABASE_SERVICE_ROLE_KEY (from .env)
   - Execute seeders in dependency order:
     1. Departments
     2. Core Values, Behaviours, Scenarios
     3. Projects
     4. Employees
     5. Manager relationships
     6. Project members
     7. Nominations
     8. Appreciations
   - Handle errors gracefully
   - Report success/failure

4. **Add npm scripts**
   - `npm run seed` — run seeding
   - `npm run seed:verify` — verify seeded data
   - `npm run supabase:types` — generate TypeScript types

5. **Create test accounts**
   - employee@test.com (employee, no team)
   - manager@test.com (manager, has team)
   - hr@test.com (hr_admin)
   - admin@test.com (super_admin)

### Files to Create

```
src/data/
  ├── valuespot-mock-data.json
  └── seeders/
      ├── seed.ts
      ├── verify.ts
      ├── seedService.ts
      ├── departmentSeeder.ts
      ├── employeeSeeder.ts
      ├── coreValueSeeder.ts
      ├── projectSeeder.ts
      ├── projectMemberSeeder.ts
      ├── nominationSeeder.ts
      ├── errorFormatter.ts
      └── utils.ts
```

### Acceptance Criteria

- [ ] `npm run seed` completes successfully
- [ ] All mock data inserted into database
- [ ] Employee test accounts created
- [ ] Manager relationships established
- [ ] 16 sample recognitions created
- [ ] Badges calculated (if Edge Function runs)
- [ ] `npm run seed:verify` passes all checks
- [ ] Can re-run seed without errors (idempotent)

---

## Phase 11: Testing & Verification

**Goal**: Verify application works end-to-end

**Duration**: 60 minutes  
**Dependencies**: All previous phases

### Tasks

1. **User authentication testing**
   - Log in with employee@test.com
   - Verify role is 'employee'
   - Log in with manager@test.com
   - Verify role is 'manager'
   - Log in with hr@test.com
   - Verify role is 'hr_admin'

2. **Employee workflow testing**
   - Employee dashboard loads
   - Can give recognition (6-step wizard)
   - Can view feed (approved recognitions)
   - Can see own badges
   - Can appreciate recognitions

3. **Manager workflow testing**
   - Manager dashboard shows pending approvals
   - Can approve a recognition
   - Nominee gets notification
   - Badge updated after approval
   - Can reject or request clarification

4. **HR workflow testing**
   - HR dashboard shows statistics
   - Analytics page shows leaders
   - Can export recognitions (CSV, XLSX)
   - Can manage employees
   - Can view audit logs

5. **Security testing**
   - Employee cannot access HR pages (RLS enforced)
   - Manager cannot see other teams' data
   - Rejection reasons hidden from nominee
   - Cannot recognize self
   - Duplicate submissions blocked

6. **Data integrity testing**
   - Snapshots captured correctly
   - Badge levels never downgrade
   - Historical data preserved
   - RLS policies enforced

7. **Performance testing**
   - Dashboard loads in <2s
   - Feed pagination works smoothly
   - Export completes quickly
   - No N+1 queries

### Testing Checklist

```
Authentication & Authorization
  [ ] Can log in with correct role
  [ ] Sessions persist
  [ ] Cannot access unauthorized pages
  [ ] RLS blocks direct API access

Employee Features
  [ ] 6-step wizard works
  [ ] Cannot recognize self
  [ ] Can submit recognition
  [ ] Can view feed
  [ ] Can appreciate recognition
  [ ] Badges display correctly
  [ ] Dashboard shows stats

Manager Features
  [ ] Pending approvals list works
  [ ] Can approve/reject/clarify
  [ ] Team views show correct data
  [ ] Cannot see other teams (RLS enforced)

HR Features
  [ ] Dashboard loads quickly
  [ ] Analytics show correct data
  [ ] Can export CSV/XLSX
  [ ] Employee CRUD works
  [ ] Can manage departments/projects
  [ ] Audit logs visible

Data Integrity
  [ ] Snapshots captured
  [ ] Badges never downgrade
  [ ] Historical data preserved
  [ ] Idempotency keys work

Performance
  [ ] Dashboard <2s load time
  [ ] Feed pagination smooth
  [ ] No excessive queries
  [ ] Export responsive
```

### Acceptance Criteria

- [ ] All tests pass
- [ ] No console errors
- [ ] No RLS permission errors
- [ ] Performance acceptable
- [ ] Application ready for production deployment

---

## Summary Timeline

| Phase | Duration | Cumulative |
|-------|----------|-----------|
| 1. Setup | 30 min | 30 min |
| 2. Database | 45 min | 75 min |
| 3. Auth | 60 min | 135 min |
| 4. Layout | 45 min | 180 min |
| 5. Wizard | 90 min | 270 min |
| 6. Feed | 75 min | 345 min |
| 7. Badges | 60 min | 405 min |
| 8. Manager | 75 min | 480 min |
| 9. HR | 120 min | 600 min |
| 10. Seeding | 45 min | 645 min |
| 11. Testing | 60 min | 705 min |
| **TOTAL** | **705 min** | **(11 hours 45 min)** |

---

## Key Principles During Rebuild

1. **Security First**: RLS enforced on all tables, never service role in frontend
2. **Type Safety**: Full TypeScript, no `any` types, auto-generated DB types
3. **Data Integrity**: Historical snapshots, idempotency keys, soft deletes
4. **User Experience**: All pages have loading, empty, and error states
5. **Testing**: Verify each phase before proceeding to next
6. **Consistency**: Follow design system, naming conventions, patterns

---

## Related Documentation

- See [CLAUDE_CODE_MASTER_PROMPT.md](CLAUDE_CODE_MASTER_PROMPT.md) for detailed implementation instructions
- See [README.md](README.md) for full documentation index

---

**Status**: ✅ Complete implementation guide  
**Last Updated**: September 2026
