import { DataGridColumn, DataGridColumns } from '@/features/data-grid';
import { BadgeListCell } from '@/features/data-grid/components/cells';
import { supabase } from '@force-majeure/shared';
import { toast } from 'sonner';
import { logger } from '@force-majeure/shared';

/**
 * Update artist image URL in the database
 */
async function updateArtistImage(row: any, newImageUrl: string) {
  try {
    const { error } = await supabase
      .from('artists')
      .update({ image_url: newImageUrl })
      .eq('id', row.id);

    if (error) throw error;
    toast.success('Artist image updated');
  } catch (error) {
    logger.error('Failed to update artist image', { error, artistId: row.id });
    toast.error('Failed to update artist image');
    throw error;
  }
}

/**
 * Update user avatar URL in the database
 */
async function updateUserAvatar(row: any, newImageUrl: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: newImageUrl })
      .eq('id', row.id);

    if (error) throw error;
    toast.success('User avatar updated');
  } catch (error) {
    logger.error('Failed to update user avatar', { error, userId: row.id });
    toast.error('Failed to update user avatar');
    throw error;
  }
}

/**
 * Update venue image URL in the database
 */
async function updateVenueImage(row: any, newImageUrl: string) {
  try {
    const { error } = await supabase
      .from('venues')
      .update({ image_url: newImageUrl })
      .eq('id', row.id);

    if (error) throw error;
    toast.success('Venue image updated');
  } catch (error) {
    logger.error('Failed to update venue image', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'adminGridColumns',
      details: { venueId: row.id }
    });
    toast.error('Failed to update venue image');
    throw error;
  }
}

/**
 * Column definitions for the Artists data grid in Admin Controls
 */
export const artistColumns: DataGridColumn[] = [
  DataGridColumns.text({
    key: 'name',
    label: 'Name',
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.text({
    key: 'genre',
    label: 'Genre',
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.image({
    key: 'image_url',
    label: 'Image',
    shape: 'circle',
    entityType: 'artist',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'artists',
    onImageUpdate: (row, newImageUrl) => updateArtistImage(row, newImageUrl),
  }),
  {
    key: 'bio',
    label: 'Bio',
    filterable: true,
    editable: true,
    render: value => {
      if (!value) {
        return <span className='text-xs text-muted-foreground'>—</span>;
      }
      const text = String(value);
      return (
        <span className='text-xs text-muted-foreground' title={text}>
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
  DataGridColumns.text({
    key: 'display_name',
    label: 'Username',
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.text({
    key: 'full_name',
    label: 'Full Name',
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.text({
    key: 'email',
    label: 'Email',
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.image({
    key: 'avatar_url',
    label: 'Avatar',
    shape: 'circle',
    entityType: 'user',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'users',
    onImageUpdate: (row, newImageUrl) => updateUserAvatar(row, newImageUrl),
  }),
  DataGridColumns.relation({
    key: 'organization_id',
    label: 'Organization',
    sortable: true,
    getLabel: (row: any) => row.organization_name || '—',
    getHref: (row: any) => row.organization_id ? `/organization/${row.organization_id}` : '#',
  }),
  {
    key: 'roles',
    label: 'Roles',
    filterable: false,
    readonly: true,
    render: (value: any) => {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return <BadgeListCell items={[]} emptyText='No roles' />;
      }

      const roleLabels = value.map((role: any) =>
        role.display_name || role.role_name
      );

      return <BadgeListCell items={roleLabels} variant='gold' />;
    },
  },
  DataGridColumns.date({
    key: 'created_at',
    label: 'Joined',
    format: 'short',
    sortable: true,
  }),
];

/**
 * Column definitions for the Venues data grid in Admin Controls
 */
export const venueColumns: DataGridColumn[] = [
  DataGridColumns.text({
    key: 'name',
    label: 'Name',
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.image({
    key: 'image_url',
    label: 'Image',
    shape: 'square',
    entityType: 'venue',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'venues',
    onImageUpdate: (row, newImageUrl) => updateVenueImage(row, newImageUrl),
  }),
  DataGridColumns.relation({
    key: 'city_id',
    label: 'City',
    sortable: true,
    getLabel: (row: any) => row.city || '—',
  }),
  DataGridColumns.address({
    keys: {
      line1: 'address_line_1',
      line2: 'address_line_2',
      city: 'city',
      state: 'state',
      zipCode: 'zip_code',
    },
    label: 'Address',
    sortable: true,
  }),
  {
    key: 'capacity',
    label: 'Capacity',
    sortable: true,
    editable: true,
    render: (value: any) => (value ? value.toLocaleString() : '—'),
  },
  DataGridColumns.date({
    key: 'created_at',
    label: 'Created',
    format: 'short',
    sortable: true,
  }),
];

/**
 * Column definitions for the Recordings data grid in Admin Controls
 */
export const recordingColumns: DataGridColumn[] = [
  DataGridColumns.image({
    key: 'cover_art',
    label: 'Cover',
    shape: 'square',
    entityType: 'recording',
    editable: false,
  }),
  DataGridColumns.text({
    key: 'name',
    label: 'Track Name',
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.relation({
    key: 'artist_id',
    label: 'Artist',
    sortable: true,
    getLabel: (row: any) => row.artist_name || '—',
    getHref: (row: any) => row.artist_id ? `/artists/${row.artist_id}` : '#',
  }),
  {
    key: 'platform',
    label: 'Platform',
    sortable: true,
    filterable: true,
    render: (value: any) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      const isSpotify = value === 'spotify';
      return (
        <span className={`px-2 py-0.5 text-xs font-medium uppercase ${isSpotify ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-[#FF5500]/20 text-[#FF5500]'}`}>
          {value}
        </span>
      );
    },
  },
  {
    key: 'recording_type',
    label: 'Type',
    sortable: true,
    filterable: true,
    editable: true,
    render: (value: any) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      const isTrack = value === 'track';
      return (
        <span className={`px-2 py-0.5 text-xs font-medium uppercase ${isTrack ? 'bg-fm-gold/20 text-fm-gold' : 'bg-fm-navy/20 text-fm-navy'}`}>
          {isTrack ? 'Track' : 'DJ Set'}
        </span>
      );
    },
  },
  {
    key: 'click_count',
    label: 'Clicks',
    sortable: true,
    render: (value: any) => (
      <span className='text-xs text-muted-foreground'>
        {value || 0}
      </span>
    ),
  },
  {
    key: 'url',
    label: 'Link',
    render: (value: any) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      return (
        <a
          href={value}
          target='_blank'
          rel='noopener noreferrer'
          className='text-fm-gold hover:underline text-xs'
        >
          Open →
        </a>
      );
    },
  },
  DataGridColumns.date({
    key: 'created_at',
    label: 'Added',
    format: 'short',
    sortable: true,
  }),
];

/**
 * Column definitions for the Genres data grid in Admin Controls
 */
export const genreColumns: DataGridColumn[] = [
  DataGridColumns.text({
    key: 'name',
    label: 'Name',
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.relation({
    key: 'parent_id',
    label: 'Parent Genre',
    sortable: true,
    getLabel: (row: any) => row.parent_name || '—',
  }),
  {
    key: 'children_count',
    label: 'Subgenres',
    sortable: true,
    render: (value: any) => (
      <span className='text-xs text-muted-foreground'>
        {value || 0}
      </span>
    ),
  },
  {
    key: 'artists_count',
    label: 'Artists',
    sortable: true,
    render: (value: any) => (
      <span className='text-xs text-muted-foreground'>
        {value || 0}
      </span>
    ),
  },
  DataGridColumns.date({
    key: 'created_at',
    label: 'Created',
    format: 'short',
    sortable: true,
  }),
];
