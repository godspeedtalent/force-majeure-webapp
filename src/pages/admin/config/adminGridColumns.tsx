import { DataGridColumn, DataGridColumns } from '@/features/data-grid';
import { BadgeListCell } from '@/features/data-grid/components/cells';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';
import i18n from '@/i18n';

/**
 * Helper to get translation
 */
const t = (key: string) => i18n.t(key, { ns: 'common' });

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
    toast.success(t('adminGrid.artistImageUpdated'));
  } catch (error) {
    logger.error('Failed to update artist image', { error, artistId: row.id });
    toast.error(t('adminGrid.artistImageUpdateFailed'));
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
    toast.success(t('adminGrid.userAvatarUpdated'));
  } catch (error) {
    logger.error('Failed to update user avatar', { error, userId: row.id });
    toast.error(t('adminGrid.userAvatarUpdateFailed'));
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
    toast.success(t('adminGrid.venueImageUpdated'));
  } catch (error) {
    logger.error('Failed to update venue image', {
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'adminGridColumns',
      details: { venueId: row.id }
    });
    toast.error(t('adminGrid.venueImageUpdateFailed'));
    throw error;
  }
}

/**
 * Column definitions for the Artists data grid in Admin Controls
 */
export const artistColumns: DataGridColumn[] = [
  DataGridColumns.text({
    key: 'name',
    label: t('adminGrid.columns.name'),
    sortable: true,
    filterable: true,
    editable: true,
  }),
  {
    key: 'genre_names',
    label: t('adminGrid.columns.genres'),
    render: (value: string[] | null) => {
      if (!value || value.length === 0) {
        return <span className='text-muted-foreground'>—</span>;
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {value.slice(0, 3).map((genreName, i) => (
            <span
              key={i}
              className='px-2 py-0.5 text-[10px] uppercase bg-fm-gold/10 text-fm-gold border border-fm-gold/30'
            >
              {genreName}
            </span>
          ))}
          {value.length > 3 && (
            <span className='text-xs text-muted-foreground'>+{value.length - 3}</span>
          )}
        </div>
      );
    },
  },
  DataGridColumns.image({
    key: 'image_url',
    label: t('adminGrid.columns.image'),
    shape: 'circle',
    entityType: 'artist',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'artists',
    onImageUpdate: (row, newImageUrl) => updateArtistImage(row, newImageUrl),
  }),
  {
    ...DataGridColumns.relation({
      key: 'city_id',
      label: t('adminGrid.columns.city'),
      sortable: true,
      getLabel: (row: any) => row.city || '—',
    }),
    editable: true,
  },
  {
    key: 'bio',
    label: t('adminGrid.columns.bio'),
    filterable: true,
    editable: true,
    multiline: true,
    rows: 4,
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
  // Social links
  {
    key: 'instagram_handle',
    label: 'Instagram',
    sortable: true,
    filterable: true,
    editable: true,
    render: (value: string | null) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      return (
        <a
          href={`https://instagram.com/${value.replace('@', '')}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-fm-gold hover:underline text-xs'
          onClick={e => e.stopPropagation()}
        >
          @{value.replace('@', '')}
        </a>
      );
    },
  },
  {
    key: 'tiktok_handle',
    label: 'TikTok',
    sortable: true,
    filterable: true,
    editable: true,
    render: (value: string | null) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      return (
        <a
          href={`https://tiktok.com/@${value.replace('@', '')}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-fm-gold hover:underline text-xs'
          onClick={e => e.stopPropagation()}
        >
          @{value.replace('@', '')}
        </a>
      );
    },
  },
  {
    key: 'soundcloud_id',
    label: 'SoundCloud',
    sortable: true,
    filterable: true,
    editable: true,
    render: (value: string | null) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      return (
        <a
          href={`https://soundcloud.com/${value}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-fm-gold hover:underline text-xs'
          onClick={e => e.stopPropagation()}
        >
          {value}
        </a>
      );
    },
  },
  {
    key: 'spotify_id',
    label: 'Spotify',
    sortable: true,
    filterable: true,
    editable: true,
    render: (value: string | null) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      return (
        <a
          href={`https://open.spotify.com/artist/${value}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-fm-gold hover:underline text-xs'
          onClick={e => e.stopPropagation()}
        >
          {value.slice(0, 12)}...
        </a>
      );
    },
  },
  {
    key: 'website',
    label: 'Website',
    sortable: true,
    filterable: true,
    editable: true,
    render: (value: string | null) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      return (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-fm-gold hover:underline text-xs'
          onClick={e => e.stopPropagation()}
        >
          {value.replace(/^https?:\/\//, '').slice(0, 20)}
        </a>
      );
    },
  },
  DataGridColumns.date({
    key: 'created_at',
    label: t('adminGrid.columns.created'),
    sortable: true,
  }),
  DataGridColumns.date({
    key: 'updated_at',
    label: 'Updated',
    sortable: true,
  }),
];

/**
 * Column definitions for the Users data grid in Admin Controls
 */
export const userColumns: DataGridColumn[] = [
  DataGridColumns.text({
    key: 'display_name',
    label: t('adminGrid.columns.username'),
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.text({
    key: 'full_name',
    label: t('adminGrid.columns.fullName'),
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.text({
    key: 'email',
    label: t('adminGrid.columns.email'),
    sortable: true,
    filterable: true,
    editable: true,
  }),
  {
    key: 'is_verified',
    label: t('adminGrid.columns.verified'),
    sortable: true,
    filterable: true,
    readonly: true,
    render: (value: boolean) => {
      if (value) {
        return (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded'>
            ✓ {t('adminGrid.columns.verifiedLabel')}
          </span>
        );
      }
      return (
        <span className='inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border rounded'>
          {t('adminGrid.columns.unverifiedLabel')}
        </span>
      );
    },
  },
  DataGridColumns.image({
    key: 'avatar_url',
    label: t('adminGrid.columns.avatar'),
    shape: 'circle',
    entityType: 'user',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'users',
    onImageUpdate: (row, newImageUrl) => updateUserAvatar(row, newImageUrl),
  }),
  DataGridColumns.relation({
    key: 'organization_id',
    label: t('adminGrid.columns.organization'),
    sortable: true,
    getLabel: (row: any) => row.organization_name || '—',
    getHref: (row: any) => row.organization_id ? `/organization/${row.organization_id}` : '#',
  }),
  {
    key: 'roles',
    label: t('adminGrid.columns.roles'),
    filterable: false,
    readonly: true,
    render: (value: any) => {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return <BadgeListCell items={[]} emptyText={t('adminGrid.columns.noRoles')} />;
      }

      const roleLabels = value.map((role: any) =>
        role.display_name || role.role_name
      );

      return <BadgeListCell items={roleLabels} variant='gold' />;
    },
  },
  DataGridColumns.date({
    key: 'created_at',
    label: t('adminGrid.columns.joined'),
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
    label: t('adminGrid.columns.name'),
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.image({
    key: 'image_url',
    label: t('adminGrid.columns.image'),
    shape: 'square',
    entityType: 'venue',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'venues',
    onImageUpdate: (row, newImageUrl) => updateVenueImage(row, newImageUrl),
  }),
  DataGridColumns.relation({
    key: 'city_id',
    label: t('adminGrid.columns.city'),
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
    label: t('adminGrid.columns.address'),
    sortable: true,
  }),
  {
    key: 'capacity',
    label: t('adminGrid.columns.capacity'),
    sortable: true,
    editable: true,
    render: (value: any) => (value ? value.toLocaleString() : '—'),
  },
  DataGridColumns.date({
    key: 'created_at',
    label: t('adminGrid.columns.created'),
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
    label: t('adminGrid.columns.cover'),
    shape: 'square',
    entityType: 'recording',
    editable: false,
  }),
  DataGridColumns.text({
    key: 'name',
    label: t('adminGrid.columns.trackName'),
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.relation({
    key: 'artist_id',
    label: t('adminGrid.columns.artist'),
    sortable: true,
    getLabel: (row: any) => row.artist_name || '—',
    getHref: (row: any) => row.artist_id ? `/artists/${row.artist_id}` : '#',
  }),
  {
    key: 'platform',
    label: t('adminGrid.columns.platform'),
    sortable: true,
    filterable: true,
    editable: true,
    type: 'select',
    options: [
      { value: 'spotify', label: 'Spotify' },
      { value: 'soundcloud', label: 'SoundCloud' },
    ],
    render: (value: any) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      const isSpotify = value === 'spotify';
      return (
        <span className={`px-2 py-0.5 text-xs font-medium uppercase ${isSpotify ? 'bg-[#5aad7a]/20 text-[#5aad7a]' : 'bg-[#d48968]/20 text-[#d48968]'}`}>
          {value}
        </span>
      );
    },
  },
  {
    key: 'is_primary_dj_set',
    label: t('adminGrid.columns.type'),
    sortable: true,
    filterable: true,
    editable: true,
    type: 'select',
    options: [
      { value: 'false', label: 'Track' },
      { value: 'true', label: 'DJ Set' },
    ],
    render: (value: any) => {
      const isTrack = value === false;
      return (
        <span className={`px-2 py-0.5 text-xs font-medium uppercase ${isTrack ? 'bg-fm-gold/20 text-fm-gold' : 'bg-fm-navy/20 text-fm-navy'}`}>
          {isTrack ? t('adminGrid.columns.track') : t('adminGrid.columns.djSet')}
        </span>
      );
    },
  },
  {
    key: 'click_count',
    label: t('adminGrid.columns.clicks'),
    sortable: true,
    render: (value: any) => (
      <span className='text-xs text-muted-foreground'>
        {value || 0}
      </span>
    ),
  },
  {
    key: 'url',
    label: t('adminGrid.columns.link'),
    render: (value: any) => {
      if (!value) return <span className='text-muted-foreground'>—</span>;
      return (
        <a
          href={value}
          target='_blank'
          rel='noopener noreferrer'
          className='text-fm-gold hover:underline text-xs'
        >
          {t('adminGrid.columns.openLink')}
        </a>
      );
    },
  },
  DataGridColumns.date({
    key: 'created_at',
    label: t('adminGrid.columns.added'),
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
    label: t('adminGrid.columns.name'),
    sortable: true,
    filterable: true,
    editable: true,
  }),
  DataGridColumns.relation({
    key: 'parent_id',
    label: t('adminGrid.columns.parentGenre'),
    sortable: true,
    getLabel: (row: any) => row.parent_name || '—',
  }),
  {
    key: 'children_count',
    label: t('adminGrid.columns.subgenres'),
    sortable: true,
    render: (value: any) => (
      <span className='text-xs text-muted-foreground'>
        {value || 0}
      </span>
    ),
  },
  {
    key: 'artists_count',
    label: t('adminGrid.columns.artists'),
    sortable: true,
    render: (value: any) => (
      <span className='text-xs text-muted-foreground'>
        {value || 0}
      </span>
    ),
  },
  DataGridColumns.date({
    key: 'created_at',
    label: t('adminGrid.columns.created'),
    format: 'short',
    sortable: true,
  }),
];
