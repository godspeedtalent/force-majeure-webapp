import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { FmCommonList, } from '@/components/common/data/FmCommonList';
export const FmTicketTierList = ({ selections, className, }) => {
    const { t } = useTranslation('common');
    const columns = [
        {
            key: 'name',
            label: t('ticketTierList.ticket'),
            render: (_, item) => (_jsxs("div", { className: 'flex flex-col gap-0.5', children: [_jsx("span", { className: 'font-medium text-foreground', children: item.tier.name }), _jsxs("span", { className: 'text-xs text-muted-foreground', children: [item.quantity, "x $", item.tier.price.toFixed(2)] })] })),
            align: 'left',
        },
        {
            key: 'subtotal',
            label: t('checkout.subtotal'),
            render: (_, item) => (_jsxs("span", { className: 'font-medium text-foreground', children: ["$", item.subtotal.toFixed(2)] })),
            align: 'right',
        },
    ];
    return (_jsx(FmCommonList, { items: selections, columns: columns, striped: true, dense: true, className: className, emptyMessage: t('ticketTierList.noTicketsSelected') }));
};
