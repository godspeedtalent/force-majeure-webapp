import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, toast } from 'sonner';
import { Info } from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  // Add click-to-dismiss functionality
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const toastElement = target.closest('[data-sonner-toast]');
      if (toastElement) {
        const toastId = toastElement.getAttribute('data-sonner-toast');
        if (toastId) {
          toast.dismiss(toastId);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      icons={{
        info: <Info className='h-4 w-4 text-fm-gold' />,
      }}
      // Limit visible toasts and add close button
      visibleToasts={3}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg cursor-pointer',
          info: 'group-[.toaster]:border-fm-gold group-[.toaster]:border-2',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
