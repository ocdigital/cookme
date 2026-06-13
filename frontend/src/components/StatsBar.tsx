import React from 'react';

interface StatBarItem {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

interface StatsBarProps {
  items: StatBarItem[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ items }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 pb-2 sm:pb-0 sm:pr-4 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 last:border-b-0 sm:last:border-r-0"
          >
            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 dark:bg-primary/20 rounded-md flex items-center justify-center text-primary">
              <span className="w-3.5 h-3.5">{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-none">
                {item.label}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
