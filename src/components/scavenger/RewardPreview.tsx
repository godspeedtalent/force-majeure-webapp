import { Ticket, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RewardPreviewProps {
  locationName: string;
  rewardType: string;
  tokensRemaining: number;
  totalTokens: number;
}

export const RewardPreview = ({ 
  locationName, 
  rewardType, 
  tokensRemaining,
  totalTokens 
}: RewardPreviewProps) => {
  const isFreeTicket = rewardType === 'free_ticket';
  const urgencyLevel = tokensRemaining <= 2 ? 'high' : tokensRemaining <= 3 ? 'medium' : 'low';

  return (
    <Card className="p-8 bg-gradient-gold border-none text-primary-foreground">
      <div className="flex items-start gap-6">
        <div className="p-4 bg-primary-foreground/10 rounded-lg">
          {isFreeTicket ? (
            <Ticket className="w-12 h-12" />
          ) : (
            <Tag className="w-12 h-12" />
          )}
        </div>
        
        <div className="flex-1">
          <h2 className="font-display text-3xl mb-2">
            {isFreeTicket ? '🎫 Free Ticket' : '🎟️ 20% Off'}
          </h2>
          <p className="text-primary-foreground/90 mb-4">
            You found: <span className="font-semibold">{locationName}</span>
          </p>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            urgencyLevel === 'high' 
              ? 'bg-destructive/20 text-primary-foreground animate-pulse-gold'
              : urgencyLevel === 'medium'
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-primary-foreground/10 text-primary-foreground'
          }`}>
            <span className="font-semibold">
              {tokensRemaining} of {totalTokens} rewards remaining
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
