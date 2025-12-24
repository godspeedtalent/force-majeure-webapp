import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Music2, Heart, Sparkles, PartyPopper } from 'lucide-react';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { ImageAnchor } from '@/shared';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { useGallery, GALLERY_SLUGS } from '@/features/media';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/common/shadcn/carousel';

// Fallback images when gallery is empty or loading
const FALLBACK_IMAGES = [
  {
    id: 'fallback-1',
    url: '/images/artist-showcase/DSC01097.jpg',
    alt_text: 'Force Majeure event showcase',
    creator: null,
  },
  {
    id: 'fallback-2',
    url: '/images/artist-showcase/_KAK4846.jpg',
    alt_text: 'Force Majeure event showcase',
    creator: null,
  },
];

const ArtistSignup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);

  // Fetch gallery images from database
  const { items: galleryItems, isLoading } = useGallery(
    GALLERY_SLUGS.ARTIST_SIGNUP_CAROUSEL
  );

  // Use gallery items if available, otherwise fallback
  const images = useMemo(() => {
    if (galleryItems.length > 0) {
      return galleryItems;
    }
    return FALLBACK_IMAGES;
  }, [galleryItems]);

  useEffect(() => {
    if (!carouselApi) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselApi]);

  const handleNavigateToRegister = () => {
    navigate('/artists/register');
  };

  return (
    <ArtistRegistrationLayout>
      <div className='relative overflow-hidden z-10 h-full'>
        {/* Image carousel - full screen background on mobile, right 65% on desktop */}
        <div
          className='absolute inset-0 lg:left-[35%] w-full lg:w-[65%] h-full'
          onMouseEnter={() => setIsHoveringCarousel(true)}
          onMouseLeave={() => setIsHoveringCarousel(false)}
        >
          <Carousel
            setApi={setCarouselApi}
            opts={{
              loop: true,
              align: 'center',
            }}
            className='h-full w-full [&>div]:h-full'
          >
            <CarouselContent className='h-full ml-0 [&>div]:h-full'>
              {isLoading ? (
                // Loading placeholder
                <CarouselItem className='h-full p-0 basis-full pl-0'>
                  <div className='absolute inset-0 bg-gradient-to-br from-black via-fm-navy/30 to-black flex items-center justify-center'>
                    <div className='text-center space-y-[20px]'>
                      <Music2 className='h-32 w-32 text-fm-gold/20 mx-auto animate-pulse' />
                      <p className='font-canela text-muted-foreground text-sm uppercase tracking-wider'>
                        Loading...
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ) : (
                images.map(image => (
                  <CarouselItem
                    key={image.id}
                    className='h-full p-0 basis-full pl-0'
                  >
                    <div className='absolute inset-0'>
                      <ImageWithSkeleton
                        src={image.url}
                        alt={image.alt_text || 'Force Majeure showcase'}
                        className='w-full h-full object-cover'
                        skeletonClassName='bg-black/40 backdrop-blur-sm'
                        anchor={ImageAnchor.CENTER}
                      />

                      {/* Gradient overlays to blend image into topography background */}
                      <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
                      <div className='absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/60 lg:hidden' />
                      <div className='absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent hidden lg:block' />

                      {/* SVG filter for selective desaturation - preserves gold and crimson */}
                      <svg className='absolute inset-0 w-0 h-0'>
                        <defs>
                          <filter id='selective-desaturate'>
                            {/* Preserve gold (#dfba7d - RGB: 223, 186, 125) */}
                            <feComponentTransfer>
                              <feFuncR
                                type='discrete'
                                tableValues='0.3 0.3 0.3 0.3 0.3 0.5 0.7 0.87 1 1'
                              />
                              <feFuncG
                                type='discrete'
                                tableValues='0.3 0.3 0.3 0.3 0.4 0.5 0.6 0.73 0.85 1'
                              />
                              <feFuncB
                                type='discrete'
                                tableValues='0.2 0.2 0.2 0.2 0.3 0.35 0.4 0.49 0.6 0.8'
                              />
                            </feComponentTransfer>
                          </filter>
                        </defs>
                      </svg>
                      <div
                        className='absolute inset-0 pointer-events-none'
                        style={{
                          filter: 'url(#selective-desaturate) contrast(1.1)',
                        }}
                      />

                      {/* Photo credit on hover */}
                      {isHoveringCarousel && image.creator && (
                        <div className='absolute bottom-[20px] right-[20px] bg-black/70 backdrop-blur-md px-[15px] py-[8px] border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                          <p className='font-canela text-xs text-muted-foreground'>
                            {t('artistSignup.photoCredit', {
                              creator: image.creator,
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Content panel - full screen overlay on mobile, left 35% on desktop */}
        <div className='absolute left-0 top-0 w-full lg:w-[35%] h-full z-20 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black/30 backdrop-blur-sm border-r border-white/10 lg:border-r-white/20' />

          <div className='relative z-10 h-full flex items-center justify-center py-8 px-6 lg:py-[6vh] lg:px-[2vw]'>
            <div className='w-[80vw] lg:w-[90%] flex flex-col justify-center gap-5 lg:gap-[2.5vh] max-w-md lg:max-w-sm mx-auto'>
              {/* FM Logo */}
              <div className='flex justify-center'>
                <ForceMajeureLogo size='md' className='opacity-90' />
              </div>

              <div className='space-y-3 lg:space-y-[1.5vh]'>
                <h1 className='font-canela text-3xl sm:text-4xl lg:text-[clamp(1.5rem,2.5vw,2rem)] leading-[1.1] tracking-tight text-center lg:text-left'>
                  {t('artistSignup.heroTitle')}
                </h1>
                <div className='font-canela text-sm lg:text-[clamp(0.75rem,0.9vw,0.875rem)] text-white leading-relaxed space-y-4 lg:space-y-3 text-center lg:text-left'>
                  <div className='flex items-start gap-2 justify-center lg:justify-start'>
                    <Heart className='w-3.5 h-3.5 text-fm-gold/70 flex-shrink-0 mt-0.5' />
                    <p>{t('artistSignup.valueProposition1')}</p>
                  </div>
                  <div className='flex items-start gap-2 justify-center lg:justify-start'>
                    <Sparkles className='w-3.5 h-3.5 text-fm-gold/70 flex-shrink-0 mt-0.5' />
                    <p>{t('artistSignup.valueProposition2')}</p>
                  </div>
                  <div className='flex items-start gap-2 justify-center lg:justify-start'>
                    <PartyPopper className='w-3.5 h-3.5 text-fm-gold/70 flex-shrink-0 mt-0.5' />
                    <p>
                      {t('artistSignup.valueProposition3')}
                      <span className='block mt-1 text-fm-gold'>
                        {t('artistSignup.closingLine')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='mt-2 lg:mt-0'>
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
