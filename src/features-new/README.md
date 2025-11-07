# Features Directory

This directory contains all feature modules for the Force Majeure Web App using a feature-based architecture.

## Structure

Each feature is a self-contained module with its own:

- **components/** - UI components specific to this feature
- **hooks/** - Custom React hooks for this feature
- **services/** - API calls and business logic
- **types/** - TypeScript type definitions
- **pages/** - Page-level components
- **index.ts** - Public API exports

## Available Features

- **auth/** - Authentication and authorization
- **events/** - Event management and discovery
- **merch/** - Merchandise store
- **payments/** - Payment processing and checkout
- **scavenger/** - Scavenger hunt game
- **admin/** - Admin panel and management
- **artist/** - Artist profiles and management
- **venue/** - Venue information and management
- **ticketing/** - Ticket sales and management
- **musicplayer/** - Music player functionality
- **organization/** - Organization management

## Usage

Import from features using path aliases:

```typescript
// Import entire feature module
import { AuthService, useAuth, LoginForm } from '@features/auth';

// Import specific items
import { EventCard } from '@features/events';
import { PaymentService } from '@features/payments';
```

## Guidelines

1. **Feature Independence** - Features should not directly depend on each other
2. **Shared Code** - Use `@shared/*` for code used across multiple features
3. **Barrel Exports** - Always export through `index.ts` files
4. **Consistent Structure** - Maintain the same directory structure in all features

## Creating a New Feature

```bash
# Use the helper script
./scripts/migrate-to-features.sh [feature-name]

# Or manually:
mkdir -p src/features-new/[feature-name]/{components,hooks,services,types,pages}
```

See `docs/ARCHITECTURE.md` for complete documentation.
