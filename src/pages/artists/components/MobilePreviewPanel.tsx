import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared';
import { ArtistPreviewCard } from './ArtistPreviewCard';
import type { ArtistRegistrationFormData } from '../types/registration';

interface BadgeItem {
  label: string;
  className?: string;
}

interface MobilePreviewPanelProps {
  formData: ArtistRegistrationFormData;
  genreBadges: BadgeItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onInputChange?: (field: keyof ArtistRegistrationFormData, value: string | null) => void;
}

export function MobilePreviewPanel({
  formData,
  genreBadges,
  isExpanded,
  onToggle,
  onInputChange,
}: MobilePreviewPanelProps) {
  const { t } = useTranslation('common');

  return (
    <>
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div
          className='fixed inset-0 bg-black/50 z-40'
          onClick={onToggle}
          aria-hidden='true'
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed left-0 right-0 z-50',
          'bg-black/80 backdrop-blur-lg',
          'border-t border-white/20',
          'transition-all duration-300 ease-out',
          isExpanded
            ? 'bottom-0 h-[70vh]'
            : 'bottom-0 h-[60px]'
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Toggle Bar */}
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-between px-[20px] h-[60px]',
            'hover:bg-white/5 transition-colors duration-200',
            'border-b border-white/10'
          )}
        >
          <div className='flex items-center gap-[10px]'>
            {/* Thumbnail */}
            <div className='w-[40px] h-[40px] flex-shrink-0 overflow-hidden rounded-none border border-white/20'>
              {formData.profileImageUrl ? (
                <img
                  src={formData.profileImageUrl}
                  alt={formData.stageName || 'Preview'}
                  className='w-full h-full object-cover'
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className='w-full h-full bg-gradient-to-br from-fm-gold/15 via-fm-gold/5 to-transparent' />
              )}
            </div>

            {/* Name */}
            <div className='flex flex-col items-start'>
              <span className='font-canela text-sm text-white truncate max-w-[150px]'>
                {formData.stageName || t('artistPreview.yourName')}
              </span>
              <span className='font-canela text-xs text-muted-foreground'>
                {isExpanded ? t('mobilePreview.closePreview') : t('mobilePreview.tapToPreview')}
              </span>
            </div>
          </div>

          {/* Chevron */}
          <div className='flex items-center gap-[5px] text-fm-gold'>
            <span className='font-canela text-xs uppercase tracking-wider'>
              {t('mobilePreview.preview')}
            </span>
            {isExpanded ? (
              <ChevronDown className='h-5 w-5' />
            ) : (
              <ChevronUp className='h-5 w-5' />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className='flex-1 overflow-y-auto p-[20px] h-[calc(70vh-60px)]'>
            <div className='max-w-lg mx-auto'>
              <p className='font-canela text-xs text-muted-foreground text-center mb-[20px]'>
                {t('mobilePreview.profileLookDescription')}
              </p>
              <ArtistPreviewCard
                formData={formData}
                genreBadges={genreBadges}
                onInputChange={onInputChange}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
