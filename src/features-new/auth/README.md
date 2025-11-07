# Auth Feature Module

**Status:** ✅ Migrated to Feature-Based Architecture

## Structure

```
auth/
├── components/
│   ├── AuthPanel.tsx           - Main authentication panel
│   ├── GoogleOAuthButton.tsx   - Google OAuth button component
│   ├── PermissionGuard.tsx     - Permission checking wrapper
│   └── index.ts               - Component exports
├── services/
│   ├── AuthContext.tsx         - Auth context provider & hook
│   └── index.ts               - Service exports
├── pages/
│   ├── Auth.tsx               - Auth page
│   └── index.ts               - Page exports
├── hooks/
│   └── index.ts               - Hook exports (to be added)
├── types/
│   └── index.ts               - Type exports (to be added)
└── index.ts                   - Main feature exports
```

## Usage

### Import Components

```typescript
import { AuthPanel, GoogleOAuthButton, PermissionGuard } from '@features/auth';
```

### Import Hooks

```typescript
import { useAuth } from '@features/auth';
```

### Import Pages

```typescript
import { AuthPage } from '@features/auth';
```

### All-in-One Import

```typescript
import {
  AuthPanel,
  GoogleOAuthButton,
  PermissionGuard,
  useAuth,
  AuthProvider,
  AuthPage,
} from '@features/auth';
```

## Migration Notes

### Migrated Files

- ✅ `src/components/auth/AuthPanel.tsx` → `components/AuthPanel.tsx`
- ✅ `src/components/auth/GoogleOAuthButton.tsx` → `components/GoogleOAuthButton.tsx`
- ✅ `src/components/auth/PermissionGuard.tsx` → `components/PermissionGuard.tsx`
- ✅ `src/features/auth/services/AuthContext.tsx` → `services/AuthContext.tsx`
- ✅ `src/pages/Auth.tsx` → `pages/Auth.tsx`

### Original Locations (Keep Until Migration Complete)

- `src/components/auth/` - Old component location
- `src/pages/Auth.tsx` - Old page location
- `src/features/auth/` - Old feature location

### Next Steps

1. Update all imports throughout the codebase to use `@features/auth`
2. Test thoroughly
3. Remove old files once confirmed working

## Exports

### Components

- `AuthPanel` - Main authentication panel UI
- `GoogleOAuthButton` - Google OAuth integration button
- `PermissionGuard` - HOC for permission-based rendering

### Services

- `useAuth` - Hook for accessing auth context
- `AuthProvider` - Context provider for auth state

### Pages

- `AuthPage` - Authentication page component

## Dependencies

This feature depends on:

- `@shared/api/supabase/client` - Supabase client
- `@shared/hooks/use-toast` - Toast notifications
- `@shared/utils/sessionPersistence` - Session management
- `@shared/services/logger` - Logging service

---

**Migrated:** November 6, 2025  
**Status:** Ready for use with `@features/auth` imports
