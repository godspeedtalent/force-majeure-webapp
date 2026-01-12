import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gift, Check, AlertCircle, Clock, Ban, ArrowLeft, Ticket } from 'lucide-react';

import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import {
  FmCommonCard,
  FmCommonCardContent,
  FmCommonCardHeader,
  FmCommonCardTitle,
  FmCommonCardDescription,
} from '@/components/common/display/FmCommonCard';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useClaimCompTicket } from '@/features/ticketing/hooks/useCompTickets';
import { cn } from '@/shared';

/**
 * ClaimTicketPage - Page for claiming complimentary tickets
 *
 * Flow:
 * 1. User clicks link with claim token (e.g., /claim/abc-123)
 * 2. If not authenticated, redirect to auth with return URL
 * 3. Fetch comp ticket details by token
 * 4. Show event info and claim button
 * 5. On claim, create $0 order and redirect to success
 */
export default function ClaimTicketPage() {
  const { t } = useTranslation('common');
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();

  const { useCompTicketByToken, claimCompTicket, isClaiming } = useClaimCompTicket();
  const { data: compTicket, isLoading: isLoadingTicket, error } = useCompTicketByToken(claimToken);

  const [claimSuccess, setClaimSuccess] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user && claimToken) {
      navigate('/auth', {
        state: { returnTo: location.pathname },
        replace: true,
      });
    }
  }, [isAuthLoading, user, claimToken, navigate, location.pathname]);

  const handleClaim = async () => {
    if (!claimToken || isClaiming) return;

    const result = await claimCompTicket(claimToken);
    if (result.success) {
      setClaimSuccess(true);
    }
  };

  const handleViewTickets = () => {
    navigate('/orders');
  };

  const handleBackToEvent = () => {
    if (compTicket?.event_id) {
      navigate(`/event/${compTicket.event_id}`);
    } else {
      navigate('/');
    }
  };

  // Loading state
  if (isAuthLoading || isLoadingTicket) {
    return (
      <Layout>
        <div className='min-h-[60vh] flex items-center justify-center'>
          <div className='flex flex-col items-center gap-[20px]'>
            <FmCommonLoadingSpinner size='lg' />
            <p className='text-muted-foreground font-canela'>
              {t('compTickets.loadingTicket')}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Not authenticated - show nothing while redirecting
  if (!user) {
    return (
      <Layout>
        <div className='min-h-[60vh] flex items-center justify-center'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </Layout>
    );
  }

  // Error or not found
  if (error || !compTicket || !claimToken) {
    return (
      <Layout>
        <div className='container mx-auto py-12 px-[20px]'>
          <div className='max-w-md mx-auto'>
            <FmCommonCard>
              <FmCommonCardHeader className='text-center'>
                <div className='mx-auto mb-[20px] w-16 h-16 bg-destructive/10 flex items-center justify-center'>
                  <AlertCircle className='h-8 w-8 text-destructive' />
                </div>
                <FmCommonCardTitle>
                  {t('compTickets.ticketNotFound')}
                </FmCommonCardTitle>
                <FmCommonCardDescription>
                  {t('compTickets.ticketNotFoundDescription')}
                </FmCommonCardDescription>
              </FmCommonCardHeader>
              <FmCommonCardContent>
                <FmCommonButton
                  onClick={() => navigate('/')}
                  variant='default'
                  className='w-full'
                  icon={ArrowLeft}
                >
                  {t('buttons.backToHome')}
                </FmCommonButton>
              </FmCommonCardContent>
            </FmCommonCard>
          </div>
        </div>
      </Layout>
    );
  }

  // Claim success
  if (claimSuccess) {
    return (
      <Layout>
        <div className='container mx-auto py-12 px-[20px]'>
          <div className='max-w-md mx-auto'>
            <FmCommonCard>
              <FmCommonCardHeader className='text-center'>
                <div className='mx-auto mb-[20px] w-16 h-16 bg-green-500/10 flex items-center justify-center'>
                  <Check className='h-8 w-8 text-green-500' />
                </div>
                <FmCommonCardTitle className='text-green-500'>
                  {t('compTickets.ticketClaimed')}
                </FmCommonCardTitle>
                <FmCommonCardDescription>
                  {t('compTickets.ticketClaimedDescription', {
                    event: compTicket.event_title,
                  })}
                </FmCommonCardDescription>
              </FmCommonCardHeader>
              <FmCommonCardContent className='space-y-[10px]'>
                <FmCommonButton
                  onClick={handleViewTickets}
                  variant='gold'
                  className='w-full'
                  icon={Ticket}
                >
                  {t('compTickets.viewMyTickets')}
                </FmCommonButton>
                <FmCommonButton
                  onClick={handleBackToEvent}
                  variant='default'
                  className='w-full'
                >
                  {t('compTickets.backToEvent')}
                </FmCommonButton>
              </FmCommonCardContent>
            </FmCommonCard>
          </div>
        </div>
      </Layout>
    );
  }

  // Already claimed
  if (compTicket.status === 'claimed') {
    return (
      <Layout>
        <div className='container mx-auto py-12 px-[20px]'>
          <div className='max-w-md mx-auto'>
            <FmCommonCard>
              <FmCommonCardHeader className='text-center'>
                <div className='mx-auto mb-[20px] w-16 h-16 bg-green-500/10 flex items-center justify-center'>
                  <Check className='h-8 w-8 text-green-500' />
                </div>
                <FmCommonCardTitle>
                  {t('compTickets.alreadyClaimed')}
                </FmCommonCardTitle>
                <FmCommonCardDescription>
                  {t('compTickets.alreadyClaimedDescription')}
                </FmCommonCardDescription>
              </FmCommonCardHeader>
              <FmCommonCardContent className='space-y-[10px]'>
                <FmCommonButton
                  onClick={handleViewTickets}
                  variant='gold'
                  className='w-full'
                  icon={Ticket}
                >
                  {t('compTickets.viewMyTickets')}
                </FmCommonButton>
                <FmCommonButton
                  onClick={handleBackToEvent}
                  variant='default'
                  className='w-full'
                >
                  {t('compTickets.backToEvent')}
                </FmCommonButton>
              </FmCommonCardContent>
            </FmCommonCard>
          </div>
        </div>
      </Layout>
    );
  }

  // Expired
  if (compTicket.status === 'expired') {
    return (
      <Layout>
        <div className='container mx-auto py-12 px-[20px]'>
          <div className='max-w-md mx-auto'>
            <FmCommonCard>
              <FmCommonCardHeader className='text-center'>
                <div className='mx-auto mb-[20px] w-16 h-16 bg-muted/20 flex items-center justify-center'>
                  <Clock className='h-8 w-8 text-muted-foreground' />
                </div>
                <FmCommonCardTitle className='text-muted-foreground'>
                  {t('compTickets.ticketExpired')}
                </FmCommonCardTitle>
                <FmCommonCardDescription>
                  {t('compTickets.ticketExpiredDescription')}
                </FmCommonCardDescription>
              </FmCommonCardHeader>
              <FmCommonCardContent>
                <FmCommonButton
                  onClick={() => navigate('/')}
                  variant='default'
                  className='w-full'
                  icon={ArrowLeft}
                >
                  {t('buttons.backToHome')}
                </FmCommonButton>
              </FmCommonCardContent>
            </FmCommonCard>
          </div>
        </div>
      </Layout>
    );
  }

  // Revoked
  if (compTicket.status === 'revoked') {
    return (
      <Layout>
        <div className='container mx-auto py-12 px-[20px]'>
          <div className='max-w-md mx-auto'>
            <FmCommonCard>
              <FmCommonCardHeader className='text-center'>
                <div className='mx-auto mb-[20px] w-16 h-16 bg-destructive/10 flex items-center justify-center'>
                  <Ban className='h-8 w-8 text-destructive' />
                </div>
                <FmCommonCardTitle className='text-destructive'>
                  {t('compTickets.ticketRevoked')}
                </FmCommonCardTitle>
                <FmCommonCardDescription>
                  {t('compTickets.ticketRevokedDescription')}
                </FmCommonCardDescription>
              </FmCommonCardHeader>
              <FmCommonCardContent>
                <FmCommonButton
                  onClick={() => navigate('/')}
                  variant='default'
                  className='w-full'
                  icon={ArrowLeft}
                >
                  {t('buttons.backToHome')}
                </FmCommonButton>
              </FmCommonCardContent>
            </FmCommonCard>
          </div>
        </div>
      </Layout>
    );
  }

  // Main claim view (pending status)
  return (
    <Layout>
      <div className='container mx-auto py-12 px-[20px]'>
        <div className='max-w-md mx-auto'>
          <FmCommonCard>
            <FmCommonCardHeader className='text-center'>
              <div className='mx-auto mb-[20px] w-16 h-16 bg-fm-gold/10 flex items-center justify-center'>
                <Gift className='h-8 w-8 text-fm-gold' />
              </div>
              <FmCommonCardTitle>
                {t('compTickets.youveBeenInvited')}
              </FmCommonCardTitle>
              <FmCommonCardDescription>
                {t('compTickets.invitedDescription')}
              </FmCommonCardDescription>
            </FmCommonCardHeader>

            <FmCommonCardContent className='space-y-[20px]'>
              {/* Event Details */}
              <div className='p-[20px] border border-white/10 bg-white/5 space-y-[10px]'>
                <div className='text-center'>
                  <h3 className='font-canela text-xl text-foreground'>
                    {compTicket.event_title}
                  </h3>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {compTicket.tier_name}
                  </p>
                </div>

                <div
                  className={cn(
                    'flex items-center justify-center gap-2 py-[10px]',
                    'border-t border-white/10 mt-[10px]'
                  )}
                >
                  <Gift className='h-4 w-4 text-fm-gold' />
                  <span className='text-sm text-fm-gold font-medium uppercase tracking-wider'>
                    {t('compTickets.complimentaryTicket')}
                  </span>
                </div>

                {compTicket.expires_at && (
                  <p className='text-xs text-center text-muted-foreground'>
                    {t('compTickets.expiresOn', {
                      date: new Date(compTicket.expires_at).toLocaleDateString(),
                    })}
                  </p>
                )}
              </div>

              {/* Claim Button */}
              <FmCommonButton
                onClick={handleClaim}
                disabled={isClaiming}
                loading={isClaiming}
                variant='gold'
                className='w-full'
              >
                {isClaiming
                  ? t('compTickets.claiming')
                  : t('compTickets.claimTicket')}
              </FmCommonButton>

              <p className='text-xs text-center text-muted-foreground'>
                {t('compTickets.claimNote')}
              </p>
            </FmCommonCardContent>
          </FmCommonCard>
        </div>
      </div>
    </Layout>
  );
}
