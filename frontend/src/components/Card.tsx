import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg
        transition-all duration-300 p-4
        border border-gray-100 dark:border-gray-700
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-xl font-bold text-dark dark:text-white mb-3">{children}</h3>
);

export const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{children}</div>
);
