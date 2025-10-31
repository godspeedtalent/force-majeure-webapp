import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface CheckoutContextType {
  isCheckoutActive: boolean;
  startCheckout: (redirectUrl?: string) => void;
  endCheckout: () => void;
  redirectUrl?: string;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [isCheckoutActive, setIsCheckoutActive] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>();
  const [checkoutPath, setCheckoutPath] = useState<string | undefined>();
  const location = useLocation();

  const startCheckout = (url?: string) => {
    setIsCheckoutActive(true);
    setRedirectUrl(url);
    setCheckoutPath(location.pathname);
  };

  const endCheckout = () => {
    setIsCheckoutActive(false);
    setRedirectUrl(undefined);
    setCheckoutPath(undefined);
    // Dismiss the timer toast
    toast.dismiss('fm-timer-toast');
  };

  // Watch for navigation changes and end checkout if user navigates away
  useEffect(() => {
    if (isCheckoutActive && checkoutPath && location.pathname !== checkoutPath) {
      endCheckout();
    }
  }, [location.pathname, isCheckoutActive, checkoutPath]);

  return (
    <CheckoutContext.Provider
      value={{
        isCheckoutActive,
        startCheckout,
        endCheckout,
        redirectUrl,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckoutTimer = () => {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckoutTimer must be used within a CheckoutProvider');
  }
  return context;
};
