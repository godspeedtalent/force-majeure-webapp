import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ArrowUpDown,
  Filter,
  Mail,
  MailOpen,
  Reply,
  Archive,
  Trash2,
  ExternalLink,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger, cn } from '@/shared';
import { Input } from '@/components/common/shadcn/input';
import { Separator } from '@/components/common/shadcn/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import {
  FmMultiCheckboxInput,
  FmMultiCheckboxOption,
} from '@/components/common/forms/FmMultiCheckboxInput';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';

type MessageStatus = 'unread' | 'read' | 'replied' | 'archived';
type SortField = 'created_at' | 'name' | 'email' | 'status';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: MessageStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  replied_at: string | null;
  replied_by: string | null;
}

const STATUS_CONFIG: Record<MessageStatus, { label: string; icon: typeof Mail; color: string }> = {
  unread: { label: 'Unread', icon: Mail, color: 'text-fm-gold' },
  read: { label: 'Read', icon: MailOpen, color: 'text-white/70' },
  replied: { label: 'Replied', icon: Reply, color: 'text-green-400' },
  archived: { label: 'Archived', icon: Archive, color: 'text-muted-foreground' },
};

const SORT_FIELD_LABELS: Record<SortField, string> = {
  created_at: 'Date',
  name: 'Name',
  email: 'Email',
  status: 'Status',
};

export const AdminMessagesSection = () => {
  const { t } = useTranslation('common');
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<MessageStatus[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState<ContactSubmission | null>(null);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      // Note: contact_submissions table types will be available after migration runs
      // Using type assertion until types are regenerated
      const { data, error } = await (supabase
        .from('contact_submissions' as 'profiles') // Type assertion for unmigrated table
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' }) as unknown as Promise<{ data: ContactSubmission[] | null; error: Error | null }>);

      if (error) {
        logger.error('Failed to load contact submissions', { error: error.message });
        toast.error(t('adminMessages.loadError'));
        return;
      }

      setMessages(data || []);
    } catch (error) {
      logger.error('Failed to load contact submissions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error(t('adminMessages.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [sortField, sortOrder, t]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const updateMessageStatus = async (id: string, status: MessageStatus) => {
    try {
      const updateData: Partial<ContactSubmission> = { status };
      if (status === 'replied') {
        updateData.replied_at = new Date().toISOString();
      }

      // Type assertion for unmigrated table
      const { error } = await (supabase
        .from('contact_submissions' as 'profiles')
        .update(updateData as Record<string, unknown>)
        .eq('id', id) as unknown as Promise<{ error: Error | null }>);

      if (error) {
        logger.error('Failed to update message status', { error: error.message });
        toast.error(t('adminMessages.updateError'));
        return;
      }

      toast.success(t('adminMessages.statusUpdated'));
      loadMessages();
    } catch (error) {
      logger.error('Failed to update message status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error(t('adminMessages.updateError'));
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      // Type assertion for unmigrated table
      const { error } = await (supabase
        .from('contact_submissions' as 'profiles')
        .delete()
        .eq('id', id) as unknown as Promise<{ error: Error | null }>);

      if (error) {
        logger.error('Failed to delete message', { error: error.message });
        toast.error(t('adminMessages.deleteError'));
        return;
      }

      toast.success(t('adminMessages.deleted'));
      setExpandedMessage(null);
      loadMessages();
    } catch (error) {
      logger.error('Failed to delete message', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error(t('adminMessages.deleteError'));
    }
  };

  // Filter and sort messages
  const filteredMessages = messages
    .filter(msg => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !msg.name.toLowerCase().includes(query) &&
          !msg.email.toLowerCase().includes(query) &&
          !(msg.subject?.toLowerCase().includes(query)) &&
          !msg.message.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      // Status filter
      if (filterStatuses.length > 0 && !filterStatuses.includes(msg.status)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const statusOptions: FmMultiCheckboxOption[] = [
    { value: 'unread', label: t('adminMessages.statuses.unread') },
    { value: 'read', label: t('adminMessages.statuses.read') },
    { value: 'replied', label: t('adminMessages.statuses.replied') },
    { value: 'archived', label: t('adminMessages.statuses.archived') },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  const handleMessageClick = (message: ContactSubmission) => {
    setExpandedMessage(message);
    // Mark as read if unread
    if (message.status === 'unread') {
      updateMessageStatus(message.id, 'read');
    }
  };

  const openEmailClient = (email: string, subject: string | null) => {
    const mailtoSubject = subject ? `Re: ${subject}` : 'Re: Your message to Force Majeure';
    window.open(`mailto:${email}?subject=${encodeURIComponent(mailtoSubject)}`, '_blank');
  };

  return (
    <div className='space-y-3'>
      {/* Header with unread count */}
      {unreadCount > 0 && (
        <div className='flex items-center gap-2 px-2 py-1.5 bg-fm-gold/10 border border-fm-gold/30'>
          <Mail className='h-4 w-4 text-fm-gold' />
          <span className='text-sm text-fm-gold'>
            {t('adminMessages.unreadCount', { count: unreadCount })}
          </span>
        </div>
      )}

      {/* Search Row */}
      <div className='flex gap-2 items-center'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder={t('adminMessages.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-9 bg-muted border-border text-white rounded-none h-9'
          />
        </div>
        <FmCommonButton
          variant='default'
          size='sm'
          onClick={loadMessages}
          className='h-9 w-9 p-0 border-white/20 hover:border-fm-gold'
          title={t('actions.refresh')}
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </FmCommonButton>
      </div>

      {/* Filter and Sort Row */}
      <div className='flex gap-2 items-center'>
        {/* Filter Button */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <FmCommonButton variant='default' size='sm' className='h-8 text-xs'>
              <Filter className='h-3 w-3' />
              {t('adminMessages.filter')}
            </FmCommonButton>
          </PopoverTrigger>
          <PopoverContent
            className='w-[220px] bg-card border-border rounded-none p-0'
            align='start'
          >
            <ScrollArea className='max-h-[50vh] p-3'>
              <div className='space-y-3'>
                <div>
                  <div className='text-xs text-muted-foreground mb-1.5 block'>
                    {t('adminMessages.filterLabels.status')}
                  </div>
                  <FmMultiCheckboxInput
                    options={statusOptions}
                    selectedValues={filterStatuses}
                    onSelectionChange={values => setFilterStatuses(values as MessageStatus[])}
                  />
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Sort Field Dropdown */}
        <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
          <SelectTrigger className='h-8 w-[90px] bg-muted border-white/20 rounded-none hover:border-fm-gold transition-colors text-xs'>
            <SelectValue placeholder={t('adminMessages.sortBy')} />
          </SelectTrigger>
          <SelectContent className='bg-card border-border rounded-none'>
            {(Object.keys(SORT_FIELD_LABELS) as SortField[]).map(field => (
              <SelectItem key={field} value={field} className='text-xs'>
                {SORT_FIELD_LABELS[field]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Order Toggle */}
        <FmCommonButton
          variant='secondary'
          size='sm'
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className='h-8 w-8 p-0 border-white/20 rounded-none hover:border-fm-gold transition-colors'
          title={sortOrder === 'asc' ? t('adminMessages.ascending') : t('adminMessages.descending')}
        >
          <ArrowUpDown className='h-3 w-3' />
        </FmCommonButton>

        {/* Spacer */}
        <div className='flex-1' />

        {/* Count */}
        <span className='text-xs text-muted-foreground'>
          {t('adminMessages.messagesCount', { count: filteredMessages.length })}
        </span>
      </div>

      {/* Divider */}
      <Separator className='bg-white/10' />

      {/* Messages List */}
      <div>
        <ScrollArea className='h-[calc(100vh-320px)] min-h-[300px] pr-2'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <FmCommonLoadingSpinner size='md' />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              {searchQuery || filterStatuses.length > 0
                ? t('adminMessages.noMatchingMessages')
                : t('adminMessages.noMessages')}
            </div>
          ) : (
            <div className='space-y-[2px]'>
              {filteredMessages.map(message => {
                const statusConfig = STATUS_CONFIG[message.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <button
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={cn(
                      'w-full text-left p-3 border border-border transition-all duration-200',
                      'hover:border-fm-gold/50 hover:bg-white/5',
                      message.status === 'unread' && 'bg-fm-gold/5 border-fm-gold/30'
                    )}
                  >
                    <div className='flex items-start gap-3'>
                      {/* Status Icon */}
                      <StatusIcon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', statusConfig.color)} />

                      <div className='flex-1 min-w-0'>
                        {/* Header Row */}
                        <div className='flex items-center justify-between gap-2'>
                          <span
                            className={cn(
                              'font-medium truncate',
                              message.status === 'unread' ? 'text-white' : 'text-white/80'
                            )}
                          >
                            {message.name}
                          </span>
                          <span className='text-xs text-muted-foreground flex-shrink-0'>
                            {formatDate(message.created_at)}
                          </span>
                        </div>

                        {/* Subject */}
                        {message.subject && (
                          <div className='text-sm text-white/70 truncate mt-0.5'>
                            {message.subject}
                          </div>
                        )}

                        {/* Message Preview */}
                        <div className='text-xs text-muted-foreground truncate mt-1'>
                          {message.message.substring(0, 80)}
                          {message.message.length > 80 && '...'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Expanded Message Modal */}
      {expandedMessage && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className='fixed inset-0 bg-black/95 z-[60] flex flex-col'
          onClick={() => setExpandedMessage(null)}
        >
          <div
            className='flex-1 flex flex-col w-full h-full max-w-4xl mx-auto'
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex items-center justify-between p-[20px] border-b border-border bg-card/50'>
              <div className='flex items-center gap-4'>
                {/* Status Icon */}
                <div
                  className={cn(
                    'w-12 h-12 border border-border flex items-center justify-center',
                    STATUS_CONFIG[expandedMessage.status].color
                  )}
                >
                  {(() => {
                    const IconComponent = STATUS_CONFIG[expandedMessage.status].icon;
                    return <IconComponent className='h-6 w-6' />;
                  })()}
                </div>

                {/* Sender Info */}
                <div className='flex flex-col'>
                  <span className='text-lg font-medium text-white'>{expandedMessage.name}</span>
                  <a
                    href={`mailto:${expandedMessage.email}`}
                    className='text-sm text-fm-gold hover:underline'
                  >
                    {expandedMessage.email}
                  </a>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setExpandedMessage(null)}
                className='p-2 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Subject */}
            {expandedMessage.subject && (
              <div className='px-[20px] py-3 border-b border-border bg-card/30'>
                <span className='text-xs text-muted-foreground uppercase tracking-wider'>
                  {t('adminMessages.subject')}
                </span>
                <h2 className='text-white font-medium mt-1'>{expandedMessage.subject}</h2>
              </div>
            )}

            {/* Message Content */}
            <div className='flex-1 p-[20px] overflow-auto'>
              <p className='text-white text-base leading-relaxed whitespace-pre-wrap'>
                {expandedMessage.message}
              </p>
            </div>

            {/* Footer with Actions */}
            <div className='p-[20px] border-t border-border bg-card/50'>
              <div className='flex items-center justify-between'>
                {/* Date */}
                <div className='text-sm text-muted-foreground'>
                  {t('adminMessages.received')}: {formatDate(expandedMessage.created_at)}
                </div>

                {/* Action Buttons */}
                <div className='flex items-center gap-2'>
                  {/* Reply via email */}
                  <FmCommonButton
                    variant='default'
                    size='sm'
                    onClick={() => {
                      openEmailClient(expandedMessage.email, expandedMessage.subject);
                      updateMessageStatus(expandedMessage.id, 'replied');
                    }}
                    className='border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white'
                  >
                    <ExternalLink className='h-4 w-4 mr-2' />
                    {t('adminMessages.replyViaEmail')}
                  </FmCommonButton>

                  {/* Mark as read/unread */}
                  {expandedMessage.status === 'read' && (
                    <FmCommonButton
                      variant='secondary'
                      size='sm'
                      onClick={() => updateMessageStatus(expandedMessage.id, 'unread')}
                      className='border-white/20 hover:border-fm-gold'
                    >
                      <Mail className='h-4 w-4 mr-2' />
                      {t('adminMessages.markUnread')}
                    </FmCommonButton>
                  )}

                  {/* Archive */}
                  {expandedMessage.status !== 'archived' && (
                    <FmCommonButton
                      variant='secondary'
                      size='sm'
                      onClick={() => {
                        updateMessageStatus(expandedMessage.id, 'archived');
                        setExpandedMessage(null);
                      }}
                      className='border-white/20 hover:border-fm-gold'
                    >
                      <Archive className='h-4 w-4 mr-2' />
                      {t('adminMessages.archive')}
                    </FmCommonButton>
                  )}

                  {/* Delete */}
                  <FmCommonButton
                    variant='secondary'
                    size='sm'
                    onClick={() => deleteMessage(expandedMessage.id)}
                    className='border-red-500/50 text-red-400 hover:bg-red-500/10'
                  >
                    <Trash2 className='h-4 w-4 mr-2' />
                    {t('actions.delete')}
                  </FmCommonButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};