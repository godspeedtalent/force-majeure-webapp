# i18n (Internationalization) Remaining Work

This document tracks the remaining work needed to fully implement internationalization across the Force Majeure web application.

## Completed Work

### Infrastructure
- [x] i18n library setup (`react-i18next` with `i18next`)
- [x] Translation files structure (`/public/locales/{en,es,zh}/`)
- [x] Language detection (browser + localStorage)
- [x] `useLocaleSync` hook for locale management
- [x] `LanguageSelector` component
- [x] Database migration for `preferred_locale` column in `profiles` table

### Translated Components
- [x] `Navigation.tsx` - Shop Merch tooltip
- [x] `UserMenuDropdown.tsx` - All menu items, section labels, permission tooltips
- [x] `ProfileEdit.tsx` - Full page translation (profile picture, personal info, billing, preferences, artist profile)

## Remaining Work

### High Priority (User-Facing Pages)

#### Authentication Pages
- [ ] `src/pages/auth/` - Login, signup, password reset forms
  - Sign in/up buttons, form labels, error messages
  - "Remember me", "Forgot password" links
  - Terms of service, privacy policy links

#### Event Pages
- [ ] `src/pages/event/EventDetailsPage.tsx` - Event details
- [ ] `src/pages/event/EventTicketingPage.tsx` - Ticket selection
- [ ] `src/features/events/components/EventCard.tsx` - Event cards
- [ ] `src/features/events/components/EventRow.tsx` - Event list items

#### Checkout Flow
- [ ] `src/components/ticketing/EventCheckoutWizard.tsx`
- [ ] `src/components/ticketing/TicketCheckoutForm.tsx`
- [ ] `src/components/ticketing/TicketingPanel.tsx`
- [ ] `src/features/payments/components/StripeCardInput.tsx`

### Medium Priority

#### Profile & User Pages
- [ ] `src/pages/Profile.tsx` - View profile page
- [ ] `src/components/profile/UserArtistTab.tsx` - Artist linking

#### Artist Pages
- [ ] `src/pages/artists/ArtistDetails.tsx`
- [ ] `src/pages/artists/ArtistRegister.tsx`
- [ ] `src/pages/artists/ArtistSignup.tsx`

#### Venue Pages
- [ ] `src/pages/venues/VenueDetails.tsx`
- [ ] `src/pages/venues/VenueManagement.tsx`

#### Error & Feedback Components
- [ ] `src/components/feedback/ErrorBoundary.tsx`
- [ ] `src/components/common/feedback/FmErrorDisplay.tsx`
- [ ] `src/components/common/feedback/FmErrorOverlay.tsx`
- [ ] `src/components/common/feedback/FmErrorToast.tsx`
- [ ] `src/pages/NotFound.tsx`

### Low Priority (Admin/Internal)

#### Admin Pages
- [ ] `src/pages/admin/AdminControls.tsx`
- [ ] `src/pages/admin/UserManagement.tsx`
- [ ] `src/pages/admin/EventsManagement.tsx`
- [ ] `src/pages/admin/DatabaseManager.tsx`
- [ ] All other admin pages

#### Developer Pages
- [ ] `src/pages/developer/` - All developer tools

#### Common Components (Shared Labels)
- [ ] `src/components/common/forms/` - Form field default labels
- [ ] `src/components/common/buttons/` - Button default labels
- [ ] `src/components/common/display/` - Display component labels
- [ ] `src/components/common/modals/` - Modal titles, buttons

## Translation File Structure

```
packages/web/public/locales/
├── en/
│   ├── common.json      # Navigation, buttons, labels, status, errors
│   ├── pages.json       # Page-specific content
│   ├── validation.json  # Form validation messages
│   └── toasts.json      # Toast notifications
├── es/
│   └── (same structure)
└── zh/
    └── (same structure)
```

## How to Add Translations

### 1. Add translation key to JSON files

```json
// en/pages.json
{
  "featureName": {
    "title": "Feature Title",
    "description": "Feature description"
  }
}
```

### 2. Use in component

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('pages');

  return (
    <h1>{t('featureName.title')}</h1>
  );
}
```

### 3. For multiple namespaces

```tsx
const { t } = useTranslation('pages');
const { t: tCommon } = useTranslation('common');

// Use t() for pages namespace
// Use tCommon() for common namespace
```

## Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| en   | English  | English     |
| es   | Spanish  | Español     |
| zh   | Chinese  | 中文         |

## Notes

- Always add translations to ALL THREE language files when adding new keys
- Use the existing key structure and naming conventions
- Keep translation keys in English, using camelCase
- Group related translations under feature/page namespaces
- Toast messages go in `toasts.json`, validation in `validation.json`
