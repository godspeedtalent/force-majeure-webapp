import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { SalesReportConfig } from '@/components/reports/SalesReportConfig';
import { AttendanceReportConfig } from '@/components/reports/AttendanceReportConfig';

interface ReportsProps {
  eventId?: string;
}

const Reports = ({ eventId }: ReportsProps) => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState('sales');

  if (!eventId) {
    return (
      <div className="container mx-auto p-6">
        <FmCommonCard className="p-6">
          <p className="text-muted-foreground">{t('reports.eventIdRequired')}</p>
        </FmCommonCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('reports.pageTitle')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('reports.pageDescription')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales">{t('reports.dailySalesReport')}</TabsTrigger>
          <TabsTrigger value="attendance">{t('reports.attendance.title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <SalesReportConfig eventId={eventId} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceReportConfig eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
