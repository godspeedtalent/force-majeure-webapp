# Feature-Based Architecture - Quick Reference

## 📁 Directory Structure at a Glance

```
force-majeure-webapp/
│
├── src/
│   │
│   ├── features/          ← BUSINESS LOGIC (Feature Modules)
│   │   ├── auth/          • Authentication & Authorization
│   │   ├── events/        • Event Management
│   │   ├── ticketing/     • Ticket Sales
│   │   ├── payments/      • Payment Processing
│   │   ├── merch/         • Merchandise Store
│   │   ├── scavenger/     • Scavenger Hunt Game
│   │   ├── admin/         • Admin Panel
│   │   ├── artist/        • Artist Profiles
│   │   ├── venue/         • Venue Info
│   │   ├── musicplayer/   • Music Player
│   │   └── organization/  • Org Management
│   │
│   ├── shared/            ← REUSABLE CODE (2+ features use it)
│   │   ├── components/    • Button, Card, Modal, etc.
│   │   ├── hooks/         • useDebounce, useFetch, etc.
│   │   ├── utils/         • formatDate, validation, etc.
│   │   ├── types/         • User, ApiResponse, etc.
│   │   ├── constants/     • API_BASE_URL, ROUTES, etc.
│   │   └── services/      • apiClient, storage, etc.
│   │
│   ├── core/              ← APP INFRASTRUCTURE
│   │   ├── router/        • Route definitions
│   │   ├── api/           • API client config
│   │   ├── providers/     • ThemeProvider, AuthProvider
│   │   └── layouts/       • MainLayout, AuthLayout
│   │
│   ├── assets/            ← STATIC ASSETS
│   │   ├── images/
│   │   ├── styles/
│   │   └── fonts/
│   │
│   ├── App.tsx            ← APP ROOT
│   └── main.tsx           ← ENTRY POINT
│
├── public/                ← PUBLIC ASSETS
├── docs/                  ← DOCUMENTATION
└── scripts/               ← BUILD & UTILITY SCRIPTS
```

## 🎯 Import Cheat Sheet

```typescript
// ✅ GOOD: Using path aliases
import { Button } from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { formatDate } from '@utils/date';
import { LoginForm } from '@features/auth';
import { EventCard } from '@features/events';

// ❌ BAD: Relative imports
import { Button } from '../../../shared/components/Button';
import { useAuth } from '../../hooks/useAuth';
```

## 🧭 Decision Tree: Where Does My Code Go?

```
                    Is this NEW code?
                           │
                  ┌────────┴────────┐
                 YES               NO
                  │                 │
                  ▼            (Refactoring)
           Does it belong              │
           to ONE feature?              │
                  │                     │
        ┌─────────┴─────────┐          │
       YES                 NO           │
        │                   │           │
        ▼                   ▼           │
   features/           Is it core       │
   [feature]/         infrastructure?   │
                           │            │
                  ┌────────┴────────┐   │
                 YES               NO    │
                  │                 │    │
                  ▼                 ▼    ▼
               core/            shared/
```

## 📦 Feature Module Anatomy

```
features/auth/
├── components/              Components ONLY used in auth
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   └── index.ts             ← export { LoginForm, SignupForm }
│
├── hooks/                   Hooks ONLY used in auth
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── index.ts             ← export { useAuth, usePermissions }
│
├── services/                Business logic & API calls
│   ├── authService.ts
│   ├── permissionService.ts
│   └── index.ts             ← export { authService, ... }
│
├── types/                   Types ONLY used in auth
│   ├── user.ts
│   └── index.ts             ← export type { User, ... }
│
├── pages/                   Page components
│   ├── LoginPage.tsx
│   └── index.ts
│
└── index.ts                 ← MAIN EXPORT (barrel file)
    └── exports everything from subdirectories
```

## 🚦 Import Rules

### ✅ ALLOWED

```typescript
// Features can import from:
import { Button } from '@shared/components'; // ✓ shared
import { api } from '@core/api'; // ✓ core

// Shared can import from:
import { api } from '@core/api'; // ✓ core
// (but NOT from features)

// Core can import from:
// (nothing - it's the foundation)
```

### ❌ NOT ALLOWED

```typescript
// Features CANNOT import from other features:
import { EventCard } from '@features/events'; // ✗ in auth feature

// Shared CANNOT import from features:
import { useAuth } from '@features/auth'; // ✗ creates circular deps

// Core CANNOT import from features or shared:
import { Button } from '@shared/components'; // ✗ wrong direction
```

## 🎨 Component Categories

### Primitive Components → `@shared/components/primitives/`

- Button, Input, Card, Badge, etc.
- Basic building blocks
- No business logic

### Layout Components → `@core/layouts/`

- MainLayout, AuthLayout, AdminLayout
- Page structure
- App-wide layouts only

### Feature Components → `@features/[name]/components/`

- LoginForm, EventCard, TicketList
- Feature-specific
- Contains business logic

### Composite Components → `@shared/components/`

- SearchBar, DataTable, FileUploader
- Reusable across features
- Complex but generic

## 📝 Naming Conventions

| Type       | Convention          | Example            |
| ---------- | ------------------- | ------------------ |
| Components | PascalCase          | `UserProfile.tsx`  |
| Hooks      | camelCase + use     | `useAuth.ts`       |
| Services   | camelCase + Service | `authService.ts`   |
| Utils      | camelCase           | `formatDate.ts`    |
| Types      | PascalCase          | `User.ts`          |
| Constants  | UPPER_SNAKE         | `API_ENDPOINTS.ts` |

## 🔄 Migration Workflow

```
1. Choose Feature
   ↓
2. Run Script: ./scripts/migrate-to-features.sh [feature]
   ↓
3. Update Exports: Edit index.ts files
   ↓
4. Update Imports: Change to path aliases
   ↓
5. Test: npm run dev
   ↓
6. Commit: git commit -m "feat: migrate [feature] to new structure"
   ↓
7. Repeat
```

## 💡 Common Patterns

### Exporting from Feature

```typescript
// features/auth/index.ts
export * from './components'; // Re-export everything
export * from './hooks';
export * from './services';
export type * from './types'; // Export types separately

// Usage elsewhere:
import { LoginForm, useAuth, authService } from '@features/auth';
```

### Creating New Feature Component

```typescript
// 1. Create component
// features/auth/components/LoginForm.tsx
export const LoginForm = () => {
  /* ... */
};

// 2. Export from components/index.ts
export { LoginForm } from './LoginForm';

// 3. Automatically available from feature
import { LoginForm } from '@features/auth';
```

## 🎓 Learning Path

1. **Day 1:** Read `docs/ARCHITECTURE.md`
2. **Day 2:** Migrate one small feature (e.g., auth)
3. **Day 3:** Practice using path aliases
4. **Week 1:** Migrate 2-3 more features
5. **Week 2:** Organize shared code
6. **Week 3:** Set up core module
7. **Week 4:** Complete migration

## 🔗 Quick Links

- **Full Docs:** `docs/ARCHITECTURE.md`
- **Migration Summary:** `docs/MIGRATION_SUMMARY.md`
- **Migration Script:** `scripts/migrate-to-features.sh`

---

**Print this out and keep it handy!** 📌
