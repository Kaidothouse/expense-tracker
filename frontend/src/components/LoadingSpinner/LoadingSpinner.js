import React from 'react';

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
};

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const classes = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-block animate-spin rounded-full border-navy-500 border-t-purple-500 ${classes} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;
