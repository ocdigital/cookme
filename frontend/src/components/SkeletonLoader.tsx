import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
  circle?: boolean;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  count = 1,
  height = 'h-4',
  width = 'w-full',
  circle = false,
  // variant = 'rect',
}) => {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${
            circle ? 'rounded-full' : 'rounded'
          } ${height} ${width} ${i < count - 1 ? 'mb-2' : ''} ${className}`}
        />
      ))}
    </>
  );
};

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <Skeleton height="h-4" width="w-1/3" className="mb-3" />
          <Skeleton height="h-3" className="mb-2" />
          <Skeleton height="h-3" width="w-2/3" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              height="h-8"
              width={j === 0 ? 'w-1/4' : 'w-1/3'}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonImage: React.FC<{ className?: string }> = ({
  className = 'w-full h-64',
}) => {
  return (
    <Skeleton
      className={className}
      height=""
      width=""
      circle={false}
    />
  );
};
