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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 pb-4 sm:pb-0 sm:pr-6 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 last:border-b-0 sm:last:border-r-0"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center text-primary">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                {item.label}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
