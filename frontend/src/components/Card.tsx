import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md
        transition-all duration-300 p-3
        border border-gray-100 dark:border-gray-700
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-sm font-semibold text-gray-900 dark:text-white mb-2 ${className}`}>{children}</h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`text-gray-600 dark:text-gray-300 text-sm leading-relaxed ${className}`}>{children}</div>
);
