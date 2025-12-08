import { z } from 'zod';
import type { FmCommonBadgeItem } from '@/components/common';

export const sampleBadges: FmCommonBadgeItem[] = [
  { label: 'Electronic', variant: 'primary' },
  { label: 'House', variant: 'secondary' },
  { label: 'Techno', variant: 'secondary' },
];

export const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  bio: z.string().optional(),
});

export const roleOptions = [
  { value: 'artist', label: 'Artist' },
  { value: 'promoter', label: 'Promoter' },
  { value: 'venue', label: 'Venue Owner' },
  { value: 'fan', label: 'Fan' },
];
