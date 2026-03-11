import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  change,
  changeType = 'positive',
}) => {
  const changeColorMap = {
    positive: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
    negative: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
    neutral: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${changeColorMap[changeType]}`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};
