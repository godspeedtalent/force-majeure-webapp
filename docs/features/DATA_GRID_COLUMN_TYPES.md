# Data Grid Column Type System

## Overview

The data grid now has a standardized column type system with specialized cell renderers for common data patterns. This system provides:

- **Type-safe column definitions** with preset configurations
- **Reusable cell renderers** (ImageCell, DateCell, RelationCell, RoleCell, BadgeListCell)
- **Consistent styling** across all data grids
- **Reduced code duplication** in column definitions

## Available Cell Renderers

### ImageCell
Displays images with fallback support, multiple shapes, and sizes.

**Features:**
- Shape: `circle` or `square`
- Sizes: `xs`, `sm`, `md`, `lg`, `xl`
- Fallback icon for missing images
- Uses `FmUserAvatar` for circle shapes

**Example:**
```tsx
DataGridColumns.image({
  key: 'avatar_url',
  label: 'Avatar',
  shape: 'circle',
  size: 'sm',
})
```

### DateCell
Formats dates consistently with multiple format options.

**Formats:**
- `relative` - "2 hours ago", "3 days ago"
- `short` - "Jan 15, 2025"
- `long` - "January 15, 2025"
- `datetime` - "Jan 15, 2025 3:45 PM"

**Example:**
```tsx
DataGridColumns.date({
  key: 'created_at',
  label: 'Created',
  format: 'relative',
  sortable: true,
})
```

### RelationCell
Displays foreign key relationships with optional internal/external links.

**Features:**
- Custom label extraction via `getLabel`
- Internal links (React Router) or external links
- Fallback text for missing relations
- FM gold link color

**Example:**
```tsx
DataGridColumns.relation({
  key: 'venue_id',
  label: 'Venue',
  getLabel: (row) => row.venue?.name || 'Unknown Venue',
  getHref: (row) => `/venue/${row.venue_id}`,
  sortable: true,
})
```

### RoleCell
Displays user roles as badges with role-specific icons and colors.

**Features:**
- Role-specific icons (Shield for admin, Code for developer, etc.)
- Color-coded badges
- Optional click handler for role management

**Example:**
```tsx
DataGridColumns.roles({
  key: 'roles',
  label: 'Roles',
  onClick: (row) => openRoleManager(row.id),
})
```

### BadgeListCell
Displays a list of items as badges (tags, categories, etc.).

**Features:**
- Customizable variant colors
- Empty state text
- Badge-based styling

**Example:**
```tsx
DataGridColumns.badgeList({
  key: 'tags',
  label: 'Tags',
  variant: 'gold',
  emptyText: 'No tags',
})
```

## Basic Usage

```tsx
import { DataGridColumns } from '@/features/data-grid/utils';
import { DataGridColumn } from '@/features/data-grid';

const columns: DataGridColumn[] = [
  DataGridColumns.text({
    key: 'name',
    label: 'Name',
    sortable: true,
    filterable: true,
  }),
  DataGridColumns.image({
    key: 'avatar_url',
    label: 'Avatar',
    shape: 'circle',
    size: 'sm',
  }),
  DataGridColumns.date({
    key: 'created_at',
    label: 'Created',
    format: 'short',
    sortable: true,
  }),
];
```

## Adding Extra Properties

Helper functions don't include all `DataGridColumn` properties (like `filterable`, `editable`). Use the spread operator to add extra properties:

```tsx
const columns: DataGridColumn[] = [
  {
    ...DataGridColumns.date({
      key: 'date',
      label: 'Date',
      format: 'short',
      sortable: true,
    }),
    filterable: true,  // Add extra property
    editable: true,    // Add extra property
  },
  {
    ...DataGridColumns.relation({
      key: 'venue_id',
      label: 'Venue',
      sortable: true,
    }),
    editable: true,
    filterable: true,
  },
];
```

## When to Use Custom Rendering

Use DataGridColumns helpers for **standard patterns**:
- Simple text fields
- Images with standard sizing/shapes
- Standard date formatting
- Basic foreign key relationships
- Standard role displays

Keep **custom render functions** for:
- Complex layouts with multiple elements
- Custom icons or indicators
- Specialized click handlers or interactions
- Conditional styling based on multiple fields
- Unique business logic

### Example: Custom Rendering

```tsx
// Use helper for simple cases
DataGridColumns.text({
  key: 'status',
  label: 'Status',
}),

// Custom rendering for complex logic
{
  key: 'actions',
  label: 'Actions',
  render: (value, row) => (
    <div className="flex gap-2">
      <Button onClick={() => handleEdit(row)}>
        <Edit className="h-4 w-4" />
      </Button>
      {row.isDeletable && (
        <Button variant="destructive" onClick={() => handleDelete(row)}>
          <Trash className="h-4 w-4" />
        </Button>
      )}
    </div>
  ),
}
```

## Refactored Grids

The following grids have been refactored to use the column type system:

### ✅ adminGridColumns.tsx (Admin Controls)
- **artistColumns**: name, genre, image_url, bio, created_at
- **userColumns**: email, display_name, full_name, avatar_url, roles, created_at
- **venueColumns**: name, image_url, city_id, address, capacity, created_at

### ✅ EventsManagement.tsx
- **columns**: title, date, time, venue_id, headliner_id

### ⚠️ Specialized Grids (Not Refactored)
These grids use highly custom rendering and are better left as-is:
- **FmOrganizationDataGrid**: Custom icons, badges, hover states
- **FmUserDataGrid**: Complex role management click handlers
- **EventListSection**: Uses FmCommonList component (different API)

## Migration Checklist

When refactoring a data grid to use the column type system:

1. **Import DataGridColumns**:
   ```tsx
   import { DataGridColumns } from '@/features/data-grid/utils';
   ```

2. **Identify simple patterns**:
   - Plain text → `DataGridColumns.text()`
   - Images → `DataGridColumns.image()`
   - Dates → `DataGridColumns.date()`
   - Foreign keys → `DataGridColumns.relation()`

3. **Use spread for extra properties**:
   ```tsx
   {
     ...DataGridColumns.date({...}),
     filterable: true,
     editable: true,
   }
   ```

4. **Keep custom rendering when needed**:
   - Complex layouts
   - Conditional rendering
   - Custom interactions

5. **Test the grid**:
   - Verify styling is preserved
   - Check sorting/filtering
   - Test editable fields
   - Verify click handlers

## Design System Compliance

All cell renderers follow the Force Majeure design system:

- **Colors**: Uses FM color palette (fm-gold, fm-crimson, fm-navy)
- **Spacing**: 5px increment scale (5, 10, 20, 40, 60)
- **Typography**: Canela font, sentence case headers
- **Corners**: Sharp edges (`rounded-none`), minimal rounding only when necessary
- **Icons**: Lucide icons for consistency

## Future Enhancements

Potential additions to the column type system:

- **NumericCell**: Number formatting (currency, percentages, etc.)
- **StatusCell**: Status indicators with color coding
- **ProgressCell**: Progress bars or indicators
- **ActionCell**: Standardized action button groups
- **CheckboxCell**: Checkbox selection
- **RatingCell**: Star ratings or numeric scores

## File Locations

- **Cell Renderers**: `/src/features/data-grid/components/cells/`
- **Column Types Helper**: `/src/features/data-grid/utils/columnTypes.tsx`
- **Type Definitions**: `/src/features/data-grid/types/`
- **Exports**: `/src/features/data-grid/index.ts`

## Related Documentation

- [Data Grid Documentation](./DATA_GRID_DOCUMENTATION.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Architecture Guide](./ARCHITECTURE.md)
