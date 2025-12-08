import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Music2, Users, LucideIcon, Heart, Sparkles, PartyPopper } from 'lucide-react';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCardCarousel } from '@/components/common/data/FmCardCarousel';
import { FmAnimatedGradientAvatar } from '@/components/common/display/FmAnimatedGradientAvatar';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { ImageAnchor } from '@force-majeure/shared/types/imageAnchor';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/common/shadcn/carousel';

interface ShowcaseImage {
  id: number;
  placeholder: boolean;
  icon: LucideIcon;
  url?: string;
  alt?: string;
  objectPosition?: string; // e.g., 'center', 'top', 'bottom', '50% 25%'
  credit?: string; // Photo credit
}

const PAST_SHOW_IMAGES: ShowcaseImage[] = [
  {
    id: 1,
    placeholder: false,
    icon: Music2,
    url: '/images/artist-showcase/DSC01097.jpg',
    alt: 'Force Majeure event showcase',
    objectPosition: 'center',
    credit: 'Photo by Force Majeure'
  },
  {
    id: 2,
    placeholder: false,
    icon: Users,
    url: '/images/artist-showcase/_KAK4846.jpg',
    alt: 'Force Majeure event showcase',
    objectPosition: 'center',
    credit: 'Photo by Force Majeure'
  },
];

const ArtistSignup = () => {
  const navigate = useNavigate();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);


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

      <div className='relative overflow-hidden z-10' style={{ height: 'calc(100vh - 80px)' }}>
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
              {PAST_SHOW_IMAGES.map((image) => {
                const IconComponent = image.icon;
                return (
                  <CarouselItem key={image.id} className='h-full p-0 basis-full pl-0'>
                    <div className='absolute inset-0'>
                      {image.placeholder ? (
                        <div className='absolute inset-0 bg-gradient-to-br from-black via-fm-navy/30 to-black flex items-center justify-center'>
                          <div className='text-center space-y-[20px]'>
                            <IconComponent className='h-32 w-32 text-fm-gold/20 mx-auto' />
                            <p className='font-canela text-muted-foreground text-sm uppercase tracking-wider'>
                              Past Performance Showcase
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ImageWithSkeleton
                          src={image.url!}
                          alt={image.alt || 'Force Majeure showcase'}
                          className='w-full h-full object-cover'
                          skeletonClassName='bg-black/40 backdrop-blur-sm'
                          anchor={ImageAnchor.CENTER}
                        />
                      )}

                      {/* Gradient overlays to blend image into topography background */}
                      <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
                      <div className='absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/60 lg:hidden' />
                      <div className='absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent hidden lg:block' />

                      {!image.placeholder && (
                        <>
                          {/* SVG filter for selective desaturation - preserves gold and crimson */}
                          <svg className='absolute inset-0 w-0 h-0'>
                            <defs>
                              <filter id='selective-desaturate'>
                                {/* Preserve gold (#dfba7d - RGB: 223, 186, 125) */}
                                <feComponentTransfer>
                                  <feFuncR type='discrete' tableValues='0.3 0.3 0.3 0.3 0.3 0.5 0.7 0.87 1 1' />
                                  <feFuncG type='discrete' tableValues='0.3 0.3 0.3 0.3 0.4 0.5 0.6 0.73 0.85 1' />
                                  <feFuncB type='discrete' tableValues='0.2 0.2 0.2 0.2 0.3 0.35 0.4 0.49 0.6 0.8' />
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
                        </>
                      )}

                      {/* Photo credit on hover */}
                      {!image.placeholder && image.credit && isHoveringCarousel && (
                        <div className='absolute bottom-[20px] right-[20px] bg-black/70 backdrop-blur-md px-[15px] py-[8px] border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                          <p className='font-canela text-xs text-muted-foreground'>
                            {image.credit}
                          </p>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Content panel - full screen overlay on mobile, left 35% on desktop */}
        <div className='absolute left-0 top-0 w-full lg:w-[35%] h-full z-20 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black/30 backdrop-blur-sm border-r border-white/10 lg:border-r-white/20' />

          <div className='relative z-10 h-full flex items-center justify-center py-8 px-6 lg:py-[8vh] lg:px-[4vw]'>
            <div className='w-[80vw] lg:w-full flex flex-col justify-center gap-6 lg:gap-[4vh] max-w-md lg:max-w-xl mx-auto'>
              {/* FM Logo */}
              <div className='flex justify-center lg:justify-start'>
                <ForceMajeureLogo size='lg' className='opacity-90' />
              </div>

              <div className='space-y-4 lg:space-y-[2vh]'>
                <h1 className='font-canela text-3xl sm:text-4xl lg:text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.1] tracking-tight text-center lg:text-left'>
                  Come spin with us.
                </h1>
                <div className='font-canela text-sm lg:text-[clamp(0.8rem,1.1vw,1rem)] text-white leading-relaxed space-y-6 lg:space-y-5 text-center lg:text-left'>
                  <div className='flex items-start gap-3 justify-center lg:justify-start'>
                    <Heart className='w-4 h-4 text-fm-gold/70 flex-shrink-0 mt-0.5' />
                    <p>
                      FM has, and always will be, a group that elevates the local Austin electronic scene by taking care of our artists.
                    </p>
                  </div>
                  <div className='flex items-start gap-3 justify-center lg:justify-start'>
                    <Sparkles className='w-4 h-4 text-fm-gold/70 flex-shrink-0 mt-0.5' />
                    <p>
                      We proudly make sure our event undercards represent a diverse selection of rising stars from an expansive pantheon of genre.
                    </p>
                  </div>
                  <div className='flex items-start gap-3 justify-center lg:justify-start'>
                    <PartyPopper className='w-4 h-4 text-fm-gold/70 flex-shrink-0 mt-0.5' />
                    <p>
                      So go ahead and click that button below and let's get rolling.
                      <span className='block mt-1 text-fm-gold'>Can't wait to make you a part of our rave fam.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card carousel - hidden on mobile */}
              <div className='hidden lg:flex flex-col justify-center gap-4 lg:gap-[2vh]'>
                <FmCardCarousel autoPlayInterval={4000}>
                  <div className='bg-black/60 backdrop-blur-sm border border-fm-gold rounded-none overflow-hidden'>
                    <div className='flex items-stretch'>
                      <div className='w-[50px] flex-shrink-0 border-r border-white/50'>
                        <FmAnimatedGradientAvatar className='w-full h-full rounded-none' />
                      </div>
                      <div className='flex-1 p-3 lg:p-[clamp(0.75rem,1.3vw,1.125rem)]'>
                        <h3 className='font-canela text-sm lg:text-[clamp(0.9375rem,1.3vw,1.125rem)] mb-[8px]'>
                          Premium events.
                        </h3>
                        <div className='w-full h-[1px] bg-white/30 mb-[8px]' />
                        <p className='font-canela text-xs lg:text-[clamp(0.75rem,1vw,0.875rem)] text-muted-foreground leading-snug lg:leading-relaxed'>
                          Perform alongside internationally acclaimed headliners at curated shows.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-black/60 backdrop-blur-sm border border-fm-gold rounded-none overflow-hidden'>
                    <div className='flex items-stretch'>
                      <div className='w-[50px] flex-shrink-0 border-r border-white/50'>
                        <FmAnimatedGradientAvatar className='w-full h-full rounded-none' />
                      </div>
                      <div className='flex-1 p-3 lg:p-[clamp(0.75rem,1.3vw,1.125rem)]'>
                        <h3 className='font-canela text-sm lg:text-[clamp(0.9375rem,1.3vw,1.125rem)] mb-[8px]'>
                          Rising stars.
                        </h3>
                        <div className='w-full h-[1px] bg-white/30 mb-[8px]' />
                        <p className='font-canela text-xs lg:text-[clamp(0.75rem,1vw,0.875rem)] text-muted-foreground leading-snug lg:leading-relaxed'>
                          Connect with passionate electronic music enthusiasts ready to discover new talent.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-black/60 backdrop-blur-sm border border-fm-gold rounded-none overflow-hidden'>
                    <div className='flex items-stretch'>
                      <div className='w-[50px] flex-shrink-0 border-r border-white/50'>
                        <FmAnimatedGradientAvatar className='w-full h-full rounded-none' />
                      </div>
                      <div className='flex-1 p-3 lg:p-[clamp(0.75rem,1.3vw,1.125rem)]'>
                        <h3 className='font-canela text-sm lg:text-[clamp(0.9375rem,1.3vw,1.125rem)] mb-[8px]'>
                          Growing scene.
                        </h3>
                        <div className='w-full h-[1px] bg-white/30 mb-[8px]' />
                        <p className='font-canela text-xs lg:text-[clamp(0.75rem,1vw,0.875rem)] text-muted-foreground leading-snug lg:leading-relaxed'>
                          Join the movement that's fueling Austin's explosion into the electronic world.
                        </p>
                      </div>
                    </div>
                  </div>
                </FmCardCarousel>
              </div>

              <div className='mt-2 lg:mt-0'>
                <FmCommonButton
                  onClick={handleNavigateToRegister}
                  variant='default'
                  className='w-full text-sm lg:text-[clamp(0.6875rem,0.9vw,0.8125rem)] py-3 lg:py-[clamp(0.375rem,0.75vh,0.5rem)] font-canela'
                >
                  Register with us now
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
