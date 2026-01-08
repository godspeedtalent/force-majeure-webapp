import { Music, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { useUserLinkedArtist } from '@/shared/hooks/useUserLinkedArtist';

interface FmArtistUndercardCardProps {
  className?: string;
}

export const FmArtistUndercardCard = ({ className = '' }: FmArtistUndercardCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const { hasLinkedArtist } = useUserLinkedArtist();

  // Don't display anything for artists that are already signed up
  if (hasLinkedArtist) {
    return null;
  }

  return (
    <div
      className={`p-4 md:p-6 bg-black/60 backdrop-blur-sm border border-fm-gold/20 max-w-md ${className}`}
    >
      <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
        <Music className="h-4 w-4 md:h-5 md:w-5 text-fm-gold mt-0.5 flex-shrink-0" />
        <div className="text-left">
          <h2 className="font-canela text-sm md:text-base text-fm-gold mb-1">
            {t('artistUndercard.lookingForArtists')}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-snug">
            {t('artistUndercard.artistDescription')}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => navigate('/artists/signup')}
        className="w-full border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10 text-xs md:text-sm py-2"
      >
        {t('artistUndercard.signUpAsArtist')}
        <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
      </Button>
    </div>
  );
};
