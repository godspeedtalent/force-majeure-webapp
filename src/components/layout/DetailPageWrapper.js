import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
export function DetailPageWrapper({ data, isLoading, error, entityName, onBack, backButtonLabel, notFoundMessage, errorMessage, showNotFoundButton = true, notFoundButtonLabel, onNotFoundAction, children, useLayout = true, layoutProps, }) {
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const resolvedBackButtonLabel = backButtonLabel || t('detailPageWrapper.goBack');
    const resolvedNotFoundButtonLabel = notFoundButtonLabel || t('detailPageWrapper.goHome');
    const handleBack = onBack || (() => navigate(-1));
    const handleNotFound = onNotFoundAction || (() => navigate('/'));
    // Loading State
    if (isLoading) {
        const loadingContent = (_jsx("div", { className: 'flex items-center justify-center min-h-[400px]', children: _jsx(FmCommonLoadingSpinner, { size: 'lg' }) }));
        return useLayout ? _jsx(Layout, { ...layoutProps, children: loadingContent }) : loadingContent;
    }
    // Error State
    if (error) {
        const errorContent = (_jsxs("div", { className: 'text-center py-12', children: [_jsx("p", { className: 'text-muted-foreground mb-4', children: errorMessage || t('detailPageWrapper.failedToLoad', { entity: entityName.toLowerCase() }) }), _jsx(Button, { onClick: handleBack, variant: 'outline', className: 'border-white/20 hover:bg-white/10', children: resolvedBackButtonLabel })] }));
        return useLayout ? _jsx(Layout, { ...layoutProps, children: errorContent }) : errorContent;
    }
    // Not Found State
    if (!data) {
        const notFoundContent = (_jsxs("div", { className: 'text-center py-12', children: [_jsx("p", { className: 'text-muted-foreground mb-4', children: notFoundMessage || t('detailPageWrapper.notFound', { entity: entityName }) }), showNotFoundButton && (_jsx(Button, { onClick: handleNotFound, variant: 'outline', className: 'border-white/20 hover:bg-white/10', children: resolvedNotFoundButtonLabel }))] }));
        return useLayout ? _jsx(Layout, { ...layoutProps, children: notFoundContent }) : notFoundContent;
    }
    // Success State - render children with data
    const content = children(data);
    return useLayout ? _jsx(Layout, { ...layoutProps, children: content }) : _jsx(_Fragment, { children: content });
}
/**
 * Simplified version for pages that don't need Layout wrapper
 * (e.g., components within tabs or modals)
 */
export function DetailContentWrapper(props) {
    return _jsx(DetailPageWrapper, { ...props, useLayout: false });
}
