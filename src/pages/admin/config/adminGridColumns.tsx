import { DataGridColumn, DataGridColumns } from '@/features/data-grid';
import { BadgeListCell } from '@/features/data-grid/components/cells';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/shared/services/logger';
import {
  User,
  Music,
  Mail,
  Image as ImageIcon,
  FileText,
  MapPin,
  Home,
  Users as UsersIcon,
  Calendar,
  Shield,
} from 'lucide-react';

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
 * TODO: Uncomment when venues table is added to database schema
 */
async function updateVenueImage(row: any, newImageUrl: string) {
  // Venues table not yet in schema - this is a placeholder
  logger.warn('Venue image update not implemented - venues table missing', {
    venueId: row.id,
  });
  toast.error('Venue image updates not yet supported');
  throw new Error('Venues table not in database schema');
}

/**
 * Column definitions for the Artists data grid in Admin Controls
 */
export const artistColumns: DataGridColumn[] = [
  {
    ...DataGridColumns.text({
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      editable: true,
    }),
    icon: <Music className='h-4 w-4' />,
  },
  {
    ...DataGridColumns.text({
      key: 'genre',
      label: 'Genre',
      sortable: true,
      filterable: true,
      editable: true,
    }),
    icon: <Music className='h-4 w-4' />,
  },
  DataGridColumns.image({
    key: 'image_url',
    label: 'Image',
    shape: 'circle',
    entityType: 'artist',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'artists',
    onImageUpdate: (row, newImageUrl) => updateArtistImage(row, newImageUrl),
    icon: <ImageIcon className='h-4 w-4' />,
  }),
  {
    key: 'bio',
    label: 'Bio',
    icon: <FileText className='h-4 w-4' />,
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
  {
    ...DataGridColumns.text({
      key: 'display_name',
      label: 'Display Name',
      sortable: true,
      filterable: true,
      editable: true,
    }),
    icon: <User className='h-4 w-4' />,
  },
  {
    ...DataGridColumns.text({
      key: 'full_name',
      label: 'Full Name',
      sortable: true,
      filterable: true,
      editable: true,
    }),
    icon: <User className='h-4 w-4' />,
  },
  {
    ...DataGridColumns.text({
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
      editable: true,
    }),
    icon: <Mail className='h-4 w-4' />,
  },
  DataGridColumns.image({
    key: 'avatar_url',
    label: 'Avatar',
    shape: 'circle',
    entityType: 'user',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'users',
    onImageUpdate: (row, newImageUrl) => updateUserAvatar(row, newImageUrl),
    icon: <ImageIcon className='h-4 w-4' />,
  }),
  {
    key: 'roles',
    label: 'Roles',
    icon: <Shield className='h-4 w-4' />,
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
  {
    ...DataGridColumns.date({
      key: 'created_at',
      label: 'Joined',
      format: 'short',
      sortable: true,
    }),
    icon: <Calendar className='h-4 w-4' />,
  },
];

/**
 * Column definitions for the Venues data grid in Admin Controls
 */
export const venueColumns: DataGridColumn[] = [
  {
    ...DataGridColumns.text({
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      editable: true,
    }),
    icon: <MapPin className='h-4 w-4' />,
  },
  DataGridColumns.image({
    key: 'image_url',
    label: 'Image',
    shape: 'square',
    entityType: 'venue',
    editable: true,
    bucket: 'entity-images',
    storagePath: 'venues',
    onImageUpdate: (row, newImageUrl) => updateVenueImage(row, newImageUrl),
    icon: <ImageIcon className='h-4 w-4' />,
  }),
  {
    ...DataGridColumns.relation({
      key: 'city_id',
      label: 'City',
      sortable: true,
      getLabel: (row: any) => row.city || '—',
    }),
    icon: <MapPin className='h-4 w-4' />,
  },
  {
    ...DataGridColumns.text({
      key: 'address',
      label: 'Address',
      sortable: true,
      filterable: true,
      editable: true,
    }),
    icon: <Home className='h-4 w-4' />,
  },
  {
    key: 'capacity',
    label: 'Capacity',
    icon: <UsersIcon className='h-4 w-4' />,
    sortable: true,
    editable: true,
    render: (value: any) => (value ? value.toLocaleString() : '—'),
  },
  {
    ...DataGridColumns.date({
      key: 'created_at',
      label: 'Created',
      format: 'short',
      sortable: true,
    }),
    icon: <Calendar className='h-4 w-4' />,
  },
];
