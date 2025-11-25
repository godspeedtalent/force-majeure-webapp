import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesReportConfig } from '@/components/reports/SalesReportConfig';
import { AttendanceReportConfig } from '@/components/reports/AttendanceReportConfig';

const Reports = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState('sales');

  if (!eventId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <p className="text-muted-foreground">Event ID is required to view reports.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-2">
          Configure and schedule automated reports for your event
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales">Daily Sales Report</TabsTrigger>
          <TabsTrigger value="attendance">Attendance & Check-in</TabsTrigger>
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
