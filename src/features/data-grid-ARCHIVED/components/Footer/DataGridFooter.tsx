import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/common/shadcn/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { useDataGridContext } from '../../context/DataGridContext';

/**
 * Footer component with pagination controls
 */
export function DataGridFooter() {
  const { pagination, originalData } = useDataGridContext();

  if (!pagination.enabled) return null;

  const startIndex = (pagination.currentPage - 1) * pagination.pageSize + 1;
  const endIndex = Math.min(pagination.currentPage * pagination.pageSize, originalData.length);
  const totalItems = originalData.length;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (pagination.totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and surrounding pages
      pages.push(1);

      if (pagination.currentPage > 3) {
        pages.push('...');
      }

      for (
        let i = Math.max(2, pagination.currentPage - 1);
        i <= Math.min(pagination.totalPages - 1, pagination.currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (pagination.currentPage < pagination.totalPages - 2) {
        pages.push('...');
      }

      pages.push(pagination.totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Showing {startIndex} to {endIndex} of {totalItems} results
        </span>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => pagination.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pagination.pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => pagination.prevPage()}
              className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {getPageNumbers().map((page, index) => (
            <PaginationItem key={index}>
              {page === '...' ? (
                <span className="px-3">...</span>
              ) : (
                <PaginationLink
                  onClick={() => pagination.goToPage(page as number)}
                  isActive={pagination.currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => pagination.nextPage()}
              className={
                pagination.currentPage === pagination.totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
