import { useState } from 'react';
import { FmCommonFormModal } from '@/components/ui/FmCommonFormModal';
import { FmCommonTextField } from '@/components/ui/FmCommonTextField';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateArtistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateArtistModal = ({ open, onOpenChange }: CreateArtistModalProps) => {
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
        social_links: formData.social_links.trim() ? JSON.parse(formData.social_links) : {},
      });

      if (error) throw error;

      toast.success('Artist created successfully');
      onOpenChange(false);
      setFormData({
        name: '',
        image_url: '',
        bio: '',
        genre: '',
        social_links: '',
      });
    } catch (error) {
      console.error('Error creating artist:', error);
      toast.error('Failed to create artist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    {
      content: (
        <div className="space-y-4">
          <FmCommonTextField
            label="Artist Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter artist name"
          />
          <FmCommonTextField
            label="Image URL"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
          <FmCommonTextField
            label="Bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Artist biography"
          />
          <FmCommonTextField
            label="Genre"
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            placeholder="Electronic, House, etc."
          />
          <FmCommonTextField
            label="Social Links (JSON)"
            value={formData.social_links}
            onChange={(e) => setFormData({ ...formData, social_links: e.target.value })}
            placeholder='{"instagram": "@artist", "twitter": "@artist"}'
            description="Enter a valid JSON object"
          />
        </div>
      ),
    },
  ];

  const actions = (
    <div className="flex gap-3 justify-end">
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting}
        className="bg-white/5 border-white/20 hover:bg-white/10"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="bg-fm-gold hover:bg-fm-gold/90 text-black"
      >
        {isSubmitting ? 'Creating...' : 'Create Artist'}
      </Button>
    </div>
  );

  return (
    <FmCommonFormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Artist"
      description="Add a new artist to the database"
      sections={sections}
      actions={actions}
    />
  );
};
