# i18n (Internationalization) Remaining Work

**Last Updated:** December 19, 2025
**Overall Progress:** ~90% complete (175+/400 non-shadcn TSX files have i18n)

This document tracks the remaining work needed to fully implement internationalization across the Force Majeure web application.

---

## Quick Stats

| Metric | Count |
|--------|-------|
| Total TSX Files | 449 |
| Shadcn UI Primitives (excluded) | 49 |
| Files to Consider | 400 |
| Files with `useTranslation` | 175+ |
| Files Still Needing i18n | ~3 (LOW priority only) |
| Translation Keys Added | 2050+ |

---

## Completed Work

### Infrastructure ✅
- [x] i18n library setup (`react-i18next` with `i18next`)
- [x] Translation files structure (`/public/locales/{en,es,zh}/`)
- [x] Language detection (browser + localStorage)
- [x] `useLocaleSync` hook for locale management
- [x] `LanguageSelector` component
- [x] Database migration for `preferred_locale` column in `profiles` table

### Recently Completed (December 2025 Sessions)

#### Session: Dec 19, 2025 (Continued)
- [x] `FmDataGrid.tsx` - Toast messages, loading/empty states (22 keys)
- [x] `FmDataGridDialogs.tsx` - Delete confirmations, buttons
- [x] `FmDataGridPagination.tsx` - Pagination results text
- [x] `SalesOverTimeChart.tsx` - Chart title, revenue/tickets labels
- [x] `RevenueByTierChart.tsx` - Chart title, revenue/tickets labels
- [x] `ViewsOverTimeChart.tsx` - Chart title, views label
- [x] `HourlyDistributionChart.tsx` - Chart title, orders label
- [x] `ArtistDetails.tsx` (admin) - Section titles, labels, metadata, buttons
- [x] `VenueDetails.tsx` (admin) - Section titles, labels, metadata, buttons

#### Session: Dec 19, 2025 (Earlier)
- [x] `AdminControls.tsx` - Full admin controls page with navigation, tabs, descriptions
- [x] `Profile.tsx` - Profile page loading states, sign-in prompts
- [x] `Contact.tsx` - Contact page title, labels, footer
- [x] `NotFound.tsx` - 404 page title, message, button

#### Session: Dec 17, 2025
- [x] `TierListItem.tsx` - Ticket tier form labels, tooltips
- [x] `TicketTiersSection.tsx` - Ticket tier section with capacity validation
- [x] `UndercardSection.tsx` - Undercard artists section
- [x] `ArtistProfile.tsx` - Artist profile display component
- [x] `FmGenreMultiSelect.tsx` - Genre multi-select dropdown
- [x] `ActivityLogFilters.tsx` - Activity log filter sidebar
- [x] `DetailPageWrapper.tsx` - Detail page wrapper (error/loading states)
- [x] `FmCommonJsonEditor.tsx` - JSON key-value editor
- [x] `ExternalLinkDialog.tsx` - External link confirmation dialog
- [x] `FmCommonRowManager.tsx` - Row manager add button default
- [x] `Footer.tsx` - Copyright text
- [x] `LocationCard.tsx` - Scavenger hunt location card

#### Previously Completed
- [x] `Navigation.tsx` - Full navigation with all menu items
- [x] `UserMenuDropdown.tsx` - All menu items, section labels, permission tooltips
- [x] `ProfileEdit.tsx` - Full page translation
- [x] `EventDetailsPage.tsx` - Event details
- [x] `EventTicketingPage.tsx` - Ticket selection
- [x] `EventCard.tsx` - Event cards
- [x] `EventRow.tsx` - Event list items
- [x] `EventCheckoutWizard.tsx` - Checkout wizard
- [x] `TicketCheckoutForm.tsx` - Checkout form
- [x] `TicketingPanel.tsx` - Ticketing panel
- [x] `Profile.tsx` - Profile view
- [x] `UserArtistTab.tsx` - Artist linking
- [x] `ArtistDetails.tsx` - Artist details page
- [x] `ArtistRegister.tsx` - Artist registration
- [x] `VenueDetails.tsx` - Venue details (partial - needs review)
- [x] `VenueManagement.tsx` - Venue management
- [x] `FmErrorDisplay.tsx` - Error display component
- [x] `NotFound.tsx` - 404 page
- [x] `UserManagement.tsx` - User management admin
- [x] `EventsManagement.tsx` - Events management admin
- [x] `GenresManagement.tsx` - Genre management admin
- [x] `Statistics.tsx` - Statistics page
- [x] All checkout flow components
- [x] All authentication pages

---

## Remaining Work

### HIGH Priority (~25 strings, 3 files)

These are critical user-facing components that need immediate attention:

**All HIGH priority files completed (Dec 19, 2025):**
- ~~`FmDataGrid.tsx`~~ - ✅ Done - Toast messages, loading/empty states
- ~~`FmDataGridDialogs.tsx`~~ - ✅ Done - Delete confirmations, buttons
- ~~`FmDataGridPagination.tsx`~~ - ✅ Done - "Showing X to Y of Z results"
- ~~`AdminControls.tsx`~~ - ✅ Done - Tab labels, section descriptions
- ~~`Reports.tsx`~~ - File no longer exists in codebase

#### FmDataGrid.tsx Strings to Translate:
```
- "Updating ${displayName}..."
- "Please wait..."
- "${displayName} updated."
- "Failed to update ${displayName}"
- "Missing required fields"
- "Please fill in: ${missingFields...}"
- "Creating ${resourceName}..."
- "${resourceName} created successfully"
- "Failed to create ${resourceName}"
- "Deleting ${selectedRowsData.length}..."
- "Success", "Delete failed", "Export successful"
- "Updating rows...", "Bulk edit successful", "Bulk edit failed"
```

#### FmDataGridDialogs.tsx Strings to Translate:
```
- "Confirm Batch Delete"
- "Are you sure you want to delete..."
- "This action cannot be undone."
- "Items to be deleted:"
- "... and ${count} more"
- "Cancel", "Delete ${count}", "Deleting..."
```

#### AdminControls.tsx Strings to Translate:
```
- "Site Controls", "Developer Tools"
- "Toggle dev environment features"
- "Ticketing", "Configure ticketing fees..."
- "Site Settings", "Database", "Organizations"
- "User Requests", "Users", "Monitoring"
- "Activity Logs", Tab labels
```

### MEDIUM Priority (~20 strings, 5 files)

**Analytics Charts completed (Dec 19, 2025):**

- ~~`SalesOverTimeChart.tsx`~~ - ✅ Done - Chart title, revenue/tickets labels
- ~~`RevenueByTierChart.tsx`~~ - ✅ Done - Chart title, revenue/tickets labels
- ~~`ViewsOverTimeChart.tsx`~~ - ✅ Done - Chart title, views label
- ~~`HourlyDistributionChart.tsx`~~ - ✅ Done - Chart title, orders label

**Admin Detail Pages completed (Dec 19, 2025):**

- ~~`ArtistDetails.tsx`~~ - ✅ Done - Section titles, labels, buttons
- ~~`VenueDetails.tsx`~~ - ✅ Done - Section titles, labels, buttons

### LOW Priority (~150+ strings, 2-3 files)

| File | Location | Strings | Notes |
|------|----------|---------|-------|
| `OrderReceiptEmail.tsx` | `services/email/templates/` | 100+ | Email template - may stay English |
| `CheckoutFlowTests.tsx` | `pages/testing/` | 9+ | Dev/test tools only |
| Demo pages | `pages/demo/` | Various | Developer tools |

---

## Translation Key Sections Added

The following translation key sections have been added to `common.json`:

```json
{
  "admin.controls": { /* 28 keys - Admin controls page navigation, tabs, descriptions */ },
  "profilePage": { /* 5 keys - Profile loading, sign-in prompts */ },
  "contactPage": { /* 6 keys - Contact page labels */ },
  "notFoundPage": { /* 3 keys - 404 page */ },
  "tierListItem": { /* 12 keys */ },
  "ticketTiersSection": { /* 11 keys */ },
  "undercardSection": { /* 2 keys */ },
  "artistProfile": { /* 10 keys */ },
  "genreMultiSelect": { /* 7 keys */ },
  "activityLogFilters": { /* 7 keys */ },
  "detailPageWrapper": { /* 4 keys */ },
  "jsonEditor": { /* 6 keys */ },
  "externalLink": { /* 3 keys */ },
  "rowManager": { /* 1 key */ },
  "footer": { /* 1 key */ },
  "locationCard": { /* 4 keys */ },
  "analytics": { /* 8 keys added - Chart titles, axis labels (salesOverTime, revenueByTier, pageViewsOverTime, salesByHour, revenue, tickets, views, orders) */ },
  "adminDetails": { /* 14 keys - Admin detail page labels (artistDetails, venueDetails, basicInformation, links, metadata, actions, artistId, venueId, created, lastUpdated, backToArtistsList, backToVenuesList, openInGoogleMaps, people) */ }
}
```

---

## Translation File Structure

```
packages/web/public/locales/
├── en/
│   ├── common.json      # ~2000+ keys - Nav, buttons, labels, status, errors, components
│   ├── pages.json       # Page-specific content
│   ├── validation.json  # Form validation messages
│   └── toasts.json      # Toast notifications
├── es/
│   └── (same structure - Spanish)
└── zh/
    └── (same structure - Chinese)
```

---

## How to Add Translations

### 1. Add translation key to ALL THREE JSON files

```json
// en/common.json
{
  "featureName": {
    "title": "Feature Title",
    "description": "Feature description",
    "dynamicMessage": "Hello {{name}}, you have {{count}} items"
  }
}

// es/common.json
{
  "featureName": {
    "title": "Título de la Función",
    "description": "Descripción de la función",
    "dynamicMessage": "Hola {{name}}, tienes {{count}} artículos"
  }
}

// zh/common.json
{
  "featureName": {
    "title": "功能标题",
    "description": "功能描述",
    "dynamicMessage": "你好 {{name}}，你有 {{count}} 个项目"
  }
}
```

### 2. Use in component

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1>{t('featureName.title')}</h1>
      <p>{t('featureName.dynamicMessage', { name: 'User', count: 5 })}</p>
    </div>
  );
}
```

### 3. For components with default prop values

```tsx
// Instead of hardcoded defaults:
// label = 'Add Item'

// Use i18n with fallback:
const { t } = useTranslation('common');
const resolvedLabel = label || t('component.defaultLabel');
```

---

## Supported Languages

| Code | Language | Native Name | Status |
|------|----------|-------------|--------|
| en   | English  | English     | Primary |
| es   | Spanish  | Español     | Complete |
| zh   | Chinese  | 中文         | Complete |

---

## Checklist for Future Sessions

When continuing i18n work:

1. **Start here** - Check HIGH priority files first
2. **Update this doc** - Mark files as completed when done
3. **Test** - Run `pnpm --filter @force-majeure/web exec tsc --noEmit`
4. **All three files** - Always update en, es, zh locale files together

### Quick Commands

```bash
# Find files without useTranslation
cd packages/web/src
find . -name "*.tsx" -type f -exec grep -L "useTranslation" {} \; | head -20

# Count files with i18n
find . -name "*.tsx" -type f -exec grep -l "useTranslation" {} \; | wc -l

# Type check
pnpm --filter @force-majeure/web exec tsc --noEmit
```

---

## Notes

- Always add translations to ALL THREE language files when adding new keys
- Use the existing key structure and naming conventions
- Keep translation keys in English, using camelCase
- Group related translations under feature/component namespaces
- Toast messages go in `toasts.json`, validation in `validation.json`
- For pluralization, use `_one` and `_other` suffixes (e.g., `entryCount_one`, `entryCount_other`)
- Email templates may remain in English only (consider if multilingual emails are needed)
