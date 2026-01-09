import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
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
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">{t('reports.eventIdRequired')}</p>
      </div>
    );
  }

  return (
    <FmFormSection
      title={t('reports.pageTitle')}
      description={t('reports.pageDescription')}
      icon={FileText}
    >
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
    </FmFormSection>
  );
};

export default Reports;
