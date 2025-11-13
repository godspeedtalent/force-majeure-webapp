import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Music2, Users, Sparkles, LucideIcon } from 'lucide-react';
import { Navigation } from '@/components/navigation/Navigation';
import { Footer } from '@/components/navigation/Footer';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
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
}

const PAST_SHOW_IMAGES: ShowcaseImage[] = [
  { 
    id: 1, 
    placeholder: false,
    icon: Music2,
    url: '/images/artist-showcase/DSC01097.jpg',
    alt: 'Force Majeure event showcase'
  },
  { 
    id: 2, 
    placeholder: false,
    icon: Users,
    url: '/images/artist-showcase/_KAK4846.jpg',
    alt: 'Force Majeure event showcase'
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

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      // Update carousel state if needed
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
    <div className='min-h-screen bg-background flex flex-col relative overflow-hidden'>
      <div className='fixed inset-0 z-0'>
        <TopographicBackground opacity={0.35} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
      </div>

      <Navigation />

      <div className='relative overflow-hidden z-10' style={{ height: 'calc(100vh - 80px)' }}>
        <div className='absolute inset-0 w-full h-full'>
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
                            filter: 'saturate(0.1) contrast(1.1)',
                            mixBlendMode: 'normal'
                          }}
                        />
                      )}

                      <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />
                      
                      {!image.placeholder && (
                        <div 
                          className='absolute inset-0 pointer-events-none'
                          style={{
                            mixBlendMode: 'color',
                            background: 'linear-gradient(135deg, rgba(223, 186, 125, 0.15) 0%, rgba(82, 12, 16, 0.15) 100%)'
                          }}
                        />
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
                  className='w-full text-[clamp(0.8125rem,1vw,0.9375rem)] py-[clamp(0.5rem,1vh,0.75rem)] font-canela uppercase tracking-wider'
                >
                  Register with us now.
                </FmCommonButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ArtistSignup;
