import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: FilterOption[];
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  options,
  ...props
}) => {
  return (
    <select
      className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-primary text-xs"
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          {option.label}
        </option>
      ))}
    </select>
  );
};
