import { MapPin, Tag } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LocationCardProps {
  locationName: string;
  totalTokens: number;
  tokensRemaining: number;
}

export const LocationCard = ({
  locationName,
  totalTokens,
  tokensRemaining,
}: LocationCardProps) => {
  const claimedCount = totalTokens - tokensRemaining;
  const progressPercentage = (claimedCount / totalTokens) * 100;
  const isFullyClaimed = tokensRemaining === 0;

  const rewardIcon = <Tag className='w-5 h-5' />;
  const rewardText = 'Exclusive Reward';

  return (
    <Card
      className={`p-6 transition-all duration-300 ${
        isFullyClaimed
          ? 'bg-muted/50 border-muted'
          : 'bg-card hover:shadow-gold border-border'
      }`}
    >
      <div className='flex items-start gap-4 mb-4'>
        <div
          className={`p-3 rounded-lg ${
            isFullyClaimed ? 'bg-muted' : 'bg-gradient-gold'
          }`}
        >
          <MapPin
            className={`w-6 h-6 ${
              isFullyClaimed
                ? 'text-muted-foreground'
                : 'text-primary-foreground'
            }`}
          />
        </div>

        <div className='flex-1 min-w-0'>
          <h3 className='font-display text-xl mb-1 truncate'>{locationName}</h3>

          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            {rewardIcon}
            <span>{rewardText}</span>
          </div>
        </div>
      </div>

      <div className='space-y-2'>
        <Progress value={progressPercentage} className='h-2' />

        <div className='flex items-center justify-between text-sm'>
          <span
            className={`font-semibold ${
              isFullyClaimed
                ? 'text-muted-foreground'
                : tokensRemaining <= 2
                  ? 'text-destructive animate-pulse'
                  : 'text-foreground'
            }`}
          >
            {claimedCount} of {totalTokens} claimed
          </span>

          {isFullyClaimed ? (
            <span className='text-muted-foreground font-medium'>
              All claimed! 🎉
            </span>
          ) : (
            <span className='text-fm-gold font-medium'>
              {tokensRemaining} left
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
