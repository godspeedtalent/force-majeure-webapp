import { useState } from 'react';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/shadcn/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@force-majeure/shared/api/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import type { ReportRecipient } from '@/types/reports';

interface ReportRecipientsManagerProps {
  configId: string;
}

export const ReportRecipientsManager = ({ configId }: ReportRecipientsManagerProps) => {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const { data: recipients, isLoading } = useQuery<ReportRecipient[]>({
    queryKey: ['report-recipients', configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_recipients' as any)
        .select('*')
        .eq('report_config_id', configId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ReportRecipient[];
    },
  });

  const addRecipientMutation = useMutation({
    mutationFn: async () => {
      if (!newEmail) throw new Error('Email is required');

      const { error } = await supabase
        .from('report_recipients' as any)
        .insert({
          report_config_id: configId,
          email: newEmail,
          name: newName || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-recipients', configId] });
      setNewEmail('');
      setNewName('');
      toast.success('Recipient added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add recipient: ' + error.message);
    },
  });

  const removeRecipientMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const { error } = await supabase
        .from('report_recipients' as any)
        .delete()
        .eq('id', recipientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-recipients', configId] });
      toast.success('Recipient removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove recipient: ' + error.message);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={newEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>Name (optional)</Label>
          <Input
            placeholder="John Doe"
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={() => addRecipientMutation.mutate()}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : recipients?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No recipients added yet
                </TableCell>
              </TableRow>
            ) : (
              recipients?.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell>{recipient.email}</TableCell>
                  <TableCell>{recipient.name || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipientMutation.mutate(recipient.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
