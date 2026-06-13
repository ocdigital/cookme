import React from 'react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  showInfo = true,
  totalItems,
  itemsPerPage,
}) => {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
      {showInfo && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Página {currentPage} de {totalPages}
          {totalItems && itemsPerPage && ` (${totalItems} total)`}
        </p>
      )}
      {!showInfo && <div />}

      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={isFirstPage}
          className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={isLastPage}
          className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};
