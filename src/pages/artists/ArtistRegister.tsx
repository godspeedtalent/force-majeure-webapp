import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonFormSection } from '@/components/common/forms/FmCommonFormSection';
import { FmCommonFormActions } from '@/components/common/forms/FmCommonFormActions';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonPageHeader } from '@/components/common/display/FmCommonPageHeader';
import { FmCommonBackButton } from '@/components/common/navigation/FmCommonBackButton';
import { supabase } from '@/shared/api/supabase/client';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logApiError } from '@/shared/utils/apiLogger';
import { logger } from '@/shared/services/logger';
import { SPACING_CLASSES } from '@/shared/constants/designSystem';
import { cn } from '@/shared/utils/utils';

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

const ArtistRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        .from('artist_registrations')
        .insert([
          {
            user_id: user?.id,
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

      // Navigate back to the signup page or home
      navigate('/artists/signup');
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
      <div className={cn('container mx-auto px-[40px]', SPACING_CLASSES.LG)}>
        <FmCommonBackButton />

        <FmCommonPageHeader
          title='Artist registration.'
          description='Tell us about yourself and your sound.'
        />

        <div className='max-w-3xl mx-auto'>
          <form onSubmit={handleSubmit} className='space-y-[40px]'>
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
            <FmCommonFormActions>
              <FmCommonButton
                type='button'
                variant='outline'
                onClick={() => navigate('/artists/signup')}
                disabled={isSubmitting}
              >
                Cancel
              </FmCommonButton>
              <FmCommonButton
                type='submit'
                variant='primary'
                loading={isSubmitting}
              >
                Submit Registration
              </FmCommonButton>
            </FmCommonFormActions>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ArtistRegister;
