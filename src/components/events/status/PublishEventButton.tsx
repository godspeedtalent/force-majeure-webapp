import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { FmBigButton } from '@/components/common/buttons/FmBigButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { EventStatus } from '@/features/events/types';

interface PublishEventButtonProps {
  currentStatus: EventStatus;
  onPublish: () => Promise<void>;
  className?: string;
}

export const PublishEventButton = ({
  currentStatus,
  onPublish,
  className = '',
}: PublishEventButtonProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  if (currentStatus === 'published') {
    return null;
  }

  const handleConfirm = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      setShowConfirm(false);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <FmBigButton
        onClick={() => setShowConfirm(true)}
        className={className}
        isLoading={isPublishing}
      >
        <Rocket className="mr-2 h-5 w-5" />
        PUBLISH EVENT
      </FmBigButton>

      <FmCommonConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirm}
        title="Publish Event?"
        description="Once published, this event will be visible to the public and ticket sales can begin. This action will make your event appear on the home page and allow customers to purchase tickets."
        confirmText="Publish Event"
        cancelText="Cancel"
        variant="default"
      />
    </>
  );
};
