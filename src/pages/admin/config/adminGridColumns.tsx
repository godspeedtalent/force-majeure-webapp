import { DataGridColumn } from '@/features/data-grid';

/**
 * Column definitions for the Artists data grid in Admin Controls
 */
export const artistColumns: DataGridColumn[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    filterable: true,
    editable: true,
    required: true,
  },
  {
    key: 'genre',
    label: 'Genre',
    sortable: true,
    filterable: true,
    editable: true,
  },
  {
    key: 'image_url',
    label: 'Image URL',
    filterable: true,
    editable: true,
    type: 'url',
    render: (value) =>
      value ? (
        <img
          src={value}
          alt='Artist'
          className='h-8 w-8 rounded-full object-cover shadow-sm'
        />
      ) : (
        <span className='text-xs text-muted-foreground'>-</span>
      ),
  },
  {
    key: 'bio',
    label: 'Bio',
    filterable: true,
    editable: true,
    render: (value) => {
      if (!value) {
        return <span className='text-xs text-muted-foreground'>-</span>;
      }
      const text = String(value);
      return (
        <span
          className='text-xs text-muted-foreground'
          title={text}
        >
          {text.length > 80 ? `${text.slice(0, 77)}…` : text}
        </span>
      );
    },
  },
];

/**
 * Column definitions for the Users data grid in Admin Controls
 */
export const userColumns: DataGridColumn[] = [
  {
    key: 'display_name',
    label: 'Display Name',
    sortable: true,
    filterable: true,
    editable: true,
  },
  {
    key: 'full_name',
    label: 'Full Name',
    sortable: true,
    filterable: true,
    editable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    filterable: true,
    readonly: true,
  },
  {
    key: 'avatar_url',
    label: 'Avatar',
    filterable: false,
    editable: true,
    type: 'url',
    render: (value) =>
      value ? (
        <img
          src={value}
          alt='User Avatar'
          className='h-8 w-8 rounded-full object-cover shadow-sm'
        />
      ) : (
        <span className='text-xs text-muted-foreground'>-</span>
      ),
  },
  {
    key: 'roles',
    label: 'Roles',
    filterable: false,
    readonly: true,
    render: (value) => {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return <span className='text-xs text-muted-foreground'>No roles</span>;
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {value.map((role: any, idx: number) => (
            <span
              key={idx}
              className='inline-flex items-center rounded-md bg-fm-gold/10 px-2 py-1 text-xs font-medium text-fm-gold ring-1 ring-inset ring-fm-gold/20'
            >
              {role.display_name || role.role_name}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    key: 'created_at',
    label: 'Joined',
    sortable: true,
    readonly: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
];

/**
 * Column definitions for the Venues data grid in Admin Controls
 */
export const venueColumns: DataGridColumn[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    filterable: true,
    editable: true,
  },
  {
    key: 'image_url',
    label: 'Image',
    filterable: false,
    editable: true,
    type: 'url',
    render: (value) =>
      value ? (
        <img
          src={value}
          alt='Venue'
          className='h-8 w-8 rounded object-cover shadow-sm'
        />
      ) : (
        <span className='text-xs text-muted-foreground'>-</span>
      ),
  },
  {
    key: 'city_id',
    label: 'City',
    sortable: true,
    filterable: true,
    editable: true,
    readonly: true, // City shown but edit via form only
    isRelation: true,
    render: (_value, row) => row.city || '-',
  },
  {
    key: 'address',
    label: 'Address',
    sortable: true,
    filterable: true,
    editable: true,
  },
  {
    key: 'capacity',
    label: 'Capacity',
    sortable: true,
    editable: true,
    render: (value) => value ? value.toLocaleString() : '-',
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    readonly: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
];
