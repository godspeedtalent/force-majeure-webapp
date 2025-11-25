import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import type { ReportConfiguration } from '@/types/reports';

interface ReportScheduleConfigProps {
  configId: string;
}

export const ReportScheduleConfig = ({ configId }: ReportScheduleConfigProps) => {
  const queryClient = useQueryClient();

  const { data: config } = useQuery<ReportConfiguration>({
    queryKey: ['report-schedule', configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_configurations')
        .select('*')
        .eq('id', configId)
        .single();

      if (error) throw error;
      return data as ReportConfiguration;
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
        .from('report_configurations')
        .update(updates)
        .eq('id', configId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedule', configId] });
      toast.success('Schedule updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update schedule: ' + error.message);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
        <Label>Enable Scheduled Sending</Label>
      </div>

      {isScheduled && (
        <>
          <div className="space-y-2">
            <Label>Schedule Type</Label>
            <Select value={scheduleType} onValueChange={setScheduleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly_day">Weekly (Specific Day)</SelectItem>
                <SelectItem value="monthly_day">Monthly (Specific Day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time (CDT)</Label>
            <Input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>

          {scheduleType === 'weekly_day' && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {scheduleType === 'monthly_day' && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
          )}
        </>
      )}

      <Button onClick={() => updateScheduleMutation.mutate()}>
        Save Schedule
      </Button>
    </div>
  );
};
