import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Music2, Users, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonFormSection } from '@/components/common/forms/FmCommonFormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { supabase } from '@/shared/api/supabase/client';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logApiError } from '@/shared/utils/apiLogger';
import { logger } from '@/shared/services/logger';
import { cn } from '@/shared/utils/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/common/shadcn/carousel';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface ArtistRegistrationFormData {
  artistName: string;
  genre: string;
  bio: string;
  soundcloudUrl: string;
  spotifyUrl: string;
  instagramHandle: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  previousVenues: string;
  setLength: string;
  equipment: string;
  availability: string;
}

// Placeholder images for artist events - replace with actual event photos
const ARTIST_SHOWCASE_IMAGES = [
  { id: 1, placeholder: true, icon: Music2 },
  { id: 2, placeholder: true, icon: Users },
  { id: 3, placeholder: true, icon: Sparkles },
  { id: 4, placeholder: true, icon: Music2 },
  { id: 5, placeholder: true, icon: Users },
];

const ArtistRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState<ArtistRegistrationFormData>({
    artistName: '',
    genre: '',
    bio: '',
    soundcloudUrl: '',
    spotifyUrl: '',
    instagramHandle: '',
    email: user?.email || '',
    phone: '',
    city: '',
    state: '',
    previousVenues: '',
    setLength: '',
    equipment: '',
    availability: '',
  });

  // Carousel effect to track current slide
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', onSelect);
    onSelect();

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  // Auto-play carousel
  useEffect(() => {
    if (!carouselApi) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [carouselApi]);

  const handleInputChange = (field: keyof ArtistRegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof ArtistRegistrationFormData)[] = [
      'artistName',
      'genre',
      'bio',
      'email',
      'phone',
      'city',
      'state',
    ];

    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        toast.error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return false;
    }

    // Phone validation (basic)
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid phone number.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert artist registration into the database
      const { data, error } = await supabase
        .from('artist_registrations' as any)
        .insert([
          {
            user_id: user?.id || null,
            artist_name: formData.artistName,
            genre: formData.genre,
            bio: formData.bio,
            soundcloud_url: formData.soundcloudUrl || null,
            spotify_url: formData.spotifyUrl || null,
            instagram_handle: formData.instagramHandle || null,
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            state: formData.state,
            previous_venues: formData.previousVenues || null,
            set_length: formData.setLength || null,
            equipment: formData.equipment || null,
            availability: formData.availability || null,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        await logApiError({
          endpoint: 'artist_registrations',
          method: 'INSERT',
          message: 'Error submitting artist registration',
          details: error,
        });
        toast.error('Failed to submit registration. Please try again.');
        return;
      }

      logger.info('Artist registration submitted successfully', { data });
      toast.success('Registration submitted successfully! We\'ll be in touch soon.');

      // Close form and navigate back
      setShowForm(false);
      setTimeout(() => {
        navigate('/artists/signup');
      }, 1000);
    } catch (error) {
      await logApiError({
        endpoint: 'artist_registrations',
        method: 'INSERT',
        message: 'Unexpected error during artist registration',
        details: error,
      });
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Magazine-Style Full Page Spread - No Scrolling */}
      <div className='fixed inset-0 flex overflow-hidden' style={{ height: '100vh' }}>
        {/* Left Side - Content (40% width) */}
        <div className='w-[40%] relative flex flex-col justify-between p-[60px] z-10'>
          {/* Topography background for left side */}
          <div className='absolute inset-0 opacity-10'>
            <TopographicBackground opacity={0.3} parallax={false} />
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/artists/signup')}
            className='absolute top-[40px] left-[40px] text-white/70 hover:text-fm-gold transition-colors duration-300 flex items-center gap-[10px] font-canela text-sm uppercase tracking-wider z-20'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </button>

          {/* Main Content */}
          <div className='relative z-10 flex-1 flex flex-col justify-center'>
            <div className='space-y-[40px]'>
              {/* Logo/Branding Area */}
              <div className='space-y-[10px]'>
                <h1 className='font-canela text-6xl md:text-7xl leading-none tracking-tight'>
                  Join the movement.
                </h1>
                <p className='font-canela text-xl text-muted-foreground max-w-md'>
                  A platform for electronic music artists who are ready to take the stage and connect with dedicated audiences.
                </p>
              </div>

              {/* Call to Action */}
              <div className='space-y-[20px]'>
                <FmCommonButton
                  onClick={() => setShowForm(true)}
                  variant='gold'
                  className='w-full text-lg py-[20px] font-canela uppercase tracking-wider'
                >
                  Apply Now
                </FmCommonButton>

                {/* Feature Pills */}
                <div className='flex flex-wrap gap-[10px]'>
                  <div className='px-[20px] py-[10px] bg-black/60 backdrop-blur-sm border border-white/20 rounded-none'>
                    <span className='font-canela text-sm text-muted-foreground uppercase tracking-wider'>
                      Professional Venues
                    </span>
                  </div>
                  <div className='px-[20px] py-[10px] bg-black/60 backdrop-blur-sm border border-white/20 rounded-none'>
                    <span className='font-canela text-sm text-muted-foreground uppercase tracking-wider'>
                      Engaged Crowds
                    </span>
                  </div>
                  <div className='px-[20px] py-[10px] bg-black/60 backdrop-blur-sm border border-white/20 rounded-none'>
                    <span className='font-canela text-sm text-muted-foreground uppercase tracking-wider'>
                      Growing Scene
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Carousel Navigation */}
          <div className='relative z-10 flex items-center justify-between'>
            <div className='flex items-center gap-[20px]'>
              <button
                onClick={() => carouselApi?.scrollPrev()}
                className='h-12 w-12 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/20 rounded-none hover:border-fm-gold hover:bg-fm-gold/10 transition-all duration-300'
                aria-label='Previous image'
              >
                <ChevronLeft className='h-6 w-6' />
              </button>
              <button
                onClick={() => carouselApi?.scrollNext()}
                className='h-12 w-12 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/20 rounded-none hover:border-fm-gold hover:bg-fm-gold/10 transition-all duration-300'
                aria-label='Next image'
              >
                <ChevronRight className='h-6 w-6' />
              </button>
            </div>

            {/* Slide Indicators */}
            <div className='flex gap-[10px]'>
              {ARTIST_SHOWCASE_IMAGES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={cn(
                    'h-2 transition-all duration-300 rounded-none',
                    currentSlide === index
                      ? 'w-[40px] bg-fm-gold'
                      : 'w-[20px] bg-white/30 hover:bg-white/50'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Full Page Carousel (60% width) */}
        <div className='w-[60%] relative'>
          <Carousel
            setApi={setCarouselApi}
            opts={{
              loop: true,
              align: 'center',
            }}
            className='h-full w-full'
          >
            <CarouselContent className='h-full'>
              {ARTIST_SHOWCASE_IMAGES.map((image) => {
                const IconComponent = image.icon;
                return (
                  <CarouselItem key={image.id} className='h-full p-0'>
                    <div className='relative h-full w-full'>
                      {/* Placeholder for actual images */}
                      <div className='absolute inset-0 bg-gradient-to-br from-black via-fm-navy/30 to-black flex items-center justify-center'>
                        <div className='text-center space-y-[20px]'>
                          <IconComponent className='h-32 w-32 text-fm-gold/20 mx-auto' />
                          <p className='font-canela text-muted-foreground text-sm uppercase tracking-wider'>
                            Artist Showcase Image
                          </p>
                        </div>
                      </div>
                      {/* When you have actual images, replace the div above with: */}
                      {/* <img
                        src={image.url}
                        alt={image.alt}
                        className='w-full h-full object-cover'
                      /> */}

                      {/* Subtle overlay gradient for depth */}
                      <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      {/* Registration Form Modal/Slide-In Panel */}
      {showForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300'>
          {/* Close overlay on click */}
          <div
            className='absolute inset-0'
            onClick={() => setShowForm(false)}
          />

          {/* Form Container */}
          <div className='relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-black/80 backdrop-blur-xl border-2 border-white/20 rounded-none shadow-2xl animate-in slide-in-from-bottom duration-500'>
            {/* Form Header */}
            <div className='sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-white/20 p-[40px]'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='font-canela text-4xl mb-[10px]'>
                    Artist registration.
                  </h2>
                  <p className='font-canela text-muted-foreground'>
                    Tell us about yourself and your sound.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className='h-12 w-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/20 rounded-none transition-all duration-300'
                  aria-label='Close form'
                >
                  <ArrowLeft className='h-6 w-6' />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className='p-[40px] space-y-[40px]'>
              {/* Basic Information */}
              <FmCommonFormSection
                title='Basic information.'
                description='Your artist details and contact information.'
              >
                <FmCommonTextField
                  label='Artist Name'
                  required
                  value={formData.artistName}
                  onChange={(e) => handleInputChange('artistName', e.target.value)}
                  placeholder='Your stage name or artist name'
                />

                <FmCommonTextField
                  label='Genre'
                  required
                  value={formData.genre}
                  onChange={(e) => handleInputChange('genre', e.target.value)}
                  placeholder='e.g., Techno, House, Drum & Bass'
                />

                <FmCommonTextField
                  label='Bio'
                  required
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder='Tell us about your musical journey and style'
                  multiline
                  rows={4}
                />
              </FmCommonFormSection>

              {/* Social & Music Links */}
              <FmCommonFormSection
                title='Online presence.'
                description='Share your music and social profiles.'
              >
                <FmCommonTextField
                  label='SoundCloud URL'
                  value={formData.soundcloudUrl}
                  onChange={(e) => handleInputChange('soundcloudUrl', e.target.value)}
                  placeholder='https://soundcloud.com/your-profile'
                />

                <FmCommonTextField
                  label='Spotify URL'
                  value={formData.spotifyUrl}
                  onChange={(e) => handleInputChange('spotifyUrl', e.target.value)}
                  placeholder='https://open.spotify.com/artist/...'
                />

                <FmCommonTextField
                  label='Instagram Handle'
                  value={formData.instagramHandle}
                  onChange={(e) => handleInputChange('instagramHandle', e.target.value)}
                  placeholder='@yourusername'
                />
              </FmCommonFormSection>

              {/* Contact Information */}
              <FmCommonFormSection
                title='Contact information.'
                description='How we can reach you.'
              >
                <FmCommonTextField
                  label='Email'
                  required
                  type='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder='your@email.com'
                />

                <FmCommonTextField
                  label='Phone'
                  required
                  type='tel'
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder='+1 (555) 123-4567'
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-[20px]'>
                  <FmCommonTextField
                    label='City'
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder='Your city'
                  />

                  <FmCommonTextField
                    label='State'
                    required
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder='State/Province'
                  />
                </div>
              </FmCommonFormSection>

              {/* Performance Details */}
              <FmCommonFormSection
                title='Performance details.'
                description='Tell us about your live setup and experience.'
              >
                <FmCommonTextField
                  label='Previous Venues'
                  value={formData.previousVenues}
                  onChange={(e) => handleInputChange('previousVenues', e.target.value)}
                  placeholder="List venues or events where you've performed"
                  multiline
                  rows={3}
                />

                <FmCommonTextField
                  label='Typical Set Length'
                  value={formData.setLength}
                  onChange={(e) => handleInputChange('setLength', e.target.value)}
                  placeholder='e.g., 60 minutes, 90 minutes'
                />

                <FmCommonTextField
                  label='Equipment'
                  value={formData.equipment}
                  onChange={(e) => handleInputChange('equipment', e.target.value)}
                  placeholder='What equipment do you use? (CDJs, controllers, etc.)'
                  multiline
                  rows={2}
                />

                <FmCommonTextField
                  label='Availability'
                  value={formData.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                  placeholder='When are you typically available to perform?'
                  multiline
                  rows={2}
                />
              </FmCommonFormSection>

              {/* Form Actions */}
              <div className='flex items-center justify-end gap-[20px] pt-[20px] border-t border-white/10'>
                <FmCommonButton
                  type='button'
                  variant='secondary'
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </FmCommonButton>
                <FmCommonButton
                  type='submit'
                  variant='gold'
                  loading={isSubmitting}
                >
                  Submit Registration
                </FmCommonButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ArtistRegister;
