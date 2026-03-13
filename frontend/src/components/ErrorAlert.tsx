import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  error: string | null;
  title?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  title = 'Erro',
}) => {
  if (!error) return null;

  return (
    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg flex items-start gap-3">
      <AlertCircle className="text-red-600 dark:text-red-300 w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-800 dark:text-red-300 font-semibold">{title}</p>
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
      </div>
    </div>
  );
};
