/**
 * Wallet Page
 *
 * Main wallet view showing upcoming and past tickets and RSVPs.
 * Accessible from user dropdown menu.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet as WalletIcon, Ticket, Calendar, UserCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import {
  useUpcomingTickets,
  usePastTickets,
  useUpcomingRsvps,
  usePastRsvps,
} from '@/features/wallet/hooks';
import { WalletTicketCard, WalletRsvpCard } from '@/features/wallet/components';
import { groupTicketsByEvent, groupRsvpsByEvent } from '@/features/wallet/types';

export default function Wallet() {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Ticket data
  const {
    data: upcomingTickets,
    isLoading: loadingUpcomingTickets,
  } = useUpcomingTickets();

  const {
    data: pastTickets,
    isLoading: loadingPastTickets,
  } = usePastTickets();

  // RSVP data
  const {
    data: upcomingRsvps,
    isLoading: loadingUpcomingRsvps,
  } = useUpcomingRsvps();

  const {
    data: pastRsvps,
    isLoading: loadingPastRsvps,
  } = usePastRsvps();

  // Combined loading states
  const loadingUpcoming = loadingUpcomingTickets || loadingUpcomingRsvps;
  const loadingPast = loadingPastTickets || loadingPastRsvps;

  // Combined counts for badge
  const upcomingCount = (upcomingTickets?.length || 0) + (upcomingRsvps?.length || 0);


  return (
    <Layout>
      <div className='container mx-auto py-8 px-4 max-w-4xl'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-2 mb-2'>
            <WalletIcon className='h-6 w-6 text-fm-gold' />
            <h1 className='text-3xl font-canela'>{t('wallet.title')}</h1>
          </div>
          <p className='text-muted-foreground'>{t('wallet.subtitle')}</p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as 'upcoming' | 'past')}
        >
          <TabsList className='grid w-full grid-cols-2 mb-6'>
            <TabsTrigger value='upcoming' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              {t('wallet.tabs.upcoming')}
              {upcomingCount > 0 && (
                <span className='ml-1 bg-fm-gold/20 text-fm-gold text-xs px-2 py-0.5 rounded-none'>
                  {upcomingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value='past' className='flex items-center gap-2'>
              <Ticket className='h-4 w-4' />
              {t('wallet.tabs.past')}
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Tickets & RSVPs */}
          <TabsContent value='upcoming'>
            {loadingUpcoming ? (
              <FmCommonLoadingState />
            ) : upcomingCount === 0 ? (
              <FmCommonEmptyState
                icon={Calendar}
                title={t('wallet.noUpcoming')}
                description={t('wallet.noUpcomingDescription')}
                action={
                  <FmCommonButton variant='gold' onClick={() => navigate('/events')}>
                    {t('wallet.browseEvents', 'Browse events')}
                  </FmCommonButton>
                }
              />
            ) : (
              <div className='space-y-6'>
                {/* Tickets Section */}
                {upcomingTickets && upcomingTickets.length > 0 && (
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <Ticket className='h-4 w-4 text-fm-gold' />
                      <h2 className='text-sm uppercase text-muted-foreground tracking-wide'>
                        {t('wallet.sections.tickets', 'Tickets')}
                      </h2>
                    </div>
                    <div className='space-y-2'>
                      {groupTicketsByEvent(upcomingTickets).map(group => (
                        <div key={group.event.id} className='space-y-2'>
                          {group.tickets.map(ticket => (
                            <WalletTicketCard key={ticket.id} ticket={ticket} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RSVPs Section */}
                {upcomingRsvps && upcomingRsvps.length > 0 && (
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <UserCheck className='h-4 w-4 text-fm-gold' />
                      <h2 className='text-sm uppercase text-muted-foreground tracking-wide'>
                        {t('wallet.sections.rsvps', 'RSVPs')}
                      </h2>
                    </div>
                    <div className='space-y-2'>
                      {groupRsvpsByEvent(upcomingRsvps).map(group => (
                        <div key={group.event.id} className='space-y-2'>
                          {group.rsvps.map(rsvp => (
                            <WalletRsvpCard key={rsvp.id} rsvp={rsvp} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Past Tickets & RSVPs */}
          <TabsContent value='past'>
            {loadingPast ? (
              <FmCommonLoadingState />
            ) : (pastTickets?.length || 0) + (pastRsvps?.length || 0) === 0 ? (
              <FmCommonEmptyState
                icon={Ticket}
                title={t('wallet.noPast')}
                description={t('wallet.noPastDescription', 'Your past tickets and RSVPs will appear here.')}
              />
            ) : (
              <div className='space-y-6'>
                {/* Past Tickets Section */}
                {pastTickets && pastTickets.length > 0 && (
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <Ticket className='h-4 w-4 text-muted-foreground' />
                      <h2 className='text-sm uppercase text-muted-foreground tracking-wide'>
                        {t('wallet.sections.tickets', 'Tickets')}
                      </h2>
                    </div>
                    <div className='space-y-2'>
                      {groupTicketsByEvent(pastTickets).map(group => (
                        <div key={group.event.id} className='space-y-2'>
                          {group.tickets.map(ticket => (
                            <WalletTicketCard key={ticket.id} ticket={ticket} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past RSVPs Section */}
                {pastRsvps && pastRsvps.length > 0 && (
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <UserCheck className='h-4 w-4 text-muted-foreground' />
                      <h2 className='text-sm uppercase text-muted-foreground tracking-wide'>
                        {t('wallet.sections.rsvps', 'RSVPs')}
                      </h2>
                    </div>
                    <div className='space-y-2'>
                      {groupRsvpsByEvent(pastRsvps).map(group => (
                        <div key={group.event.id} className='space-y-2'>
                          {group.rsvps.map(rsvp => (
                            <WalletRsvpCard key={rsvp.id} rsvp={rsvp} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
