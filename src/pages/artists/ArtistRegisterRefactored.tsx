import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { cn } from '@/shared/utils/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/common/shadcn/carousel';

// Hooks
import { useRegistrationStepper } from './hooks/useRegistrationStepper';
import { useArtistRegistrationValidation } from './hooks/useArtistRegistrationValidation';
import { useArtistRegistrationSubmit } from './hooks/useArtistRegistrationSubmit';

// Types and constants
import { DEFAULT_FORM_DATA, STEP_TITLES } from './types/registration';
import type { ArtistRegistrationFormData } from './types/registration';

// Step components
import { BasicDetailsStep } from './components/registration-steps/BasicDetailsStep';
import { SocialImagesStep } from './components/registration-steps/SocialImagesStep';
import { MusicStep } from './components/registration-steps/MusicStep';
import { TermsStep } from './components/registration-steps/TermsStep';

// Note: Preview panel code would go in a separate component for further modularization
// For now, keeping it inline to maintain visual parity with original

/**
 * ArtistRegister - Artist registration wizard
 *
 * Refactored for better maintainability by:
 * - Extracting each step into separate components
 * - Moving validation logic to custom hook
 * - Moving submission logic to custom hook
 * - Extracting stepper navigation to custom hook
 * - Centralizing types and constants
 *
 * Main component is now a clean orchestrator (~200 lines vs 849 lines)
 */
const ArtistRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] =
    useState<ArtistRegistrationFormData>(DEFAULT_FORM_DATA);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Custom hooks
  const { currentStep, handleNext, handlePrevious, goToStep } =
    useRegistrationStepper(carouselApi);
  const { validateStep, validateAllSteps } = useArtistRegistrationValidation();
  const { submitRegistration, isSubmitting } = useArtistRegistrationSubmit();

  const handleInputChange = (
    field: keyof ArtistRegistrationFormData,
    value: any
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStepNext = () => {
    if (validateStep(currentStep, formData)) {
      handleNext();
    }
  };

  const handleSubmit = async () => {
    const invalidStep = validateAllSteps(formData);
    if (invalidStep !== null) {
      goToStep(invalidStep);
      return;
    }

    await submitRegistration(formData);
  };

  // Genre badges for preview
  const genreBadges = useMemo(
    () =>
      formData.genres.map(genre => ({
        label: genre.name,
        className: 'border-fm-gold/60 bg-fm-gold/10 text-fm-gold',
      })),
    [formData.genres]
  );

  return (
    <ArtistRegistrationLayout>
      {/* Full viewport split layout */}
      <div className='fixed inset-0 top-[80px] flex overflow-hidden'>
        {/* Left Column - Form Carousel (50% width) */}
        <div className='w-1/2 relative flex flex-col border-r border-white/10 z-10'>
          {/* Frosted Glass Background */}
          <div className='absolute inset-0 bg-black/70 backdrop-blur-md' />

          {/* Header */}
          <div className='relative z-10 flex items-center justify-between p-[20px] border-b border-white/10'>
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
                {STEP_TITLES[currentStep]}
              </span>
            </div>
          </div>

          {/* Form Carousel */}
          <div className='relative z-10 flex-1 overflow-hidden'>
            <Carousel
              setApi={setCarouselApi}
              opts={{
                align: 'start',
                watchDrag: false,
              }}
              className='h-full'
            >
              <CarouselContent className='h-full'>
                {/* Step 1: Basic Details */}
                <CarouselItem className='h-full'>
                  <BasicDetailsStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNext={handleStepNext}
                  />
                </CarouselItem>

                {/* Step 2: Social & Images */}
                <CarouselItem className='h-full'>
                  <SocialImagesStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNext={handleStepNext}
                    onPrevious={handlePrevious}
                  />
                </CarouselItem>

                {/* Step 3: Music */}
                <CarouselItem className='h-full'>
                  <MusicStep
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNext={handleStepNext}
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

          {/* Progress Indicators */}
          <div className='relative z-10 flex justify-center gap-[10px] p-[15px] border-t border-white/10'>
            {[0, 1, 2, 3].map(step => (
              <button
                key={step}
                onClick={() => goToStep(step)}
                className={cn(
                  'h-2 transition-all duration-300 rounded-none',
                  currentStep === step
                    ? 'w-[40px] bg-fm-gold'
                    : 'w-[20px] bg-white/30 hover:bg-white/50'
                )}
                aria-label={`Go to step ${step + 1}: ${STEP_TITLES[step]}`}
              />
            ))}
          </div>
        </div>

        {/* Right Column - Live Preview (50% width) */}
        <div className='w-1/2 relative overflow-hidden'>
          {/* Background with gradient */}
          <div className='absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-black' />

          {/* Content */}
          <div className='relative z-10 h-full overflow-y-auto p-[40px]'>
            <div className='max-w-[500px] mx-auto space-y-[30px]'>
              {/* Preview Header */}
              <div className='text-center space-y-[10px]'>
                <h3 className='font-canela text-2xl text-fm-gold'>
                  Live Preview
                </h3>
                <p className='font-canela text-sm text-muted-foreground'>
                  See how your profile will look
                </p>
              </div>

              {/* Profile Card Preview */}
              <div className='bg-black/40 backdrop-blur-sm border border-white/10 rounded-none p-[30px] space-y-[20px]'>
                {/* Profile Image */}
                {formData.profileImageUrl ? (
                  <div className='aspect-[3/4] w-full overflow-hidden rounded-none border-2 border-fm-gold/30'>
                    <img
                      src={formData.profileImageUrl}
                      alt='Profile preview'
                      className='w-full h-full object-cover'
                    />
                  </div>
                ) : (
                  <div className='aspect-[3/4] w-full border-2 border-dashed border-white/20 rounded-none bg-black/20 flex items-center justify-center'>
                    <span className='font-canela text-sm text-muted-foreground'>
                      Profile image preview
                    </span>
                  </div>
                )}

                {/* Artist Name */}
                <div>
                  <h4 className='font-canela text-3xl text-foreground mb-[5px]'>
                    {formData.stageName || 'Your Stage Name'}
                  </h4>
                  {genreBadges.length > 0 && (
                    <div className='flex flex-wrap gap-[5px] mt-[10px]'>
                      {genreBadges.map((badge, index) => (
                        <span
                          key={index}
                          className={cn(
                            'px-[10px] py-[3px] text-xs font-canela border rounded-none',
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <p className='font-canela text-sm text-muted-foreground leading-relaxed'>
                    {formData.bio ||
                      'Your bio will appear here. Tell your story, describe your sound, and share what makes you unique.'}
                  </p>
                </div>

                {/* Social Links Preview */}
                {(formData.instagramHandle ||
                  formData.soundcloudUrl ||
                  formData.spotifyUrl ||
                  formData.tiktokHandle) && (
                  <div className='pt-[20px] border-t border-white/10 space-y-[10px]'>
                    <h5 className='font-canela text-sm text-muted-foreground uppercase tracking-wider'>
                      Connect
                    </h5>
                    <div className='flex flex-wrap gap-[10px]'>
                      {formData.instagramHandle && (
                        <span className='text-xs font-canela text-muted-foreground'>
                          Instagram: {formData.instagramHandle}
                        </span>
                      )}
                      {formData.soundcloudUrl && (
                        <span className='text-xs font-canela text-muted-foreground'>
                          SoundCloud
                        </span>
                      )}
                      {formData.spotifyUrl && (
                        <span className='text-xs font-canela text-muted-foreground'>
                          Spotify
                        </span>
                      )}
                      {formData.tiktokHandle && (
                        <span className='text-xs font-canela text-muted-foreground'>
                          TikTok: {formData.tiktokHandle}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ArtistRegistrationLayout>
  );
};

export default ArtistRegister;
