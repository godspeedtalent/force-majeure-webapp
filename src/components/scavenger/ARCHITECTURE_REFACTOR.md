# Scavenger Hunt Architecture Refactoring

## Overview

The scavenger hunt system has been successfully refactored from a stateful component architecture to a clean, orchestrated design with dumb components and centralized state management.

## Key Architectural Changes

### 1. WelcomeStep → Atomic Components

The complex `WelcomeStep` component has been broken down into smaller, focused components:

- **`ClaimSuccessPanel`** - Shows success state for users who have already claimed
- **`CheckpointClaimPanel`** - Shows claim interface for authenticated users at checkpoints
- **`CheckpointWelcomePanel`** - Shows welcome screen for unauthenticated users at checkpoints
- **`NoCheckpointPanel`** - Shows general welcome screen when no checkpoint is scanned

Each component is now a simple, stateless function that only handles presentation logic.

### 2. ScavengerOrchestrator - Centralized State Management

Created a new `ScavengerOrchestrator` component that:

- **Manages all state** - Authentication, location validation, claim status, UI flow state
- **Provides actions** - Clean interface for all possible user actions
- **Uses render props pattern** - Passes state and actions to child components
- **Integrates with existing hooks** - Works with `useAuth`, `useClaimReward`, etc.

#### State Interface

```typescript
interface ScavengerState {
  // Authentication state
  isAuthenticated: boolean;
  user: User | null;
  userDisplayName?: string;

  // Location and validation state
  locationId: string | null;
  validationResult: LocationValidation | null;

  // Claim state
  hasAlreadyClaimed: boolean;
  isClaimLoading: boolean;

  // UI flow state
  currentStep: 'welcome' | 'unauthenticated-wizard';
  wizardStep: number;
  isLoginMode: boolean;
  registrationEmail: string;
}
```

#### Actions Interface

```typescript
interface ScavengerActions {
  // Navigation actions
  goToWelcome: () => void;
  goToWizard: () => void;
  setWizardStep: (step: number) => void;
  setLoginMode: (isLogin: boolean) => void;
  setRegistrationEmail: (email: string) => void;

  // Authentication actions
  handleSignIn: () => void;
  handleJoin: () => void;

  // Claim actions
  claimCheckpoint: () => void;

  // Location actions
  updateLocationId: (locationId: string | null) => void;
}
```

### 3. UnauthenticatedWizard - Simplified Component

The `UnauthenticatedWizard` has been refactored to:

- **Remove internal state** - No more `useState` hooks for wizard flow
- **Accept orchestrator props** - Receives state and actions from parent
- **Maintain backward compatibility** - Still works with legacy usage patterns
- **Focus on presentation** - Only handles UI rendering and user interactions

### 4. Scavenger Page - Clean Integration

The main `Scavenger.tsx` page now:

- **Uses orchestrator for state** - Location-based flows use `ScavengerOrchestrator`
- **Direct component usage** - Uses atomic components directly where appropriate
- **Clear flow separation** - Each user state has a dedicated rendering path
- **Simplified logic** - Business logic moved to orchestrator

## Benefits of New Architecture

### 1. **Separation of Concerns**

- **Presentation components** handle only UI rendering
- **Orchestrator** manages all business logic and state
- **Pages** coordinate high-level flows

### 2. **Testability**

- **Atomic components** can be tested in isolation
- **Orchestrator** can be unit tested separately
- **State and actions** have clear interfaces

### 3. **Reusability**

- **Atomic components** can be used anywhere
- **Orchestrator** can be composed with different UIs
- **Clear prop interfaces** make integration simple

### 4. **Maintainability**

- **Single source of truth** for scavenger state
- **Predictable data flow** - state down, actions up
- **Easy to extend** - add new actions or state properties

### 5. **Type Safety**

- **Full TypeScript interfaces** for state and actions
- **Compile-time validation** of prop usage
- **IDE support** for autocomplete and refactoring

## Usage Patterns

### Direct Component Usage

For simple, static UIs:

```tsx
<ClaimSuccessPanel userDisplayName='John Doe' />
```

### Orchestrated Flow

For complex, stateful interactions:

```tsx
<ScavengerOrchestrator initialLocationId={locationId}>
  {(state, actions) => (
    <CheckpointClaimPanel
      locationName={state.validationResult?.location_name || ''}
      onClaimClick={actions.claimCheckpoint}
      isLoading={state.isClaimLoading}
    />
  )}
</ScavengerOrchestrator>
```

## Migration Status

- ✅ **WelcomeStep broken into atomic components**
- ✅ **ScavengerOrchestrator created with full state management**
- ✅ **UnauthenticatedWizard made stateless**
- ✅ **Scavenger page refactored to use orchestrator**
- ✅ **All compilation errors resolved**
- ✅ **Development server running successfully**
- ✅ **Hot module reloading working**

The refactoring is complete and the application is ready for testing. All components are now simple, focused, and easily testable while maintaining full functionality.
