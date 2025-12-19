import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/shadcn/select';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@force-majeure/shared';
import { toast } from 'sonner';
import type { ReportConfiguration } from '@/types/reports';

interface ReportScheduleConfigProps {
  configId: string;
}

export const ReportScheduleConfig = ({ configId }: ReportScheduleConfigProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();

  const { data: config } = useQuery<ReportConfiguration>({
    queryKey: ['report-schedule', configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_configurations' as any)
        .select('*')
        .eq('id', configId)
        .single();

      if (error) throw error;
      return data as unknown as ReportConfiguration;
    },
  });

  const [isScheduled, setIsScheduled] = useState(config?.is_scheduled || false);
  const [scheduleType, setScheduleType] = useState(config?.schedule_type || 'daily');
  const [scheduleTime, setScheduleTime] = useState(config?.schedule_time || '09:00');
  const [dayOfWeek, setDayOfWeek] = useState(config?.schedule_day_of_week?.toString() || '1');
  const [dayOfMonth, setDayOfMonth] = useState(config?.schedule_day_of_month?.toString() || '1');

  const updateScheduleMutation = useMutation({
    mutationFn: async () => {
      const updates: any = {
        is_scheduled: isScheduled,
        schedule_type: scheduleType,
        schedule_time: scheduleTime,
      };

      if (scheduleType === 'weekly_day') {
        updates.schedule_day_of_week = parseInt(dayOfWeek);
      } else if (scheduleType === 'monthly_day') {
        updates.schedule_day_of_month = parseInt(dayOfMonth);
      }

      const { error } = await supabase
        .from('report_configurations' as any)
        .update(updates)
        .eq('id', configId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedule', configId] });
      toast.success(tToast('reports.scheduleUpdated'));
    },
    onError: (error: Error) => {
      toast.error(tToast('reports.scheduleUpdateFailed') + ': ' + error.message);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
        <Label>{t('reports.schedule.enableScheduledSending')}</Label>
      </div>

      {isScheduled && (
        <>
          <div className="space-y-2">
            <Label>{t('reports.schedule.scheduleType')}</Label>
            <Select value={scheduleType} onValueChange={setScheduleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t('reports.schedule.daily')}</SelectItem>
                <SelectItem value="weekly">{t('reports.schedule.weekly')}</SelectItem>
                <SelectItem value="monthly">{t('reports.schedule.monthly')}</SelectItem>
                <SelectItem value="weekly_day">{t('reports.schedule.weeklySpecificDay')}</SelectItem>
                <SelectItem value="monthly_day">{t('reports.schedule.monthlySpecificDay')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('reports.schedule.timeCDT')}</Label>
            <Input
              type="time"
              value={scheduleTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduleTime(e.target.value)}
            />
          </div>

          {scheduleType === 'weekly_day' && (
            <div className="space-y-2">
              <Label>{t('reports.schedule.dayOfWeek')}</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('reports.schedule.days.sunday')}</SelectItem>
                  <SelectItem value="1">{t('reports.schedule.days.monday')}</SelectItem>
                  <SelectItem value="2">{t('reports.schedule.days.tuesday')}</SelectItem>
                  <SelectItem value="3">{t('reports.schedule.days.wednesday')}</SelectItem>
                  <SelectItem value="4">{t('reports.schedule.days.thursday')}</SelectItem>
                  <SelectItem value="5">{t('reports.schedule.days.friday')}</SelectItem>
                  <SelectItem value="6">{t('reports.schedule.days.saturday')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {scheduleType === 'monthly_day' && (
            <div className="space-y-2">
              <Label>{t('reports.schedule.dayOfMonth')}</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDayOfMonth(e.target.value)}
              />
            </div>
          )}
        </>
      )}

      <Button onClick={() => updateScheduleMutation.mutate()}>
        {t('reports.schedule.saveSchedule')}
      </Button>
    </div>
  );
};
