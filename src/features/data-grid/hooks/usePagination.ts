import { useState, useCallback, useEffect } from 'react';
import { PaginationState, PaginationOptions } from '../types';

/**
 * Hook for managing data grid pagination state
 */
export function usePagination(
  totalItems: number,
  options?: PaginationOptions
): PaginationState {
  const enabled = options?.enabled !== false;
  const pageSize = options?.pageSize || 10;
  const pageSizeOptions = options?.pageSizeOptions || [10, 25, 50, 100];

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  const totalPages = Math.ceil(totalItems / currentPageSize);

  // Reset to page 1 when total items change
  useEffect(() => {
    setCurrentPage(1);
  }, [totalItems]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const setPageSize = useCallback((size: number) => {
    setCurrentPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const paginateData = useCallback(<T,>(data: T[]): T[] => {
    if (!enabled) return data;
    
    const startIndex = (currentPage - 1) * currentPageSize;
    return data.slice(startIndex, startIndex + currentPageSize);
  }, [enabled, currentPage, currentPageSize]);

  return {
    currentPage,
    pageSize: currentPageSize,
    totalPages,
    pageSizeOptions,
    enabled,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    paginateData,
  };
}
