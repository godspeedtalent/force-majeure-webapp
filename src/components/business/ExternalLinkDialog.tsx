import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/common/shadcn/alert-dialog';

interface ExternalLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
  description?: string;
  continueText?: string;
  onStopPropagation?: boolean;
}

export const ExternalLinkDialog = ({
  open,
  onOpenChange,
  url,
  title,
  description,
  continueText,
  onStopPropagation = false,
}: ExternalLinkDialogProps) => {
  const { t } = useTranslation('common');

  const resolvedTitle = title || t('externalLink.title');
  const resolvedDescription = description || t('externalLink.description');
  const resolvedContinueText = continueText || t('externalLink.continue');

  const handleClick = (e: React.MouseEvent) => {
    if (onStopPropagation) {
      e.stopPropagation();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={handleClick}>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClick}>{t('buttons.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              handleClick(e);
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
          >
            {resolvedContinueText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
