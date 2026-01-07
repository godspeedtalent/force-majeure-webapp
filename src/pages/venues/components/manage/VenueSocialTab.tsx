/**
 * VenueSocialTab
 *
 * Social media tab for venue management - website and social links.
 * Matches the style of ArtistSocialTab for consistency.
 */

import { useTranslation } from 'react-i18next';
import { Globe, Mail, Share2 } from 'lucide-react';
import {
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
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
          // Strip @ prefix if user includes it
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

interface VenueSocialTabProps {
  // Email & Website
  email: string;
  onEmailChange: (value: string) => void;
  website: string;
  onWebsiteChange: (value: string) => void;
  // Social media
  instagram: string;
  onInstagramChange: (value: string) => void;
  twitter: string;
  onTwitterChange: (value: string) => void;
  tiktok: string;
  onTiktokChange: (value: string) => void;
  facebook: string;
  onFacebookChange: (value: string) => void;
  youtube: string;
  onYoutubeChange: (value: string) => void;
  // Save (optional - parent handles via sticky footer)
  onSave?: () => void;
  isSaving?: boolean;
}

export function VenueSocialTab({
  email,
  onEmailChange,
  website,
  onWebsiteChange,
  instagram,
  onInstagramChange,
  twitter,
  onTwitterChange,
  tiktok,
  onTiktokChange,
  facebook,
  onFacebookChange,
  youtube,
  onYoutubeChange,
}: VenueSocialTabProps) {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-6'>
      {/* Social Media */}
      <FmFormSection
        title={t('sections.socialMedia', 'Social Media & Web')}
        description={t('venueManagement.socialMediaDescription', 'Add your venue\'s website and social media links so fans can find and follow you.')}
        icon={Share2}
      >
        {/* Email - contact email input */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Mail className='h-4 w-4 text-fm-gold' />
              <span>{t('labels.socialEmail', 'Contact Email')}</span>
            </div>
            <FmCommonTextField
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder={t('placeholders.enterEmail')}
              type='email'
            />
            {email && (
              <a
                href={`mailto:${email}`}
                className='text-xs text-muted-foreground hover:text-fm-gold transition-colors truncate block'
              >
                {email}
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
              value={website}
              onChange={(e) => onWebsiteChange(e.target.value)}
              placeholder={t('placeholders.websiteUrl', 'https://yourwebsite.com')}
            />
            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-xs text-muted-foreground hover:text-fm-gold transition-colors truncate block'
              >
                {website.startsWith('http') ? website : `https://${website}`}
              </a>
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
            icon={FaXTwitter}
            label={t('labels.twitterX')}
            value={twitter}
            onChange={onTwitterChange}
            placeholder={t('placeholders.username')}
            iconColor='text-white'
            urlBuilder={socialUrlBuilders.twitter}
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
