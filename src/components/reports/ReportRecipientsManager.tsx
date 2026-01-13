import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/shadcn/table';
import { FmCommonEmailField, isValidEmail } from '@/components/common/forms/FmCommonEmailField';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import type { ReportRecipient } from '@/types/reports';

interface ReportRecipientsManagerProps {
  configId: string;
}

export const ReportRecipientsManager = ({ configId }: ReportRecipientsManagerProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
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
      if (!isValidEmail(newEmail)) throw new Error('Invalid email format');

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
      toast.success(tToast('reports.recipientAdded'));
    },
    onError: (error: Error) => {
      toast.error(tToast('reports.recipientAddFailed') + ': ' + error.message);
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
      toast.success(tToast('reports.recipientRemoved'));
    },
    onError: (error: Error) => {
      toast.error(tToast('reports.recipientRemoveFailed') + ': ' + error.message);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <FmCommonEmailField
            label={t('labels.email')}
            placeholder={t('placeholders.email')}
            value={newEmail}
            onChange={setNewEmail}
            validateOnBlur
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>{t('reports.recipients.nameOptional')}</Label>
          <Input
            placeholder={t('placeholders.fullName')}
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={() => addRecipientMutation.mutate()}>
            <Plus className="w-4 h-4 mr-2" />
            {t('reports.recipients.add')}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('labels.email')}</TableHead>
              <TableHead>{t('labels.name')}</TableHead>
              <TableHead className="w-[100px]">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">{t('status.loading')}</TableCell>
              </TableRow>
            ) : recipients?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {t('reports.recipients.noRecipientsYet')}
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
