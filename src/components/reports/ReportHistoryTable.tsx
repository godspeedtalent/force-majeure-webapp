import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { format } from 'date-fns';

interface ReportHistoryTableProps {
  configId: string;
}

export const ReportHistoryTable = ({ configId }: ReportHistoryTableProps) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['report-history', configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_history')
        .select('*')
        .eq('report_config_id', configId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : history?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No reports sent yet
              </TableCell>
            </TableRow>
          ) : (
            history?.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {format(new Date(entry.sent_at), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>{entry.recipients_count}</TableCell>
                <TableCell>{getStatusBadge(entry.status)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.error_message || '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
