# Migration Checklist

Use this checklist to track your progress migrating to the Feature-Based Architecture.

## ✅ Setup (Completed)

- [x] Created new directory structure
- [x] Updated `tsconfig.json` with path aliases
- [x] Created index files for all modules
- [x] Created documentation
- [x] Created migration script

## 📦 Feature Migration

### Auth Feature

- [ ] Migrate components from `src/components/auth/`
- [ ] Migrate pages related to auth
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test auth functionality
- [ ] Remove old auth files

### Events Feature

- [ ] Migrate components from `src/components/events/`
- [ ] Migrate pages related to events
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test events functionality
- [ ] Remove old events files

### Ticketing Feature

- [ ] Migrate components from `src/components/ticketing/`
- [ ] Migrate pages related to ticketing
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test ticketing functionality
- [ ] Remove old ticketing files

### Payments Feature

- [ ] Migrate components from `src/components/payments/`
- [ ] Migrate pages related to payments
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test payments functionality
- [ ] Remove old payments files

### Merch Feature

- [ ] Migrate components from `src/components/merch/`
- [ ] Migrate pages related to merch
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test merch functionality
- [ ] Remove old merch files

### Scavenger Feature

- [ ] Migrate components from `src/components/scavenger/`
- [ ] Migrate pages related to scavenger
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test scavenger functionality
- [ ] Remove old scavenger files

### Admin Feature

- [ ] Migrate components from `src/components/admin/`
- [ ] Migrate pages from `src/pages/admin/`
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test admin functionality
- [ ] Remove old admin files

### Artist Feature

- [ ] Migrate components from `src/components/artist/`
- [ ] Migrate pages related to artists
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test artist functionality
- [ ] Remove old artist files

### Venue Feature

- [ ] Migrate components from `src/components/venue/`
- [ ] Migrate pages related to venues
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test venue functionality
- [ ] Remove old venue files

### Music Player Feature

- [ ] Migrate components from `src/components/musicplayer/`
- [ ] Migrate context from `src/contexts/MusicPlayerContext.tsx`
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test music player functionality
- [ ] Remove old music player files

### Organization Feature

- [ ] Migrate components from `src/components/organization/`
- [ ] Migrate pages from `src/pages/organization/`
- [ ] Migrate hooks
- [ ] Migrate services
- [ ] Migrate types
- [ ] Update exports in index files
- [ ] Update all imports throughout codebase
- [ ] Test organization functionality
- [ ] Remove old organization files

## 🔄 Shared Code Organization

### Components

- [ ] Identify truly shared components from `src/components/common/`
- [ ] Move to `src/shared/components/`
- [ ] Organize by type (primitives, forms, layouts, etc.)
- [ ] Create index files
- [ ] Update imports

### Hooks

- [ ] Review existing hooks in `src/hooks/`
- [ ] Move shared hooks to `src/shared/hooks/`
- [ ] Update exports
- [ ] Update imports

### Utils

- [ ] Review existing utils in `src/shared/utils/`
- [ ] Organize by category
- [ ] Create index files
- [ ] Update imports

### Types

- [ ] Review existing types in `src/types/`
- [ ] Move shared types to `src/shared/types/`
- [ ] Organize by domain
- [ ] Create index files
- [ ] Update imports

### Constants

- [ ] Review existing constants
- [ ] Move to `src/shared/constants/`
- [ ] Organize by category
- [ ] Create index files
- [ ] Update imports

### Services

- [ ] Review existing services in `src/services/`
- [ ] Move shared services to `src/shared/services/`
- [ ] Create index files
- [ ] Update imports

## 🏗️ Core Module Setup

### Router

- [ ] Move routing config from `src/config/routes.ts` to `src/core/router/`
- [ ] Create route definitions
- [ ] Update imports
- [ ] Test routing

### API

- [ ] Move API client setup to `src/core/api/`
- [ ] Configure base client
- [ ] Update imports
- [ ] Test API calls

### Providers

- [ ] Review contexts in `src/contexts/`
- [ ] Move global providers to `src/core/providers/`
- [ ] Create provider setup
- [ ] Update App.tsx
- [ ] Test context functionality

### Layouts

- [ ] Identify layout components in `src/components/layout/`
- [ ] Move to `src/core/layouts/`
- [ ] Create layout index
- [ ] Update imports
- [ ] Test layouts

## 🧹 Cleanup

- [ ] Remove old `src/components/` directory
- [ ] Remove old `src/pages/` directory structure
- [ ] Remove unused files
- [ ] Rename `src/features-new/` to `src/features/`
- [ ] Update `.gitignore` if needed
- [ ] Update documentation references

## 📝 Documentation

- [ ] Update README.md with new structure
- [ ] Document any project-specific conventions
- [ ] Create component creation guide
- [ ] Update onboarding docs

## 🧪 Testing

- [ ] Run full test suite
- [ ] Test all features manually
- [ ] Check for broken imports
- [ ] Verify build process
- [ ] Test in production build

## 🚀 Final Steps

- [ ] Code review
- [ ] Team walkthrough
- [ ] Deploy to staging
- [ ] Monitor for issues
- [ ] Deploy to production
- [ ] Celebrate! 🎉

---

**Started:** November 6, 2025  
**Target Completion:** [Set your target date]  
**Progress:** 0/12 features migrated
