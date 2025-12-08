# Mobile Developer Toolbar

> Mobile-native developer tools accessible via floating action button (FAB) and bottom sheet drawers.

---

## Overview

The Mobile Developer Toolbar provides on-the-fly access to all developer tools on mobile devices (< 768px viewport width). It's automatically available to users with `ADMIN` or `DEVELOPER` roles.

**Components:**
- **Floating Action Button (FAB)** - Bottom-right corner trigger with badge support
- **Main Drawer** - Bottom sheet with tool grid
- **Nested Drawers** - Full-screen content for individual tools

---

## Features

### Available Developer Tools

1. **Navigation** (prioritized) - Quick links to:
   - Admin Controls (admin only)
   - Developer Home
   - Supabase Dashboard (auto-detects local vs production)
   - Mailpit (local email viewer, dev environment only)

2. **Database** - Database search and navigation
   - DatabaseNavigatorSearch component
   - Quick link to full Database Manager page

3. **Feature Toggles** - Toggle feature flags on/off
   - Same functionality as desktop toolbar

4. **Session Overrides** - Session-based feature flag overrides
   - Override Coming Soon Mode
   - Shows database vs override values
   - Clear individual or all overrides

5. **Notes** - Developer notes and TODOs
   - Create, edit, and manage dev notes
   - Full DevNotesSection functionality

---

## User Experience

### Interaction Flow

1. **FAB appears** in bottom-right corner (only on mobile < 768px)
2. **Tap FAB** to open main drawer from bottom
3. **Select tool** from grid to open nested drawer
4. **Swipe down or tap back** to return to tool grid
5. **Tap close or swipe down** to dismiss everything

### Gestures

- **Swipe down** - Dismiss drawers (Vaul handles this natively)
- **Tap overlay** - Close drawer
- **Drag handle** - Visual affordance for swipe-to-dismiss

### Visual Design

#### FAB
- **Position**: Fixed bottom-right (16px from right, 80px from bottom)
- **Size**: 56x56px (Material Design standard)
- **Icon**: Wrench (gold color)
- **Background**: `bg-fm-gold` with pulsing animation
- **Badge**: Red dot with count for notifications

#### Main Drawer
- **Height**: 70vh (shows content behind)
- **Background**: `bg-black/80 backdrop-blur-lg`
- **Grid**: 2 columns (small), 3 columns (larger mobile)
- **Cards**: Sharp corners, gold hover states

#### Nested Drawers
- **Height**: 90vh (immersive)
- **Background**: `bg-black/90 backdrop-blur-xl`
- **Header**: Back button (left), title (center), close button (right)
- **Content**: Scrollable, reuses desktop tab components

---

## Technical Implementation

### File Structure

```
src/components/common/toolbar/
├── FmToolbar.tsx (desktop - hidden md:block)
└── mobile/
    ├── FmMobileDevToolbar.tsx (main container)
    ├── FmMobileDevFAB.tsx (floating button)
    ├── FmMobileDevDrawer.tsx (bottom sheet menu)
    ├── FmMobileDevToolContent.tsx (nested drawer)
    └── useMobileDevTools.ts (shared state hook)
```

### Integration

**Location**: [src/App.tsx:435](../src/App.tsx#L435)

```tsx
<CheckoutProvider>
  <AppRoutes />
  <FmToolbar /> {/* Desktop only - hidden md:block */}
  <FmMobileDevToolbar /> {/* Mobile only - block md:hidden */}
  <GlobalSearchWrapper />
</CheckoutProvider>
```

### State Management

**Hook**: `useMobileDevTools()`

Manages:
- Main drawer open/close state
- Active tool selection
- Badge counts for notifications
- Tool drawer history

**Example Usage**:
```tsx
const {
  isMainDrawerOpen,
  openMainDrawer,
  closeMainDrawer,
  activeTool,
  openTool,
  closeTool,
  badges,
  totalBadges,
} = useMobileDevTools();
```

### Permission Gating

Only visible to users with `ROLES.ADMIN` or `ROLES.DEVELOPER`:

```tsx
const { hasRole } = useUserPermissions();
const canAccessDevTools = hasRole(ROLES.ADMIN) || hasRole(ROLES.DEVELOPER);
```

---

## Design System Compliance

### Colors
- **FAB**: `bg-fm-gold` (exception - needs visibility)
- **Drawers**: `bg-black/80` and `bg-black/90` (Level 2 and 3 depth)
- **Borders**: `border-white/10` and `border-white/20`
- **Badge**: `bg-fm-danger` (red for notifications)

### Spacing
- **XS (5px)**: Badge padding, icon gaps
- **SM (10px)**: Grid gaps between tool cards
- **MD (20px)**: Drawer padding, card padding
- **LG (40px)**: Not used in mobile toolbar

### Corners
- **FAB**: `rounded-full` (exception - industry standard)
- **Drawers**: `rounded-t-[20px]` (top corners - bottom sheet convention)
- **Tool cards**: `rounded-none` (sharp - per design system)

### z-index Hierarchy
- **FAB**: `z-[60]` (above mobile tabs at 40)
- **Main drawer**: `z-[70]` (above FAB)
- **Nested drawer**: `z-[80]` (above main drawer)
- **Navigation**: `z-50` (always on top)

---

## Performance Considerations

### Optimizations
1. **Mobile detection** - Uses `useIsMobile()` hook with matchMedia
2. **Permission checking** - Early return if user doesn't have access
3. **Component reuse** - All tab content reused from desktop toolbar
4. **Lazy rendering** - Nested drawers only render when tool is active

### Bundle Impact
- **New files**: ~15KB total (pre-compression)
- **Vaul drawer**: Already included in bundle (used elsewhere)
- **No new dependencies** - Uses existing libraries

---

## Browser Support

### Tested Platforms
- ✅ iOS Safari (iPhone, iPad)
- ✅ Android Chrome
- ✅ Mobile Firefox
- ✅ Chrome DevTools mobile emulation

### iOS Considerations
- **Safe area support**: `h-[env(safe-area-inset-bottom)]`
- **Bottom padding**: Accounts for home indicator
- **Scroll behavior**: Native iOS scrolling in drawers

---

## Accessibility

### ARIA Labels
- FAB: `aria-label="Open developer tools (X notifications)"`
- Back button: `aria-label="Go back"`
- Close button: `aria-label="Close"`

### Keyboard Support
- **Tab**: Navigate through tool cards
- **Enter/Space**: Activate tools
- **Escape**: Close active drawer

### Screen Readers
- Badge counts announced with FAB label
- Drawer state changes announced
- Tool labels read on focus

---

## Future Enhancements

### Planned (Out of Current Scope)
1. **Customizable FAB position** - Drag to different corners
2. **Quick actions** - Long-press FAB for frequently used tools
3. **Haptic feedback** - iOS vibration on interactions
4. **Landscape mode** - Optimized layout for landscape
5. **Tool shortcuts** - PWA home screen shortcuts
6. **Search/filter** - Search tools in main drawer
7. **Recent tools** - Show last used tools first

---

## Troubleshooting

### FAB Not Appearing

**Check**:
1. Viewport width < 768px?
2. User has `ADMIN` or `DEVELOPER` role?
3. `FmMobileDevToolbar` imported in App.tsx?

**Debug**:
```tsx
// In FmMobileDevToolbar.tsx
console.log('Mobile:', isMobile, 'Access:', canAccessDevTools);
```

### Drawer Not Opening

**Check**:
1. Vaul drawer component installed?
2. z-index conflicts with other components?
3. Browser console for JavaScript errors?

### Tool Content Not Displaying

**Check**:
1. Tab component exports correct content function?
2. Navigation paths correct for environment?
3. Required permissions for specific tools?

---

## Related Documentation

- [FEATURE_FLAG_GUIDE.md](./FEATURE_FLAG_GUIDE.md) - Feature flag system
- [SESSION_OVERRIDES.md](./SESSION_OVERRIDES.md) - Session override system
- [PERMISSION_MANAGEMENT_GUIDE.md](../security/PERMISSION_MANAGEMENT_GUIDE.md) - Roles and permissions
- [DESIGN_SYSTEM.md](../architecture/DESIGN_SYSTEM.md) - Design system reference

---

## Examples

### Adding a New Tool

1. **Add tool ID** to `MobileDevToolId` type:
   ```ts
   export type MobileDevToolId =
     | 'navigation'
     | 'database'
     | 'features'
     | 'session'
     | 'notes'
     | 'my-new-tool'; // Add here
   ```

2. **Update tool list** in `FmMobileDevDrawer.tsx`:
   ```tsx
   const tools = [
     // ... existing tools
     {
       id: 'my-new-tool',
       label: 'My Tool',
       icon: <Icon className="h-[24px] w-[24px]" />,
     },
   ];
   ```

3. **Add content renderer** in `FmMobileDevToolContent.tsx`:
   ```tsx
   case 'my-new-tool':
     return <MyNewToolContent />;
   ```

4. **Update tool labels**:
   ```tsx
   const toolLabels: Record<MobileDevToolId, string> = {
     // ... existing labels
     'my-new-tool': 'My Tool',
   };
   ```

### Setting Badge Count

```tsx
const { setBadge } = useMobileDevTools();

// Set badge for notes tool
setBadge('notes', 5);

// Clear badge
setBadge('notes', 0);
// or
clearBadge('notes');
```

---

## Notes

- Mobile toolbar automatically hidden on desktop (≥768px)
- Desktop FmToolbar hidden on mobile (<768px)
- Both toolbars share the same tab content components
- No duplicate code - maximum reuse
- Navigation tool prioritized per user preference
