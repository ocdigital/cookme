import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-dark mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2 border rounded-lg transition-all
          focus:outline-none focus:ring-2 focus:ring-primary
          ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
