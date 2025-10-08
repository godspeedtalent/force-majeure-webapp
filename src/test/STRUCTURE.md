# Example test structure - these are empty test files showing the organizational pattern

# Component Tests
components/
  __tests__/
    AnimatedCounter.test.tsx
    EventCard.test.tsx
    ExternalLinkDialog.test.tsx
    Navigation.test.tsx
    scavenger/
      AuthenticatedScavenger.test.tsx
      UnauthenticatedWizard.test.tsx
      ScavengerSplitLayout.test.tsx
    ui/
      Button.test.tsx
      Dialog.test.tsx
      Input.test.tsx

# Hook Tests  
hooks/
  __tests__/
    useAuth.test.ts
    useFeatureFlags.test.ts
    useScavenger.test.ts
    useProxyToken.test.ts

# Page Tests
pages/
  __tests__/
    ComingSoon.test.tsx
    ProxyToken.test.tsx
    Scavenger.test.tsx
    Login.test.tsx

# Integration Tests
integration/
  AuthFlow.test.tsx
  ScavengerFlow.test.tsx
  TokenValidation.test.tsx

# Utils Tests
lib/
  __tests__/
    encryption.test.ts
    constants.test.ts
    utils.test.ts