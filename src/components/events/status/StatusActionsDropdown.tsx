import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { EventStatus } from '@/features/events/types';
import { toast } from 'sonner';

interface StatusActionsDropdownProps {
  currentStatus: EventStatus;
  orderCount: number;
  onMakeInvisible: () => Promise<void>;
}

export const StatusActionsDropdown = ({
  currentStatus,
  orderCount,
  onMakeInvisible,
}: StatusActionsDropdownProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [showInvisibleConfirm, setShowInvisibleConfirm] = useState(false);

  if (currentStatus === 'draft') {
    return null;
  }

  const handleMakeInvisible = async () => {
    if (orderCount > 0) {
      toast.error(tToast('events.cannotHideWithOrders'));
      return;
    }

    try {
      await onMakeInvisible();
      setShowInvisibleConfirm(false);
      toast.success(tToast('events.hiddenFromPublic'));
    } catch (_error) {
      toast.error(tToast('events.hideFailed'));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <FmCommonButton variant="secondary" size="icon">
            <MoreVertical className="h-4 w-4" />
          </FmCommonButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              if (orderCount > 0) {
                toast.error(tToast('events.cannotHideWithOrders'));
              } else {
                setShowInvisibleConfirm(true);
              }
            }}
            disabled={orderCount > 0}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            {t('dialogs.makeInvisible')}
            {orderCount > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({orderCount} orders)
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FmCommonConfirmDialog
        open={showInvisibleConfirm}
        onOpenChange={setShowInvisibleConfirm}
        onConfirm={handleMakeInvisible}
        title={t('dialogs.hideEvent')}
        description={t('dialogs.hideEventDescription')}
        confirmText={t('dialogs.makeInvisible')}
        cancelText={t('buttons.cancel')}
        variant="destructive"
      />
    </>
  );
};
