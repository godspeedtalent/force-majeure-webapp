# Force Majeure - Claude Context

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
│   ├── auth/          # Authentication (Google OAuth + email/password)
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

### TypeScript
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

**Available Roles:**
- `ROLES.ADMIN` - Full system administrator (all permissions via `*`)
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

// Check permissions
const { hasPermission, hasRole, hasAnyPermission } = useUserPermissions();
const canManage = hasPermission(PERMISSIONS.MANAGE_ORGANIZATION);
const isAdmin = hasRole(ROLES.ADMIN);

// Protect routes (use in App.tsx)
<ProtectedRoute role={ROLES.ADMIN}>
  <AdminPage />
</ProtectedRoute>

// Conditional rendering
<PermissionGuard permission={PERMISSIONS.SCAN_TICKETS}>
  <ScannerTools />
</PermissionGuard>
```

**CRITICAL Security Rules:**
1. ❌ **NEVER** hard-code role/permission strings - always use constants
2. ✅ **ALWAYS** use `<ProtectedRoute>` for admin/privileged routes
3. ✅ **ALWAYS** check actual user roles, not dev mode overrides
4. ✅ Admin routes (`/admin/*`) must use `<ProtectedRoute role={ROLES.ADMIN}>`
5. ✅ DevTools tabs must check `hasAnyRole(ROLES.DEVELOPER, ROLES.ADMIN)`
6. ✅ Use permission checks for features, role checks for access levels

**See also:** `/docs/PERMISSION_MANAGEMENT_GUIDE.md` for detailed examples

### Authentication (Nov 2025)
- Added Google OAuth2 integration
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

### General Guidelines
- Prefer named exports over default exports (better refactoring)
- Always read files before editing
- Use parallel tool calls when possible
- Test builds after significant changes
- Keep components focused and under 300 lines
- Extract shared logic into hooks or utilities
- Follow existing patterns in the codebase
- Use pre-built layouts for new pages, only creating a brand new layout if there is no reasonable base layout. Create the new layout with the idea in mind that in can be implemented in other pages.
- Use pre-built Fm* components first before creating new components, using pre-existing ones as much as possible. Only create brand new components if absolutely necessary, and do your best to inherit base components when doing so.

### Design System Usage
**CRITICAL: Always follow the design system when creating or modifying components.**

1. **Import constants**: Always import from `/src/shared/constants/designSystem.ts`
   ```typescript
   import { COLORS, SPACING_CLASSES, TYPOGRAPHY, DEPTH } from '@/shared/constants/designSystem';
   ```

2. **Use helper functions**: Import from `/src/shared/utils/styleUtils.ts`
   ```typescript
   import { 
     getInputClasses, 
     getLabelClasses, 
     getListItemClasses, 
     getDepthClasses,
     getButtonClasses,
     getCardClasses 
   } from '@/shared/utils/styleUtils';
   ```

3. **Use defined colors**: Never use arbitrary hex values
   - ✅ `className={COLOR_CLASSES.GOLD_BG}` or `bg-fm-gold`
   - ❌ `className="bg-[#dfba7d]"` or inline styles

3. **Use spacing scale**: Only use 5, 10, 20, 40, 60 pixel values
   - ✅ `gap-[20px]`, `p-[40px]`, `m-[10px]`
   - ❌ `gap-4`, `p-6`, arbitrary values like `15px`

4. **Typography rules**:
   - Always use Canela font: `className={TYPOGRAPHY.FONT_CANELA}` or `font-canela`
   - Sentence case headers: "Welcome to the event." not "Welcome To The Event"
   - Minimal bold text, only for true emphasis

5. **Sharp corners**: Default to no rounding
   - ✅ `rounded-none` (default)
   - ❌ `rounded-lg`, `rounded-md` (avoid)
   - Only exception: `rounded-sm` when absolutely necessary

6. **Depth system**: Use for layered backgrounds
   - Level 0: `bg-transparent border border-white/20` (outline)
   - Level 1: `bg-black/60 backdrop-blur-sm` (base frosted)
   - Level 2: `bg-black/70 backdrop-blur-md` (elevated)
   - Level 3: `bg-black/80 backdrop-blur-lg` (high)

7. **Component reuse**: Check existing Fm* components before creating new ones
   - Primary components: FmButton, FmCard, FmTextInput, FmCheckbox, FmDateBox, FmDataGrid
   - Inherit and extend rather than duplicate

8. **Input field styling** (based on FmCommonTextField):
   - Default: Single border on all sides
   - Hover: Gold border with subtle glow, `bg-white/5`
   - Focus: Remove top/left/right borders, keep only bottom border (3px thick, gold)
   - Focus glow: `shadow-[0_4px_16px_rgba(223,186,125,0.3)]`
   - Ripple effect on click

9. **Label styling**: 
   - Small size: `text-xs`
   - ALL CAPS: `uppercase`
   - Muted color: `text-muted-foreground`
   - Gold when focused: `text-fm-gold`

10. **List/menu items** (based on FmCommonContextMenu):
    - Striped background: Even items `bg-background/40`, odd items `bg-background/60`
    - Hover: `hover:bg-fm-gold/10 hover:scale-[1.02]` with gold glow
    - Interactive scaling and smooth transitions

11. **Reference documentation**: When in doubt, check `/docs/DESIGN_SYSTEM.md`

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
