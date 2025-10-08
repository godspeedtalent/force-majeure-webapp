import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  title = 'Leaving Force Majeure',
  description = "You're about to be redirected to an external site. Continue?",
  continueText = 'Continue',
  onStopPropagation = false,
}: ExternalLinkDialogProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onStopPropagation) {
      e.stopPropagation();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={handleClick}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClick}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              handleClick(e);
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
          >
            {continueText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
