# Force Majeure

[![CI](https://github.com/Godspeed-Talent-LLC/force-majeure-webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/Godspeed-Talent-LLC/force-majeure-webapp/actions/workflows/ci.yml)

A modern event ticketing and artist management platform built with React, TypeScript, and Supabase.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui + Radix UI primitives
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage)
- **Payments**: Stripe
- **State Management**: Zustand + TanStack Query
- **Routing**: React Router v6
- **i18n**: i18next

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── common/         # Shared UI components (buttons, cards, inputs)
│   ├── features/       # Feature-specific components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations (Supabase)
├── lib/                # Utility libraries
├── pages/              # Route page components
├── shared/             # Shared utilities, types, constants
│   ├── constants/      # Design system constants
│   ├── design/         # Design tokens
│   ├── hooks/          # Shared hooks
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── stores/             # Zustand stores
└── styles/             # Global styles

supabase/
├── functions/          # Edge functions
└── migrations/         # Database migrations

docs/                   # Project documentation
```

## Documentation

- [AI Instructions](docs/AI_INSTRUCTIONS.md) - Guidelines for AI assistants
- [Design System](docs/DESIGN_SYSTEM.md) - Design tokens and component patterns
- [CLAUDE.md](CLAUDE.md) - Project context for Claude

## Design System

The project uses a custom design system with:
- **Colors**: Defined in `src/shared/design/tokens.ts`
- **Typography**: IBM Plex Mono (primary), Space Grotesk (headers)
- **Spacing**: 5px-based scale (5, 10, 20, 40, 60)
- **Depth levels**: 0-3 with frosted glass effects

See [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for full documentation.

## Environment

The app runs on Lovable Cloud with Supabase backend integration.

## License

Private - All rights reserved.
