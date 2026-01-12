import { User } from '@supabase/supabase-js';

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  cover_image_url: string | null;
  ticket_count: number;
}

export interface UserProfile {
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface ProfileLayoutProps {
  user: User;
  profile: UserProfile | null;
  upcomingShows: UpcomingEvent[];
  pastShows: UpcomingEvent[];
  loadingShows: boolean;
  showPastShows: boolean;
  onShowPastShowsChange: (value: boolean) => void;
  hasLinkedArtist: boolean;
  linkedArtistName?: string | null;
  linkedArtistDate?: string | null;
  loadingArtist: boolean;
  createdAt: string;
  /** Whether the current authenticated user is viewing their own profile */
  isOwnProfile: boolean;
}
