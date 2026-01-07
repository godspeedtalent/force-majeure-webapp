import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { Layout } from '@/components/layout/Layout';
import {
  FmCommonTabs,
  FmCommonTabsContent,
  FmCommonTabsList,
  FmCommonTabsTrigger,
} from '@/components/common/navigation/FmCommonTabs';
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
      <Layout>
        <div className="container mx-auto p-6">
          <FmCommonCard className="p-6">
            <p className="text-muted-foreground">{t('reports.eventIdRequired')}</p>
          </FmCommonCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.pageTitle')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('reports.pageDescription')}
          </p>
        </div>

        <FmCommonTabs value={activeTab} onValueChange={setActiveTab}>
          <FmCommonTabsList>
            <FmCommonTabsTrigger value="sales">{t('reports.dailySalesReport')}</FmCommonTabsTrigger>
            <FmCommonTabsTrigger value="attendance">{t('reports.attendance.title')}</FmCommonTabsTrigger>
          </FmCommonTabsList>

          <FmCommonTabsContent value="sales" className="mt-6">
            <SalesReportConfig eventId={eventId} />
          </FmCommonTabsContent>

          <FmCommonTabsContent value="attendance" className="mt-6">
            <AttendanceReportConfig eventId={eventId} />
          </FmCommonTabsContent>
        </FmCommonTabs>
      </div>
    </Layout>
  );
};

export default Reports;
