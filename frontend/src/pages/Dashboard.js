import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatMonth, getBudgetStatusColor, getBudgetProgressColor } from '../utils/formatters';
import { useBudget, useTrends } from '../hooks/useBudget';
import { budgetAPI } from '../services/api';
import InteractivePieChart from '../components/PieChart/InteractivePieChart';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

const Dashboard = () => {
  const { budget, loading: budgetLoading } = useBudget();
  const { trends, loading: trendsLoading } = useTrends(6);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState(null);

  useEffect(() => {
    const fetchRecentExpenses = async () => {
      try {
        setRecentLoading(true);
        setRecentError(null);
        const response = await budgetAPI.getRecent(5);
        setRecentExpenses(response.data.data);
      } catch (error) {
        setRecentError('Failed to fetch recent expenses');
        console.error('Failed to fetch recent expenses:', error);
      } finally {
        setRecentLoading(false);
      }
    };
    fetchRecentExpenses();
  }, []);

  if (budgetLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-navy-400">
          <LoadingSpinner size="lg" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  const percentUsed = budget?.percentUsed || 0;
  const statusColor = getBudgetStatusColor(percentUsed);
  const progressColor = getBudgetProgressColor(percentUsed);

  // Prepare data for pie chart
  const pieData = budget?.categorySpending?.filter(c => c.amount > 0).map(item => ({
    name: item.name,
    value: item.amount,
    categoryId: item.categoryId
  })) || [];

  // Prepare data for bar chart
  const barData = trends.map(trend => ({
    month: formatMonth(trend.month).split(' ')[0].slice(0, 3),
    expense: trend.expense,
    income: trend.income,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-navy-800 border border-navy-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-white">{data.name || label}</p>
          <p className="text-sm text-purple-400">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-semibold mb-4">Monthly Budget</h2>
          <div className="space-y-4">
            <div className="text-4xl font-bold">
              {formatCurrency(budget?.totalSpent || 0)}
              <span className="text-lg font-normal text-navy-400"> / {formatCurrency(budget?.monthlyBudget || 0)}</span>
            </div>

            <div className="w-full bg-navy-700 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all duration-500`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-sm">
              <span className={`${statusColor} font-medium`}>
                {percentUsed.toFixed(1)}% used
              </span>
              <span className="text-navy-400">
                {formatCurrency(budget?.remaining || 0)} remaining
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Net Income</h3>
          <div className="text-2xl font-bold">
            {formatCurrency((budget?.totalIncome || 0) - (budget?.totalSpent || 0))}
          </div>
          <div className="text-sm text-navy-400 mt-1">
            Income: {formatCurrency(budget?.totalIncome || 0)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Spending by Category</h2>
          {trendsLoading ? (
            <div className="flex items-center justify-center h-72 text-navy-400">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <InteractivePieChart
              data={pieData}
              height={300}
              showLegend={true}
              interactive={false}
              animationDelay={500}
            />
          )}
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">6-Month Trend</h2>
          {trendsLoading ? (
            <div className="flex items-center justify-center h-72 text-navy-400">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="expense" fill="#8B5CF6" name="Expenses" />
                <Bar dataKey="income" fill="#10B981" name="Income" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
        {recentLoading ? (
          <div className="flex items-center justify-center py-10 text-navy-400">
            <LoadingSpinner size="md" />
          </div>
        ) : recentError ? (
          <div className="text-center py-8 text-red-300">{recentError}</div>
        ) : recentExpenses.length > 0 ? (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-navy-700 rounded-lg">
                <div>
                  <p className="font-medium">{expense.description || 'No description'}</p>
                  <p className="text-sm text-navy-400">
                    {expense.categoryName || 'Uncategorized'} • {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-semibold ${expense.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                  {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-navy-400">No expenses recorded yet</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
