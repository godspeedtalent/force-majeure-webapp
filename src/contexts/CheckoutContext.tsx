import { createContext, useContext, useState, ReactNode } from 'react';

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

  const startCheckout = (url?: string) => {
    setIsCheckoutActive(true);
    setRedirectUrl(url);
  };

  const endCheckout = () => {
    setIsCheckoutActive(false);
    setRedirectUrl(undefined);
  };

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
