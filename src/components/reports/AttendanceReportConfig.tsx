import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';

interface AttendanceReportConfigProps {
  eventId?: string;
}

export const AttendanceReportConfig = ({ eventId: _eventId }: AttendanceReportConfigProps) => {
  const { t } = useTranslation('common');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.attendance.title')}</CardTitle>
        <CardDescription>
          {t('reports.attendance.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          {t('reports.attendance.comingSoonText')}
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li>{t('reports.attendance.checkInsVsTickets')}</li>
          <li>{t('reports.attendance.checkInTimeline')}</li>
          <li>{t('reports.attendance.noShowAnalysis')}</li>
          <li>{t('reports.attendance.tierBreakdown')}</li>
        </ul>
        <Button disabled>{t('reports.attendance.comingSoon')}</Button>
      </CardContent>
    </Card>
  );
};
