export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatMonth = (monthString) => {
  const [year, month] = monthString.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
};

export const getBudgetStatusColor = (percentUsed) => {
  if (percentUsed <= 50) return 'text-green-400';
  if (percentUsed <= 80) return 'text-yellow-400';
  return 'text-red-400';
};

export const getBudgetProgressColor = (percentUsed) => {
  if (percentUsed <= 50) return 'bg-green-500';
  if (percentUsed <= 80) return 'bg-yellow-500';
  return 'bg-red-500';
};