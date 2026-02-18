import React, { useState } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency, getBudgetStatusColor, getBudgetProgressColor } from '../utils/formatters';
import { useBudget } from '../hooks/useBudget';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import { useToast } from '../components/Toast/ToastProvider';

const Budget = () => {
  const { budget, loading, updateMonthlyBudget } = useBudget();
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const handleEditBudget = () => {
    setNewBudget(budget?.monthlyBudget || '');
    setIsEditing(true);
    setError('');
  };

  const handleSaveBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await updateMonthlyBudget(amount);
      setIsEditing(false);
      setError('');
      addToast({
        type: 'success',
        title: 'Budget updated',
        message: `Monthly budget set to ${formatCurrency(amount)}.`,
      });
    } catch (err) {
      setError(err.message);
      addToast({
        type: 'error',
        title: 'Update failed',
        message: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewBudget('');
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-navy-400">
          <LoadingSpinner size="lg" />
          Loading budget...
        </div>
      </div>
    );
  }

  const monthlyBudget = budget?.monthlyBudget || 0;
  const totalSpent = budget?.totalSpent || 0;
  const percentUsed = budget?.percentUsed || 0;
  const remaining = budget?.remaining || 0;

  const statusColor = getBudgetStatusColor(percentUsed);
  const progressColor = getBudgetProgressColor(percentUsed);

  const getBudgetStatus = () => {
    if (percentUsed <= 50) {
      return {
        icon: CheckCircleIcon,
        text: 'You\'re doing great! Keep it up.',
        color: 'text-green-400',
      };
    } else if (percentUsed <= 80) {
      return {
        icon: ExclamationTriangleIcon,
        text: 'Be careful, you\'re approaching your budget limit.',
        color: 'text-yellow-400',
      };
    } else {
      return {
        icon: ExclamationTriangleIcon,
        text: percentUsed >= 100 ? 'You\'ve exceeded your budget!' : 'Warning! You\'re close to exceeding your budget.',
        color: 'text-red-400',
      };
    }
  };

  const budgetStatus = getBudgetStatus();
  const StatusIcon = budgetStatus.icon;

  const categoryBudgets = budget?.categorySpending || [];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Budget</h1>

      {/* Monthly Budget Card */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Monthly Budget</h2>
          {!isEditing && (
            <button onClick={handleEditBudget} className="btn-primary">
              Set Budget
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Budget Amount</label>
              <div className="flex items-center gap-2">
                <span className="text-navy-400">$</span>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="input flex-1"
                  placeholder="0.00"
                  step="0.01"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveBudget}
                disabled={saving}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {saving && <LoadingSpinner size="sm" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold mb-2">
                {formatCurrency(totalSpent)}
                <span className="text-lg font-normal text-navy-400"> / {formatCurrency(monthlyBudget)}</span>
              </div>
              <div className={`${statusColor} font-medium text-lg`}>
                {percentUsed.toFixed(1)}% used
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-navy-700 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-500 relative`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                >
                  {percentUsed > 10 && (
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium">
                      {percentUsed.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status Message */}
            <div className={`flex items-center gap-3 p-4 rounded-lg bg-navy-700/50 ${budgetStatus.color}`}>
              <StatusIcon className="h-6 w-6 flex-shrink-0" />
              <span className="font-medium">{budgetStatus.text}</span>
            </div>

            {/* Budget Details */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-navy-700/30 rounded-lg">
                <div className="text-sm text-navy-400 mb-1">Remaining</div>
                <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(Math.abs(remaining))}
                </div>
              </div>
              <div className="text-center p-4 bg-navy-700/30 rounded-lg">
                <div className="text-sm text-navy-400 mb-1">Daily Average</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(monthlyBudget / 30)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category Spending */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">Category Spending</h3>

        {categoryBudgets.length === 0 ? (
          <div className="text-center py-8 text-navy-400">
            No spending data available yet
          </div>
        ) : (
          <div className="space-y-4">
            {categoryBudgets.map((category) => {
              const categoryPercent = monthlyBudget > 0 ? (category.amount / monthlyBudget) * 100 : 0;
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {category.icon && (
                        <span className="text-lg">{category.icon}</span>
                      )}
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(category.amount)}</div>
                      <div className="text-xs text-navy-400">{categoryPercent.toFixed(1)}% of budget</div>
                    </div>
                  </div>
                  <div className="w-full bg-navy-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(categoryPercent, 100)}%`,
                        backgroundColor: category.color || '#8B5CF6',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 bg-purple-600/10 border border-purple-600/20 rounded-lg">
          <h4 className="font-semibold text-purple-400 mb-2">Budget Tips</h4>
          <ul className="text-sm space-y-1 text-purple-300">
            <li>• Try to keep your spending under 80% of your budget</li>
            <li>• Review your category spending to identify areas to cut back</li>
            <li>• Set aside at least 20% of your income for savings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Budget;
