/**
 * Wallet Page
 *
 * Main wallet view showing upcoming and past tickets.
 * Accessible from user dropdown menu.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet as WalletIcon, Ticket, Calendar } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { useUpcomingTickets, usePastTickets } from '@/features/wallet/hooks';
import { WalletTicketCard } from '@/features/wallet/components';
import { groupTicketsByEvent } from '@/features/wallet/types';

export default function Wallet() {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const {
    data: upcomingTickets,
    isLoading: loadingUpcoming,
  } = useUpcomingTickets();

  const {
    data: pastTickets,
    isLoading: loadingPast,
  } = usePastTickets();


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
              {upcomingTickets && upcomingTickets.length > 0 && (
                <span className='ml-1 bg-fm-gold/20 text-fm-gold text-xs px-2 py-0.5 rounded-none'>
                  {upcomingTickets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value='past' className='flex items-center gap-2'>
              <Ticket className='h-4 w-4' />
              {t('wallet.tabs.past')}
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Tickets */}
          <TabsContent value='upcoming'>
            {loadingUpcoming ? (
              <FmCommonLoadingState />
            ) : !upcomingTickets || upcomingTickets.length === 0 ? (
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
                {groupTicketsByEvent(upcomingTickets).map(group => (
                  <div key={group.event.id} className='space-y-2'>
                    {group.tickets.map(ticket => (
                      <WalletTicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Past Tickets */}
          <TabsContent value='past'>
            {loadingPast ? (
              <FmCommonLoadingState />
            ) : !pastTickets || pastTickets.length === 0 ? (
              <FmCommonEmptyState
                icon={Ticket}
                title={t('wallet.noPast')}
                description={t('wallet.noPastDescription', 'Your past tickets will appear here.')}
              />
            ) : (
              <div className='space-y-6'>
                {groupTicketsByEvent(pastTickets).map(group => (
                  <div key={group.event.id} className='space-y-2'>
                    {group.tickets.map(ticket => (
                      <WalletTicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
