import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/common/shadcn/carousel';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { BasicDetailsStep } from './registration-steps/BasicDetailsStep';
import { SocialImagesStep } from './registration-steps/SocialImagesStep';
import { MusicStep } from './registration-steps/MusicStep';
import { TermsStep } from './registration-steps/TermsStep';
import { ArtistPreviewCard } from './ArtistPreviewCard';
import { MobilePreviewPanel } from './MobilePreviewPanel';
import type { ArtistRegistrationFormData } from '../types/registration';

interface BadgeItem {
  label: string;
  className?: string;
}

export interface ArtistRegisterResponsiveProps {
  formData: ArtistRegistrationFormData;
  currentStep: number;
  stepTitles: string[];
  setCarouselApi: (api: CarouselApi | undefined) => void;
  handleInputChange: (field: keyof ArtistRegistrationFormData, value: any) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  genreBadges: BadgeItem[];
  setCurrentStep: (step: number) => void;
  previewExpanded?: boolean;
  setPreviewExpanded?: (expanded: boolean) => void;
}

/**
 * ArtistRegisterResponsive
 *
 * Unified responsive component for artist registration.
 * Replaces separate ArtistRegisterDesktop and ArtistRegisterMobile components.
 *
 * - Desktop: 50/50 split layout with live preview on right
 * - Mobile: Full-screen with collapsible bottom preview panel
 */
export function ArtistRegisterResponsive({
  formData,
  currentStep,
  stepTitles,
  setCarouselApi,
  handleInputChange,
  handleNext,
  handlePrevious,
  handleSubmit,
  isSubmitting,
  genreBadges,
  setCurrentStep,
  previewExpanded = false,
  setPreviewExpanded,
}: ArtistRegisterResponsiveProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Shared header component
  const Header = () => (
    <div
      className={cn(
        'relative z-10 flex items-center justify-between h-[60px] px-[20px] border-b border-white/10 flex-shrink-0',
        !isMobile && 'bg-transparent'
      )}
    >
      <button
        onClick={() => navigate('/artists/signup')}
        className='text-white/70 hover:text-fm-gold transition-colors duration-300 flex items-center gap-[10px] font-canela text-sm'
      >
        <ArrowLeft className='h-4 w-4' />
        {t('buttons.back')}
      </button>
      <div className='flex flex-col items-end'>
        <span className='font-canela text-sm text-muted-foreground'>
          {t('artistRegistration.stepOf', { current: currentStep + 1, total: 4 })}
        </span>
        <span className='font-canela text-xs text-muted-foreground/70'>
          {stepTitles[currentStep]}
        </span>
      </div>
    </div>
  );

  // Shared carousel content
  const FormCarousel = () => (
    <Carousel
      setApi={setCarouselApi}
      opts={{
        align: 'start',
        watchDrag: false,
      }}
      className='h-full [&>div]:h-full'
    >
      <CarouselContent className='h-full [&>div]:h-full'>
        <CarouselItem className='h-full'>
          <BasicDetailsStep
            formData={formData}
            onInputChange={handleInputChange}
            onNext={handleNext}
          />
        </CarouselItem>

        <CarouselItem className='h-full'>
          <SocialImagesStep
            formData={formData}
            onInputChange={handleInputChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        </CarouselItem>

        <CarouselItem className='h-full'>
          <MusicStep
            formData={formData}
            onInputChange={handleInputChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        </CarouselItem>

        <CarouselItem className='h-full'>
          <TermsStep
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            isSubmitting={isSubmitting}
          />
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  );

  // Shared progress indicators
  const ProgressIndicators = ({ className }: { className?: string }) => (
    <div className={cn('flex justify-center gap-[10px]', className)}>
      {[0, 1, 2, 3].map(step => (
        <button
          key={step}
          onClick={() => setCurrentStep(step)}
          className={cn(
            'h-2 transition-all duration-300 rounded-none',
            currentStep === step
              ? 'w-[40px] bg-fm-gold'
              : 'w-[20px] bg-white/30 hover:bg-white/50'
          )}
          aria-label={`Go to step ${step + 1}: ${stepTitles[step]}`}
        />
      ))}
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <div className='fixed inset-0 top-0 flex flex-col'>
          <TopographicBackground opacity={0.35} />

          <Header />

          {/* Form Carousel - takes remaining space, accounting for progress dots and preview panel */}
          <div className='relative z-10 flex-1 min-h-0 pb-[110px]'>
            <FormCarousel />
          </div>

          {/* Progress Indicators - fixed above preview panel */}
          <div
            className='fixed left-0 right-0 z-30 py-[10px] border-t border-white/10 bg-black/60 backdrop-blur-sm'
            style={{ bottom: '60px' }}
          >
            <ProgressIndicators />
          </div>
        </div>

        {/* Collapsible Preview Panel */}
        <MobilePreviewPanel
          formData={formData}
          genreBadges={genreBadges}
          isExpanded={previewExpanded}
          onToggle={() => setPreviewExpanded?.(!previewExpanded)}
        />
      </>
    );
  }

  // Desktop Layout
  return (
    <div className='fixed inset-0 top-[64px] flex'>
      {/* Left Column - Form Carousel (50% width) */}
      <div className='w-1/2 relative flex flex-col border-r border-white/10 z-10 overflow-hidden'>
        {/* Frosted Glass Background */}
        <div className='absolute inset-0 bg-black/70 backdrop-blur-md' />

        <Header />

        {/* Form Carousel */}
        <div className='relative z-10 flex-1 min-h-0'>
          <FormCarousel />
        </div>

        {/* Progress Indicators */}
        <div className='relative z-10 p-[15px] border-t border-white/10'>
          <ProgressIndicators />
        </div>
      </div>

      {/* Right Column - Live Preview (50% width) */}
      <div className='w-1/2 relative flex flex-col overflow-hidden z-10'>
        {/* Preview Header */}
        <div className='flex-shrink-0 flex items-center justify-between h-[60px] px-[20px] border-b border-white/10 bg-black/30 backdrop-blur-sm'>
          <h3 className='font-canela text-lg text-white'>{t('pageTitles.profilePreview')}</h3>
          <p className='font-canela text-xs text-muted-foreground'>
            {t('pageTitles.profilePreviewDescription')}
          </p>
        </div>

        {/* Preview Content */}
        <div className='flex-1 flex items-center justify-center overflow-y-auto p-[40px]'>
          <div className='w-full max-w-2xl'>
            <ArtistPreviewCard formData={formData} genreBadges={genreBadges} />
          </div>
        </div>
      </div>
    </div>
  );
}
