import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Edit, Trash2, Power, Plus, Link2 } from 'lucide-react';
import {
  FmCommonTabs,
  FmCommonTabsContent,
  FmCommonTabsList,
  FmCommonTabsTrigger,
} from '@/components/common/navigation/FmCommonTabs';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
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
  const [linkToDelete, setLinkToDelete] = useState<TrackingLink | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        setLinkToDelete(row);
        setShowDeleteConfirm(true);
      },
      variant: 'destructive' as const,
    },
  ];

  const handleDeleteConfirm = () => {
    if (linkToDelete) {
      deleteLink.mutate(linkToDelete.id);
      setShowDeleteConfirm(false);
      setLinkToDelete(null);
    }
  };

  return (
    <FmFormSection
      title={t('tracking.title')}
      description={t('tracking.description')}
      icon={Link2}
    >
      <FmCommonTabs defaultValue="links" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <FmCommonTabsList>
            <FmCommonTabsTrigger value="links">{t('tracking.tabs.links')}</FmCommonTabsTrigger>
            <FmCommonTabsTrigger value="analytics">{t('tracking.tabs.analytics')}</FmCommonTabsTrigger>
          </FmCommonTabsList>

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

        <FmCommonTabsContent value="links" className="space-y-4">
          <FmConfigurableDataGrid
            gridId="tracking-links"
            tableName="tracking_links"
            data={links || []}
            columns={columns}
            loading={isLoading}
            contextMenuActions={contextMenuActions}
          />
        </FmCommonTabsContent>

        <FmCommonTabsContent value="analytics">
          <TrackingAnalytics eventId={eventId} />
        </FmCommonTabsContent>
      </FmCommonTabs>

      <CreateLinkDialog
        eventId={eventId}
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingLink(null);
        }}
        editingLink={editingLink}
      />

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('buttons.delete')}
        description={t('tracking.deleteConfirm', { name: linkToDelete?.name })}
        confirmText={t('buttons.delete')}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </FmFormSection>
  );
}
