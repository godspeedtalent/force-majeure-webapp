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

### Design System Naming
- All custom components use `Fm` prefix (Force Majeure)
- Common components: `FmCommon*` (FmCommonButton, FmCommonTextField)
- Specific components: `Fm*` (FmEventCard, FmTicketTier)
- Gold accent color: `bg-fm-gold`, `text-fm-gold`, `border-fm-gold`
- Font: Canela for headings (`.font-canela`)

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

## Recent Major Changes

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
- Managed in `/src/shared/hooks/useFeatureFlags.ts`
- Stored in Supabase `feature_flags` table
- DevTools drawer for toggling (admin only)

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
- Prefer named exports over default exports (better refactoring)
- Always read files before editing
- Use parallel tool calls when possible
- Test builds after significant changes
- Keep components focused and under 300 lines
- Extract shared logic into hooks or utilities
- Follow existing patterns in the codebase
- Use pre-built layouts for new pages, only creating a brand new layout if there is no reasonable base layout. Create the new layout with the idea in mind that in can be implemented in other pages.
- Use pre-built Fm* components first before creating new components, using pre-existing ones as much as possible. Only create brand new components if absolutely necessary, and do your best to inherit base components when doing so.