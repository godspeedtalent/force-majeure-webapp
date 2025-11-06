import { DataGridColumn } from '@/components/common/data/FmCommonDataGrid';

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
