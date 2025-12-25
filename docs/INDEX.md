# Force Majeure Documentation Index

> Master table of contents for all project documentation.

---

## Quick Start

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview, setup instructions, and quick start guide |
| [CLAUDE.md](../CLAUDE.md) | AI assistant context - project structure, conventions, and guidelines |
| [AI_INSTRUCTIONS.md](./AI_INSTRUCTIONS.md) | Shared TypeScript standards for all AI assistants |

---

## Architecture (`docs/architecture/`)

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | System architecture overview and design decisions |
| [ARCHITECTURE_QUICK_REFERENCE.md](./architecture/ARCHITECTURE_QUICK_REFERENCE.md) | Condensed architecture cheat sheet |
| [DESIGN_SYSTEM.md](./architecture/DESIGN_SYSTEM.md) | Complete design system - colors, spacing, typography, components |
| [PARALLAX_SYSTEM.md](./architecture/PARALLAX_SYSTEM.md) | Parallax scrolling system implementation |

---

## Features (`docs/features/`)

| Document | Description |
|----------|-------------|
| [DATA_GRID_DOCUMENTATION.md](./features/DATA_GRID_DOCUMENTATION.md) | FmCommonDataGrid component usage and configuration |
| [DATA_GRID_COLUMN_TYPES.md](./features/DATA_GRID_COLUMN_TYPES.md) | Column type definitions for data grids |
| [DYNAMIC_DATAGRID_IMPLEMENTATION.md](./features/DYNAMIC_DATAGRID_IMPLEMENTATION.md) | Dynamic data grid implementation guide |
| [FEATURE_FLAG_GUIDE.md](./features/FEATURE_FLAG_GUIDE.md) | Feature flag system documentation |
| [MOBILE_DEV_TOOLBAR.md](./features/MOBILE_DEV_TOOLBAR.md) | Mobile developer toolbar - FAB and bottom sheet implementation |
| [SESSION_OVERRIDES.md](./features/SESSION_OVERRIDES.md) | Session-based feature flag overrides for dev/admin |
| [SHOPPING_CART_GUIDE.md](./features/SHOPPING_CART_GUIDE.md) | Shopping cart implementation and Zustand store |
| [SKELETON_LOADING_GUIDE.md](./features/SKELETON_LOADING_GUIDE.md) | Skeleton loading state patterns |
| [TICKETING_GATE_IMPLEMENTATION.md](./features/TICKETING_GATE_IMPLEMENTATION.md) | Ticketing gate/scanning feature |

---

## Security (`docs/security/`)

| Document | Description |
|----------|-------------|
| [PERMISSION_MANAGEMENT_GUIDE.md](./security/PERMISSION_MANAGEMENT_GUIDE.md) | Role-based access control system guide |
| [ROLE_PERMISSION_QUICK_REFERENCE.md](./security/ROLE_PERMISSION_QUICK_REFERENCE.md) | Quick reference for roles and permissions |

---

## Error Handling (`docs/error-handling/`)

| Document | Description |
|----------|-------------|
| [ERROR_HANDLING_GUIDE.md](./error-handling/ERROR_HANDLING_GUIDE.md) | Error handling patterns and best practices |
| [ERROR_HANDLING_README.md](./error-handling/ERROR_HANDLING_README.md) | Error handling README overview |
| [examples/ERROR_HANDLER_MIGRATION.md](./error-handling/examples/ERROR_HANDLER_MIGRATION.md) | Migration examples for error handling |

---

## Backend (`docs/backend/`)

| Document | Description |
|----------|-------------|
| [EDGE_FUNCTIONS.md](./backend/EDGE_FUNCTIONS.md) | Supabase Edge Functions API documentation |
| [DATABASE_MIGRATION_STRATEGY.md](./backend/DATABASE_MIGRATION_STRATEGY.md) | Database migration approach and strategy |
| [RLS_AND_GRANTS_GUIDE.md](./backend/RLS_AND_GRANTS_GUIDE.md) | **CRITICAL**: RLS policies AND GRANTs for table access |
| [ENVIRONMENT_SYSTEM.md](./backend/ENVIRONMENT_SYSTEM.md) | Environment configuration system |
| [EVENT_VIEWS_SETUP.md](./backend/EVENT_VIEWS_SETUP.md) | Event views database setup |
| [IMAGE_UPLOAD_SETUP.md](./backend/IMAGE_UPLOAD_SETUP.md) | Image upload configuration guide |
| [LOCAL_EMAIL_TESTING.md](./backend/LOCAL_EMAIL_TESTING.md) | Local email testing setup |

---

## Testing (`docs/testing/`)

| Document | Description |
|----------|-------------|
| [TESTING_GUIDE.md](./testing/TESTING_GUIDE.md) | Testing patterns, setup, and best practices |

---

## Refactoring (`docs/refactoring/`)

Active refactoring plans and guides:

| Document | Description |
|----------|-------------|
| [COMPONENT_REFACTORING_GUIDE.md](./refactoring/COMPONENT_REFACTORING_GUIDE.md) | Component refactoring patterns and guidelines |
| [ARTIST_REGISTER_REFACTORING_PLAN.md](./refactoring/ARTIST_REGISTER_REFACTORING_PLAN.md) | Artist registration refactoring plan |
| [EVENT_DETAILS_CONTENT_REFACTORING.md](./refactoring/EVENT_DETAILS_CONTENT_REFACTORING.md) | Event details page refactoring notes |
| [TICKET_GROUP_MANAGER_REFACTORING.md](./refactoring/TICKET_GROUP_MANAGER_REFACTORING.md) | Ticket group manager refactoring plan |

---

## Other

| Document | Description |
|----------|-------------|
| [LOVABLE.md](./LOVABLE.md) | Lovable AI integration notes |

---

## Archive (`docs/archive/`)

Completed work preserved for historical reference:

| Document | Description |
|----------|-------------|
| [PHASE_3_COMPLETE.md](./archive/PHASE_3_COMPLETE.md) | DataGrid Phase 3 completion summary (Nov 2025) |
| [REFACTORING_COMPLETE_SUMMARY.md](./archive/REFACTORING_COMPLETE_SUMMARY.md) | Component refactoring completion summary |
| [ROLE_SYSTEM_CLEANUP.md](./archive/ROLE_SYSTEM_CLEANUP.md) | Role system DB migration guide (completed) |
| [PRODUCTS_IMPLEMENTATION_SUMMARY.md](./archive/PRODUCTS_IMPLEMENTATION_SUMMARY.md) | Products table implementation (completed) |
| [TICKETING_IMPLEMENTATION_SUMMARY.md](./archive/TICKETING_IMPLEMENTATION_SUMMARY.md) | Physical ticketing system (completed) |
| [MIGRATION_COMPLETE.md](./archive/MIGRATION_COMPLETE.md) | Feature structure migration (completed Nov 2025) |
| [MIGRATION-CONSOLIDATION.md](./archive/MIGRATION-CONSOLIDATION.md) | Database consolidation (completed Nov 2025) |

---

## Feature-Specific READMEs

Located within their respective source directories:

| Document | Description |
|----------|-------------|
| [packages/web/src/features/payments/README.md](../packages/web/src/features/payments/README.md) | Payments feature documentation |
| [packages/web/src/services/email/README.md](../packages/web/src/services/email/README.md) | Email service documentation |
| [packages/web/src/config/tailwind/README.md](../packages/web/src/config/tailwind/README.md) | Tailwind configuration |
| [packages/web/src/components/scavenger/ARCHITECTURE_REFACTOR.md](../packages/web/src/components/scavenger/ARCHITECTURE_REFACTOR.md) | Scavenger hunt architecture |

---

## Directory Structure

```
docs/
├── INDEX.md                 # This file
├── AI_INSTRUCTIONS.md       # AI assistant standards
├── LOVABLE.md               # Lovable AI notes
├── architecture/            # System design docs (4)
├── backend/                 # Infrastructure docs (8)
├── error-handling/          # Error handling docs (3)
├── features/                # Feature-specific docs (10)
├── refactoring/             # Active refactoring plans (5)
├── security/                # Auth & permissions (2)
├── testing/                 # Testing docs (1)
└── archive/                 # Completed/historical (7)
```

---

## Quick Links by Role

### New Developers

1. [README.md](../README.md)
2. [CLAUDE.md](../CLAUDE.md)
3. [architecture/ARCHITECTURE.md](./architecture/ARCHITECTURE.md)
4. [architecture/DESIGN_SYSTEM.md](./architecture/DESIGN_SYSTEM.md)

### AI Assistants

1. [CLAUDE.md](../CLAUDE.md)
2. [AI_INSTRUCTIONS.md](./AI_INSTRUCTIONS.md)
3. [architecture/ARCHITECTURE_QUICK_REFERENCE.md](./architecture/ARCHITECTURE_QUICK_REFERENCE.md)

### Backend Work

1. [backend/EDGE_FUNCTIONS.md](./backend/EDGE_FUNCTIONS.md)
2. [backend/DATABASE_MIGRATION_STRATEGY.md](./backend/DATABASE_MIGRATION_STRATEGY.md)
3. [security/PERMISSION_MANAGEMENT_GUIDE.md](./security/PERMISSION_MANAGEMENT_GUIDE.md)

### Frontend Work

1. [architecture/DESIGN_SYSTEM.md](./architecture/DESIGN_SYSTEM.md)
2. [features/DATA_GRID_DOCUMENTATION.md](./features/DATA_GRID_DOCUMENTATION.md)
3. [refactoring/COMPONENT_REFACTORING_GUIDE.md](./refactoring/COMPONENT_REFACTORING_GUIDE.md)

---

*Last updated: December 21, 2025*
