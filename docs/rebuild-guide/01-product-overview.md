# 1. Product Overview

## Application Identity

**Name**: ValueSpot  
**Organization**: Touchcore  
**Type**: Enterprise recognition and culture platform  
**Status**: Production-ready MVP  
**Version**: 1.0.0

---

## Executive Summary

ValueSpot is an employee recognition platform that celebrates behaviors aligned with an organization's core values. It enables peer-to-peer recognition within teams, provides manager-led approval workflows, and delivers HR analytics on recognition patterns and cultural health.

The platform gamifies recognition through a five-tier badge system—employees earn "Cheers," "Applause," "Kudos," "Spotlight," and "Value Ambassador" badges as they receive recognition for specific core values.

---

## Business Problem Solved

### The Challenge

Employees often don't recognize each other's contributions in alignment with organizational values. Recognition tends to be:
- **Infrequent**: Only happens during formal performance reviews
- **Disconnected from values**: Generic "good job" without linking to cultural pillars
- **Unstructured**: No framework for meaningful, actionable feedback
- **Invisible**: Achievements go unnoticed across the organization
- **Unequal**: Some employees get recognition; others' work is invisible

### The Solution

ValueSpot provides a **structured, values-aligned recognition system** that:
- Makes recognition **frequent and visible** (feed, notifications, badges)
- Links every recognition to **specific Core Values and behaviors**
- Provides **approval workflows** so recognition is verified and meaningful
- Tracks **recognition trends** for cultural insights
- **Celebrates publicly** to reinforce organizational culture

---

## Target Users

### Primary Users

| User Type | Count | Goals |
|-----------|-------|-------|
| **Employees** | 9–500+ | Give/receive recognition, track personal badges, see team achievements |
| **Managers** | 1–50+ | Approve recognition from team, motivate reports via badges, see team trends |
| **HR / Culture Team** | 1–5 | Drive culture initiatives, analyze recognition patterns, report on cultural health |

### Personas

#### 1. Sarah (Employee)
- **Role**: Individual contributor in Product
- **Goal**: Celebrate team wins and get recognized for good work
- **Use case**: "I want to recognize my colleague for helping me debug a production issue"
- **Success**: Gets badge feedback, sees recognition in feed, contributes to team culture

#### 2. Michael (Manager)
- **Role**: Engineering manager with 8 reports
- **Goal**: Motivate team, ensure recognition is meaningful, stay on top of team wins
- **Use case**: "I need to approve pending recognitions and see which team members are earning badges"
- **Success**: Approvals take <2 min, team sees their recognition published, trends show engagement

#### 3. Priya (HR / Culture Lead)
- **Role**: HR partner responsible for culture and engagement
- **Goal**: Track cultural health, identify engagement trends, drive culture initiatives
- **Use case**: "I need to see which Core Values are being recognized, who's earning badges, and trends over time"
- **Success**: Can export data for reports, spot gaps in recognition, celebrate leaders in company meetings

---

## Core Value Framework

The application is built around **5 Organizational Core Values**:

| Core Value | Definition | Typical Behaviors |
|-----------|-----------|------------------|
| **Adaptable** | Embracing change, staying flexible | Pivot quickly, learn new tools, support process changes |
| **Transparent** | Open communication, honesty | Share feedback openly, admit mistakes, overcommunicate |
| **Collaborative** | Teamwork, helping others | Pair with colleagues, mentor, jump in to help |
| **Innovative** | Creativity, trying new things | Propose ideas, experiment, solve problems differently |
| **Accountable** | Taking ownership, reliability | Deliver on commitments, own mistakes, follow through |

Each Core Value has **5 specific Behaviors** (e.g., "Adaptable" → "Embrace new ideas," "Learn continuously," etc.).

---

## Key Features

### For Employees

✅ **Give Recognition** (6-step wizard)
- Select colleague being recognized
- Choose Core Value they demonstrated
- Pick specific behavior and scenario
- Tell what happened + the impact
- Review and submit

✅ **Receive Recognition**
- See recognitions in personal feed (once approved)
- Earn badges as recognition accumulates
- Track badge progression per Core Value
- See historical recognition journey

✅ **View Recognition Feed**
- Approved recognitions from across organization
- Filter by Core Value, person, department
- See trends in who's recognized for what

### For Managers

✅ **Approve/Clarify Recognitions**
- Queue of recognitions from team members
- One-click approve, request clarification, or reject
- Inline reason for rejection (if needed)

✅ **See Team Performance**
- Team recognition dashboard (given + received)
- Team badge distribution
- Recent team activity

### For HR

✅ **Comprehensive Analytics**
- Recognition leaderboards (by Core Value, by department, by month)
- Badge distribution charts
- Trend analysis (who's most recognized, which values emphasized)

✅ **Admin Functions**
- Manage employees (CRUD, roles, departments)
- Manage projects and teams
- Configure Core Values and behaviors
- Configure badge thresholds
- View audit logs of all system actions

✅ **Export & Reporting**
- Export recognition data (CSV/XLSX)
- Filter by date, employee, Core Value
- Monthly/quarterly reports

---

## User Roles & Permissions

### Four Tiers

| Role | Created By | Capabilities |
|------|-----------|---|
| **Employee** | Signup / HR | Give recognition, receive recognition, view feed, track own badges |
| **Manager** | HR promotion | All employee + approve/reject/clarify recognitions from reports + view team badges |
| **HR Admin** | System setup | Full system access, manage all data, view analytics, manage config, audit logs |
| **Super Admin** | System setup | Same as HR Admin (no distinction in current implementation) |

### Permission Model

**Database-enforced via Row-Level Security (RLS)** — not just frontend guards. Every table has RLS policies:
- Employees read non-sensitive employee data
- Managers read team data + recognitions for team
- HR reads all data
- Self-nomination is **prevented at database level** (CHECK constraint)
- Rejection reasons are **hidden from non-HR** at database level

---

## Core Business Rules

### Recognition Rules

1. **Self-nomination prevention** ✅
   - Cannot recognize yourself (database CHECK constraint)

2. **Rate limiting** ⚠️ (configured but not actively enforced)
   - Configurable: Max X recognitions per employee per day/month
   - Rate limit check at submission time

3. **Anti-gaming** ⚠️ (infrastructure exists; enforcement depends on config)
   - Flag rapid mutual recognition (A recognizes B, then B recognizes A within 30 days)
   - Flag same pair recognizing each other multiple times in a period
   - HR reviews flagged patterns

4. **Idempotency** ✅
   - Duplicate submissions prevented via `idempotency_key` UNIQUE constraint
   - Protects against network retries

### Badge Rules

1. **Recognition count by Core Value** ✅
   - Badges awarded based on number of recognitions for a specific Core Value
   - Not based on performance or ranking

2. **Badge levels** (5 tiers):
   - **B1 "Cheers"**: 1–2 recognitions
   - **B2 "Applause"**: 3–5 recognitions
   - **B3 "Kudos"**: 6–10 recognitions
   - **B4 "Spotlight"**: 11–15 recognitions
   - **B5 "Value Ambassador"**: 16+ recognitions

3. **Annual + Quarterly periods** ✅
   - Badges tracked separately for calendar year AND fiscal quarters
   - Period start month configurable (default: January for annual, April/July/October/January for fiscal)

4. **No downgrade** ✅
   - Badge level never goes down in a period
   - Once earned "Kudos" (B3), cannot drop back to "Applause" (B2) same year

5. **Historical badges** ⚠️
   - Historical badge data preserved via `badge_history` table
   - Allows looking back at past badge levels

### Approval Workflow Rules

1. **Status flow**:
   - `draft` → `pending` (on submission)
   - `pending` → `approved` / `rejected` / `clarification_requested`
   - `clarification_requested` → `pending` (after employee responds)

2. **Approver assignment** ✅
   - Default: employee's manager
   - If employee's manager = nominee's manager: escalate to HR
   - If nominee = C-level: escalate to HR
   - If nominee's manager not set: route to designated HR fallback

3. **Idempotency for approvals** ⚠️
   - Approvals are idempotent (same approver can re-approve same ID safely)

---

## Recognition Lifecycle

```
Employee gives recognition
    ↓
Step 1: Choose nominee
    ↓
Step 2: Select Core Value
    ↓
Step 3: Pick behavior + scenario
    ↓
Step 4: Story (what happened) + Impact
    ↓
Step 5: Review (preview card)
    ↓
Step 6: Submit
    ↓
Status: PENDING (awaiting approval)
    ↓
Manager / HR approves, rejects, or requests clarification
    ↓
If APPROVED:
  - Status: APPROVED
  - Published in feed
  - Appreciations enabled
  - Badge count incremented
  - Recipient notified
    ↓
If REJECTED:
  - Status: REJECTED
  - Nominator can see rejection (not reason, unless HR)
  - Nominee never sees nomination
    ↓
If CLARIFICATION REQUESTED:
  - Status: CLARIFICATION_REQUESTED
  - Nominator notified, can update story
  - Resubmit to manager
  - Repeats approval flow
```

---

## Historical Data Integrity

### Snapshot Fields

Every recognition record captures "snapshot" data at insertion time:
- `snapshot_nominator_dept` — nominator's department name at time of recognition
- `snapshot_nominee_dept` — nominee's department name at time of recognition
- `snapshot_nominee_manager_id` — nominee's manager at time of recognition
- `snapshot_core_value_name` — Core Value name at submission
- `snapshot_behaviour_name` — Behavior name at submission
- `snapshot_scenario_name` — Scenario name at submission
- `snapshot_project_name` — Project name at submission

**Purpose**: If an employee changes departments or manager later, historical recognition remains accurate. Reports show "Dept X" at time of recognition, not current dept.

---

## Non-Goals & Constraints

### What ValueSpot Does NOT Do

❌ **Not a performance management tool**
- Recognition frequency is NOT a performance score
- Badges are "celebration," not "rating"
- System explicitly prevents using badges for appraisals

❌ **Not a public leaderboard**
- No "Top 10 Recognized Employees" visible to entire company
- Recognition celebrates behavior, not competition

❌ **Not connected to compensation**
- Badges do not influence salary/bonuses
- System designed for culture, not incentive alignment

❌ **Not a feedback system**
- Recognition is one-directional (you recognize someone)
- No 360 feedback or multi-rater surveys

❌ **Not a task/project management tool**
- Project context is optional (for "what" context)
- Not designed for tracking work items

---

## MVP vs. Future Features

### ✅ Fully Implemented (MVP Complete)

- ✅ 5-step recognition wizard
- ✅ Role-based approval workflows
- ✅ Badge system (5 levels × 5 values)
- ✅ Manager approval/clarification
- ✅ Employee recognition feed
- ✅ HR analytics & export
- ✅ Database-enforced security
- ✅ Audit logging
- ✅ Mock data seeding

### 🚧 Partially Implemented (Infrastructure Ready)

- ⚠️ Rate limiting (config exists; enforcement needs activation)
- ⚠️ Anti-gaming detection (tables exist; enforcement depends on config)
- ⚠️ Notifications (table + bell icon; email not integrated)
- ⚠️ Reward assignments (structure exists; no UI)

### 📋 Future Enhancements (Not in Scope)

- Sentiment analysis of recognition text
- Peer groups / team benchmarking
- Mobile app (responsive web only)
- Email notifications
- Slack / Teams integration
- Advanced forecasting
- Predictive churn analysis

---

## Key Metrics Tracked

### Recognition Metrics

- Total recognitions given/received
- Recognitions by Core Value
- Recognition trends (month-over-month)
- Recognition by department/project
- Average time to approval

### Engagement Metrics

- % of employees who gave recognition
- % of employees who received recognition
- % of badges unlocked
- Badge distribution (by level)
- Repeat recognizers (giver retention)

### Culture Metrics

- Which Core Values are most recognized (indicates culture emphasis)
- Recognition gaps (values with low recognition)
- Team performance (team given + received)
- Manager approval patterns (speed, rejection rate)

---

## Design & Aesthetic

### Visual Approach

- **Design System**: Blueprint (monochromatic steel-blue, minimal, corporate)
- **Color Palette**: Single hue (blues + grays), no bright colors or gradients
- **Typography**: Barlow (modern sans-serif), Barlow Condensed (headers)
- **Spacing**: Generous whitespace, 4px–24px increments
- **Interactions**: Subtle animations, no excessive movement or bounce

### Brand Feeling

**"Corporate + Modern + Human + Premium + Simple"**
- Trustworthy (finance/healthcare appropriate)
- Clean (minimal design)
- Approachable (not cold)
- Professional (ready for exec use)
- Easy (recognitions take <60 seconds)

---

## Success Criteria

The application is successful if:

✅ **Adoption**: >80% of employees have given at least one recognition within 3 months  
✅ **Engagement**: Employees give >100 recognitions per month (per 100 employees)  
✅ **Culture**: Recognition patterns reflect intended Core Values (not skewed to one value)  
✅ **Speed**: Average recognition submission <60 seconds  
✅ **Quality**: Approval workflow average <4 hours  
✅ **Leadership Buy-in**: Executives/managers use the tool actively  

---

## Related Documentation

- See [02-functional-requirements.md](02-functional-requirements.md) for detailed feature specs
- See [03-user-roles-and-permissions.md](03-user-roles-and-permissions.md) for permission matrix
- See [04-user-journeys.md](04-user-journeys.md) for step-by-step workflows
- See [09-database-schema.md](09-database-schema.md) for recognition lifecycle in SQL

---

**Status**: ✅ Verified from actual codebase  
**Last Updated**: September 2026
