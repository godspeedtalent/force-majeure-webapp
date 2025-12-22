import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
// Default duration in seconds (10 minutes)
const DEFAULT_CHECKOUT_DURATION = 600;
const CheckoutContext = createContext(undefined);
export const CheckoutProvider = ({ children }) => {
    const [isCheckoutActive, setIsCheckoutActive] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState();
    const [checkoutPath, setCheckoutPath] = useState();
    const [checkoutDuration, setCheckoutDuration] = useState(DEFAULT_CHECKOUT_DURATION);
    const location = useLocation();
    const startCheckout = (url, durationSeconds) => {
        setIsCheckoutActive(true);
        setRedirectUrl(url);
        setCheckoutPath(location.pathname);
        if (durationSeconds && durationSeconds > 0) {
            setCheckoutDuration(durationSeconds);
        }
        else {
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
        if (isCheckoutActive &&
            checkoutPath &&
            location.pathname !== checkoutPath) {
            endCheckout();
        }
    }, [location.pathname, isCheckoutActive, checkoutPath]);
    return (_jsx(CheckoutContext.Provider, { value: {
            isCheckoutActive,
            startCheckout,
            endCheckout,
            redirectUrl,
            checkoutDuration,
        }, children: children }));
};
export const useCheckoutTimer = () => {
    const context = useContext(CheckoutContext);
    if (context === undefined) {
        throw new Error('useCheckoutTimer must be used within a CheckoutProvider');
    }
    return context;
};
