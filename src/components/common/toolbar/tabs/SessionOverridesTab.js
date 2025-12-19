import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Button } from '@/components/common/shadcn/button';
import { RefreshCw, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/common/shadcn/tooltip';
import { FEATURE_FLAGS } from '@/shared';
import { setFeatureFlagOverride, getFeatureFlagOverride, clearFeatureFlagOverride, clearAllFeatureFlagOverrides, hasFeatureFlagOverride, } from '@/shared';
import { useFeatureFlagHelpers } from '@/shared';
import { useQueryClient } from '@tanstack/react-query';
export function SessionOverridesTabContent() {
    const { t } = useTranslation('common');
    const { flags } = useFeatureFlagHelpers();
    const queryClient = useQueryClient();
    const [localOverrides, setLocalOverrides] = useState({});
    // Load current overrides from session storage
    useEffect(() => {
        const overrides = {};
        overrides[FEATURE_FLAGS.COMING_SOON_MODE] = getFeatureFlagOverride(FEATURE_FLAGS.COMING_SOON_MODE);
        setLocalOverrides(overrides);
    }, []);
    const handleToggle = (flagName, newValue) => {
        setFeatureFlagOverride(flagName, newValue);
        setLocalOverrides(prev => ({ ...prev, [flagName]: newValue }));
        // Invalidate feature flags query to trigger re-fetch
        queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
        toast.success(t('devTools.sessionOverrides.overrideApplied'), {
            description: t('devTools.sessionOverrides.overrideActiveSession'),
        });
    };
    const handleClear = (flagName) => {
        clearFeatureFlagOverride(flagName);
        setLocalOverrides(prev => ({ ...prev, [flagName]: null }));
        // Invalidate feature flags query to trigger re-fetch
        queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
        toast.info(t('devTools.sessionOverrides.overrideCleared'), {
            description: t('devTools.sessionOverrides.usingDatabaseValue'),
        });
    };
    const handleClearAll = () => {
        clearAllFeatureFlagOverrides();
        const clearedOverrides = {};
        clearedOverrides[FEATURE_FLAGS.COMING_SOON_MODE] = null;
        setLocalOverrides(clearedOverrides);
        // Invalidate feature flags query to trigger re-fetch
        queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
        toast.info(t('devTools.sessionOverrides.allOverridesCleared'));
    };
    const hasAnyOverrides = hasFeatureFlagOverride(FEATURE_FLAGS.COMING_SOON_MODE);
    // Get the current database value for coming_soon_mode
    const databaseValue = flags?.[FEATURE_FLAGS.COMING_SOON_MODE] ?? false;
    const overrideValue = localOverrides[FEATURE_FLAGS.COMING_SOON_MODE];
    const hasOverride = overrideValue !== null;
    const displayValue = hasOverride ? overrideValue : databaseValue;
    return (_jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { className: 'mb-4 pb-3 border-b border-white/10', children: [_jsx("p", { className: 'text-xs text-white/50 mb-2', children: t('devTools.sessionOverrides.description') }), _jsxs("div", { className: 'flex items-center gap-2 text-xs', children: [_jsx("span", { className: 'text-white/50', children: t('devTools.sessionOverrides.activeOverrides') }), _jsx("span", { className: 'font-medium text-fm-gold', children: hasAnyOverrides ? '1' : t('status.none') })] })] }), _jsx("div", { className: 'space-y-4', children: _jsxs("div", { className: 'space-y-2', children: [_jsx(TooltipProvider, { children: _jsxs(Tooltip, { delayDuration: 300, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { children: _jsx(FmCommonToggle, { id: 'override-coming-soon-mode', label: t('devTools.sessionOverrides.overrideComingSoon'), icon: EyeOff, checked: displayValue, onCheckedChange: checked => handleToggle(FEATURE_FLAGS.COMING_SOON_MODE, checked) }) }) }), _jsx(TooltipContent, { side: 'left', className: 'max-w-xs bg-black/95 border-white/20 z-[150]', children: _jsx("p", { className: 'text-sm text-white', children: t('devTools.sessionOverrides.comingSoonTooltip') }) })] }) }), _jsx("div", { className: 'flex items-center gap-2 text-xs ml-10', children: hasOverride ? (_jsxs(_Fragment, { children: [_jsx("span", { className: 'text-white/50', children: t('devTools.sessionOverrides.overrideActive') }), _jsx("span", { className: 'font-medium text-fm-gold', children: displayValue ? t('status.enabled') : t('status.disabled') }), _jsx("span", { className: 'text-white/30', children: "\u2022" }), _jsxs("span", { className: 'text-white/30', children: [t('labels.database'), ": ", databaseValue ? t('status.enabled') : t('status.disabled')] }), _jsx(Button, { variant: 'ghost', size: 'sm', onClick: () => handleClear(FEATURE_FLAGS.COMING_SOON_MODE), className: 'h-6 px-2 text-xs text-white/50 hover:text-white hover:bg-white/10', children: t('buttons.clear') })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: 'text-white/50', children: t('devTools.sessionOverrides.usingDatabase') }), _jsx("span", { className: 'font-medium text-white/70', children: databaseValue ? t('status.enabled') : t('status.disabled') })] })) })] }) }), hasAnyOverrides && (_jsx("div", { className: 'pt-4 border-t border-white/10', children: _jsxs(Button, { onClick: handleClearAll, variant: 'outline', className: 'w-full border-white/20 hover:bg-white/10 text-white', children: [_jsx(RefreshCw, { className: 'h-4 w-4 mr-2' }), t('devTools.sessionOverrides.clearAll')] }) })), _jsx("div", { className: 'p-3 rounded-none bg-white/5 border border-white/10', children: _jsxs("p", { className: 'text-xs text-white/70 leading-relaxed', children: [_jsx("strong", { className: 'text-white', children: t('devTools.sessionOverrides.howItWorks') }), " ", t('devTools.sessionOverrides.howItWorksDescription')] }) })] }));
}
