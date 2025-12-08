import { useState } from 'react';
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
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { Send, Eye } from 'lucide-react';
import type { ReportConfiguration } from '@/types/reports';

interface SalesReportConfigProps {
  eventId: string;
}

export const SalesReportConfig = ({ eventId }: SalesReportConfigProps) => {
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
      toast.success('Report configuration created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create configuration: ' + error.message);
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
      toast.success(config?.is_active ? 'Report disabled' : 'Report enabled');
    },
    onError: (error: Error) => {
      toast.error('Failed to update: ' + error.message);
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
      toast.success('Test report sent successfully');
      queryClient.invalidateQueries({ queryKey: ['report-history', config?.id] });
    },
    onError: (error: Error) => {
      toast.error('Failed to send test report: ' + error.message);
    },
  });

  if (isLoading) {
    return <Card className="p-6"><p>Loading...</p></Card>;
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Report</CardTitle>
          <CardDescription>
            Get automated daily sales reports with comprehensive order data and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => createConfigMutation.mutate()}>
            Enable Daily Sales Report
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
              <CardTitle>Daily Sales Report</CardTitle>
              <CardDescription>
                Automated Excel report with summary, orders, and detailed analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked: boolean) => toggleActiveMutation.mutate(checked)}
                />
                <Label>{config.is_active ? 'Enabled' : 'Disabled'}</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schedule">
            <TabsList>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <ReportScheduleConfig configId={config.id} />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Report
                </Button>
                <Button
                  onClick={() => sendTestMutation.mutate()}
                  disabled={sendTestMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Report
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
