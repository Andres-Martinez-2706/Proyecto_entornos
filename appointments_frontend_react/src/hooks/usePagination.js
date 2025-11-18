import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 0, initialSize = 10) => {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const goToPage = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 0));
  }, []);

  const changeSize = useCallback((newSize) => {
    setSize(newSize);
    setPage(0); // Reset a primera página
  }, []);

  const updatePagination = useCallback((paginationData) => {
    setTotalPages(paginationData.totalPages || 0);
    setTotalElements(paginationData.totalElements || 0);
  }, []);

  return {
    page,
    size,
    totalPages,
    totalElements,
    goToPage,
    nextPage,
    prevPage,
    changeSize,
    updatePagination,
  };
};