import { cn } from '@/shared';
import { Instagram as InstagramIcon } from 'lucide-react';
import { SiSoundcloud, SiSpotify, SiTiktok } from 'react-icons/si';

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
  instagram: {
    name: 'Instagram',
    icon: InstagramIcon,
    getUrl: (handle: string) =>
      `https://instagram.com/${handle.replace('@', '')}`,
    hoverColor: 'hover:text-fm-gold',
    borderColor: 'hover:border-fm-gold/50',
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
};

export type SocialSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<SocialSize, { icon: string; padding: string }> = {
  sm: { icon: 'h-4 w-4', padding: 'p-[8px]' },
  md: { icon: 'h-5 w-5', padding: 'p-[10px]' },
  lg: { icon: 'h-6 w-6', padding: 'p-[12px]' },
};

export interface FmSocialLinksProps {
  /** Instagram handle (with or without @) */
  instagram?: string | null;
  /** SoundCloud profile URL */
  soundcloud?: string | null;
  /** Spotify artist URL */
  spotify?: string | null;
  /** TikTok handle (with or without @) */
  tiktok?: string | null;
  /** Icon and padding size */
  size?: SocialSize;
  /** Gap between links */
  gap?: 'sm' | 'md' | 'lg';
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
 * - Supports Instagram, SoundCloud, Spotify, and TikTok
 * - Brand-specific hover colors
 * - Accessible with proper aria-labels
 * - Opens links in new tabs safely
 *
 * @example
 * ```tsx
 * <FmSocialLinks
 *   instagram="@djname"
 *   soundcloud="https://soundcloud.com/djname"
 *   spotify="https://open.spotify.com/artist/..."
 *   size="md"
 * />
 * ```
 */
export function FmSocialLinks({
  instagram,
  soundcloud,
  spotify,
  tiktok,
  size = 'md',
  gap = 'md',
  className,
}: FmSocialLinksProps) {
  const sizeClasses = SIZE_CLASSES[size];

  // Collect active platforms
  const activePlatforms: Array<{ key: string; value: string }> = [];
  if (instagram) activePlatforms.push({ key: 'instagram', value: instagram });
  if (soundcloud) activePlatforms.push({ key: 'soundcloud', value: soundcloud });
  if (spotify) activePlatforms.push({ key: 'spotify', value: spotify });
  if (tiktok) activePlatforms.push({ key: 'tiktok', value: tiktok });

  // Return null if no platforms active
  if (activePlatforms.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center', GAP_CLASSES[gap], className)}>
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
