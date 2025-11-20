import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, Instagram as InstagramIcon, ExternalLink, Upload, Music } from 'lucide-react';
import { SiSoundcloud, SiSpotify, SiTiktok } from 'react-icons/si';
import { ArtistRegistrationLayout } from '@/components/layout/ArtistRegistrationLayout';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
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
import type { Genre } from '@/features/artists/types';

interface ArtistRegistrationFormData {
  // Basic Details
  stageName: string;
  bio: string;
  genres: Genre[];

  // Social
  profileImageUrl: string;
  pressImage1Url: string;
  pressImage2Url: string;
  pressImage3Url: string;
  instagramHandle: string;
  soundcloudUrl: string;
  spotifyUrl: string;
  tiktokHandle: string;

  // Music
  spotifyTrackUrl: string;
  soundcloudSetUrl: string;

  // Terms
  agreeToTerms: boolean;
  linkPersonalProfile: boolean;
  followOnInstagram: boolean;
  notificationsOptIn: boolean;
}

const ArtistRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ArtistRegistrationFormData>({
    // Basic Details
    stageName: '',
    bio: '',
    genres: [],

    // Social
    profileImageUrl: '',
    pressImage1Url: '',
    pressImage2Url: '',
    pressImage3Url: '',
    instagramHandle: '',
    soundcloudUrl: '',
    spotifyUrl: '',
    tiktokHandle: '',

    // Music
    spotifyTrackUrl: '',
    soundcloudSetUrl: '',

    // Terms
    agreeToTerms: false,
    linkPersonalProfile: false,
    followOnInstagram: false,
    notificationsOptIn: false,
  });

  // Sync carousel with current step
  useEffect(() => {
    if (carouselApi) {
      carouselApi.scrollTo(currentStep);
    }
  }, [currentStep, carouselApi]);

  // Track carousel changes
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentStep(carouselApi.selectedScrollSnap());
    };

    carouselApi.on('select', onSelect);
    onSelect();

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const handleInputChange = (field: keyof ArtistRegistrationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Details
        if (!formData.stageName.trim()) {
          toast.error('Please enter your stage name');
          return false;
        }
        if (!formData.bio.trim()) {
          toast.error('Please tell us about yourself');
          return false;
        }
        if (formData.genres.length === 0) {
          toast.error('Please select at least one genre');
          return false;
        }
        return true;

      case 1: // Social
        if (!formData.profileImageUrl.trim()) {
          toast.error('Please provide your profile image URL');
          return false;
        }
        if (!formData.instagramHandle.trim()) {
          toast.error('Instagram handle is required');
          return false;
        }
        if (!formData.soundcloudUrl.trim() && !formData.spotifyUrl.trim()) {
          toast.error('Please provide either a SoundCloud or Spotify URL');
          return false;
        }
        return true;

      case 2: // Music
        if (!formData.soundcloudSetUrl.trim()) {
          toast.error('A SoundCloud sample set is required');
          return false;
        }
        // Validate URL format
        try {
          new URL(formData.soundcloudSetUrl);
        } catch {
          toast.error('Please provide a valid SoundCloud URL');
          return false;
        }
        return true;

      case 3: // Terms
        if (!formData.agreeToTerms) {
          toast.error('You must agree to the terms and conditions');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // Validate all steps
    for (let i = 0; i < 4; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('artist_registrations' as any)
        .insert([
          {
            user_id: user?.id || null,
            artist_name: formData.stageName,
            bio: formData.bio,
            genres: formData.genres.map(g => g.id),
            profile_image_url: formData.profileImageUrl,
            press_images: [
              formData.pressImage1Url,
              formData.pressImage2Url,
              formData.pressImage3Url,
            ].filter(url => url.trim() !== ''),
            instagram_handle: formData.instagramHandle,
            soundcloud_url: formData.soundcloudUrl || null,
            spotify_url: formData.spotifyUrl || null,
            tiktok_handle: formData.tiktokHandle || null,
            spotify_track_url: formData.spotifyTrackUrl || null,
            soundcloud_set_url: formData.soundcloudSetUrl,
            link_personal_profile: formData.linkPersonalProfile,
            notifications_opt_in: formData.notificationsOptIn,
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
      toast.success("Registration submitted successfully! We'll be in touch soon.");

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

  // Genre badges for preview
  const genreBadges = useMemo(
    () =>
      formData.genres.map(genre => ({
        label: genre.name,
        className: 'border-fm-gold/60 bg-fm-gold/10 text-fm-gold',
      })),
    [formData.genres]
  );

  const stepTitles = [
    'Basic Details',
    'Social & Images',
    'Music',
    'Terms & Conditions',
  ];

  const DEFAULT_BIO =
    'Your bio will appear here. Tell your story, describe your sound, and share what makes you unique.';

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
                {stepTitles[currentStep]}
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
                  <div className='h-full flex flex-col p-[20px]'>
                    <div className='flex-1 overflow-y-auto pr-[10px]'>
                      <div className='flex justify-center'>
                        <div className='w-[60%] space-y-[20px]'>
                          <div>
                            <h2 className='font-canela text-3xl mb-[10px]'>
                              Tell us about your sound.
                            </h2>
                            <p className='font-canela text-sm text-muted-foreground'>
                              Share your stage name, bio, and musical style.
                            </p>
                          </div>

                          <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

                          <div className='space-y-[20px]'>
                            <FmCommonTextField
                              label='Stage Name'
                              required
                              value={formData.stageName}
                              onChange={e => handleInputChange('stageName', e.target.value)}
                              placeholder='Your artist or DJ name'
                            />

                            <FmCommonTextField
                              label='Bio'
                              required
                              value={formData.bio}
                              onChange={e => handleInputChange('bio', e.target.value)}
                              placeholder='Tell us about your musical journey, style, and influences...'
                              multiline
                              rows={6}
                            />

                            <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

                            <FmGenreMultiSelect
                              label='Genres'
                              required
                              selectedGenres={formData.genres}
                              onChange={genres => handleInputChange('genres', genres)}
                              maxGenres={5}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex justify-end pt-[20px] border-t border-white/10 flex-shrink-0'>
                      <FmCommonButton onClick={handleNext} variant='default'>
                        Next
                      </FmCommonButton>
                    </div>
                  </div>
                </CarouselItem>

                {/* Step 2: Social & Images */}
                <CarouselItem className='h-full'>
                  <div className='h-full flex flex-col p-[20px]'>
                    <div className='flex-1 overflow-y-auto pr-[10px]'>
                      <div className='flex justify-center'>
                        <div className='w-[60%] space-y-[20px]'>
                          <div>
                            <h2 className='font-canela text-3xl mb-[10px]'>Your online presence.</h2>
                            <p className='font-canela text-sm text-muted-foreground'>
                              Add your profile images and social media links.
                            </p>
                          </div>

                          <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

                          {/* Profile Images - Grid Upload */}
                          <div className='space-y-[10px]'>
                            <h3 className='font-canela text-lg'>Profile Images</h3>
                          <div className='grid grid-cols-2 gap-[10px]'>
                            {/* Main Profile Picture */}
                            <div className='col-span-1 row-span-2'>
                              <div
                                className='aspect-[3/4] border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
                                onClick={() => {
                                  const url = prompt('Enter image URL for main profile picture:');
                                  if (url) handleInputChange('profileImageUrl', url);
                                }}
                              >
                                {formData.profileImageUrl ? (
                                  <img src={formData.profileImageUrl} alt='Profile' className='w-full h-full object-cover' />
                                ) : (
                                  <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
                                    <Upload className='h-8 w-8 mb-[10px]' />
                                    <span className='text-xs font-canela'>Main Profile</span>
                                    <span className='text-xs font-canela text-white/30'>Required</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Press Photo 1 */}
                            <div className='col-span-1'>
                              <div
                                className='aspect-[3/2] border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
                                onClick={() => {
                                  const url = prompt('Enter image URL for press photo 1:');
                                  if (url) handleInputChange('pressImage1Url', url);
                                }}
                              >
                                {formData.pressImage1Url ? (
                                  <img src={formData.pressImage1Url} alt='Press 1' className='w-full h-full object-cover' />
                                ) : (
                                  <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
                                    <Upload className='h-6 w-6 mb-[5px]' />
                                    <span className='text-xs font-canela'>Press Photo</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Press Photo 2 - Only show if Press Photo 1 has content */}
                            {formData.pressImage1Url && (
                              <div className='col-span-1'>
                                <div
                                  className='aspect-[3/2] border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
                                  onClick={() => {
                                    const url = prompt('Enter image URL for press photo 2:');
                                    if (url) handleInputChange('pressImage2Url', url);
                                  }}
                                >
                                  {formData.pressImage2Url ? (
                                    <img src={formData.pressImage2Url} alt='Press 2' className='w-full h-full object-cover' />
                                  ) : (
                                    <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
                                      <Upload className='h-6 w-6 mb-[5px]' />
                                      <span className='text-xs font-canela'>Press Photo</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Press Photo 3 - Only show if Press Photo 2 has content */}
                            {formData.pressImage1Url && formData.pressImage2Url && (
                              <div className='col-span-2'>
                                <div
                                  className='aspect-[3/1] border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
                                  onClick={() => {
                                    const url = prompt('Enter image URL for press photo 3:');
                                    if (url) handleInputChange('pressImage3Url', url);
                                  }}
                                >
                                  {formData.pressImage3Url ? (
                                    <img src={formData.pressImage3Url} alt='Press 3' className='w-full h-full object-cover' />
                                  ) : (
                                    <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
                                      <Upload className='h-6 w-6 mb-[5px]' />
                                      <span className='text-xs font-canela'>Press Photo</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

                        {/* Social Links */}
                        <div className='space-y-[10px]'>
                          <h3 className='font-canela text-lg'>Social Media</h3>
                          <div className='flex items-center gap-[10px]'>
                            <InstagramIcon className='h-5 w-5 text-fm-gold flex-shrink-0' />
                            <FmCommonTextField
                              label='Instagram Handle'
                              required
                              value={formData.instagramHandle}
                              onChange={e => handleInputChange('instagramHandle', e.target.value)}
                              placeholder='@yourusername'
                              className='flex-1'
                            />
                          </div>

                          <div className={cn(
                            'bg-black/40 backdrop-blur-sm border rounded-none p-[15px] transition-colors',
                            !formData.soundcloudUrl && !formData.spotifyUrl ? 'border-fm-danger/50' : 'border-white/20'
                          )}>
                            <p className='font-canela text-xs mb-[10px] flex items-center gap-[5px]'>
                              <Music className='h-3 w-3' />
                              <span className={cn(
                                'transition-colors',
                                !formData.soundcloudUrl && !formData.spotifyUrl ? 'text-fm-danger' : 'text-muted-foreground'
                              )}>
                                At least one music platform is required:
                              </span>
                            </p>
                            <div className='space-y-[10px]'>
                              <div className='flex items-center gap-[10px]'>
                                <SiSoundcloud className='h-5 w-5 text-[#ff5500] flex-shrink-0' />
                                <FmCommonTextField
                                  label='SoundCloud URL'
                                  value={formData.soundcloudUrl}
                                  onChange={e => handleInputChange('soundcloudUrl', e.target.value)}
                                  placeholder='https://soundcloud.com/your-profile'
                                  className='flex-1'
                                />
                              </div>
                              <div className='flex items-center gap-[10px]'>
                                <SiSpotify className='h-5 w-5 text-[#1DB954] flex-shrink-0' />
                                <FmCommonTextField
                                  label='Spotify Artist URL'
                                  value={formData.spotifyUrl}
                                  onChange={e => handleInputChange('spotifyUrl', e.target.value)}
                                  placeholder='https://open.spotify.com/artist/...'
                                  className='flex-1'
                                />
                              </div>
                            </div>
                          </div>

                          <div className='flex items-center gap-[10px]'>
                            <SiTiktok className='h-5 w-5 flex-shrink-0' />
                            <FmCommonTextField
                              label='TikTok Handle (Optional)'
                              value={formData.tiktokHandle}
                              onChange={e => handleInputChange('tiktokHandle', e.target.value)}
                              placeholder='@yourusername'
                              className='flex-1'
                            />
                          </div>
                        </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex justify-between pt-[20px] border-t border-white/10 flex-shrink-0'>
                      <FmCommonButton onClick={handlePrevious} variant='secondary'>
                        <ChevronLeft className='h-4 w-4 mr-[10px]' />
                        Previous
                      </FmCommonButton>
                      <FmCommonButton onClick={handleNext} variant='default'>
                        Next
                      </FmCommonButton>
                    </div>
                  </div>
                </CarouselItem>

                {/* Step 3: Music */}
                <CarouselItem className='h-full'>
                  <div className='h-full flex flex-col p-[20px]'>
                    <div className='flex-1 overflow-y-auto pr-[10px]'>
                      <div className='flex justify-center'>
                        <div className='w-[60%] space-y-[20px]'>
                          <div>
                            <h2 className='font-canela text-3xl mb-[10px]'>Show us your music.</h2>
                            <p className='font-canela text-sm text-muted-foreground'>
                              Share samples of your work so we can hear your sound.
                            </p>
                          </div>

                          <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

                          <div className='space-y-[20px]'>
                            <FmCommonTextField
                              label='SoundCloud Sample Set'
                              required
                              value={formData.soundcloudSetUrl}
                              onChange={e => handleInputChange('soundcloudSetUrl', e.target.value)}
                              placeholder='https://soundcloud.com/you/sets/your-sample-set'
                            />
                            <p className='font-canela text-xs text-muted-foreground -mt-[10px]'>
                              A full set or mix showcasing your style is required.
                            </p>

                            <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

                            <FmCommonTextField
                              label='Spotify Track (Optional)'
                              value={formData.spotifyTrackUrl}
                              onChange={e => handleInputChange('spotifyTrackUrl', e.target.value)}
                              placeholder='https://open.spotify.com/track/...'
                            />
                            <p className='font-canela text-xs text-muted-foreground -mt-[10px]'>
                              Share a representative track if you have music on Spotify.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex justify-between pt-[20px] border-t border-white/10 flex-shrink-0'>
                      <FmCommonButton onClick={handlePrevious} variant='secondary'>
                        <ChevronLeft className='h-4 w-4 mr-[10px]' />
                        Previous
                      </FmCommonButton>
                      <FmCommonButton onClick={handleNext} variant='default'>
                        Next
                      </FmCommonButton>
                    </div>
                  </div>
                </CarouselItem>

                {/* Step 4: Terms & Conditions */}
                <CarouselItem className='h-full'>
                  <div className='h-full flex flex-col p-[20px]'>
                    <div className='flex-1 overflow-y-auto pr-[10px]'>
                      <div className='flex justify-center'>
                        <div className='w-[60%] space-y-[20px]'>
                          <div>
                            <h2 className='font-canela text-3xl mb-[10px]'>
                              Almost there!
                            </h2>
                            <p className='font-canela text-sm text-muted-foreground'>
                              Review the terms and customize your profile settings.
                            </p>
                          </div>

                          <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

                          {/* Terms and Conditions */}
                          <div className='bg-black/40 backdrop-blur-sm border border-white/20 rounded-none p-[20px]'>
                          <h3 className='font-canela text-base mb-[10px]'>Terms and Conditions</h3>
                          <div className='max-h-[150px] overflow-y-auto mb-[15px] p-[15px] bg-black/20 border border-white/10 rounded-none'>
                            <p className='font-canela text-xs text-muted-foreground leading-relaxed'>
                              By submitting this registration, you agree to the Force Majeure artist terms and conditions.
                              You confirm that all information provided is accurate and that you have the rights to the music
                              and images submitted. Force Majeure reserves the right to approve or decline artist applications
                              at our discretion. Selected artists will be contacted within 2-3 weeks of submission.
                            </p>
                          </div>
                          <label className='flex items-start gap-[10px] cursor-pointer group'>
                            <input
                              type='checkbox'
                              checked={formData.agreeToTerms}
                              onChange={e => handleInputChange('agreeToTerms', e.target.checked)}
                              className='mt-1 h-4 w-4 rounded-none border-white/20 bg-transparent checked:bg-fm-gold checked:border-fm-gold focus:ring-fm-gold focus:ring-offset-0'
                            />
                            <span className='font-canela text-sm group-hover:text-fm-gold transition-colors'>
                              I agree to the terms and conditions <span className='text-fm-danger'>*</span>
                            </span>
                          </label>
                        </div>

                        <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

                        {/* Profile Settings */}
                        <div className='space-y-[15px]'>
                          <h3 className='font-canela text-base'>Profile Settings</h3>

                          <label className='flex items-start gap-[10px] cursor-pointer group'>
                            <input
                              type='checkbox'
                              checked={formData.linkPersonalProfile}
                              onChange={e => handleInputChange('linkPersonalProfile', e.target.checked)}
                              className='mt-1 h-4 w-4 rounded-none border-white/20 bg-transparent checked:bg-fm-gold checked:border-fm-gold focus:ring-fm-gold focus:ring-offset-0'
                            />
                            <div className='flex-1'>
                              <span className='font-canela text-sm group-hover:text-fm-gold transition-colors block'>
                                Link my personal account
                              </span>
                              <span className='font-canela text-xs text-muted-foreground'>
                                Connect your social user account with your artist profile
                              </span>
                            </div>
                          </label>

                          <label className='flex items-start gap-[10px] cursor-pointer group'>
                            <input
                              type='checkbox'
                              checked={formData.notificationsOptIn}
                              onChange={e => handleInputChange('notificationsOptIn', e.target.checked)}
                              className='mt-1 h-4 w-4 rounded-none border-white/20 bg-transparent checked:bg-fm-gold checked:border-fm-gold focus:ring-fm-gold focus:ring-offset-0'
                            />
                            <div className='flex-1'>
                              <span className='font-canela text-sm group-hover:text-fm-gold transition-colors block'>
                                Send me booking notifications
                              </span>
                              <span className='font-canela text-xs text-muted-foreground'>
                                Get notified about booking opportunities and event updates
                              </span>
                            </div>
                          </label>
                        </div>

                        <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

                        {/* Support Force Majeure */}
                        <div className='bg-fm-gold/10 border border-fm-gold/30 rounded-none p-[20px]'>
                          <h3 className='font-canela text-base mb-[10px] text-fm-gold'>
                            Support Force Majeure
                          </h3>
                          <p className='font-canela text-sm text-muted-foreground mb-[15px]'>
                            Your support helps us create better events and support more artists. Follow us on Instagram to
                            stay connected with the community.
                          </p>
                          <a
                            href='https://instagram.com/forcemajeureevents'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-[10px] px-[20px] py-[12px] bg-fm-gold/20 hover:bg-fm-gold/30 border border-fm-gold/50 rounded-none transition-all duration-300 font-canela text-sm'
                          >
                            <InstagramIcon className='h-4 w-4' />
                            Follow us on Instagram
                            <ExternalLink className='h-3 w-3' />
                          </a>
                        </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex justify-between pt-[20px] border-t border-white/10 flex-shrink-0'>
                      <FmCommonButton onClick={handlePrevious} variant='secondary'>
                        <ChevronLeft className='h-4 w-4 mr-[10px]' />
                        Previous
                      </FmCommonButton>
                      <FmCommonButton
                        onClick={handleSubmit}
                        variant='gold'
                        loading={isSubmitting}
                      >
                        Submit Registration
                      </FmCommonButton>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </div>

          {/* Progress Indicators */}
          <div className='relative z-10 flex justify-center gap-[10px] p-[15px] border-t border-white/10'>
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

        {/* Right Column - Live Preview (50% width) - Modal Style */}
        <div className='w-1/2 relative flex flex-col overflow-hidden z-10'>
          {/* Preview Header - Thin row at top */}
          <div className='flex-shrink-0 flex items-center justify-between px-[40px] py-[15px] border-b border-white/10 bg-black/30 backdrop-blur-sm'>
            <div>
              <h3 className='font-canela text-lg text-white'>Profile Preview</h3>
            </div>
            <p className='font-canela text-xs text-muted-foreground'>
              This is how your profile will look to others
            </p>
          </div>

          {/* Preview Content */}
          <div className='flex-1 flex items-center justify-center overflow-y-auto p-[40px]'>
            <div className='w-full max-w-2xl'>
              {/* Artist Preview - Modal Style with Frosted Glass Card */}
              <div className='bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-[30px]'>
                <div className='flex flex-col gap-6 sm:flex-row sm:items-stretch'>
                  {/* Left: Image Column */}
                  <div className='sm:w-48 flex-shrink-0'>
                    <div className='overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-inner'>
                      {formData.profileImageUrl ? (
                        <img
                          src={formData.profileImageUrl}
                          alt={formData.stageName}
                          className='aspect-[3/4] w-full object-cover'
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className='aspect-[3/4] w-full bg-gradient-to-br from-fm-gold/15 via-fm-gold/5 to-transparent' />
                      )}
                    </div>
                  </div>

                  {/* Right: Content Column */}
                  <div className='flex-1 flex flex-col gap-4 sm:min-h-[280px]'>
                    <div className='space-y-2'>
                      <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela'>
                        Artist Spotlight
                      </p>
                      <h2 className='text-2xl font-canela font-semibold text-white leading-tight'>
                        {formData.stageName || 'Your Name'}
                      </h2>
                      <div className='w-full h-[1px] bg-white/30' />
                    </div>

                    <div
                      className={cn(
                        'prose prose-invert max-w-none text-sm text-white/80 leading-relaxed font-canela',
                        !formData.bio && 'italic text-white/60'
                      )}
                    >
                      {formData.bio || DEFAULT_BIO}
                    </div>

                    {genreBadges.length > 0 && (
                      <FmCommonBadgeGroup
                        badges={genreBadges}
                        className='mt-auto'
                        badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold'
                        gap='md'
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ArtistRegistrationLayout>
  );
};

export default ArtistRegister;
