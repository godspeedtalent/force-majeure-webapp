import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { Switch } from '@/components/common/shadcn/switch';
import { Label } from '@/components/common/shadcn/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { ReportScheduleConfig } from './ReportScheduleConfig';
import { ReportRecipientsManager } from './ReportRecipientsManager';
import { ReportHistoryTable } from './ReportHistoryTable';
import { ReportPreviewModal } from './ReportPreviewModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { Send, Eye } from 'lucide-react';
import type { ReportConfiguration } from '@/types/reports';

interface SalesReportConfigProps {
  eventId: string;
}

export const SalesReportConfig = ({ eventId }: SalesReportConfigProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  // Fetch report configuration
  const { data: config, isLoading } = useQuery<ReportConfiguration | null>({
    queryKey: ['report-config', eventId, 'sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_configurations' as any)
        .select('*')
        .eq('event_id', eventId)
        .eq('report_type', 'daily_sales')
        .maybeSingle();

      if (error) throw error;
      return data as unknown as ReportConfiguration | null;
    },
  });

  // Create configuration if it doesn't exist
  const createConfigMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('report_configurations' as any)
        .insert({
          event_id: eventId,
          report_type: 'daily_sales',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-config', eventId, 'sales'] });
      toast.success(tToast('reports.configCreated'));
    },
    onError: (error: Error) => {
      toast.error(tToast('reports.configCreateFailed') + ': ' + error.message);
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!config) throw new Error('No configuration found');

      const { error } = await supabase
        .from('report_configurations' as any)
        .update({ is_active: isActive })
        .eq('id', config.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-config', eventId, 'sales'] });
      toast.success(config?.is_active ? tToast('reports.disabled') : tToast('reports.enabled'));
    },
    onError: (error: Error) => {
      toast.error(tToast('reports.updateFailed') + ': ' + error.message);
    },
  });

  // Send test report
  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-sales-report', {
        body: {
          eventId,
          sendEmail: true,
          recipients: ['test@example.com'], // TODO: Get from form
          reportConfigId: config?.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(tToast('reports.testSent'));
      queryClient.invalidateQueries({ queryKey: ['report-history', config?.id] });
    },
    onError: (error: Error) => {
      toast.error(tToast('reports.testSendFailed') + ': ' + error.message);
    },
  });

  if (isLoading) {
    return <Card className="p-6"><p>{t('status.loading')}</p></Card>;
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.dailySalesReport')}</CardTitle>
          <CardDescription>
            {t('reports.dailySalesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => createConfigMutation.mutate()}>
            {t('reports.enableDailySalesReport')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('reports.dailySalesReport')}</CardTitle>
              <CardDescription>
                {t('reports.automatedExcelDescription')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked: boolean) => toggleActiveMutation.mutate(checked)}
                />
                <Label>{config.is_active ? t('status.on') : t('status.off')}</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schedule">
            <TabsList>
              <TabsTrigger value="schedule">{t('reports.tabs.schedule')}</TabsTrigger>
              <TabsTrigger value="recipients">{t('reports.tabs.recipients')}</TabsTrigger>
              <TabsTrigger value="history">{t('reports.tabs.history')}</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <ReportScheduleConfig configId={config.id} />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('reports.previewReport')}
                </Button>
                <Button
                  onClick={() => sendTestMutation.mutate()}
                  disabled={sendTestMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t('reports.sendTestReport')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="recipients">
              <ReportRecipientsManager configId={config.id} />
            </TabsContent>

            <TabsContent value="history">
              <ReportHistoryTable configId={config.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ReportPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        eventId={eventId}
        reportType="sales"
      />
    </>
  );
};
