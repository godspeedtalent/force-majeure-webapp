# Force Majeure - Claude Context

> **📖 Master Reference**: See `/docs/AI_INSTRUCTIONS.md` for shared TypeScript standards across all AI assistants.
> When updating coding standards, ensure both files stay synchronized.

## Project Overview

Force Majeure is a company website and web application for electronic music events, featuring ticket sales, artist profiles, event management, and light social media features. Built with React, TypeScript, Vite, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives + custom FmCommon components
- **State**: React Query, Context API
- **Routing**: React Router v6
- **Forms**: Custom validation utilities (`/src/shared/utils/formValidation.ts`)

## Key Architectural Patterns

### Component Organization

```
src/
├── components/          # Shared UI components
│   ├── ui/             # FmCommon design system components
│   │   ├── buttons/    # FmCommonButton, action buttons
│   │   ├── forms/      # FmCommonTextField, FmCommonSelect, etc.
│   │   ├── data/       # FmCommonDataGrid, FmInfoCard, etc.
│   │   ├── feedback/   # FmCommonToast, FmTimerToast, FmErrorDisplay
│   │   └── modals/     # Modal components
│   └── layout/         # Layout components
├── features/           # Feature-based modules
│   ├── auth/          # Authentication (email/password)
│   ├── events/        # Event management
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/     # Centralized type definitions
│   │   └── services/
│   └── merch/
├── pages/             # Route-level components
├── contexts/          # React Context providers
├── services/          # Business logic and external integrations
└── shared/            # Shared utilities
    ├── api/           # Supabase client
    ├── hooks/         # Reusable hooks
    ├── utils/         # Utility functions
    └── services/      # Shared services (logger, etc.)
```

### Import Conventions

- **Supabase**: Always import from `@/shared/api/supabase/client`
- **Toast**: Use `import { toast } from 'sonner'`
- **Logger**: Use `import { logger } from '@/shared/services/logger'`
- **API Logging**: Use `import { logApiError, logApi } from '@/shared/utils/apiLogger'`
- **Types**: Import from centralized locations (e.g., `@/features/events/types`)

### Layout System

**CRITICAL: All pages MUST use a layout component that provides the topography background and navigation bar.**

#### Base Layout (`Layout.tsx`)

The default layout includes:
- Navigation bar at the top
- Topography background pattern
- Footer
- Proper spacing and structure

```tsx
import { Layout } from '@/components/layout/Layout';

export default function MyPage() {
  return (
    <Layout>
      <div className='container mx-auto py-8'>
        {/* Your page content */}
      </div>
    </Layout>
  );
}
```

#### Available Layouts

- **`Layout`**: Base layout with navigation, topography, and footer. Use this for most pages.
- **`SideNavbarLayout`**: Layout with side navigation for multi-section pages (e.g., event management).
- **`SplitPageLayout`**: Two-column layout for forms or split content.
- **`SinglePageLayout`**: Simplified layout for focused single-page content.
- **`ForceMajeureRootLayout`**: Root-level layout wrapper (rarely used directly).

#### Layout Guidelines

1. **Always use a layout**: Never create a page without wrapping it in a layout component.
2. **Inherit from base**: If creating a custom layout, ensure it includes the topography background and navigation.
3. **Consistent structure**: All layouts should provide:
   - Navigation bar (from `Navigation` component)
   - Topography background (`TopographicBackground` component with appropriate opacity)
   - Proper spacing (padding, container, etc.)
4. **Loading and error states**: Wrap loading/error states in the same layout for consistency.

#### Example: Details Page with Layout

```tsx
import { Layout } from '@/components/layout/Layout';

export default function EntityDetails() {
  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>Entity not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto py-8'>
        {/* Page content */}
      </div>
    </Layout>
  );
}
```

### Design System

- **Complete design system documentation**: `/docs/DESIGN_SYSTEM.md`
- **Design constants**: `/src/shared/constants/designSystem.ts`

#### Colors

- **Primary Accent**: Dusty Gold `#dfba7d` (`bg-fm-gold`, `text-fm-gold`, `border-fm-gold`)
- **Secondary**: Dark Crimson `#520C10` (`bg-fm-crimson`, `text-fm-crimson`)
- **Info/Tertiary**: Muted Navy `#545E75` (`bg-fm-navy`, `text-fm-navy`)
- **Danger**: Chili Red `#D64933` (`bg-fm-danger`, `text-fm-danger`)
- **Base**: Black `#000000` and White `#FFFFFF`

#### Spacing Scale

- XS: `5px` - Tight spacing, small gaps
- SM: `10px` - Compact layouts, list items
- MD: `20px` - Default element spacing
- LG: `40px` - Section spacing, major gaps
- XL: `60px` - Page sections, hero spacing

#### Typography

- **Font**: Canela for 99% of application (`.font-canela`)
- **Capitalization**: Sentence case for headers ("Here's what we found." not "Here's What We Found")
- **Periods**: Use at end of headers where appropriate
- **Bold**: Use sparingly for emphasis only

#### Design Elements

- **Background**: Black topography pattern (`bg-topography`)
- **Corners**: Sharp edges only (`rounded-none`) - rounded corners almost never used
- **Depth**: 4-level system (transparent → frosted glass with increasing opacity)
  - Level 0: Transparent with outline
  - Level 1: `bg-black/60 backdrop-blur-sm`
  - Level 2: `bg-black/70 backdrop-blur-md`
  - Level 3: `bg-black/80 backdrop-blur-lg`
- **Icon Buttons**: Use where appropriate with accessible labels

#### Component Naming

- All custom components use `Fm` prefix (Force Majeure)
- Common components: `FmCommon*` (FmCommonButton, FmCommonTextField)
- Specific components: `Fm*` (FmEventCard, FmTicketTier)
- Primary building blocks: FmButton, FmCard, FmTextInput, FmCheckbox, FmDateBox, FmDataGrid

## Code Standards

> **📖 Master Reference**: See `/docs/AI_INSTRUCTIONS.md` for shared TypeScript standards across all AI assistants.

### TypeScript

**Strictness Level:**
- **Strict mode enabled** (`strict: true`, `strictNullChecks: true`)
- **Unused code detection** (`noUnusedLocals`, `noUnusedParameters`)
- All type mismatches must be resolved - no `as any` shortcuts
- Distinguish between `null` and `undefined` explicitly

**Type Definitions:**
- **Single source of truth**: Types in `/features/*/types/` must match database schema
- **No property access on undefined types**: If accessing `event.title`, `title` must exist in `Event` interface
- **Type predicates**: Must have exact parameter-to-return type matching
  ```typescript
  // ✅ Correct
  function isString(value: string | undefined): value is string {
    return typeof value === 'string';
  }
  
  // ❌ Wrong - type mismatch
  function isString(value?: string): value is string {
    return typeof value === 'string';
  }
  ```

**Import Requirements:**
- **Logger**: Always import `import { logger } from '@/shared/services/logger'`
- **Toast**: Always import `import { toast } from 'sonner'`
- **Supabase**: Always import from `@/shared/api/supabase/client`
- No reliance on global definitions or implicit imports

**Logger Usage:**
- Use structured context objects:
  ```typescript
  // ✅ Correct
  logger.error('Error loading data', { 
    error: error instanceof Error ? error.message : 'Unknown',
    source: 'componentName',
    details: additionalData 
  });
  
  // ❌ Wrong
  logger.error('Error loading data', error);
  ```

**Handling Unused Parameters:**
- Prefix unused parameters with underscore: `_value`, `_event`
- Alternatively, omit parameter name if truly unnecessary
- This satisfies `noUnusedParameters` while maintaining function signature compatibility

**Null vs Undefined:**
- **Database fields**: Use `null` (matches Supabase/PostgreSQL convention)
- **Optional React props**: Use `undefined` (TypeScript/React convention)
- **Optional function parameters**: Use `undefined` (TypeScript convention)
- Convert between them explicitly when needed:
  ```typescript
  const venue_id = venueId || null; // undefined → null for DB
  const venueId = venue_id ?? undefined; // null → undefined for React
  ```

**Type Alignment Strategy:**
When code and types don't match:
1. **Check database schema** - Does the column exist?
2. **Update type definition** - Add missing properties to interface
3. **Update code** - Use correct property names from type
4. **Never use `as any`** - Fix the root cause instead

**General Guidelines:**
- Use strict mode
- Prefer interfaces over types for object shapes
- Use optional chaining and nullish coalescing
- Centralize types in feature modules (`features/*/types/`)

### React

- Use functional components with hooks
- Named exports preferred over default exports (except pages)
- Extract custom hooks for complex logic (prefix with `use`)
- Keep components under 300 lines (break up if larger)

### State Management

- React Query for server state
- Context API for global client state
- Local state with useState for component-specific state
- Avoid prop drilling - use composition or context

### File Naming

- Components: PascalCase (EventCard.tsx)
- App-specific Components: Fm* (for common, FmCommon*)
- Hooks: camelCase with `use` prefix (useEventData.ts)
- Utils: camelCase (formatTimeDisplay.ts)
- Types: PascalCase (Event, TicketTier)
- Constants: UPPER_SNAKE_CASE

### Styling

- Tailwind utility classes (mobile-first responsive)
- Custom Tailwind config: `/config/tailwind/`
- Avoid inline styles except for dynamic values
- Use `cn()` utility for conditional classes
- Dark mode support throughout
- **Sharp corners only** - No rounded corners for cards, buttons, or components (use `rounded-none` or minimal rounding like `rounded-sm` for subtle edges only when absolutely necessary)

## Recent Major Changes

### Feature Flag System (Nov 2025)

- **Centralized feature flag management** similar to permission system
- Type-safe `FEATURE_FLAGS` constants in `src/shared/config/featureFlags.ts`
- Enhanced `useFeatureFlagHelpers` hook with utility methods:
  - `isFeatureEnabled(flag)` - Check single flag
  - `isAnyFeatureEnabled(flags[])` - Check if any flag enabled (OR logic)
  - `areAllFeaturesEnabled(flags[])` - Check if all flags enabled (AND logic)
  - `getEnabledFeatures()` - Get array of all enabled flags
- `FeatureGuard` component for declarative UI gating:
  - Supports single or multiple flags
  - AND/OR logic with `requireAll` prop
  - Fallback component support
  - Invert logic with `invert` prop
- Comprehensive migration from scattered flag checks (`flags?.flag_name`) to centralized system
- Updated files: App.tsx, Scavenger.tsx, ProfileEdit.tsx, Navigation.tsx, GlobalSearchContext.tsx, ForceMajeureRootLayout.tsx
- Deprecated old `FeatureFlagGuard` with migration guidance
- **📖 Full documentation:** `/docs/FEATURE_FLAG_GUIDE.md`

### Role & Permission System (Nov 2025)

- **Centralized permission management** in `src/shared/auth/permissions.ts`
- Type-safe `PERMISSIONS` and `ROLES` constants
- Enhanced `useUserPermissions` hook with comprehensive checking methods
- `<PermissionGuard>` component for conditional UI rendering
- `<ProtectedRoute>` enhanced with permission/role support
- Role management modal in user admin grid (click roles to edit)
- RLS policies enforce permission checks at database level
- **Admin role automatically bypasses all permission/role checks** - no need to assign individual permissions

**Available Roles:**

- `ROLES.ADMIN` - **Full system administrator (automatically grants ALL permissions and roles without database assignment)**
- `ROLES.DEVELOPER` - Developer access (debugging, dev tools, all permissions)
- `ROLES.ORG_ADMIN` - Organization administrator (manage events, venues, staff)
- `ROLES.ORG_STAFF` - Organization staff (view org, scan tickets)
- `ROLES.USER` - Standard user (basic access)

**Key Permissions:**

- `PERMISSIONS.MANAGE_ORGANIZATION` - Full org management
- `PERMISSIONS.VIEW_ORGANIZATION` - View org data
- `PERMISSIONS.SCAN_TICKETS` - Ticket scanning capability
- `PERMISSIONS.MANAGE_EVENTS` - Event management
- `PERMISSIONS.ALL` - Wildcard permission (`*`)

**Usage Patterns:**

```typescript
// Import constants
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';
import { useUserPermissions } from '@/shared/hooks/useUserRole';

// Check permissions (admins automatically pass all checks)
const { isAdmin, hasPermission, hasRole, hasAnyPermission } = useUserPermissions();
const canManage = hasPermission(PERMISSIONS.MANAGE_ORGANIZATION); // true for admins
const isAdminUser = isAdmin(); // Check if user has admin role

// Protect routes (admins automatically have access)
<ProtectedRoute permission={PERMISSIONS.MANAGE_ORGANIZATION}>
  <OrgTools />
</ProtectedRoute>

// Conditional rendering (admins automatically see content)
<PermissionGuard permission={PERMISSIONS.SCAN_TICKETS}>
  <ScannerTools />
</PermissionGuard>
```

**CRITICAL Security Rules:**

1. ❌ **NEVER** hard-code role/permission strings - always use constants
2. ✅ **ALWAYS** use `<ProtectedRoute>` for admin/privileged routes
3. ✅ **ADMIN ROLE OVERRIDE**: Users with `ROLES.ADMIN` automatically pass ALL permission and role checks
4. ✅ **SIMPLIFIED ADMIN MANAGEMENT**: Only assign the `admin` role in the database - no need to assign individual permissions
5. ✅ Admin routes (`/admin/*`) can use `<ProtectedRoute permission={PERMISSIONS.MANAGE_*}>` or specific role checks
6. ✅ Use permission checks for features, role checks for access levels

**See also:** `/docs/PERMISSION_MANAGEMENT_GUIDE.md` for detailed examples

### Authentication (Nov 2025)

- Email/password authentication
- "Remember Me" functionality with 30-day sessions
- Password confirmation on signup
- Session persistence utilities

### Email System (Nov 2025)

- Order receipt email templates with inline styles
- PDF ticket generation (stubbed for future implementation)
- Email preview demo at `/demo/email-template`
- Supabase Edge Function integration ready

## Known Technical Debt

### High Priority

1. **Event form duplication** - `FmEditEventButton` (640 lines) and `FmCreateEventButton` (556 lines) share 80% code
2. **FmCommonDataGrid** (859 lines) - Needs breaking into smaller components
3. **Data fetching patterns** - 15+ files with duplicate Supabase queries

### Medium Priority

4. **Loading state management** - 22+ files with manual loading states
5. **TicketGroupManager** (635 lines) - Should split into separate view components
6. **Page components** - ProfileEdit, EventDetails, EventManagement could be split

## Development Workflow

### Running the App

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Feature Flags

- **Centralized system** with type-safe constants in `src/shared/config/featureFlags.ts`
- Stored in Supabase `feature_flags` table
- Use `FeatureGuard` component for conditional UI rendering
- Use `useFeatureFlagHelpers` hook for programmatic checks
- FmToolbar provides access to feature toggles (admin/developer only)
- Full documentation: `docs/FEATURE_FLAG_GUIDE.md`

### FmToolbar (Floating Toolbar)

- **Unified toolbar** for all user tools (shopping cart, developer tools, etc.)
- Located in `/src/components/common/toolbar/FmToolbar.tsx`
- Tabs are role-based: user tools for logged-in users, developer tools for admin/developer roles
- Self-contained component - no separate wrapper needed
- Appears as floating tabs on right side of screen
- Features:
  - Draggable positioning
  - Group labels with 1-second hover delay
  - Shopping cart (all logged-in users)
  - Developer tools (admin/developer only): Database, Feature Toggles, TODO Notes

### Demo Pages

- Protected by `DemoProtectedRoute` (admin role required)
- Located in `/src/pages/demo/`
- Access via `/demo` route
- Useful for testing without affecting production data

### Testing Events

- Use demo tools at `/demo/event-checkout`
- Create/select random events for testing
- Checkout flow with Stripe test mode

## Database Schema Notes

### Key Tables

- `events` - Event information
- `ticket_tiers` - Ticket pricing and inventory
- `orders` - Order records
- `order_items` - Line items for orders
- `venues` - Venue information
- `artists` - Artist profiles
- `profiles` - User profile data (extends Supabase auth)
- `feature_flags` - Feature toggles

### Naming Convention

- Snake_case for column names (database convention)
- camelCase in TypeScript interfaces (after fetching)
- Use centralized types for consistency

## Common Tasks

### Adding a New Feature

1. Create feature module in `/src/features/[feature-name]/`
2. Define types in `types/index.ts`
3. Create components in `components/`
4. Create hooks in `hooks/`
5. Add services in `services/` if needed
6. Update routes in `App.tsx`

### Adding a New FmCommon Component

1. Create component in `/src/components/ui/[category]/`
2. Use existing patterns (props, styling, accessibility)
3. Export from barrel file (if exists)
4. Document props with JSDoc
5. Use Radix UI primitives where appropriate

### Working with Supabase

- Always use typed queries with TypeScript
- Handle errors with toast notifications
- Use React Query for caching when appropriate
- Test with row-level security (RLS) policies in mind

## Contact & Resources

- GitHub: [repository URL]
- Supabase Dashboard: [project URL]
- Figma: [design URL] (if applicable)
- Stripe Dashboard: [stripe URL]

## Notes for Claude

### Development Principles

**CRITICAL: When implementing any feature, always prioritize these core principles:**

1. **Clean Architecture** - Separation of concerns, single responsibility principle
   - Keep business logic separate from UI components
   - Use services for API calls and data transformations
   - Hooks for reusable stateful logic
   - Components for presentation only

2. **Component Reuse** - Use existing FmCommon components wherever possible
   - Check `/src/components/common/` before creating new components
   - Extend existing components rather than duplicating
   - Use composition over inheritance
   - Maintain consistent API patterns across similar components

3. **File Size Management** - Keep components under 300 lines, extract when larger
   - Break large components into smaller, focused pieces
   - Extract complex logic into custom hooks
   - Move repeated utilities to `/src/shared/utils/`
   - Split large forms into smaller sections

4. **Organized Hierarchy** - Follow established file structure patterns
   - Feature-specific code: `/src/features/[feature]/`
   - Shared components: `/src/components/common/`
   - Business components: `/src/components/business/` or `/src/components/ticketing/`
   - Page components: `/src/pages/`
   - Use nested folders to group related components

5. **Industry Standards** - TypeScript strict mode, proper error handling, accessibility
   - Always use TypeScript with strict mode enabled
   - Handle errors gracefully with try-catch and user feedback (toasts)
   - Ensure keyboard navigation and screen reader support
   - Follow React best practices (hooks rules, key props, etc.)

6. **Design Patterns** - Use appropriate patterns for the problem at hand
   - Hooks for logic sharing and state management
   - Context for global state (auth, checkout, shopping cart)
   - Services for API integration and business logic
   - HOCs sparingly (prefer hooks and composition)
   - Custom hooks for complex stateful logic

7. **Maintainability** - Self-documenting code, proper typing, configuration over hardcoding
   - Use descriptive variable and function names
   - Add JSDoc comments for complex functions
   - Centralize configuration in database or constants files
   - Avoid magic numbers - use named constants
   - Keep functions focused on single tasks

8. **Modularity** - Build composable, reusable pieces that work independently
   - Components should be self-contained
   - Props should be well-defined with TypeScript interfaces
   - Minimize dependencies between modules
   - Use dependency injection where appropriate
   - Make components configurable through props

### General Guidelines

- Prefer named exports over default exports (better refactoring)
- Always read files before editing
- Use parallel tool calls when possible
- Test builds after significant changes
- Keep components focused and under 300 lines
- Extract shared logic into hooks or utilities
- Follow existing patterns in the codebase
- Use pre-built layouts for new pages, only creating a brand new layout if there is no reasonable base layout. Create the new layout with the idea in mind that in can be implemented in other pages.
- Use pre-built Fm\* components first before creating new components, using pre-existing ones as much as possible. Only create brand new components if absolutely necessary, and do your best to inherit base components when doing so.

### Code Modularization & Component Creation

**CRITICAL: Always search for similar patterns before implementing new features.**

1. **Search before implementing**: When adding new functionality, search the codebase for similar implementations
   - Use `semantic_search` to find related components and patterns
   - Use `grep_search` to find specific code patterns or function names
   - Check if existing utilities, hooks, or components can be reused or extended

2. **Identify repeated code**: If you find code duplicated in multiple places:
   - Evaluate if the duplicated logic should be extracted into a shared component
   - Consider creating a new utility function for repeated calculations or transformations
   - Extract shared hooks for common state management or side effects
   - Create shared type definitions in `types/` directories

3. **Component size management**: Files approaching 150+ lines should be evaluated for splitting
   - Look for logical groupings that can become separate components
   - Extract form sections into their own components
   - Split data display logic from data fetching logic
   - Break large forms into smaller, focused components
   - Consider extracting modal content into separate components

4. **Maintain hierarchy**: Keep related files organized within the established structure
   - Feature-specific code goes in `/src/features/[feature]/`
   - Shared components go in `/src/components/common/`
   - Page-level components in `/src/pages/`
   - Related sub-components should live in the same directory as their parent
   - Use barrel exports (`index.ts`) for cleaner imports when appropriate

### Design System Usage

**CRITICAL: Always follow the design system when creating or modifying components.**

1. **Import constants**: Always import from `/src/shared/constants/designSystem.ts`

   ```typescript
   import {
     COLORS,
     SPACING_CLASSES,
     TYPOGRAPHY,
     DEPTH,
   } from '@/shared/constants/designSystem';
   ```

2. **Use helper functions**: Import from `/src/shared/utils/styleUtils.ts`

   ```typescript
   import {
     getInputClasses,
     getLabelClasses,
     getListItemClasses,
     getDepthClasses,
     getButtonClasses,
     getCardClasses,
   } from '@/shared/utils/styleUtils';
   ```

3. **Use defined colors**: Never use arbitrary hex values
   - ✅ `className={COLOR_CLASSES.GOLD_BG}` or `bg-fm-gold`
   - ❌ `className="bg-[#dfba7d]"` or inline styles

4. **Use spacing scale**: Only use 5, 10, 20, 40, 60 pixel values
   - ✅ `gap-[20px]`, `p-[40px]`, `m-[10px]`
   - ❌ `gap-4`, `p-6`, arbitrary values like `15px`

5. **Typography rules**:
   - Always use Canela font: `className={TYPOGRAPHY.FONT_CANELA}` or `font-canela`
   - Sentence case headers: "Welcome to the event." not "Welcome To The Event"
   - Minimal bold text, only for true emphasis

6. **Sharp corners**: Default to no rounding
   - ✅ `rounded-none` (default)
   - ❌ `rounded-lg`, `rounded-md` (avoid)
   - Only exception: `rounded-sm` when absolutely necessary

7. **Depth system**: Use for layered backgrounds
   - Level 0: `bg-transparent border border-white/20` (outline)
   - Level 1: `bg-black/60 backdrop-blur-sm` (base frosted)
   - Level 2: `bg-black/70 backdrop-blur-md` (elevated)
   - Level 3: `bg-black/80 backdrop-blur-lg` (high)

8. **Component reuse**: Check existing Fm\* components before creating new ones
   - Primary components: FmButton, FmCard, FmTextInput, FmCheckbox, FmDateBox, FmDataGrid
   - Inherit and extend rather than duplicate

9. **Input field styling** (based on FmCommonTextField):
   - Default: Single border on all sides
   - Hover: Gold border with subtle glow, `bg-white/5`
   - Focus: Remove top/left/right borders, keep only bottom border (3px thick, gold)
   - Focus glow: `shadow-[0_4px_16px_rgba(223,186,125,0.3)]`
   - Ripple effect on click

10. **Label styling**:
    - Small size: `text-xs`
    - ALL CAPS: `uppercase`
    - Muted color: `text-muted-foreground`
    - Gold when focused: `text-fm-gold`

11. **Context Menus** (`FmCommonContextMenu`):
    - **Visual Design**:
      - Striped background: Even items `bg-background/40`, odd items `bg-background/60`
      - Hover: `hover:bg-fm-gold/10 hover:scale-[1.02]` with gold glow `shadow-fm-gold/20`
      - Focus: `focus:bg-fm-gold/15` with enhanced glow
      - Active: `active:scale-[0.98]` for tactile feedback
      - Backdrop: `backdrop-blur-xl` with gradient `from-background to-background/95`
      - Border: `border-2 border-white/20` with shadow `shadow-black/50`
      - Dividers: Horizontal gradient lines between items `bg-gradient-to-r from-transparent via-white/10`
    - **Basic Usage**:

      ```tsx
      import {
        FmCommonContextMenu,
        ContextMenuAction,
      } from '@/components/common/modals/FmCommonContextMenu';

      const actions: ContextMenuAction<DataType>[] = [
        {
          label: 'Edit',
          icon: <Pencil className='h-4 w-4' />,
          onClick: data => handleEdit(data),
        },
        {
          label: 'Delete',
          icon: <Trash className='h-4 w-4' />,
          onClick: data => handleDelete(data),
          variant: 'destructive',
        },
      ];

      <FmCommonContextMenu actions={actions} data={rowData}>
        <div>Right-click me</div>
      </FmCommonContextMenu>;
      ```

    - **Action Properties**:
      - `label`: Display text (required)
      - `icon`: Icon element (optional)
      - `iconPosition`: 'left' | 'right' (default: 'left')
      - `onClick`: Handler function receiving the data (optional if submenu exists)
      - `variant`: 'default' | 'destructive' (changes hover color)
      - `disabled`: Boolean to disable the item
      - `separator`: Add visual separator after this item
      - `submenu`: Array of nested actions for hierarchical menus
    - **Submenu Support**:

      ```tsx
      const actionsWithSubmenu: ContextMenuAction<NoteType>[] = [
        {
          label: 'Set Status',
          icon: <CircleDot className='h-4 w-4' />,
          submenu: [
            {
              label: 'TODO',
              icon: <Circle className='h-3 w-3 text-gray-400' />,
              onClick: note => updateStatus(note, 'TODO'),
            },
            {
              label: 'IN PROGRESS',
              icon: <Circle className='h-3 w-3 text-yellow-400' />,
              onClick: note => updateStatus(note, 'IN_PROGRESS'),
            },
            {
              label: 'RESOLVED',
              icon: <Circle className='h-3 w-3 text-green-400' />,
              onClick: note => updateStatus(note, 'RESOLVED'),
            },
          ],
        },
        { separator: true },
        {
          label: 'Delete',
          icon: <Trash className='h-4 w-4' />,
          onClick: note => handleDelete(note),
          variant: 'destructive',
        },
      ];
      ```

    - **Design System Compliance**:
      - Animations: 200ms duration with `animate-in fade-in zoom-in-95`
      - Spacing: Uses 0.5 units (`my-0.5`) between items
      - Typography: `font-medium` for labels
      - Transitions: `transition-all duration-300` for smooth interactions

12. **Reference documentation**: When in doubt, check `/docs/DESIGN_SYSTEM.md`

### Design System Enforcement Tools

**Audit Script**: Run `npm run audit:design-system` to check compliance

- Identifies files with design system violations
- Reports rounded corners, hardcoded colors, arbitrary spacing
- Generates compliance scores (0-100) for each file
- Saves detailed report to `design-system-audit-report.json`

**ESLint Rules**: Automatically warns about:

- Rounded corners (except rounded-none)
- Hardcoded hex color values

**Type Safety**: Use types from `/src/shared/types/designSystem.ts`

- `DesignSystemColor` - Only approved colors
- `DesignSystemSpacing` - Only scale values (5, 10, 20, 40, 60)
- `DepthLevel` - Only valid depth levels (0-3)
- `ButtonVariant`, `CardVariant`, etc.
