import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@force-majeure/shared';
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
import { MobilePreviewPanel } from './MobilePreviewPanel';
import type { ArtistRegistrationFormData } from '../types/registration';

interface BadgeItem {
  label: string;
  className?: string;
}

export interface ArtistRegisterMobileProps {
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
  previewExpanded: boolean;
  setPreviewExpanded: (expanded: boolean) => void;
}

export function ArtistRegisterMobile({
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
  previewExpanded,
  setPreviewExpanded,
}: ArtistRegisterMobileProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Full viewport mobile layout */}
      <div className='fixed inset-0 top-0 flex flex-col'>
        {/* Topography Background */}
        <TopographicBackground opacity={0.35} />

        {/* Header */}
        <div className='relative z-10 flex items-center justify-between h-[60px] px-[20px] border-b border-white/10 flex-shrink-0'>
          <button
            onClick={() => navigate('/artists/signup')}
            className='text-white/70 hover:text-fm-gold transition-colors duration-300 flex items-center gap-[10px] font-canela text-sm'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </button>
          <div className='flex flex-col items-end'>
            <span className='font-canela text-sm text-muted-foreground'>
              Step {currentStep + 1} of 4
            </span>
            <span className='font-canela text-xs text-muted-foreground/70'>
              {stepTitles[currentStep]}
            </span>
          </div>
        </div>

        {/* Form Carousel - takes remaining space, accounting for progress dots and preview panel */}
        <div className='relative z-10 flex-1 min-h-0 pb-[110px]'>
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: 'start',
              watchDrag: false,
            }}
            className='h-full [&>div]:h-full'
          >
            <CarouselContent className='h-full [&>div]:h-full'>
              {/* Step 1: Basic Details */}
              <CarouselItem className='h-full'>
                <BasicDetailsStep
                  formData={formData}
                  onInputChange={handleInputChange}
                  onNext={handleNext}
                />
              </CarouselItem>

              {/* Step 2: Social & Images */}
              <CarouselItem className='h-full'>
                <SocialImagesStep
                  formData={formData}
                  onInputChange={handleInputChange}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                />
              </CarouselItem>

              {/* Step 3: Music */}
              <CarouselItem className='h-full'>
                <MusicStep
                  formData={formData}
                  onInputChange={handleInputChange}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                />
              </CarouselItem>

              {/* Step 4: Terms & Conditions */}
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
        </div>

        {/* Progress Indicators - fixed above preview panel */}
        <div
          className='fixed left-0 right-0 z-30 flex justify-center gap-[10px] py-[10px] border-t border-white/10 bg-black/60 backdrop-blur-sm'
          style={{ bottom: '60px' }}
        >
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
      </div>

      {/* Collapsible Preview Panel */}
      <MobilePreviewPanel
        formData={formData}
        genreBadges={genreBadges}
        isExpanded={previewExpanded}
        onToggle={() => setPreviewExpanded(!previewExpanded)}
        onInputChange={handleInputChange}
      />
    </>
  );
}
