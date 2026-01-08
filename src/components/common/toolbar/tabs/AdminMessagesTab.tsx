import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link2,
  Trash2,
  Unlink,
  Clock,
  CheckCircle2,
  User,
  MapPin,
  Music,
  Building2,
  RefreshCw,
  Inbox,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger, cn } from '@/shared';
import { Separator } from '@/components/common/shadcn/separator';
import { AdminMessagesSection } from '@/components/DevTools/AdminMessagesSection';
import { Badge } from '@/components/common/shadcn/badge';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  FmCommonTabs,
  FmCommonTabsContent,
  FmCommonTabsList,
  FmCommonTabsTrigger,
} from '@/components/common/navigation/FmCommonTabs';

interface UserRequest {
  id: string;
  request_type:
    | 'link_artist'
    | 'delete_data'
    | 'unlink_artist'
    | 'delete_venue'
    | 'delete_artist'
    | 'delete_organization';
  status: 'pending' | 'approved' | 'denied';
  user_id: string;
  parameters: Record<string, unknown> | null;
  created_at: string;
  user?: {
    email: string;
    display_name: string | null;
  };
}

const REQUEST_TYPE_ICONS: Record<string, React.ReactNode> = {
  link_artist: <Link2 className='h-4 w-4' />,
  delete_data: <Trash2 className='h-4 w-4' />,
  unlink_artist: <Unlink className='h-4 w-4' />,
  delete_venue: <MapPin className='h-4 w-4' />,
  delete_artist: <Music className='h-4 w-4' />,
  delete_organization: <Building2 className='h-4 w-4' />,
};

function UserRequestsSection() {
  const { t } = useTranslation('common');
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch pending requests
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: requestsData, error: requestsError } = await (supabase as any)
        .from('user_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) {
        logger.error('Failed to fetch user requests', { error: requestsError.message });
        toast.error(t('adminMessages.loadError'));
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set((requestsData as UserRequest[])?.map(r => r.user_id) || [])];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Combine data
        const enrichedRequests = (requestsData || []).map((request: UserRequest) => ({
          ...request,
          user: profileMap.get(request.user_id),
        }));

        setRequests(enrichedRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      logger.error('Failed to load user requests', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error(t('adminMessages.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  const REQUEST_TYPE_LABELS: Record<string, string> = {
    link_artist: t('admin.requests.linkArtist'),
    delete_data: t('admin.requests.deleteData'),
    unlink_artist: t('admin.requests.unlinkArtist'),
    delete_venue: t('admin.requests.deleteVenue'),
    delete_artist: t('admin.requests.deleteArtist'),
    delete_organization: t('admin.requests.deleteOrganization'),
  };

  return (
    <div className='space-y-3'>
      {/* Header with pending count */}
      {requests.length > 0 && (
        <div className='flex items-center gap-2 px-2 py-1.5 bg-fm-gold/10 border border-fm-gold/30'>
          <Inbox className='h-4 w-4 text-fm-gold' />
          <span className='text-sm text-fm-gold'>
            {t('adminMessages.pendingRequests', { count: requests.length })}
          </span>
        </div>
      )}

      {/* Refresh button */}
      <div className='flex justify-end'>
        <FmCommonButton
          variant='default'
          size='sm'
          onClick={loadRequests}
          className='h-9 w-9 p-0 border-white/20 hover:border-fm-gold'
          title={t('actions.refresh')}
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </FmCommonButton>
      </div>

      {/* Requests List */}
      <ScrollArea className='h-[calc(100vh-400px)] min-h-[200px] pr-2'>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <FmCommonLoadingSpinner size='md' />
          </div>
        ) : requests.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            <CheckCircle2 className='h-8 w-8 mx-auto mb-2 text-green-500' />
            <p>{t('admin.requests.noPendingRequests')}</p>
          </div>
        ) : (
          <div className='space-y-[2px]'>
            {requests.map(request => (
              <div
                key={request.id}
                className={cn(
                  'w-full text-left p-3 border border-border transition-all duration-200',
                  'hover:border-fm-gold/50 hover:bg-white/5',
                  'bg-fm-gold/5 border-fm-gold/30'
                )}
              >
                <div className='flex items-start gap-3'>
                  {/* Type Icon */}
                  <div className={cn(
                    'p-1.5 flex-shrink-0',
                    request.request_type.startsWith('delete')
                      ? 'bg-fm-danger/10 text-fm-danger'
                      : 'bg-fm-gold/10 text-fm-gold'
                  )}>
                    {REQUEST_TYPE_ICONS[request.request_type]}
                  </div>

                  <div className='flex-1 min-w-0'>
                    {/* Header Row */}
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-medium text-white truncate'>
                        {REQUEST_TYPE_LABELS[request.request_type]}
                      </span>
                      <Badge variant='outline' className='flex-shrink-0'>
                        <Clock className='h-3 w-3 mr-1' />
                        {t('status.pending')}
                      </Badge>
                    </div>

                    {/* User Info */}
                    <div className='flex items-center gap-2 text-sm text-muted-foreground mt-1'>
                      <User className='h-3 w-3' />
                      <span className='truncate'>
                        {request.user?.display_name || request.user?.email || t('globalSearch.unknownUser')}
                      </span>
                    </div>

                    {/* Date */}
                    <div className='text-xs text-muted-foreground mt-1'>
                      {formatDate(request.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Link to full admin page */}
      {requests.length > 0 && (
        <div className='text-center pt-2'>
          <span className='text-xs text-muted-foreground'>
            {t('adminMessages.viewFullRequests')}
          </span>
        </div>
      )}
    </div>
  );
}

export function AdminMessagesTabContent() {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <FmCommonTabs defaultValue='requests'>
        <FmCommonTabsList className='w-full'>
          <FmCommonTabsTrigger value='requests' className='flex-1'>
            <Inbox className='h-4 w-4 mr-2' />
            {t('adminMessages.tabs.requests')}
          </FmCommonTabsTrigger>
          <FmCommonTabsTrigger value='messages' className='flex-1'>
            <Mail className='h-4 w-4 mr-2' />
            {t('adminMessages.tabs.messages')}
          </FmCommonTabsTrigger>
        </FmCommonTabsList>

        <FmCommonTabsContent value='requests' className='mt-4'>
          <UserRequestsSection />
        </FmCommonTabsContent>

        <FmCommonTabsContent value='messages' className='mt-4'>
          <AdminMessagesSection />
        </FmCommonTabsContent>
      </FmCommonTabs>
    </div>
  );
}