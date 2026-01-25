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
import { supabase, cn, handleError } from '@/shared';
import { Separator } from '@/components/common/shadcn/separator';
import { AdminMessagesSection } from '@/components/DevTools/AdminMessagesSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  FmCommonTabs,
  FmCommonTabsContent,
  FmCommonTabsList,
  FmCommonTabsTrigger,
} from '@/components/common/navigation/FmCommonTabs';
import { UserRequestDetailsModal } from './UserRequestDetailsModal';

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
  artist?: {
    id: string;
    name: string;
    image_url: string | null;
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
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        handleError(requestsError, {
          title: t('adminMessages.loadError'),
          context: 'AdminMessagesTab.loadRequests',
          endpoint: 'user_requests',
        });
        setRequests([]);
        setIsLoading(false);
        return;
      }

      // If no requests, set empty and return early
      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setIsLoading(false);
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set((requestsData as UserRequest[]).map(r => r.user_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch artist info for link requests
      const artistIds = (requestsData as UserRequest[])
        .filter(r => r.parameters && 'artist_id' in r.parameters)
        .map(r => (r.parameters as { artist_id?: string })?.artist_id)
        .filter((id): id is string => !!id);

      let artistMap = new Map<string, { id: string; name: string; image_url: string | null }>();
      if (artistIds.length > 0) {
        const { data: artists } = await supabase
          .from('artists')
          .select('id, name, image_url')
          .in('id', artistIds);
        artistMap = new Map(artists?.map(a => [a.id, a]) || []);
      }

      // Combine data
      const enrichedRequests = requestsData.map((request: UserRequest) => ({
        ...request,
        user: profileMap.get(request.user_id),
        artist: request.parameters && 'artist_id' in request.parameters
          ? artistMap.get((request.parameters as { artist_id: string }).artist_id)
          : undefined,
      }));

      setRequests(enrichedRequests);
    } catch (error: unknown) {
      handleError(error, {
        title: t('adminMessages.loadError'),
        context: 'AdminMessagesTab.loadRequests',
        endpoint: 'user_requests',
      });
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Relative time format: "2m", "3h", "1d"
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
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
          <div className='divide-y divide-border/30'>
            {requests.map(request => (
              <button
                key={request.id}
                onClick={() => {
                  setSelectedRequest(request);
                  setIsModalOpen(true);
                }}
                className={cn(
                  'w-full text-left transition-all duration-150 group',
                  'border-l-2 hover:bg-white/5',
                  'border-transparent hover:border-fm-gold/50',
                  'cursor-pointer focus:outline-none focus:bg-white/5'
                )}
              >
                {/* Row 1: Icon + Type + Pending Badge */}
                <div className='flex items-center gap-1.5 px-1.5 py-1'>
                  {/* Type Icon */}
                  <div className={cn(
                    'w-5 h-5 flex items-center justify-center flex-shrink-0',
                    request.request_type.startsWith('delete')
                      ? 'text-fm-danger'
                      : 'text-fm-gold'
                  )}>
                    {REQUEST_TYPE_ICONS[request.request_type]}
                  </div>

                  {/* Request Type Label */}
                  <span className='flex-1 min-w-0 text-[11px] text-white/90 truncate'>
                    {REQUEST_TYPE_LABELS[request.request_type]}
                  </span>

                  {/* Pending Badge - Compact */}
                  <span className='text-[9px] text-fm-gold/80 flex items-center gap-0.5 flex-shrink-0'>
                    <Clock className='h-2.5 w-2.5' />
                    {t('status.pending')}
                  </span>
                </div>

                {/* Row 2: User + Time */}
                <div className='flex items-center gap-1.5 px-1.5 pb-1.5 pl-[26px]'>
                  <User className='h-2.5 w-2.5 text-muted-foreground flex-shrink-0' />
                  <span className='text-[10px] text-muted-foreground truncate flex-1'>
                    {request.user?.display_name || request.user?.email || t('globalSearch.unknownUser')}
                  </span>
                  <span className='text-[9px] text-muted-foreground flex-shrink-0'>
                    {formatRelativeTime(request.created_at)}
                  </span>
                </div>
              </button>
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

      {/* Request Details Modal */}
      <UserRequestDetailsModal
        request={selectedRequest}
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setSelectedRequest(null);
        }}
        onActionComplete={loadRequests}
      />
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