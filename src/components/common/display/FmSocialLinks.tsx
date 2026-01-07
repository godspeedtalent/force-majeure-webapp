import { cn } from '@/shared';
import { Globe, Instagram as InstagramIcon, Mail } from 'lucide-react';
import {
  SiFacebook,
  SiSoundcloud,
  SiSpotify,
  SiTiktok,
  SiX,
  SiYoutube,
} from 'react-icons/si';

/**
 * Social media platform configuration
 */
interface SocialPlatform {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  getUrl: (handle: string) => string;
  hoverColor: string;
  borderColor: string;
}

const PLATFORMS: Record<string, SocialPlatform> = {
  email: {
    name: 'Email',
    icon: Mail,
    getUrl: (email: string) => `mailto:${email}`,
    hoverColor: 'hover:text-fm-gold',
    borderColor: 'hover:border-fm-gold/50',
  },
  website: {
    name: 'Website',
    icon: Globe,
    getUrl: (url: string) =>
      url.startsWith('http') ? url : `https://${url}`,
    hoverColor: 'hover:text-fm-gold',
    borderColor: 'hover:border-fm-gold/50',
  },
  instagram: {
    name: 'Instagram',
    icon: InstagramIcon,
    getUrl: (handle: string) =>
      `https://instagram.com/${handle.replace('@', '')}`,
    hoverColor: 'hover:text-fm-gold',
    borderColor: 'hover:border-fm-gold/50',
  },
  youtube: {
    name: 'YouTube',
    icon: SiYoutube,
    getUrl: (handle: string) =>
      handle.startsWith('http')
        ? handle
        : `https://youtube.com/@${handle.replace('@', '')}`,
    hoverColor: 'hover:text-[#FF0000]',
    borderColor: 'hover:border-[#FF0000]/50',
  },
  facebook: {
    name: 'Facebook',
    icon: SiFacebook,
    getUrl: (handle: string) =>
      handle.startsWith('http')
        ? handle
        : `https://facebook.com/${handle}`,
    hoverColor: 'hover:text-[#1877F2]',
    borderColor: 'hover:border-[#1877F2]/50',
  },
  soundcloud: {
    name: 'SoundCloud',
    icon: SiSoundcloud,
    getUrl: (url: string) => url,
    hoverColor: 'hover:text-[#d48968]',
    borderColor: 'hover:border-[#d48968]/50',
  },
  spotify: {
    name: 'Spotify',
    icon: SiSpotify,
    getUrl: (url: string) => url,
    hoverColor: 'hover:text-[#5aad7a]',
    borderColor: 'hover:border-[#5aad7a]/50',
  },
  tiktok: {
    name: 'TikTok',
    icon: SiTiktok,
    getUrl: (handle: string) =>
      `https://tiktok.com/@${handle.replace('@', '')}`,
    hoverColor: 'hover:text-white',
    borderColor: 'hover:border-white/50',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: SiX,
    getUrl: (handle: string) =>
      `https://x.com/${handle.replace('@', '')}`,
    hoverColor: 'hover:text-white',
    borderColor: 'hover:border-white/50',
  },
};

export type SocialSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SocialSize, { icon: string; padding: string }> = {
  sm: { icon: 'h-4 w-4', padding: 'p-[8px]' },
  md: { icon: 'h-5 w-5', padding: 'p-[10px]' },
  lg: { icon: 'h-6 w-6', padding: 'p-[12px]' },
};

export interface FmSocialLinksProps {
  /** Email address for contact */
  email?: string | null;
  /** Website URL */
  website?: string | null;
  /** Instagram handle (with or without @) */
  instagram?: string | null;
  /** YouTube channel handle or URL */
  youtube?: string | null;
  /** Facebook page name or URL */
  facebook?: string | null;
  /** SoundCloud profile URL */
  soundcloud?: string | null;
  /** Spotify artist URL */
  spotify?: string | null;
  /** TikTok handle (with or without @) */
  tiktok?: string | null;
  /** Twitter/X handle (with or without @) */
  twitter?: string | null;
  /** Icon and padding size */
  size?: SocialSize;
  /** Gap between links */
  gap?: 'sm' | 'md' | 'lg';
  /** Allow icons to wrap to next line when container is too narrow (default: true) */
  wrap?: boolean;
  /** Additional className for container */
  className?: string;
}

const GAP_CLASSES = {
  sm: 'gap-[10px]',
  md: 'gap-[15px]',
  lg: 'gap-[20px]',
};

/**
 * FmSocialLinks - Displays social media icon links for artists/profiles
 *
 * Features:
 * - Supports Website, Instagram, YouTube, Facebook, SoundCloud, Spotify, and TikTok
 * - Brand-specific hover colors
 * - Accessible with proper aria-labels
 * - Opens links in new tabs safely
 *
 * @example
 * ```tsx
 * <FmSocialLinks
 *   website="https://example.com"
 *   instagram="@djname"
 *   youtube="@djname"
 *   facebook="djnamepage"
 *   soundcloud="https://soundcloud.com/djname"
 *   spotify="https://open.spotify.com/artist/..."
 *   size="md"
 * />
 * ```
 */
export function FmSocialLinks({
  email,
  website,
  instagram,
  youtube,
  facebook,
  soundcloud,
  spotify,
  tiktok,
  twitter,
  size = 'md',
  gap = 'md',
  wrap = true,
  className,
}: FmSocialLinksProps) {
  const sizeClasses = SIZE_CLASSES[size];

  // Collect active platforms (order matches visual display preference)
  const activePlatforms: Array<{ key: string; value: string }> = [];
  if (email) activePlatforms.push({ key: 'email', value: email });
  if (website) activePlatforms.push({ key: 'website', value: website });
  if (instagram) activePlatforms.push({ key: 'instagram', value: instagram });
  if (twitter) activePlatforms.push({ key: 'twitter', value: twitter });
  if (youtube) activePlatforms.push({ key: 'youtube', value: youtube });
  if (facebook) activePlatforms.push({ key: 'facebook', value: facebook });
  if (soundcloud) activePlatforms.push({ key: 'soundcloud', value: soundcloud });
  if (spotify) activePlatforms.push({ key: 'spotify', value: spotify });
  if (tiktok) activePlatforms.push({ key: 'tiktok', value: tiktok });

  // Return null if no platforms active
  if (activePlatforms.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center', wrap && 'flex-wrap', GAP_CLASSES[gap], className)}>
      {activePlatforms.map(({ key, value }) => {
        const platform = PLATFORMS[key];
        const Icon = platform.icon;
        const url = platform.getUrl(value);

        return (
          <a
            key={key}
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(
              sizeClasses.padding,
              'rounded-none border border-white/20 bg-white/5',
              'hover:bg-white/10 transition-all duration-300',
              platform.borderColor
            )}
            aria-label={platform.name}
          >
            <Icon
              className={cn(
                sizeClasses.icon,
                'text-white/70',
                platform.hoverColor
              )}
            />
          </a>
        );
      })}
    </div>
  );
}
