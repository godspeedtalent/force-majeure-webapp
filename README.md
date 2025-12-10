# Force Majeure Monorepo

Event management platform with web and mobile applications for electronic music events.

## 📦 Monorepo Structure

This project uses a **monorepo architecture** with pnpm workspaces and Turborepo:

```
force-majeure-webapp/
├── packages/
│   ├── shared/                    # @force-majeure/shared
│   │   ├── src/
│   │   │   ├── api/              # Supabase client & queries
│   │   │   ├── types/            # Shared type definitions
│   │   │   ├── stores/           # Zustand stores
│   │   │   ├── hooks/            # React hooks
│   │   │   ├── utils/            # Utility functions
│   │   │   ├── services/         # Business logic
│   │   │   ├── constants/        # Design system & config
│   │   │   └── validation/       # Zod schemas
│   │   └── package.json
│   │
│   ├── web/                       # @force-majeure/web
│   │   ├── src/
│   │   │   ├── components/       # UI components
│   │   │   ├── pages/            # Route components
│   │   │   ├── features/         # Web-specific features
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── mobile/                    # @force-majeure/mobile (Expo)
│       ├── src/
│       │   ├── screens/          # Screen components
│       │   ├── components/       # Mobile UI components
│       │   ├── navigation/       # React Navigation
│       │   └── App.tsx
│       ├── app.json
│       └── package.json
│
├── package.json                   # Root workspace config
├── pnpm-workspace.yaml           # Workspace definition
├── turbo.json                    # Turborepo pipeline
└── supabase/                     # Database migrations
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **pnpm** 10+ (install with `npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd force-majeure-webapp

# Install dependencies for all packages
pnpm install

# Copy environment files
cp packages/web/.env.example packages/web/.env
cp packages/mobile/.env.example packages/mobile/.env
# Edit .env files with your Supabase credentials
```

## 📱 Development

### Run Both Web and Mobile

```bash
pnpm dev
```

### Run Web Only

```bash
pnpm web:dev
# Opens at http://localhost:8080
```

### Run Mobile Only

```bash
pnpm mobile:dev
# Scan QR code with Expo Go app
```

### Build Projects

```bash
# Build all packages
pnpm build

# Build web only
pnpm web:build
```

### Type Checking

```bash
# Type check all packages
pnpm type-check

# Type check web only
pnpm --filter @force-majeure/web type-check
```

### Linting

```bash
# Lint all packages
pnpm lint

# Lint web only
pnpm --filter @force-majeure/web lint
```

## 📚 Available Commands

### Root-Level Commands (from project root)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all packages in dev mode |
| `pnpm build` | Build all packages |
| `pnpm type-check` | Type check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run tests across all packages |
| `pnpm clean` | Clean all build artifacts and dependencies |

### Package-Specific Commands

| Command | Description |
|---------|-------------|
| `pnpm web:dev` | Run web package in dev mode |
| `pnpm web:build` | Build web package |
| `pnpm mobile:dev` | Run mobile package (Expo) |
| `pnpm mobile:android` | Run mobile on Android |
| `pnpm mobile:ios` | Run mobile on iOS |

### Supabase Commands

| Command | Description |
|---------|-------------|
| `pnpm supabase:start` | Start local Supabase instance |
| `pnpm supabase:stop` | Stop local Supabase instance |
| `pnpm supabase:status` | Check Supabase status |
| `pnpm supabase:studio` | Open Supabase Studio |
| `pnpm supabase:db:reset` | Reset local database |
| `pnpm supabase:gen-types` | Generate TypeScript types from database schema |

### Working with Specific Packages

```bash
# Run command in specific package
pnpm --filter @force-majeure/web <command>
pnpm --filter @force-majeure/mobile <command>
pnpm --filter @force-majeure/shared <command>

# Examples
pnpm --filter @force-majeure/web dev
pnpm --filter @force-majeure/shared type-check
```

## 🏗️ Tech Stack

### Shared

- **TypeScript** - Type safety
- **Supabase** - Backend (PostgreSQL, Auth, Storage, Edge Functions)
- **React Query** - Server state management
- **Zustand** - Client state management
- **Zod** - Schema validation

### Web (`packages/web`)

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Headless components
- **React Router v6** - Routing

### Mobile (`packages/mobile`)

- **Expo SDK 54** - React Native framework
- **React Navigation** - Navigation
- **NativeWind** - Tailwind for React Native
- **React Native components** - UI

## 📖 Documentation

Complete documentation is available in the [`docs/`](docs/) directory:

- **[CLAUDE.md](CLAUDE.md)** - AI assistant context and project conventions
- **[docs/INDEX.md](docs/INDEX.md)** - Master documentation catalog
- **[docs/architecture/DESIGN_SYSTEM.md](docs/architecture/DESIGN_SYSTEM.md)** - Design system guide
- **[docs/security/PERMISSION_MANAGEMENT_GUIDE.md](docs/security/PERMISSION_MANAGEMENT_GUIDE.md)** - Role & permission system
- **[docs/features/FEATURE_FLAG_GUIDE.md](docs/features/FEATURE_FLAG_GUIDE.md)** - Feature flag usage

## 🗄️ Database

### Local Development

```bash
# Start local Supabase
pnpm supabase:start

# Apply migrations
pnpm supabase:db:reset

# Generate TypeScript types
pnpm supabase:gen-types
```

### Migrations

Database migrations are in `supabase/migrations/`. To create a new migration:

```bash
pnpm supabase:migration:new <migration_name>
```

## 🔧 Environment Variables

### Web (`packages/web/.env`)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Mobile (`packages/mobile/.env`)

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🎯 Import Paths

### In Web Package

```typescript
// Shared package imports
import { supabase, useEvents, Event } from '@force-majeure/shared';

// Web-specific imports (path alias)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
```

### In Mobile Package

```typescript
// Shared package imports
import { supabase, useEvents, Event } from '@force-majeure/shared';

// Mobile-specific imports (path alias)
import { Button } from '@/components/Button';
import { HomeScreen } from '@/screens/HomeScreen';
```

### In Shared Package

```typescript
// Use relative imports within shared package
import { supabase } from './api/supabase/client';
import { Event } from './types/features/events';
```

## 🚢 Deployment

### Web Deployment

The web app is deployed via [Lovable](https://lovable.dev):

1. Push changes to the connected GitHub repository
2. Lovable automatically deploys on push to main branch
3. Access at your custom domain or Lovable subdomain

### Mobile Deployment

Mobile app uses Expo's build service:

```bash
# Build for Android
pnpm --filter @force-majeure/mobile build:android

# Build for iOS
pnpm --filter @force-majeure/mobile build:ios
```

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `pnpm type-check` and `pnpm lint` to ensure quality
4. Push and create a pull request

## 📝 Code Standards

- **TypeScript strict mode** enabled
- **ESLint** for code quality
- **Prettier** for code formatting
- **Path aliases** for clean imports
- **Centralized types** in feature modules
- See [CLAUDE.md](CLAUDE.md) for detailed conventions

## 🐛 Troubleshooting

### "Cannot find module '@force-majeure/shared'"

```bash
pnpm install
```

### Metro bundler doesn't see shared package changes (mobile)

```bash
# Clear Metro cache
pnpm --filter @force-majeure/mobile start --clear
```

### TypeScript errors after migration

```bash
# Type check specific package
pnpm --filter @force-majeure/web type-check
pnpm --filter @force-majeure/shared type-check
```

### Build failures

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

## 📞 Support

- **Documentation**: [docs/INDEX.md](docs/INDEX.md)
- **GitHub Issues**: [Report an issue](https://github.com/anthropics/claude-code/issues)
- **Supabase Dashboard**: [View database](your_supabase_dashboard_url)

---

**Package Manager**: pnpm@10.25.0
**Last Updated**: December 2025
