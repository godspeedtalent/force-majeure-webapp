import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// Default duration in seconds (10 minutes)
const DEFAULT_CHECKOUT_DURATION = 600;

interface CheckoutContextType {
  isCheckoutActive: boolean;
  startCheckout: (redirectUrl?: string, durationSeconds?: number) => void;
  endCheckout: () => void;
  redirectUrl?: string;
  checkoutDuration: number; // in seconds
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined
);

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [isCheckoutActive, setIsCheckoutActive] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>();
  const [checkoutPath, setCheckoutPath] = useState<string | undefined>();
  const [checkoutDuration, setCheckoutDuration] = useState(DEFAULT_CHECKOUT_DURATION);
  const location = useLocation();

  const startCheckout = (url?: string, durationSeconds?: number) => {
    setIsCheckoutActive(true);
    setRedirectUrl(url);
    setCheckoutPath(location.pathname);
    if (durationSeconds && durationSeconds > 0) {
      setCheckoutDuration(durationSeconds);
    } else {
      setCheckoutDuration(DEFAULT_CHECKOUT_DURATION);
    }
  };

  const endCheckout = () => {
    setIsCheckoutActive(false);
    setRedirectUrl(undefined);
    setCheckoutPath(undefined);
    setCheckoutDuration(DEFAULT_CHECKOUT_DURATION);
    // Dismiss the timer toast
    toast.dismiss('fm-timer-toast');
  };

  // Watch for navigation changes and end checkout if user navigates away
  useEffect(() => {
    if (
      isCheckoutActive &&
      checkoutPath &&
      location.pathname !== checkoutPath
    ) {
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
        checkoutDuration,
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
