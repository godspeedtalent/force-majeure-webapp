import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from '@/components/common/shadcn/pagination';
import { cn } from '@/shared';
export function FmDataGridPagination({ currentPage, totalPages, pageSize, totalCount, onPageChange, }) {
    const { t } = useTranslation('common');
    if (totalPages <= 1) {
        return null;
    }
    return (_jsxs("div", { className: 'flex items-center justify-between', children: [_jsx("div", { className: 'text-sm text-muted-foreground', children: t('dataGrid.showingResults', {
                    from: (currentPage - 1) * pageSize + 1,
                    to: Math.min(currentPage * pageSize, totalCount),
                    total: totalCount
                }) }), _jsx(Pagination, { children: _jsxs(PaginationContent, { children: [_jsx(PaginationItem, { children: _jsx(PaginationPrevious, { onClick: () => onPageChange(Math.max(1, currentPage - 1)), className: cn('cursor-pointer transition-all duration-200', currentPage === 1 && 'pointer-events-none opacity-50') }) }), Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                                pageNumber = i + 1;
                            }
                            else if (currentPage <= 3) {
                                pageNumber = i + 1;
                            }
                            else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i;
                            }
                            else {
                                pageNumber = currentPage - 2 + i;
                            }
                            return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { onClick: () => onPageChange(pageNumber), isActive: currentPage === pageNumber, className: 'cursor-pointer transition-all duration-200', children: pageNumber }) }, pageNumber));
                        }), _jsx(PaginationItem, { children: _jsx(PaginationNext, { onClick: () => onPageChange(Math.min(totalPages, currentPage + 1)), className: cn('cursor-pointer transition-all duration-200', currentPage === totalPages && 'pointer-events-none opacity-50') }) })] }) })] }));
}
