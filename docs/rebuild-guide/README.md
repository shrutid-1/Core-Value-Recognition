# ValueSpot Application Rebuild Guide

## Overview

This documentation provides complete, implementation-grade specifications for rebuilding the **Touchcore ValueSpot** application from scratch. It is designed to enable another AI coding platform (such as Claude Code) to reconstruct this application as closely as possible to the original.

**ValueSpot** is an employee recognition and Core Values celebration platform that enables peer-to-peer recognition tied to organizational values, with automated badge tracking, manager approval workflows, and comprehensive HR analytics.

---

## Documentation Structure

This guide is organized into 21 detailed sections covering every aspect of the application:

### Core Documentation

1. **[01-product-overview.md](01-product-overview.md)**
   - Application purpose and business context
   - Target users and user personas
   - Feature overview
   - Business rules and constraints

2. **[02-functional-requirements.md](02-functional-requirements.md)**
   - Complete list of implemented features
   - Feature status (fully implemented, partial, planned)
   - Detailed feature specifications
   - User workflows and interactions

3. **[03-user-roles-and-permissions.md](03-user-roles-and-permissions.md)**
   - User role definitions (Employee, Manager, HR Admin, Super Admin)
   - Permission matrix
   - Role-based access control implementation
   - Data-level security model

4. **[04-user-journeys.md](04-user-journeys.md)**
   - Complete user journeys for each role
   - Workflow diagrams and sequences
   - Happy paths and edge cases
   - Integration points between features

### UI/UX Documentation

5. **[05-ui-ux-specification.md](05-ui-ux-specification.md)**
   - Detailed page specifications for all 25+ pages
   - Component layouts and hierarchies
   - Forms, tables, filters, search
   - Empty, loading, and error states

6. **[06-navigation-and-routing.md](06-navigation-and-routing.md)**
   - Complete routing map (25+ routes)
   - Navigation structure and sidebar layout
   - Route access control and guards
   - Breadcrumb navigation and deep linking

### Technical Architecture

7. **[07-technical-architecture.md](07-technical-architecture.md)**
   - System architecture overview
   - Frontend architecture (React + TypeScript)
   - Backend architecture (Supabase)
   - Data flow and integration patterns

8. **[08-project-structure.md](08-project-structure.md)**
   - Complete file/folder structure
   - Module organization
   - File purposes and dependencies
   - Architecture and design patterns

### Database & Data

9. **[09-database-schema.md](09-database-schema.md)**
   - All database tables and columns
   - Data types, constraints, and indexes
   - Foreign key relationships
   - Unique constraints and check constraints

10. **[10-data-model-and-relationships.md](10-data-model-and-relationships.md)**
    - Entity relationship diagrams
    - Data relationships and cardinalities
    - Important business logic in data model
    - Historical snapshot pattern

11. **[16-mock-data-and-seeding.md](16-mock-data-and-seeding.md)**
    - Mock data structure and format
    - Seeding system architecture
    - Seeding execution flow
    - Data transformation rules and UUID mapping

### Configuration & Security

12. **[11-supabase-configuration.md](11-supabase-configuration.md)**
    - Supabase project setup requirements
    - Environment variable configuration (without exposing secrets)
    - RLS policy setup
    - Custom JWT hook configuration

13. **[12-authentication-and-security.md](12-authentication-and-security.md)**
    - Authentication flow and JWT tokens
    - Authorization model (RLS policies)
    - Security best practices
    - Data privacy and protection

### Components & Design

14. **[13-components.md](13-components.md)**
    - All reusable components
    - Component props and behavior
    - Component hierarchy and dependencies
    - Usage examples and patterns

15. **[15-design-system.md](15-design-system.md)**
    - Color palette and tokens
    - Typography scale and families
    - Spacing and layout conventions
    - UI component patterns and interactions
    - Animations and transitions

### Services & Data Access

16. **[14-services-and-data-access.md](14-services-and-data-access.md)**
    - Supabase client configuration
    - Data fetching patterns and conventions
    - Query builders and filters
    - Error handling
    - Edge Functions and backend operations

### Development & Deployment

17. **[17-development-setup.md](17-development-setup.md)**
    - Prerequisites and system requirements
    - Installation steps (dependencies, environment)
    - Running development server
    - Building and testing
    - Database seeding

18. **[18-testing-and-verification.md](18-testing-and-verification.md)**
    - Manual testing procedures
    - Verification checklist
    - Seeding verification
    - Performance considerations

### Implementation Guides

19. **[19-known-issues-and-limitations.md](19-known-issues-and-limitations.md)**
    - Known limitations
    - Not-yet-implemented features
    - Edge cases and workarounds
    - Performance considerations

20. **[20-rebuild-plan-for-claude-code.md](20-rebuild-plan-for-claude-code.md)**
    - Step-by-step rebuild phases
    - Phase dependencies and ordering
    - Acceptance criteria for each phase
    - Files to create in each phase

21. **[CLAUDE_CODE_MASTER_PROMPT.md](CLAUDE_CODE_MASTER_PROMPT.md)**
    - Comprehensive master prompt for Claude Code
    - Detailed implementation instructions
    - Architecture principles to follow
    - Quality and verification standards

### Reference

22. **[DOCUMENTATION_COMPLETENESS_CHECKLIST.md](DOCUMENTATION_COMPLETENESS_CHECKLIST.md)**
    - Checklist of all documented areas
    - Coverage verification
    - Links to relevant documentation sections

---

## How to Use This Documentation

### For Complete Rebuild

1. **Start with**: [01-product-overview.md](01-product-overview.md) — Understand what you're building
2. **Then read**: [07-technical-architecture.md](07-technical-architecture.md) — Understand how it's built
3. **For implementation**: [20-rebuild-plan-for-claude-code.md](20-rebuild-plan-for-claude-code.md) — Follow the phase-by-phase guide
4. **For specific areas**: Jump to relevant documentation sections

### For Reference During Implementation

- **Building UI**: See [05-ui-ux-specification.md](05-ui-ux-specification.md) and [15-design-system.md](15-design-system.md)
- **Creating database**: See [09-database-schema.md](09-database-schema.md)
- **Understanding data flow**: See [14-services-and-data-access.md](14-services-and-data-access.md)
- **Setting up Supabase**: See [11-supabase-configuration.md](11-supabase-configuration.md)
- **Creating components**: See [13-components.md](13-components.md)

### For Verification

- **Checklist**: [DOCUMENTATION_COMPLETENESS_CHECKLIST.md](DOCUMENTATION_COMPLETENESS_CHECKLIST.md)
- **Manual testing**: [18-testing-and-verification.md](18-testing-and-verification.md)
- **Known issues**: [19-known-issues-and-limitations.md](19-known-issues-and-limitations.md)

---

## Key Principles for Rebuilding

### 1. Security First
- All authorization is database-enforced via RLS policies (not just frontend guards)
- Service role key is NEVER exposed in frontend code
- JWT claims are used for RLS decisions (not database lookups)

### 2. Type Safety
- Full TypeScript + strict mode throughout
- Auto-generated database types from Supabase schema
- No `any` types unless absolutely necessary

### 3. Data Integrity
- Historical snapshots on recognition records ensure historical accuracy
- Idempotency keys prevent duplicate submissions
- Soft deletes preserve historical data

### 4. User Experience
- Modern, minimal design system (Blueprint aesthetic)
- Responsive design supporting all screen sizes
- Empty/loading/error states for every data-driven page

### 5. Maintainability
- Clear separation of concerns (components, services, types)
- Reusable components and utilities
- Consistent naming conventions and patterns

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form + Zod |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (JWT-based) |
| **Backend Logic** | Supabase Edge Functions |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Export** | XLSX + File-Saver |

---

## Important Notes

### Source of Truth
**The actual codebase is the authoritative source of truth.** This documentation describes the current implementation. If you notice discrepancies between this documentation and the actual code, the code is correct.

### Completeness Verification
Each documentation file includes a **"Verification Status"** section indicating:
- ✅ Verified from actual codebase
- 🔍 Analyzed from codebase
- ⚠️ Inferred from patterns
- ⚠️ Not confirmed from codebase

### Confidentiality
- **NO API keys, passwords, or secrets** are included in this documentation
- All credential examples are placeholders
- `.env` values are shown as examples only, not real values

### Version Information
- **Application**: ValueSpot v1.0.0
- **Documentation Version**: 1.0
- **Last Updated**: September 2026
- **Based on**: Full codebase analysis including migrations, components, services, and configuration

---

## Quick Links

| Task | Document |
|------|----------|
| Understand the product | [01-product-overview.md](01-product-overview.md) |
| Plan rebuild phases | [20-rebuild-plan-for-claude-code.md](20-rebuild-plan-for-claude-code.md) |
| Get started with Claude Code | [CLAUDE_CODE_MASTER_PROMPT.md](CLAUDE_CODE_MASTER_PROMPT.md) |
| Build the database | [09-database-schema.md](09-database-schema.md) |
| Build the UI | [05-ui-ux-specification.md](05-ui-ux-specification.md) + [15-design-system.md](15-design-system.md) |
| Understand authentication | [12-authentication-and-security.md](12-authentication-and-security.md) |
| Set up development | [17-development-setup.md](17-development-setup.md) |
| Verify everything | [18-testing-and-verification.md](18-testing-and-verification.md) |
| Check coverage | [DOCUMENTATION_COMPLETENESS_CHECKLIST.md](DOCUMENTATION_COMPLETENESS_CHECKLIST.md) |

---

## Getting Help

When rebuilding, refer to:
1. The specific documentation page for your current task
2. The "Related Documentation" section at the bottom of each page
3. The "Verification Status" to understand how well-documented each area is
4. The actual codebase as the source of truth

---

**Ready to rebuild? Start with [01-product-overview.md](01-product-overview.md)**

**Or jump to: [20-rebuild-plan-for-claude-code.md](20-rebuild-plan-for-claude-code.md) for a phased implementation guide**

**Or for Claude Code: [CLAUDE_CODE_MASTER_PROMPT.md](CLAUDE_CODE_MASTER_PROMPT.md)**
