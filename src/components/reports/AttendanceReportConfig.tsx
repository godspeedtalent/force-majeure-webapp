import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AttendanceReportConfigProps {
  eventId?: string;
}

export const AttendanceReportConfig = ({ eventId: _eventId }: AttendanceReportConfigProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance & Check-in Report</CardTitle>
        <CardDescription>
          Track attendance and check-in data for your event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          This report is coming soon. It will include:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
          <li>Total check-ins vs. tickets sold</li>
          <li>Check-in timeline and peaks</li>
          <li>No-show analysis</li>
          <li>Ticket tier breakdown</li>
        </ul>
        <Button disabled>Coming Soon</Button>
      </CardContent>
    </Card>
  );
};
