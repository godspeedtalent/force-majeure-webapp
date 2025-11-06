# Force Majeure Web App - Architecture Documentation

## Overview

This application uses a **Feature-Based Architecture** (System 1) designed for scalability, maintainability, and clear separation of concerns.

## Directory Structure

```
src/
├── features/              # Feature modules (business domains)
│   ├── auth/             # Authentication & authorization
│   ├── events/           # Event management
│   ├── merch/            # Merchandise
│   ├── payments/         # Payment processing
│   ├── scavenger/        # Scavenger hunt
│   ├── admin/            # Admin features
│   ├── artist/           # Artist management
│   ├── venue/            # Venue management
│   ├── ticketing/        # Ticketing system
│   ├── musicplayer/      # Music player
│   └── organization/     # Organization management
│
├── shared/               # Shared across features
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   ├── types/            # Shared TypeScript types
│   ├── constants/        # Application constants
│   └── services/         # Shared services
│
├── core/                 # Application core
│   ├── router/           # Routing configuration
│   ├── api/              # API client setup
│   ├── providers/        # Context providers
│   └── layouts/          # Layout components
│
└── assets/               # Static assets
    ├── images/
    ├── styles/
    └── fonts/
```

## Feature Module Structure

Each feature follows a consistent internal structure:

```
features/[feature-name]/
├── components/           # Feature-specific components
│   ├── ComponentName.tsx
│   └── index.ts         # Export barrel
├── hooks/               # Feature-specific hooks
│   ├── useFeature.ts
│   └── index.ts
├── services/            # API calls & business logic
│   ├── api.ts
│   └── index.ts
├── types/               # Feature-specific types
│   ├── types.ts
│   └── index.ts
├── pages/               # Page-level components
│   ├── PageName.tsx
│   └── index.ts
└── index.ts             # Feature module exports
```

## Path Aliases

The following TypeScript path aliases are configured for cleaner imports:

```typescript
// Instead of: import { Button } from '../../../shared/components/Button'
import { Button } from '@shared/components/Button';
// Or using shorthand:
import { Button } from '@components/Button';

// Feature imports
import { AuthService } from '@features/auth';

// Core imports
import { router } from '@core/router';

// Shared utilities
import { formatDate } from '@utils/date';
```

### Available Aliases

- `@/*` - Any file in src/
- `@features/*` - Feature modules
- `@shared/*` - Shared resources
- `@core/*` - Core application code
- `@components/*` - Shared components (shorthand for @shared/components)
- `@hooks/*` - Shared hooks
- `@utils/*` - Utility functions
- `@types/*` - Shared types

## Migration Guide

### Phase 1: Setup (✅ Completed)
- [x] Created new directory structure
- [x] Configured TypeScript path aliases
- [x] Created index files for all modules

### Phase 2: Gradual Migration (In Progress)

**Migration Strategy:**
1. Start with one complete feature (recommended: `auth`)
2. Move files to the new structure
3. Update imports to use new path aliases
4. Test thoroughly
5. Repeat for other features

**Step-by-Step Process:**

#### Migrating a Feature (Example: Auth)

1. **Identify all auth-related files:**
   ```
   src/features/auth/         (existing)
   src/components/auth/       (needs migration)
   src/pages/Auth.tsx         (needs migration)
   ```

2. **Move components:**
   ```bash
   # Move feature components
   mv src/components/auth/* src/features-new/auth/components/
   
   # Move pages
   mv src/pages/Auth.tsx src/features-new/auth/pages/
   ```

3. **Update exports in index files:**
   ```typescript
   // src/features-new/auth/components/index.ts
   export { PermissionGuard } from './PermissionGuard';
   
   // src/features-new/auth/pages/index.ts
   export { default as AuthPage } from './Auth';
   ```

4. **Update imports throughout the app:**
   ```typescript
   // Before
   import { PermissionGuard } from '@/components/auth/PermissionGuard';
   
   // After
   import { PermissionGuard } from '@features/auth';
   ```

5. **Test the feature:**
   - Run the dev server
   - Test all auth functionality
   - Fix any broken imports

#### What Goes Where?

**Feature-Specific Code** (`src/features/[feature]/`)
- Components used ONLY by this feature
- Business logic specific to this feature
- Types defined and used only within this feature
- Pages that belong to this feature

**Shared Code** (`src/shared/`)
- Components used by 2+ features (Button, Card, Modal, etc.)
- Utility functions used across features
- Global types (User, ApiResponse, etc.)
- Common hooks (useAuth, useFetch, etc.)

**Core Code** (`src/core/`)
- App-wide routing configuration
- Global providers (ThemeProvider, AuthProvider)
- API client setup
- Base layouts (MainLayout, AuthLayout)

### Phase 3: Cleanup (Future)

Once migration is complete:
1. Remove old `src/components/` directory
2. Remove old `src/pages/` directory structure
3. Update documentation
4. Rename `src/features-new/` to `src/features/`

## Best Practices

### 1. Feature Independence
- Features should be as independent as possible
- Avoid direct dependencies between features
- Share code through the `shared/` directory

### 2. Barrel Exports
- Always use `index.ts` files to export public APIs
- Keep internal implementation details private

```typescript
// ❌ Bad - importing from internal file
import { validateEmail } from '@features/auth/services/validation';

// ✅ Good - importing from feature barrel
import { validateEmail } from '@features/auth';
```

### 3. Consistent Structure
- Every feature follows the same structure
- Makes navigation predictable
- Easier onboarding for new developers

### 4. Co-location
- Keep related files close together
- Component + styles + tests + types in same directory

### 5. Clear Boundaries
```typescript
// Feature can import from shared
import { Button } from '@shared/components';

// Shared should NOT import from features
// ❌ Don't do this in shared/
import { AuthService } from '@features/auth';
```

## File Naming Conventions

- **Components:** PascalCase (e.g., `UserProfile.tsx`)
- **Hooks:** camelCase with 'use' prefix (e.g., `useAuth.ts`)
- **Services:** camelCase (e.g., `authService.ts`)
- **Types:** PascalCase (e.g., `User.ts`, `types.ts`)
- **Utils:** camelCase (e.g., `formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE or camelCase (e.g., `API_ENDPOINTS.ts`)

## Testing Strategy

```
features/[feature]/
├── components/
│   ├── Component.tsx
│   └── Component.test.tsx      # Co-located tests
├── hooks/
│   ├── useHook.ts
│   └── useHook.test.ts
└── services/
    ├── service.ts
    └── service.test.ts
```

## Examples

### Creating a New Feature

```bash
# 1. Create feature directory structure
mkdir -p src/features/notifications/{components,hooks,services,types,pages}

# 2. Create index files
touch src/features/notifications/{components,hooks,services,types,pages}/index.ts
touch src/features/notifications/index.ts

# 3. Start building your feature!
```

### Importing Between Modules

```typescript
// In a feature
import { api } from '@core/api';
import { Button, Card } from '@components';
import { useToast } from '@hooks';
import { formatDate } from '@utils/date';
import { User } from '@types';

// In shared
import { api } from '@core/api';
// ❌ Do NOT import from features

// In core
// ❌ Do NOT import from features or shared
```

## Benefits of This Architecture

1. **Scalability** - Easy to add new features without bloating existing ones
2. **Maintainability** - Clear structure makes code easy to find and modify
3. **Team Collaboration** - Multiple developers can work on different features
4. **Code Reusability** - Shared code is centralized and DRY
5. **Testing** - Features can be tested in isolation
6. **Performance** - Easier to implement code-splitting by feature
7. **Onboarding** - New developers can understand structure quickly

## Questions?

If you have questions about where something should go:
1. Is it used by multiple features? → `shared/`
2. Is it app-wide infrastructure? → `core/`
3. Is it specific to one domain? → `features/[domain]/`

---

**Last Updated:** November 6, 2025
**Architecture Version:** 1.0
**System:** Feature-Based Architecture (System 1)
