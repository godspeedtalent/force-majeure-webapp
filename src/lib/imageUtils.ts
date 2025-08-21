import { supabase } from '@/integrations/supabase/client';

export const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) {
    return '/placeholder.svg';
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('/lovable-uploads/')) {
    return imagePath;
  }

  // If it's a storage path, get the public URL
  if (imagePath.startsWith('images/')) {
    const { data } = supabase.storage.from('images').getPublicUrl(imagePath.replace('images/', ''));
    return data.publicUrl;
  }

  // For other paths, assume they're in the images bucket
  const { data } = supabase.storage.from('images').getPublicUrl(imagePath);
  return data.publicUrl;
};