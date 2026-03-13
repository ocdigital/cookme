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
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      {showInfo && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Página {currentPage} de {totalPages}
          {totalItems && itemsPerPage && ` (${totalItems} total)`}
        </p>
      )}
      {!showInfo && <div />}

      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={isFirstPage}
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={isLastPage}
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};
