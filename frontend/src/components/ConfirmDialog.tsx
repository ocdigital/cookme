import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDangerous?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  isDangerous = false,
  onConfirm,
  onCancel,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl"
            >
              {/* Icon */}
              <div className="flex justify-center pt-6">
                <div className={`p-3 rounded-full ${
                  isDangerous
                    ? 'bg-red-100 dark:bg-red-900/20'
                    : 'bg-blue-100 dark:bg-blue-900/20'
                }`}>
                  <AlertCircle
                    size={24}
                    className={isDangerous ? 'text-red-600' : 'text-blue-600'}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {description}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    disabled={loading || isLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading || isLoading}
                    className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                      isDangerous
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-primary hover:bg-orange-600'
                    }`}
                  >
                    {loading || isLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        {confirmText}
                      </>
                    ) : (
                      confirmText
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
