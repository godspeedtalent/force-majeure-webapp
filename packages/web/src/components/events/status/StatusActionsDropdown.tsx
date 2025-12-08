import { useState } from 'react';
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
  const [showInvisibleConfirm, setShowInvisibleConfirm] = useState(false);

  if (currentStatus === 'draft') {
    return null;
  }

  const handleMakeInvisible = async () => {
    if (orderCount > 0) {
      toast.error('Cannot hide event with existing orders');
      return;
    }

    try {
      await onMakeInvisible();
      setShowInvisibleConfirm(false);
      toast.success('Event is now hidden from public view');
    } catch (error) {
      toast.error('Failed to hide event');
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
                toast.error('Cannot hide event with existing orders');
              } else {
                setShowInvisibleConfirm(true);
              }
            }}
            disabled={orderCount > 0}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Make Invisible
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
        title="Hide Event from Public?"
        description="This event will be hidden from public view and will not appear on the home page. Existing ticket holders will retain their tickets."
        confirmText="Make Invisible"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
};
