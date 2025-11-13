import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { Music2, Users, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ParallaxLayerManager } from '@/components/layout/ParallaxLayerManager';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/common/shadcn/carousel';
import { useScrollPosition } from '@/shared/hooks/useScrollPosition';
import { SCROLL_THRESHOLDS } from '@/shared/constants/scrollThresholds';
import { cn } from '@/shared/utils/utils';
import { SPACING_CLASSES } from '@/shared/constants/designSystem';

// Placeholder images for past shows - these will be replaced with actual event photos
const PAST_SHOW_IMAGES = [
  '/placeholder-show-1.jpg',
  '/placeholder-show-2.jpg',
  '/placeholder-show-3.jpg',
  '/placeholder-show-4.jpg',
  '/placeholder-show-5.jpg',
];

const ArtistSignup = () => {
  const navigate = useNavigate();
  const scrollY = useScrollPosition();

  // Parallax calculations
  const { parallaxOffset, fadeOpacity } = useMemo(
    () => ({
      parallaxOffset: scrollY * SCROLL_THRESHOLDS.PARALLAX_MULTIPLIER,
      fadeOpacity: Math.max(0, 1 - scrollY / SCROLL_THRESHOLDS.CONTENT_FADE),
    }),
    [scrollY]
  );

  // Smooth scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateToRegister = () => {
    navigate('/artists/register');
  };

  return (
    <Layout>
      <ParallaxLayerManager
        layers={[
          {
            id: 'topography',
            content: <TopographicBackground opacity={0.2} parallax={false} />,
            speed: 0.3,
            zIndex: 1,
          },
          {
            id: 'gradient',
            content: (
              <div className='absolute inset-0 bg-gradient-monochrome' />
            ),
            speed: 0.5,
            zIndex: 2,
            opacity: 0.15,
          },
        ]}
      >
        <div className='min-h-screen'>
          {/* Hero Section */}
          <section
            className='relative min-h-[70vh] flex items-center justify-center'
            style={{
              transform: `translateY(${parallaxOffset}px)`,
              opacity: fadeOpacity,
            }}
          >
            <div className='container mx-auto px-[40px] py-[60px] text-center'>
              <h1 className='font-canela text-5xl md:text-7xl lg:text-8xl mb-[20px] tracking-tight'>
                Play with us.
              </h1>
              <p className='font-canela text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-[40px]'>
                Join the lineup and bring your sound to our stage.
              </p>
            </div>
          </section>

          {/* Features Section - Magazine Style */}
          <section className={cn('container mx-auto px-[40px]', SPACING_CLASSES.LG)}>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-[60px]'>
              {/* Feature 1 */}
              <div
                className='bg-black/60 backdrop-blur-sm border border-white/20 p-[40px] rounded-none'
                style={{
                  transform: `translateY(${scrollY * 0.15}px)`,
                }}
              >
                <Music2 className='w-12 h-12 text-fm-gold mb-[20px]' />
                <h2 className='font-canela text-3xl md:text-4xl mb-[20px]'>
                  Premium events.
                </h2>
                <p className='font-canela text-lg text-muted-foreground leading-relaxed'>
                  Perform alongside internationally acclaimed headliners at our
                  meticulously curated electronic music events. We create
                  unforgettable experiences for both artists and audiences.
                </p>
              </div>

              {/* Feature 2 */}
              <div
                className='bg-black/60 backdrop-blur-sm border border-white/20 p-[40px] rounded-none lg:translate-y-[60px]'
                style={{
                  transform: `translateY(${scrollY * 0.12}px)`,
                }}
              >
                <Users className='w-12 h-12 text-fm-gold mb-[20px]' />
                <h2 className='font-canela text-3xl md:text-4xl mb-[20px]'>
                  Engaged audiences.
                </h2>
                <p className='font-canela text-lg text-muted-foreground leading-relaxed'>
                  Connect with dedicated electronic music enthusiasts who
                  appreciate quality sound and emerging talent. Our events
                  attract passionate crowds ready to discover new artists.
                </p>
              </div>
            </div>
          </section>

          {/* Photo Carousel Section */}
          <section className='container mx-auto px-[40px] py-[60px]'>
            <h2 className='font-canela text-3xl md:text-5xl text-center mb-[40px]'>
              Past performances.
            </h2>

            <div className='max-w-5xl mx-auto'>
              <Carousel
                opts={{
                  align: 'start',
                  loop: true,
                }}
                className='w-full'
              >
                <CarouselContent>
                  {PAST_SHOW_IMAGES.map((image, index) => (
                    <CarouselItem key={index} className='md:basis-1/2 lg:basis-1/3'>
                      <div className='p-1'>
                        <div
                          className='relative aspect-square bg-black/60 backdrop-blur-sm border border-white/20 rounded-none overflow-hidden group cursor-pointer'
                        >
                          {/* Placeholder for actual images */}
                          <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 to-black/60'>
                            <Sparkles className='w-16 h-16 text-fm-gold/30 group-hover:text-fm-gold/50 transition-colors duration-300' />
                          </div>
                          {/* When you have actual images, replace the div above with: */}
                          {/* <img
                            src={image}
                            alt={`Past show ${index + 1}`}
                            className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                          /> */}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className='border-white/20 bg-black/60 backdrop-blur-sm hover:bg-black/70 hover:border-fm-gold text-white rounded-none' />
                <CarouselNext className='border-white/20 bg-black/60 backdrop-blur-sm hover:bg-black/70 hover:border-fm-gold text-white rounded-none' />
              </Carousel>
            </div>
          </section>

          {/* Final CTA Section */}
          <section
            className='container mx-auto px-[40px] py-[60px]'
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          >
            <div className='bg-black/70 backdrop-blur-md border border-white/20 rounded-none p-[60px] text-center max-w-4xl mx-auto'>
              <h2 className='font-canela text-4xl md:text-5xl mb-[20px]'>
                Ready to join the lineup?
              </h2>
              <p className='font-canela text-lg text-muted-foreground mb-[40px] max-w-2xl mx-auto'>
                Submit your artist profile and let us know about your sound.
                We're always looking for talented performers to showcase at our
                events.
              </p>
              <FmCommonButton
                onClick={handleNavigateToRegister}
                variant='primary'
                size='lg'
              >
                Apply Now
              </FmCommonButton>
            </div>
          </section>
        </div>
      </ParallaxLayerManager>
    </Layout>
  );
};

export default ArtistSignup;
