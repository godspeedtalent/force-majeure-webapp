import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Music2, Users, Sparkles, LucideIcon } from 'lucide-react';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCardCarousel } from '@/components/common/data/FmCardCarousel';
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
  {
    id: 3,
    placeholder: true,
    icon: Sparkles,
  },
  {
    id: 4,
    placeholder: true,
    icon: Music2,
  },
  {
    id: 5,
    placeholder: true,
    icon: Users,
  },
];

const ArtistSignup = () => {
  const navigate = useNavigate();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlideIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', onSelect);
    onSelect();

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

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
        <div
          className='absolute inset-0 w-full h-full'
          onMouseEnter={() => setIsHoveringCarousel(true)}
          onMouseLeave={() => setIsHoveringCarousel(false)}
        >
          <Carousel
            setApi={setCarouselApi}
            opts={{
              loop: true,
              align: 'center',
            }}
            className='h-full w-full'
          >
            <CarouselContent className='h-full'>
              {PAST_SHOW_IMAGES.map((image) => {
                const IconComponent = image.icon;
                return (
                  <CarouselItem key={image.id} className='h-full p-0'>
                    <div className='relative h-full w-full'>
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
                        <img
                          src={image.url}
                          alt={image.alt}
                          className='w-full h-full object-cover'
                          style={{
                            objectPosition: image.objectPosition || 'center'
                          }}
                        />
                      )}

                      <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />

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

        <div className='absolute left-0 top-0 h-full w-[40%] z-20'>
          <div className='absolute inset-0 bg-black/70 backdrop-blur-md' />
          
          <div className='relative z-10 h-full flex items-center py-[8vh] px-[4vw]'>
            <div className='w-full h-full flex flex-col justify-between max-w-xl mx-auto'>
              <div className='flex-shrink-0 space-y-[1vh]'>
                <h1 className='font-canela text-[clamp(1.75rem,3.5vw,3rem)] leading-[1.1] tracking-tight'>
                  Play with us.
                </h1>
                <p className='font-canela text-[clamp(0.8rem,1.1vw,1rem)] text-muted-foreground leading-relaxed'>
                  A platform where electronic music artists connect with dedicated audiences and take center stage.
                </p>
              </div>

              <div className='flex-1 flex flex-col justify-center min-h-0'>
                <FmCardCarousel autoPlayInterval={4000}>
                  <div className='bg-black/60 backdrop-blur-sm border border-white/20 rounded-none p-[clamp(0.75rem,1.3vw,1.125rem)]'>
                    <div className='flex items-start gap-[clamp(0.625rem,1vw,0.875rem)]'>
                      <Music2 className='w-[clamp(1.125rem,1.8vw,1.5rem)] h-[clamp(1.125rem,1.8vw,1.5rem)] text-fm-gold flex-shrink-0 mt-1' />
                      <div>
                        <h3 className='font-canela text-[clamp(0.9375rem,1.3vw,1.125rem)] mb-[0.3vh]'>
                          Premium events.
                        </h3>
                        <p className='font-canela text-[clamp(0.75rem,1vw,0.875rem)] text-muted-foreground leading-relaxed'>
                          Perform alongside internationally acclaimed headliners at meticulously curated shows.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-black/60 backdrop-blur-sm border border-white/20 rounded-none p-[clamp(0.75rem,1.3vw,1.125rem)]'>
                    <div className='flex items-start gap-[clamp(0.625rem,1vw,0.875rem)]'>
                      <Users className='w-[clamp(1.125rem,1.8vw,1.5rem)] h-[clamp(1.125rem,1.8vw,1.5rem)] text-fm-gold flex-shrink-0 mt-1' />
                      <div>
                        <h3 className='font-canela text-[clamp(0.9375rem,1.3vw,1.125rem)] mb-[0.3vh]'>
                          Engaged audiences.
                        </h3>
                        <p className='font-canela text-[clamp(0.75rem,1vw,0.875rem)] text-muted-foreground leading-relaxed'>
                          Connect with passionate electronic music enthusiasts ready to discover new talent.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-black/60 backdrop-blur-sm border border-white/20 rounded-none p-[clamp(0.75rem,1.3vw,1.125rem)]'>
                    <div className='flex items-start gap-[clamp(0.625rem,1vw,0.875rem)]'>
                      <Sparkles className='w-[clamp(1.125rem,1.8vw,1.5rem)] h-[clamp(1.125rem,1.8vw,1.5rem)] text-fm-gold flex-shrink-0 mt-1' />
                      <div>
                        <h3 className='font-canela text-[clamp(0.9375rem,1.3vw,1.125rem)] mb-[0.3vh]'>
                          Growing scene.
                        </h3>
                        <p className='font-canela text-[clamp(0.75rem,1vw,0.875rem)] text-muted-foreground leading-relaxed'>
                          Be part of a thriving community that celebrates electronic music and supports emerging artists.
                        </p>
                      </div>
                    </div>
                  </div>
                </FmCardCarousel>
              </div>

              <div className='flex-shrink-0 pt-[2vh]'>
                <FmCommonButton
                  onClick={handleNavigateToRegister}
                  variant='default'
                  className='w-full text-[clamp(0.8125rem,1vw,0.9375rem)] py-[clamp(0.5rem,1vh,0.75rem)] font-canela'
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
