import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/common/shadcn/alert-dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase, logger } from '@/shared';
import { toast } from 'sonner';

interface DeleteAccountSectionProps {
  disabled?: boolean;
}

/**
 * Account deletion section for profile edit page
 */
export function DeleteAccountSection({ disabled = false }: DeleteAccountSectionProps) {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);

    try {
      // Soft delete: set deleted_at timestamp on profile
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', user.id);

      if (error) {
        logger.error('Failed to delete account', {
          error: error.message,
          source: 'DeleteAccountSection.tsx',
        });
        toast.error(t('profile.deleteAccountFailed'));
        setIsDeletingAccount(false);
        return;
      }

      toast.success(t('profile.accountDeleted'));

      // Sign out and redirect to home
      await signOut();
      navigate('/');
    } catch (error) {
      logger.error('Unexpected error deleting account', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'DeleteAccountSection.tsx',
      });
      toast.error(t('profile.deleteAccountFailed'));
      setIsDeletingAccount(false);
    }
  };

  return (
    <FmCommonCard className='border-fm-danger/30'>
      <FmCommonCardContent className='p-8 space-y-6'>
        <div>
          <h2 className='text-xl font-canela font-medium text-fm-danger mb-2'>
            {t('profile.deleteAccount')}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t('profile.deleteAccountDescription')}
          </p>
        </div>

        <div className='p-4 bg-fm-danger/10 border border-fm-danger/20'>
          <p className='text-sm text-muted-foreground'>
            {t('profile.deleteAccountWarning')}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <FmCommonButton
              variant='destructive'
              icon={Trash2}
              disabled={disabled || isDeletingAccount}
              loading={isDeletingAccount}
            >
              {t('profile.deleteAccountButton')}
            </FmCommonButton>
          </AlertDialogTrigger>
          <AlertDialogContent className='bg-background border-border'>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-fm-danger'>
                {t('profile.deleteAccountConfirmTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('profile.deleteAccountConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className='bg-fm-danger hover:bg-fm-danger/90'
              >
                {t('profile.deleteAccountConfirmButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
