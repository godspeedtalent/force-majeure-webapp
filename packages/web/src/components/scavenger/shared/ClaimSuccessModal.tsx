import { useTranslation } from 'react-i18next';
import { ArrowRight, Mail, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/shadcn/button';
import { Dialog, DialogContent } from '@/components/common/shadcn/dialog';

interface ClaimSuccessModalProps {
  open: boolean;
  claimPosition: number;
  locationName: string;
  promoCode: string;
  onClose: () => void;
}

export const ClaimSuccessModal = ({
  open,
  claimPosition,
  locationName,
  promoCode,
  onClose,
}: ClaimSuccessModalProps) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setConfettiVisible(true);
      setTimeout(() => setConfettiVisible(false), 3000);
    }
  }, [open]);

  const getPositionText = (position: number) => {
    if (position === 1) return t('scavenger.claimSuccess.ordinal1');
    if (position === 2) return t('scavenger.claimSuccess.ordinal2');
    if (position === 3) return t('scavenger.claimSuccess.ordinal3');
    return t('scavenger.claimSuccess.ordinalN', { position });
  };

  const rewardDisplay = t('scavenger.claimSuccess.exclusiveReward');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-lg bg-background border-fm-gold'>
        <div className='text-center py-8 px-4'>
          {/* Trophy animation */}
          <div className='relative mb-6'>
            <div
              className={`inline-block p-6 bg-gradient-gold rounded-full ${confettiVisible ? 'animate-scale-in' : ''}`}
            >
              <Trophy className='w-16 h-16 text-primary-foreground' />
            </div>
            {confettiVisible && (
              <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                <div className='text-6xl animate-pulse-gold'>🎉</div>
              </div>
            )}
          </div>

          <h2 className='font-display text-4xl mb-4 text-foreground'>
            {t('scavenger.claimSuccess.title')}
          </h2>

          <p className='text-lg text-muted-foreground mb-2'>
            {t('scavenger.claimSuccess.youreThe')}{' '}
            <span className='font-bold text-fm-gold'>
              {getPositionText(claimPosition)}
            </span>{' '}
            {t('scavenger.claimSuccess.person')}
          </p>
          <p className='text-lg text-muted-foreground mb-6'>
            {t('scavenger.claimSuccess.toFind')} <span className='font-semibold'>{locationName}</span>!
          </p>

          {/* Reward card */}
          <div className='bg-muted/30 border border-border rounded-lg p-6 mb-6'>
            <div className='text-sm text-muted-foreground mb-2'>
              {t('scavenger.claimSuccess.yourReward')}
            </div>
            <div className='text-3xl font-display mb-3'>{rewardDisplay}</div>
            <div className='bg-background border-2 border-fm-gold rounded-lg p-4'>
              <div className='text-xs text-muted-foreground mb-1'>
                {t('ticketingPanel.promoCode')}
              </div>
              <div className='text-2xl font-mono font-bold tracking-wider text-fm-gold'>
                {promoCode}
              </div>
            </div>
          </div>

          {/* Email notice */}
          <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8'>
            <Mail className='w-4 h-4' />
            <span>{t('scavenger.claimSuccess.checkEmail')}</span>
          </div>

          {/* Action button */}
          <Button
            onClick={() => {
              onClose();
              navigate('/scavenger');
            }}
            className='w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-display text-lg py-6'
          >
            {t('buttons.continue')}
            <ArrowRight className='ml-2 w-5 h-5' />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
