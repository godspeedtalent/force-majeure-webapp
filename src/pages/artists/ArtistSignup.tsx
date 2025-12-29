import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Sparkles, PartyPopper } from 'lucide-react';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { FmGalleryCarousel, GALLERY_SLUGS } from '@/features/media';

const ArtistSignup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');

  const handleNavigateToRegister = () => {
    navigate('/artists/register');
  };

  return (
    <ArtistRegistrationLayout>
      <div className='relative overflow-hidden z-10 h-full'>
        {/* Image carousel - full screen background on mobile, right 65% on desktop */}
        <div className='absolute inset-0 lg:left-[35%] w-full lg:w-[65%] h-full'>
          <FmGalleryCarousel
            gallerySlug={GALLERY_SLUGS.ARTIST_SIGNUP_CAROUSEL}
            autoScrollInterval={5000}
            showCredits={true}
            creditPrefix={t('artistSignup.photoCredit', { creator: '' }).replace('', '').trim()}
          />
        </div>

        {/* Content panel - full screen overlay on mobile, left 35% on desktop */}
        <div className='absolute left-0 top-0 w-full lg:w-[35%] h-full z-20 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black/30 backdrop-blur-sm border-r border-white/10 lg:border-r-white/20' />

          <div className='relative z-10 h-full flex items-center justify-center py-8 px-6 lg:py-[6vh] lg:px-[2vw]'>
            <div className='relative w-[80vw] lg:w-[90%] flex flex-col justify-center gap-8 lg:gap-[4vh] max-w-md lg:max-w-sm mx-auto'>
              {/* Mobile-only frosted glass backing for better text readability */}
              <div className='absolute -inset-6 -z-10 bg-black/30 backdrop-blur-sm border border-fm-gold/30 lg:hidden' />
              {/* FM Logo */}
              <div className='flex justify-center'>
                <ForceMajeureLogo size='md' className='opacity-90' />
              </div>

              <div className='space-y-6 lg:space-y-[3vh]'>
                <h1 className='font-canela text-3xl sm:text-4xl lg:text-[clamp(1.5rem,2.5vw,2rem)] leading-[1.1] tracking-tight text-center'>
                  {t('artistSignup.heroTitle')}
                </h1>
                <div className='font-canela text-sm lg:text-[clamp(0.75rem,0.9vw,0.875rem)] text-white leading-relaxed space-y-6 lg:space-y-5 text-center lg:text-left'>
                  <div className='flex items-start gap-3 justify-center lg:justify-start'>
                    <Heart className='w-3.5 h-3.5 text-fm-gold/70 flex-shrink-0 mt-0.5' />
                    <p>{t('artistSignup.valueProposition1')}</p>
                  </div>
                  <div className='flex items-start gap-3 justify-center lg:justify-start'>
                    <Sparkles className='w-3.5 h-3.5 text-fm-gold/70 flex-shrink-0 mt-0.5' />
                    <p>{t('artistSignup.valueProposition2')}</p>
                  </div>
                  <div className='flex items-start gap-3 justify-center lg:justify-start'>
                    <PartyPopper className='w-3.5 h-3.5 text-fm-gold/70 flex-shrink-0 mt-0.5' />
                    <p>{t('artistSignup.valueProposition3')}</p>
                  </div>
                </div>

                <p className='text-fm-gold text-center font-canela text-sm lg:text-[clamp(0.75rem,0.9vw,0.875rem)]'>
                  {t('artistSignup.closingLine')}
                </p>
              </div>

              <div className='mt-4 lg:mt-2'>
                <FmCommonButton
                  onClick={handleNavigateToRegister}
                  variant='default'
                  className='w-full text-sm lg:text-[clamp(0.6875rem,0.9vw,0.8125rem)] py-3 lg:py-[clamp(0.375rem,0.75vh,0.5rem)] font-canela'
                >
                  {t('artistSignup.registerButton')}
                </FmCommonButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ArtistRegistrationLayout>
  );
};

export default ArtistSignup;
