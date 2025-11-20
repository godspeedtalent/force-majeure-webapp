import { useState } from 'react';
import { Mic2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/shadcn/button';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/shared/services/logger';

const DeveloperCreateArtistPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    bio: '',
    genre: '',
    social_links: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Artist name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('artists').insert({
        name: formData.name.trim(),
        image_url: formData.image_url.trim() || null,
        bio: formData.bio.trim() || null,
        genre: formData.genre.trim() || null,
        social_links: formData.social_links.trim()
          ? JSON.parse(formData.social_links)
          : {},
      });

      if (error) throw error;

      toast.success('Artist created successfully');
      setFormData({
        name: '',
        image_url: '',
        bio: '',
        genre: '',
        social_links: '',
      });
      navigate('/developer/database');
    } catch (error) {
      logger.error('Error creating artist:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      toast.error('Failed to create artist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      image_url: '',
      bio: '',
      genre: '',
      social_links: '',
    });
    navigate('/developer/database');
  };

  return (
    <DemoLayout
      title='Create Artist'
      description='Add a new artist profile, including imagery and genre metadata.'
      icon={Mic2}
      condensed
    >
      <div className='space-y-6'>
        <p className='text-sm text-muted-foreground'>
          Use this form to create placeholder or production artist records.
        </p>

        <div className='space-y-4'>
          <FmCommonTextField
            label='Artist Name'
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder='Enter artist name'
          />
          <FmFlexibleImageUpload
            label='Artist Image'
            value={formData.image_url}
            onChange={url => setFormData({ ...formData, image_url: url })}
            bucket='artist-images'
            pathPrefix='artists'
          />
          <FmCommonTextField
            label='Bio'
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            placeholder='Artist biography'
          />
          <FmCommonTextField
            label='Genre'
            value={formData.genre}
            onChange={e => setFormData({ ...formData, genre: e.target.value })}
            placeholder='Electronic, House, etc.'
          />
          <FmCommonTextField
            label='Social Links (JSON)'
            value={formData.social_links}
            onChange={e =>
              setFormData({ ...formData, social_links: e.target.value })
            }
            placeholder='{"instagram": "@artist", "twitter": "@artist"}'
            description='Enter a valid JSON object'
          />
        </div>

        {/* Form Actions */}
        <div className='flex gap-3 justify-end pt-4 border-t border-white/20'>
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={isSubmitting}
            className='bg-white/5 border-white/20 hover:bg-white/10'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Artist'}
          </Button>
        </div>
      </div>
    </DemoLayout>
  );
};

export default DeveloperCreateArtistPage;
