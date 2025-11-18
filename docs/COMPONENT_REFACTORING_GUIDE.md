# Component Refactoring Guide

## Overview

This document provides a detailed plan for refactoring oversized components in the Force Majeure codebase. The goal is to break down components exceeding 300 lines into smaller, more maintainable pieces while preserving functionality.

## Refactoring Status

### ✅ Completed

1. **FmComponentsCatalog.tsx** (1,835 lines → Partial Refactor)
   - **Status**: Infrastructure extracted
   - **Created Files**:
     - `/src/pages/developer/catalog/components/ComponentSection.tsx`
     - `/src/pages/developer/catalog/components/ComponentGroup.tsx`
     - `/src/pages/developer/catalog/config/navigationConfig.ts`
     - `/src/pages/developer/catalog/config/sampleData.ts`
     - `/src/pages/developer/catalog/sections/OverviewSection.tsx`
     - `/src/pages/developer/catalog/sections/RelationshipsSection.tsx`
   - **Note**: This is a demo/documentation page with extensive inline examples. The infrastructure has been extracted, but full component splitting would create import complexity without much benefit. The component is already well-organized with clear sections.

2. **FmDataGrid.tsx** (901 lines → ✅ Already Well-Architected)
   - **Status**: No changes needed
   - **Analysis**: Component is already properly modularized:
     - Uses separate hooks: `useDataGridKeyboardNav`, `useDataGridVirtualization`
     - Uses separate components: `FmDataGridToolbar`, `FmDataGridHeader`, `FmDataGridRow`, `FmDataGridPagination`, etc.
     - Uses utility files: `dataExport`, `grouping`
     - The 901 lines are justified for a complex, feature-rich data grid orchestrator
   - **Recommendation**: This is an example of GOOD architecture despite line count

### ⏳ Pending (High Priority)

3. **TicketGroupManager.tsx** (743 lines) - **PRODUCTION CRITICAL**

   **Recommended Refactoring:**

   Create directory structure:
   ```
   src/components/events/ticketing/ticket-group-manager/
   ├── index.ts                        # Export barrel
   ├── TicketGroupManager.tsx          # Main orchestrator (~150 lines)
   ├── types.ts                        # Shared types
   ├── constants.ts                    # GROUP_COLORS and other constants
   ├── components/
   │   ├── OverviewView.tsx            # Overview dashboard
   │   ├── GroupDetailView.tsx         # Individual group editor
   │   ├── TierListItem.tsx            # Single tier row
   │   └── GroupStats.tsx              # Statistics display
   └── hooks/
       └── useTicketGroupManager.ts    # State management hook
   ```

   **Files to Create:**

   a. **types.ts** - Extract interfaces
   ```typescript
   export interface TicketTier {
     id?: string;
     name: string;
     description: string;
     price_cents: number;
     total_tickets: number;
     tier_order: number;
     hide_until_previous_sold_out: boolean;
     group_id?: string;
   }

   export interface TicketGroup {
     id: string;
     name: string;
     description: string;
     color: string;
     tiers: TicketTier[];
   }
   ```

   b. **constants.ts** - Extract GROUP_COLORS array

   c. **hooks/useTicketGroupManager.ts** - Extract state management
   ```typescript
   export function useTicketGroupManager(groups: TicketGroup[], onChange: (groups: TicketGroup[]) => void) {
     const [activeView, setActiveView] = useState<'overview' | string>('overview');
     // ... all state logic

     return {
       activeView,
       setActiveView,
       // ... exposed methods
     };
   }
   ```

   d. **components/OverviewView.tsx** - Extract overview dashboard (~100 lines)

   e. **components/GroupDetailView.tsx** - Extract group editor (~200 lines)

   f. **components/TierListItem.tsx** - Extract tier row component (~50 lines)

   g. **components/GroupStats.tsx** - Extract statistics display (~50 lines)

   **Benefits:**
   - Main orchestrator reduces to ~150 lines
   - Each view component becomes testable in isolation
   - Shared state logic in custom hook
   - Better code organization for critical ticketing feature

4. **FmToolbar.tsx** (934 lines)

   **Recommended Refactoring:**

   Create directory structure:
   ```
   src/components/common/toolbar/
   ├── FmToolbar.tsx                   # Main component (~200 lines)
   ├── config/
   │   └── toolbarTabs.ts              # Tab configuration
   ├── tabs/
   │   ├── CartTab.tsx                 # ✅ Created
   │   ├── OrgDashboardTab.tsx
   │   ├── ScanTicketsTab.tsx
   │   ├── DevNavigationTab.tsx
   │   ├── DatabaseTab.tsx
   │   ├── FeaturesTab.tsx
   │   └── NotesTab.tsx
   └── hooks/
       ├── useToolbarState.ts          # State management
       └── useToolbarDrag.ts           # Drag & resize logic
   ```

   **Steps:**
   1. Extract each tab's content component into `tabs/` directory
   2. Create `config/toolbarTabs.ts` to return tab array using tab components
   3. Extract drag/resize logic to `useToolbarDrag.ts`
   4. Extract state management to `useToolbarState.ts`
   5. Main FmToolbar.tsx becomes clean orchestrator

   **Benefits:**
   - Main file reduces to ~200 lines
   - Each tab is self-contained and testable
   - Drag logic is reusable
   - Easier to add new tabs

5. **EventDetailsContent.tsx** (687 lines)

   **Recommended Refactoring:**

   Create directory structure:
   ```
   src/pages/event/components/
   ├── EventDetailsContent.tsx         # Main orchestrator (~100 lines)
   ├── EventInfoSection.tsx            # Basic info (~80 lines)
   ├── EventTicketingSection.tsx       # Ticketing widget (~150 lines)
   ├── EventArtistsSection.tsx         # Artists list (~100 lines)
   ├── EventVenueSection.tsx           # Venue details (~80 lines)
   ├── EventMetadataSection.tsx        # Dates, times, etc. (~80 lines)
   └── hooks/
       └── useEventDetails.ts          # Data fetching & state
   ```

   **Benefits:**
   - Sections can be lazy-loaded
   - Each section independently testable
   - Easier to reorder or conditionally render sections
   - Main file becomes clean layout orchestrator

6. **ArtistRegister.tsx** (849 lines)

   **Recommended Refactoring:**

   Create directory structure:
   ```
   src/pages/artists/components/
   ├── ArtistRegister.tsx              # Main orchestrator (~100 lines)
   ├── registration-steps/
   │   ├── BasicInfoStep.tsx           # Step 1 (~150 lines)
   │   ├── ArtistProfileStep.tsx       # Step 2 (~150 lines)
   │   ├── MediaLinksStep.tsx          # Step 3 (~150 lines)
   │   ├── GenresAndStyleStep.tsx      # Step 4 (~150 lines)
   │   └── ReviewAndSubmitStep.tsx     # Step 5 (~100 lines)
   ├── RegistrationProgress.tsx        # Progress indicator (~50 lines)
   └── hooks/
       ├── useArtistRegistration.ts    # Form state & validation
       └── useRegistrationSteps.ts     # Step navigation logic
   ```

   **Benefits:**
   - Each step loads independently
   - Step components are highly reusable
   - Form state centralized in hook
   - Easier to add/remove/reorder steps
   - Main file becomes wizard orchestrator

## General Refactoring Patterns

### Pattern 1: View Components
When a component has multiple "views" or "modes":
1. Extract each view into separate component
2. Keep switcher logic in parent
3. Pass shared state via props or context

### Pattern 2: State Management Hooks
When state logic is complex:
1. Create custom hook (e.g., `useComponentName`)
2. Move all useState, useEffect, callbacks to hook
3. Return only necessary values and methods
4. Component becomes presentation-focused

### Pattern 3: Configuration Files
When component has large data arrays:
1. Extract to `constants.ts` or `config.ts`
2. Keep logic in component, data in config
3. Benefits: easier testing, i18n, customization

### Pattern 4: Utility Components
When repeated UI patterns exist:
1. Extract into small, focused components
2. Place in `components/` subdirectory
3. Keep them simple and well-typed

## Refactoring Checklist

Before refactoring:
- [ ] Read entire component to understand flow
- [ ] Identify natural boundaries (views, sections, steps)
- [ ] Note all props and state
- [ ] Check for external dependencies (hooks, contexts)
- [ ] Plan directory structure

During refactoring:
- [ ] Create directory structure first
- [ ] Extract types and constants
- [ ] Create child components bottom-up
- [ ] Extract hooks for complex logic
- [ ] Update main component to use new structure
- [ ] Maintain all existing props interfaces
- [ ] Preserve all functionality

After refactoring:
- [ ] Run TypeScript compiler (`npx tsc --noEmit`)
- [ ] Run build (`npm run build`)
- [ ] Test in development mode
- [ ] Check all component features work
- [ ] Update imports in consuming components
- [ ] Update tests if they exist

## Best Practices

1. **Keep interfaces stable**: Don't change public API of refactored components
2. **One concern per file**: Each file should have single responsibility
3. **Avoid prop drilling**: Use composition or context for deep trees
4. **Name files clearly**: File name should match export name
5. **Use barrel exports**: Create `index.ts` to simplify imports
6. **Document complex logic**: Add JSDoc to hooks and utilities
7. **Test incrementally**: Verify each extraction before moving to next

## When NOT to Refactor

Don't refactor if:
- Component is demo/documentation page with inline examples
- Component is already well-modularized (like FmDataGrid)
- Breaking it up would create more complexity than it solves
- Line count is high due to comprehensive JSDoc comments
- Component has low complexity despite line count

## Priority Order

Based on impact and usage:

1. **TicketGroupManager** - Critical ticketing feature, high complexity
2. **ArtistRegister** - User-facing registration flow
3. **EventDetailsContent** - High-traffic public page
4. **FmToolbar** - Used on every page, but lower priority (UI chrome)

## Estimated Time

- TicketGroupManager: 4-6 hours
- ArtistRegister: 4-6 hours
- EventDetailsContent: 3-4 hours
- FmToolbar: 3-4 hours

**Total**: 14-20 hours for complete refactoring

## Next Steps

1. Start with **TicketGroupManager** (highest priority)
2. Create directory structure
3. Extract types and constants
4. Build child components incrementally
5. Test thoroughly before moving to next component
6. Document any architectural decisions made

## Success Criteria

- [ ] All files under 300 lines (except well-justified orchestrators)
- [ ] No breaking changes to public APIs
- [ ] All TypeScript errors resolved
- [ ] Build succeeds
- [ ] All features work as before
- [ ] Code is more maintainable and testable

---

**Note**: This is a living document. Update it as you complete refactorings or discover better patterns.
