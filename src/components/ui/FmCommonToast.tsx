import { toast as sonnerToast, ExternalToast } from 'sonner';
import { X } from 'lucide-react';

interface ToastOptions extends ExternalToast {
  title?: string;
  description?: string;
}

const getToastStyles = () => {
  return {
    className: 'group bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl hover:border-fm-gold/50 hover:shadow-[0_0_16px_rgba(207,173,118,0.3)] hover:scale-[1.02] transition-all duration-300 cursor-pointer',
    descriptionClassName: 'text-white/70',
  };
};

const createToast = (
  type: 'success' | 'error' | 'info' | 'message',
  message: string,
  options?: ToastOptions
) => {
  const { title, description, ...rest } = options || {};
  const styles = getToastStyles();

  const content = (
    <div 
      className="flex items-start justify-between gap-3 w-full"
      onClick={(e) => {
        // Find the toast element and trigger close
        const toastEl = (e.target as HTMLElement).closest('[data-sonner-toast]');
        if (toastEl) {
          toastEl.classList.add('opacity-0', 'scale-95', 'transition-all', 'duration-300');
          setTimeout(() => {
            sonnerToast.dismiss(toastEl.getAttribute('data-toast-id') || undefined);
          }, 300);
        }
      }}
    >
      <div className="flex-1">
        {title && <div className="font-canela font-semibold mb-1">{title}</div>}
        <div className="text-sm">{description || message}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          const toastEl = (e.target as HTMLElement).closest('[data-sonner-toast]');
          if (toastEl) {
            toastEl.classList.add('opacity-0', 'scale-95', 'transition-all', 'duration-300');
            setTimeout(() => {
              sonnerToast.dismiss(toastEl.getAttribute('data-toast-id') || undefined);
            }, 300);
          }
        }}
        className="text-white/50 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  // Map type to sonnerToast method
  if (type === 'message') {
    return sonnerToast(content, {
      ...styles,
      ...rest,
    });
  }
  
  return sonnerToast[type](content, {
    ...styles,
    ...rest,
  });
};

export const toast = {
  success: (message: string, options?: ToastOptions) => 
    createToast('success', message, options),
  
  error: (message: string, options?: ToastOptions) => 
    createToast('error', message, options),
  
  info: (message: string, options?: ToastOptions) => 
    createToast('info', message, options),

  message: (message: string, options?: ToastOptions) => 
    createToast('message', message, options),
};
