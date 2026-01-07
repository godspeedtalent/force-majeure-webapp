/**
 * FmSocialLinksInput
 *
 * A form component for entering social media handles and music platform links.
 * Reusable across artist creation, editing, and other forms.
 */

import { useTranslation } from 'react-i18next';
import { Globe, Mail } from 'lucide-react';
import {
  FaInstagram,
  FaXTwitter,
  FaFacebook,
  FaTiktok,
  FaYoutube,
  FaSoundcloud,
  FaSpotify,
} from 'react-icons/fa6';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { cn } from '@/shared';

// Social media URL builders
const socialUrlBuilders = {
  instagram: (username: string) => `https://instagram.com/${username}`,
  twitter: (username: string) => `https://x.com/${username}`,
  facebook: (username: string) => `https://facebook.com/${username}`,
  tiktok: (username: string) => `https://tiktok.com/@${username}`,
  youtube: (username: string) => `https://youtube.com/@${username}`,
};

// Music platform URL extractors - extract ID/username from full URLs
const extractSpotifyArtistId = (input: string): string => {
  const spotifyMatch = input.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) return spotifyMatch[1];
  return input.replace(/^https?:\/\//, '').replace(/^open\.spotify\.com\/artist\//, '');
};

const extractSoundcloudUsername = (input: string): string => {
  const soundcloudMatch = input.match(/soundcloud\.com\/([^/?]+)/);
  if (soundcloudMatch) return soundcloudMatch[1];
  return input.replace(/^https?:\/\//, '').replace(/^soundcloud\.com\//, '');
};

// Music platform input - shows base URL in prepend, extracts ID from full URLs
function MusicPlatformInput({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  iconColor,
  baseUrl,
  extractId,
  urlBuilder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  iconColor: string;
  baseUrl: string;
  extractId: (input: string) => string;
  urlBuilder: (id: string) => string;
}) {
  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span>{label}</span>
      </div>
      <FmCommonTextField
        value={value}
        onChange={(e) => {
          const extracted = extractId(e.target.value);
          onChange(extracted);
        }}
        placeholder={placeholder}
        prepend={baseUrl}
      />
      {value && (
        <a
          href={urlBuilder(value)}
          target='_blank'
          rel='noopener noreferrer'
          className='text-xs text-muted-foreground hover:text-fm-gold transition-colors truncate block'
        >
          {urlBuilder(value)}
        </a>
      )}
    </div>
  );
}

// Social media input with icon - username only, shows constructed URL
function SocialInput({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  iconColor,
  urlBuilder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  iconColor: string;
  urlBuilder: (username: string) => string;
}) {
  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span>{label}</span>
      </div>
      <FmCommonTextField
        value={value}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/^@/, '');
          onChange(cleaned);
        }}
        placeholder={placeholder}
        prepend='@'
      />
      {value && (
        <a
          href={urlBuilder(value)}
          target='_blank'
          rel='noopener noreferrer'
          className='text-xs text-muted-foreground hover:text-fm-gold transition-colors truncate block'
        >
          {urlBuilder(value)}
        </a>
      )}
    </div>
  );
}

export interface SocialLinksData {
  spotify?: string;
  soundcloud?: string;
  email?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
}

interface FmSocialLinksInputProps {
  /** Current social links values */
  value: SocialLinksData;
  /** Callback when any value changes */
  onChange: (data: SocialLinksData) => void;
  /** Show music platforms section (Spotify, SoundCloud) */
  showMusicPlatforms?: boolean;
  /** Show social media section */
  showSocialMedia?: boolean;
  /** Show Twitter/X field */
  showTwitter?: boolean;
  /** Show Facebook field */
  showFacebook?: boolean;
  /** Show YouTube field */
  showYoutube?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FmSocialLinksInput
 *
 * A comprehensive social media and music platform input component.
 * Supports Spotify, SoundCloud, Website, Instagram, TikTok, Twitter/X, Facebook, and YouTube.
 * Twitter, Facebook, and YouTube are hidden by default (not in artists table schema).
 */
export function FmSocialLinksInput({
  value,
  onChange,
  showMusicPlatforms = true,
  showSocialMedia = true,
  showTwitter = false,
  showFacebook = false,
  showYoutube = false,
  className,
}: FmSocialLinksInputProps) {
  const { t } = useTranslation('common');

  const updateField = (field: keyof SocialLinksData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Music Platforms */}
      {showMusicPlatforms && (
        <div className='space-y-4'>
          <p className='text-xs uppercase text-muted-foreground tracking-wider'>
            {t('sections.musicPlatforms')}
          </p>
          <MusicPlatformInput
            icon={FaSpotify}
            label={t('labels.spotify')}
            value={value.spotify || ''}
            onChange={(v) => updateField('spotify', v)}
            placeholder={t('placeholders.spotifyArtistId')}
            iconColor='text-[#1DB954]'
            baseUrl='open.spotify.com/artist/'
            extractId={extractSpotifyArtistId}
            urlBuilder={(id) => id ? `https://open.spotify.com/artist/${id}` : ''}
          />
          <MusicPlatformInput
            icon={FaSoundcloud}
            label={t('labels.soundcloud')}
            value={value.soundcloud || ''}
            onChange={(v) => updateField('soundcloud', v)}
            placeholder={t('placeholders.soundcloudUsername')}
            iconColor='text-[#FF5500]'
            baseUrl='soundcloud.com/'
            extractId={extractSoundcloudUsername}
            urlBuilder={(username) => username ? `https://soundcloud.com/${username}` : ''}
          />
        </div>
      )}

      {/* Social Media */}
      {showSocialMedia && (
        <div className='space-y-4'>
          <p className='text-xs uppercase text-muted-foreground tracking-wider'>
            {t('sections.socialMedia')}
          </p>

          {/* Email - direct email input */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Mail className='h-4 w-4 text-fm-gold' />
              <span>{t('labels.socialEmail', 'Contact Email')}</span>
            </div>
            <FmCommonTextField
              value={value.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder={t('placeholders.enterEmail')}
              type='email'
            />
            {value.email && (
              <a
                href={`mailto:${value.email}`}
                className='text-xs text-muted-foreground hover:text-fm-gold transition-colors truncate block'
              >
                {value.email}
              </a>
            )}
          </div>

          {/* Website - full URL input */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Globe className='h-4 w-4 text-fm-gold' />
              <span>{t('labels.website')}</span>
            </div>
            <FmCommonTextField
              value={value.website || ''}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder={t('forms.artists.websitePlaceholder')}
            />
            {value.website && (
              <a
                href={value.website.startsWith('http') ? value.website : `https://${value.website}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-xs text-muted-foreground hover:text-fm-gold transition-colors truncate block'
              >
                {value.website.startsWith('http') ? value.website : `https://${value.website}`}
              </a>
            )}
          </div>

          <SocialInput
            icon={FaInstagram}
            label={t('labels.instagram')}
            value={value.instagram || ''}
            onChange={(v) => updateField('instagram', v)}
            placeholder={t('placeholders.username')}
            iconColor='text-[#E4405F]'
            urlBuilder={socialUrlBuilders.instagram}
          />

          <SocialInput
            icon={FaTiktok}
            label={t('labels.tiktok')}
            value={value.tiktok || ''}
            onChange={(v) => updateField('tiktok', v)}
            placeholder={t('placeholders.username')}
            iconColor='text-white'
            urlBuilder={socialUrlBuilders.tiktok}
          />

          {showTwitter && (
            <SocialInput
              icon={FaXTwitter}
              label={t('labels.twitterX')}
              value={value.twitter || ''}
              onChange={(v) => updateField('twitter', v)}
              placeholder={t('placeholders.username')}
              iconColor='text-white'
              urlBuilder={socialUrlBuilders.twitter}
            />
          )}

          {showFacebook && (
            <SocialInput
              icon={FaFacebook}
              label={t('labels.facebook')}
              value={value.facebook || ''}
              onChange={(v) => updateField('facebook', v)}
              placeholder={t('placeholders.usernameOrPage')}
              iconColor='text-[#1877F2]'
              urlBuilder={socialUrlBuilders.facebook}
            />
          )}

          {showYoutube && (
            <SocialInput
              icon={FaYoutube}
              label={t('labels.youtube')}
              value={value.youtube || ''}
              onChange={(v) => updateField('youtube', v)}
              placeholder={t('placeholders.channelHandle')}
              iconColor='text-[#FF0000]'
              urlBuilder={socialUrlBuilders.youtube}
            />
          )}
        </div>
      )}
    </div>
  );
}
