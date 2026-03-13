import React from 'react';

type ActionVariant = 'edit' | 'delete' | 'view' | 'danger' | 'success';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionVariant;
  icon: React.ReactNode;
  title?: string;
}

const variantStyles: Record<ActionVariant, string> = {
  edit: 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400',
  delete: 'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400',
  view: 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400',
  danger: 'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400',
  success: 'text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400',
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'edit',
  icon,
  title,
  ...props
}) => {
  return (
    <button
      className={`p-2 rounded-lg transition-colors ${variantStyles[variant]}`}
      title={title}
      {...props}
    >
      {icon}
    </button>
  );
};
