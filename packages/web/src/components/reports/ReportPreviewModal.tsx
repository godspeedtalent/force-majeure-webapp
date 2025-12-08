import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/common/shadcn/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';

interface ReportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  reportType: 'sales' | 'attendance';
}

export const ReportPreviewModal = ({ open, onOpenChange, eventId, reportType }: ReportPreviewModalProps) => {
  const { data: previewData, isLoading } = useQuery({
    queryKey: ['report-preview', eventId, reportType],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-sales-report', {
        body: {
          eventId,
          sendEmail: false,
        },
      });

      if (error) throw error;
      return data.reportData;
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Preview</DialogTitle>
          <DialogDescription>
            Preview of the {reportType} report email and data
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center">Loading preview...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Summary</h3>
              <div className="border rounded p-4 bg-muted/50">
                {previewData?.summary?.map((row: any[], idx: number) => (
                  <div key={idx} className="flex gap-4">
                    {row.map((cell, cellIdx) => (
                      <span key={cellIdx} className={cellIdx === 0 ? 'font-medium' : ''}>
                        {cell}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Orders ({previewData?.orders?.length - 1 || 0})</h3>
              <p className="text-sm text-muted-foreground">
                Preview shows first few rows. Full report will include all orders.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Analysis</h3>
              <div className="border rounded p-4 bg-muted/50">
                {previewData?.analysis?.map((row: any[], idx: number) => (
                  <div key={idx} className="flex gap-4">
                    {row.map((cell, cellIdx) => (
                      <span key={cellIdx} className={cellIdx === 0 ? 'font-medium' : ''}>
                        {cell}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
