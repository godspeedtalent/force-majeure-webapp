import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Edit, Trash2, Power, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmConfigurableDataGrid, DataGridAction } from '@/features/data-grid';
import { useTrackingLinks } from './hooks/useTrackingLinks';
import { TrackingLink } from '@/types/tracking';
import { CreateLinkDialog } from './CreateLinkDialog';
import { TrackingAnalytics } from './TrackingAnalytics';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TrackingLinksManagementProps {
  eventId: string;
}

export function TrackingLinksManagement({ eventId }: TrackingLinksManagementProps) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const { links, isLoading, toggleActive, deleteLink } = useTrackingLinks(eventId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<TrackingLink | null>(null);

  const copyToClipboard = (code: string) => {
    const url = `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/track-link?code=${code}`;
    navigator.clipboard.writeText(url);
    toast.success(tToast('tracking.linkCopied'));
  };

  const getStatusBadge = (link: TrackingLink) => {
    if (!link.is_active) return { text: t('tracking.status.inactive'), color: 'text-muted-foreground' };
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return { text: t('tracking.status.expired'), color: 'text-orange-500' };
    }
    if (link.max_clicks && link.click_count >= link.max_clicks) {
      return { text: t('tracking.status.maxReached'), color: 'text-orange-500' };
    }
    return { text: t('tracking.status.active'), color: 'text-green-500' };
  };

  const columns = [
    {
      key: 'name',
      label: t('labels.name'),
      width: '200px',
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'code',
      label: t('tracking.shortUrl'),
      width: '300px',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded">
            /t/{value}
          </code>
          <button
            className="p-1 hover:bg-muted rounded transition-colors"
            onClick={() => copyToClipboard(value)}
            title={t('tracking.copyLink')}
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ),
    },
    {
      key: 'utm_source',
      label: t('tracking.sourceMedium'),
      width: '150px',
      render: (_: string, row: TrackingLink) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium">{row.utm_source}</span>
          <span className="text-muted-foreground">{row.utm_medium}</span>
        </div>
      ),
    },
    {
      key: 'click_count',
      label: t('tracking.clicks'),
      width: '100px',
      render: (value: number, row: TrackingLink) => (
        <div className="text-center">
          <div className="font-medium">{value}</div>
          {row.max_clicks && (
            <div className="text-xs text-muted-foreground">
              {t('tracking.ofMax', { max: row.max_clicks })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: t('labels.status'),
      width: '120px',
      render: (_: boolean, row: TrackingLink) => {
        const status = getStatusBadge(row);
        return <span className={status.color}>{status.text}</span>;
      },
    },
    {
      key: 'created_at',
      label: t('labels.created'),
      width: '120px',
      render: (value: string) => format(new Date(value), 'MMM d, yyyy'),
    },
  ];

  const contextMenuActions: DataGridAction<TrackingLink>[] = [
    {
      label: t('tracking.copyLink'),
      icon: <Copy className="h-4 w-4" />,
      onClick: (row) => copyToClipboard(row.code),
    },
    {
      label: t('buttons.edit'),
      icon: <Edit className="h-4 w-4" />,
      onClick: (row) => {
        setEditingLink(row);
        setIsCreateDialogOpen(true);
      },
    },
    {
      label: t('tracking.toggleActive'),
      icon: <Power className="h-4 w-4" />,
      onClick: (row) => toggleActive.mutate({ id: row.id, isActive: !row.is_active }),
    },
    {
      label: t('buttons.delete'),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row) => {
        if (confirm(t('tracking.deleteConfirm', { name: row.name }))) {
          deleteLink.mutate(row.id);
        }
      },
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="links" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="links">{t('tracking.tabs.links')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('tracking.tabs.analytics')}</TabsTrigger>
          </TabsList>

          <FmCommonButton
            variant="default"
            onClick={() => {
              setEditingLink(null);
              setIsCreateDialogOpen(true);
            }}
            icon={Plus}
          >
            {t('tracking.createLink')}
          </FmCommonButton>
        </div>

        <TabsContent value="links" className="space-y-4">
          <FmConfigurableDataGrid
            gridId="tracking-links"
            tableName="tracking_links"
            data={links || []}
            columns={columns}
            loading={isLoading}
            contextMenuActions={contextMenuActions}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <TrackingAnalytics eventId={eventId} />
        </TabsContent>
      </Tabs>

      <CreateLinkDialog
        eventId={eventId}
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingLink(null);
        }}
        editingLink={editingLink}
      />
    </div>
  );
}
