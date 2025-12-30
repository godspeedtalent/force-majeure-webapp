/**
 * ArtistProfile Component
 *
 * A reusable component for displaying artist profiles.
 * Used in both the artist profile page (/artists/{artist-id}) and the registration preview.
 */

import { useTranslation } from 'react-i18next';
import { Music2, ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/shared';
import { FmI18nCommon } from '@/components/common/i18n';

interface ArtistProfileProps {
  artist: {
    name: string;
    bio: string | null;
    imageUrl: string | null;
    website?: string | null;
    primaryGenre?: string | null;
    genres?: string[];
  };
  /** Compact mode for preview */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show placeholder state */
  isPreview?: boolean;
}

/**
 * Artist profile display component
 *
 * @example
 * ```tsx
 * <ArtistProfile
 *   artist={{
 *     name: "DJ Example",
 *     bio: "Electronic music producer...",
 *     imageUrl: "/path/to/image.jpg",
 *     primaryGenre: "Techno",
 *     socialLinks: { instagram: "djexample", soundcloud: "djexample" }
 *   }}
 * />
 * ```
 */
export const ArtistProfile = ({
  artist,
  compact = false,
  className,
  isPreview = false,
}: ArtistProfileProps) => {
  const { t } = useTranslation('common');
  const hasImage = artist.imageUrl && artist.imageUrl.trim() !== '';
  const hasBio = artist.bio && artist.bio.trim() !== '';
  const hasGenre = artist.primaryGenre && artist.primaryGenre.trim() !== '';

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col',
        compact ? 'gap-[20px]' : 'gap-[40px]',
        className
      )}
    >
      {/* Artist Header */}
      <div className='space-y-[10px]'>
        <h1
          className={cn(
            'font-canela tracking-tight',
            compact ? 'text-4xl' : 'text-6xl md:text-7xl'
          )}
        >
          {artist.name || (isPreview ? t('artistProfile.yourArtistName') : t('artistProfile.artistName'))}
        </h1>
        {hasGenre && (
          <div className='flex items-center gap-[10px]'>
            <Music2 className='h-4 w-4 text-fm-gold' />
            <p className='font-canela text-sm text-fm-gold uppercase tracking-wider'>
              {artist.primaryGenre}
            </p>
          </div>
        )}
      </div>

      {/* Artist Image */}
      {hasImage ? (
        <div
          className={cn(
            'relative w-full bg-black/60 backdrop-blur-sm border border-white/20 rounded-none overflow-hidden',
            compact ? 'h-[300px]' : 'h-[400px] md:h-[500px]'
          )}
        >
          <img
            src={artist.imageUrl || ''}
            alt={artist.name}
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />
        </div>
      ) : (
        <div
          className={cn(
            'relative w-full bg-black/60 backdrop-blur-sm border border-white/20 rounded-none flex items-center justify-center',
            compact ? 'h-[300px]' : 'h-[400px] md:h-[500px]'
          )}
        >
          <div className='text-center space-y-[10px]'>
            <Music2 className='h-16 w-16 text-fm-gold/30 mx-auto' />
            <p className='font-canela text-muted-foreground text-sm uppercase tracking-wider'>
              {isPreview ? t('artistProfile.uploadYourPhoto') : t('artistProfile.artistPhoto')}
            </p>
          </div>
        </div>
      )}

      {/* Bio */}
      <div className='space-y-[10px]'>
        <FmI18nCommon i18nKey='artistProfile.about' as='h2' className='font-canela text-2xl' />
        <div className='bg-black/60 backdrop-blur-sm border border-white/20 rounded-none p-[20px]'>
          <p
            className={cn(
              'font-canela leading-relaxed whitespace-pre-wrap',
              compact ? 'text-sm' : 'text-base',
              hasBio ? 'text-foreground' : 'text-muted-foreground italic'
            )}
          >
            {hasBio
              ? artist.bio
              : isPreview
              ? t('artistProfile.bioPreviewPlaceholder')
              : t('artistProfile.noBioAvailable')}
          </p>
        </div>
      </div>

      {/* Genre Tags */}
      {artist.genres && artist.genres.length > 0 && (
        <div className='space-y-[10px]'>
          <FmI18nCommon i18nKey='artistProfile.genres' as='h3' className='font-canela text-xl' />
          <div className='flex flex-wrap gap-[10px]'>
            {artist.genres.map((genre, index) => (
              <div
                key={index}
                className='px-[15px] py-[8px] bg-black/60 backdrop-blur-sm border border-white/20 rounded-none'
              >
                <span className='font-canela text-sm text-muted-foreground uppercase tracking-wider'>
                  {genre}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Website Link */}
      {artist.website && (
        <div className='space-y-[10px]'>
          <FmI18nCommon i18nKey='artistProfile.connect' as='h3' className='font-canela text-xl' />
          <div className='flex flex-wrap gap-[10px]'>
            <a
            href={artist.website ?? undefined}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-[10px] px-[15px] py-[10px] bg-black/60 backdrop-blur-sm border border-white/20 rounded-none hover:border-fm-gold hover:bg-fm-gold/10 transition-all duration-300'
            >
              <Globe className='h-4 w-4' />
              <span className='font-canela text-sm'>{t('artistProfile.website')}</span>
              <ExternalLink className='h-3 w-3 text-muted-foreground' />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
