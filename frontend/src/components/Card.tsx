import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-md hover:shadow-lg
        transition-shadow duration-300 p-6
        border border-gray-100
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-xl font-bold text-dark mb-6">{children}</h3>
);

export const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-gray-600 text-sm leading-relaxed">{children}</div>
);
