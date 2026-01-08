/**
 * ArtistSocialTab
 *
 * Social media tab for artist management - music platforms and social links.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Mail, Music, Share2 } from 'lucide-react';
import {
  FaInstagram,
  FaXTwitter,
  FaFacebook,
  FaTiktok,
  FaYoutube,
  FaSoundcloud,
  FaSpotify,
} from 'react-icons/fa6';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { cn, useIsMobile } from '@/shared';

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
  // If it's a full URL, extract just the artist ID
  const spotifyMatch = input.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) return spotifyMatch[1];
  // Otherwise return as-is (already just the ID)
  return input.replace(/^https?:\/\//, '').replace(/^open\.spotify\.com\/artist\//, '');
};

const extractSoundcloudUsername = (input: string): string => {
  // If it's a full URL, extract just the username
  const soundcloudMatch = input.match(/soundcloud\.com\/([^/?]+)/);
  if (soundcloudMatch) return soundcloudMatch[1];
  // Otherwise return as-is (already just the username)
  return input.replace(/^https?:\/\//, '').replace(/^soundcloud\.com\//, '');
};

// Expandable URL link - truncated by default, expands on tap
function ExpandableUrlLink({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      onClick={(e) => {
        // On first tap, expand instead of navigating
        if (!isExpanded) {
          e.preventDefault();
          setIsExpanded(true);
        }
      }}
      className={cn(
        'text-[10px] text-muted-foreground hover:text-fm-gold transition-colors block',
        !isExpanded && 'truncate',
        className
      )}
    >
      {url}
    </a>
  );
}

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
    <div className='space-y-0.5'>
      <div className='flex items-center gap-1.5 text-[10px] text-muted-foreground'>
        <Icon className={cn('h-3 w-3', iconColor)} />
        <span>{label}</span>
      </div>
      <FmCommonTextField
        value={value}
        onChange={(e) => {
          // Extract ID/username if full URL is pasted
          const extracted = extractId(e.target.value);
          onChange(extracted);
        }}
        placeholder={placeholder}
        prepend={baseUrl}
        className='h-10 text-sm'
      />
      {value && <ExpandableUrlLink url={urlBuilder(value)} />}
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
    <div className='space-y-0.5'>
      <div className='flex items-center gap-1.5 text-[10px] text-muted-foreground'>
        <Icon className={cn('h-3 w-3', iconColor)} />
        <span>{label}</span>
      </div>
      <FmCommonTextField
        value={value}
        onChange={(e) => {
          // Strip @ prefix if user includes it
          const cleaned = e.target.value.replace(/^@/, '');
          onChange(cleaned);
        }}
        placeholder={placeholder}
        prepend='@'
        className='h-10 text-sm'
      />
      {value && <ExpandableUrlLink url={urlBuilder(value)} />}
    </div>
  );
}

interface ArtistSocialTabProps {
  // Music platforms
  spotify: string;
  onSpotifyChange: (value: string) => void;
  soundcloud: string;
  onSoundcloudChange: (value: string) => void;
  // Email & Website & Social media
  email: string;
  onEmailChange: (value: string) => void;
  website: string;
  onWebsiteChange: (value: string) => void;
  instagram: string;
  onInstagramChange: (value: string) => void;
  tiktok: string;
  onTiktokChange: (value: string) => void;
  twitter: string;
  onTwitterChange: (value: string) => void;
  facebook: string;
  onFacebookChange: (value: string) => void;
  youtube: string;
  onYoutubeChange: (value: string) => void;
  // Save (optional - parent handles via sticky footer)
  onSave?: () => void;
  isSaving?: boolean;
}

export function ArtistSocialTab({
  spotify,
  onSpotifyChange,
  soundcloud,
  onSoundcloudChange,
  email,
  onEmailChange,
  website,
  onWebsiteChange,
  instagram,
  onInstagramChange,
  tiktok,
  onTiktokChange,
  twitter,
  onTwitterChange,
  facebook,
  onFacebookChange,
  youtube,
  onYoutubeChange,
}: ArtistSocialTabProps) {
  const { t } = useTranslation('common');
  const isMobile = useIsMobile();

  return (
    <div className={cn('space-y-4', isMobile && 'pb-[140px]')}>
      {/* Music Platforms */}
      <FmFormSection
        title={t('sections.musicPlatforms')}
        description={t('sections.musicPlatformsDescription')}
        icon={Music}
      >
        <MusicPlatformInput
          icon={FaSpotify}
          label={t('labels.spotify')}
          value={spotify}
          onChange={onSpotifyChange}
          placeholder={t('placeholders.spotifyArtistId')}
          iconColor='text-[#1DB954]'
          baseUrl='open.spotify.com/artist/'
          extractId={extractSpotifyArtistId}
          urlBuilder={(id) => id ? `https://open.spotify.com/artist/${id}` : ''}
        />

        <MusicPlatformInput
          icon={FaSoundcloud}
          label={t('labels.soundcloud')}
          value={soundcloud}
          onChange={onSoundcloudChange}
          placeholder={t('placeholders.soundcloudUsername')}
          iconColor='text-[#FF5500]'
          baseUrl='soundcloud.com/'
          extractId={extractSoundcloudUsername}
          urlBuilder={(username) => username ? `https://soundcloud.com/${username}` : ''}
        />
      </FmFormSection>

      {/* Social Media */}
      <FmFormSection
        title={t('sections.socialMedia')}
        description={t('sections.socialMediaDescription')}
        icon={Share2}
      >
          {/* Email - contact email input */}
          <div className='space-y-0.5'>
            <div className='flex items-center gap-1.5 text-[10px] text-muted-foreground'>
              <Mail className='h-3 w-3 text-fm-gold' />
              <span>{t('labels.socialEmail', 'Contact Email')}</span>
            </div>
            <FmCommonTextField
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder={t('placeholders.enterEmail')}
              type='email'
              className='h-10 text-sm'
            />
            {email && <ExpandableUrlLink url={`mailto:${email}`} />}
          </div>

          {/* Website - full URL input */}
          <div className='space-y-0.5'>
            <div className='flex items-center gap-1.5 text-[10px] text-muted-foreground'>
              <Globe className='h-3 w-3 text-fm-gold' />
              <span>{t('labels.website')}</span>
            </div>
            <FmCommonTextField
              value={website}
              onChange={(e) => onWebsiteChange(e.target.value)}
              placeholder={t('forms.artists.websitePlaceholder')}
              className='h-10 text-sm'
            />
            {website && (
              <ExpandableUrlLink
                url={website.startsWith('http') ? website : `https://${website}`}
              />
            )}
          </div>

          <SocialInput
            icon={FaInstagram}
            label={t('labels.instagram')}
            value={instagram}
            onChange={onInstagramChange}
            placeholder={t('placeholders.username')}
            iconColor='text-[#E4405F]'
            urlBuilder={socialUrlBuilders.instagram}
          />

          <SocialInput
            icon={FaTiktok}
            label={t('labels.tiktok')}
            value={tiktok}
            onChange={onTiktokChange}
            placeholder={t('placeholders.username')}
            iconColor='text-white'
            urlBuilder={socialUrlBuilders.tiktok}
          />

          <SocialInput
            icon={FaXTwitter}
            label={t('labels.twitterX')}
            value={twitter}
            onChange={onTwitterChange}
            placeholder={t('placeholders.username')}
            iconColor='text-white'
            urlBuilder={socialUrlBuilders.twitter}
          />

          <SocialInput
            icon={FaFacebook}
            label={t('labels.facebook')}
            value={facebook}
            onChange={onFacebookChange}
            placeholder={t('placeholders.usernameOrPage')}
            iconColor='text-[#1877F2]'
            urlBuilder={socialUrlBuilders.facebook}
          />

          <SocialInput
            icon={FaYoutube}
            label={t('labels.youtube')}
            value={youtube}
            onChange={onYoutubeChange}
            placeholder={t('placeholders.channelHandle')}
            iconColor='text-[#FF0000]'
            urlBuilder={socialUrlBuilders.youtube}
          />
      </FmFormSection>
    </div>
  );
}
