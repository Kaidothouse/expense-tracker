import React, { useState, useMemo } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, FunnelIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useExpenses } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import Modal from '../components/Modal/Modal';
import ExpenseForm from '../components/ExpenseForm/ExpenseForm';
import InteractivePieChart from '../components/PieChart/InteractivePieChart';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import { useToast } from '../components/Toast/ToastProvider';

const Expenses = () => {
  const [filters, setFilters] = useState({
    categoryId: '',
    type: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPieChart, setShowPieChart] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const { categories, loading: categoriesLoading } = useCategories();
  const { expenses, loading, error, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { addToast } = useToast();

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Apply filters
    if (filters.categoryId) {
      filtered = filtered.filter(e => e.categoryId === parseInt(filters.categoryId));
    }
    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }
    if (filters.startDate) {
      filtered = filtered.filter(e => new Date(e.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(e => new Date(e.date) <= new Date(filters.endDate));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[filters.sortBy];
      let bVal = b[filters.sortBy];

      if (filters.sortBy === 'amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (filters.sortBy === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [expenses, filters]);

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    setIsDeleteLoading(true);
    setDeletingExpenseId(expenseToDelete.id);
    try {
      await deleteExpense(expenseToDelete.id);
      addToast({
        type: 'success',
        title: 'Expense deleted',
        message: `${expenseToDelete.description || 'Expense'} removed successfully.`,
      });
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete failed',
        message: error.message,
      });
    } finally {
      setDeletingExpenseId(null);
      setIsDeleteLoading(false);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, data);
        addToast({
          type: 'success',
          title: 'Expense updated',
          message: `${data.description || 'Expense'} updated successfully.`,
        });
      } else {
        await createExpense(data);
        addToast({
          type: 'success',
          title: 'Expense added',
          message: `${data.description || 'Expense'} added successfully.`,
        });
      }
      setIsModalOpen(false);
      setEditingExpense(null);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Save failed',
        message: error.message,
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      type: '',
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const totalAmount = filteredAndSortedExpenses.reduce((sum, expense) => {
    return expense.type === 'expense' ? sum - expense.amount : sum + expense.amount;
  }, 0);

  // Prepare data for pie chart
  const pieChartData = useMemo(() => {
    const categoryTotals = {};

    filteredAndSortedExpenses
      .filter(expense => expense.type === 'expense')
      .forEach(expense => {
        const categoryName = expense.categoryName || 'Uncategorized';
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = {
            name: categoryName,
            value: 0,
            categoryId: expense.categoryId,
          };
        }
        categoryTotals[categoryName].value += expense.amount;
      });

    return Object.values(categoryTotals).sort((a, b) => b.value - a.value);
  }, [filteredAndSortedExpenses]);

  const handlePieSliceClick = (data) => {
    if (data.categoryId) {
      setFilters(prev => ({ ...prev, categoryId: data.categoryId.toString() }));
      setShowPieChart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-navy-400">
          <LoadingSpinner size="lg" />
          Loading expenses...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Expenses</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
          <button
            onClick={() => setShowPieChart(!showPieChart)}
            className={`btn-secondary flex items-center gap-2 ${showPieChart ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
          >
            <ChartPieIcon className="h-5 w-5" />
            Chart
          </button>
          <button
            onClick={handleAddExpense}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Expense
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              {categoriesLoading ? (
                <div className="flex items-center gap-2 text-sm text-navy-400">
                  <LoadingSpinner size="sm" />
                  Loading categories...
                </div>
              ) : (
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="select w-full"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="select w-full"
              >
                <option value="">All Types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="input w-full"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="input w-full"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="select w-full"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sort Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="select w-full"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            <div className="flex items-end">
              <button onClick={clearFilters} className="btn-secondary w-full">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pie Chart */}
      {showPieChart && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="text-lg font-semibold mb-4">Expense Breakdown by Category</h3>
          <InteractivePieChart
            data={pieChartData}
            height={400}
            showLegend={true}
            interactive={true}
            onSliceClick={handlePieSliceClick}
            animationDelay={300}
          />
          <p className="text-sm text-navy-400 text-center mt-4">
            Click on a slice to filter expenses by that category
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="card mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <span className="text-lg">Total: {filteredAndSortedExpenses.length} transactions</span>
          <span className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(Math.abs(totalAmount))}
          </span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        {filteredAndSortedExpenses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-navy-700/60">
              <svg
                className="h-10 w-10 text-purple-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 7h12M6 11h12M6 15h6m-7 7h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
            <p className="text-navy-400 mb-4">
              Add your first transaction to start tracking spending.
            </p>
            <button onClick={handleAddExpense} className="btn-primary">
              Add your first expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-700 text-left">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-navy-700 hover:bg-navy-700/50 transition-colors">
                    <td className="px-4 py-3">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3">
                      {expense.description || <span className="text-navy-400">No description</span>}
                    </td>
                    <td className="px-4 py-3">
                      {expense.categoryName ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: expense.categoryColor + '33', color: expense.categoryColor }}
                        >
                          {expense.categoryName}
                        </span>
                      ) : (
                        <span className="text-navy-400">Uncategorized</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      expense.type === 'income' ? 'text-green-400' : 'text-white'
                    }`}>
                      {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="p-1.5 text-navy-400 hover:text-purple-400 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense)}
                          disabled={deletingExpenseId === expense.id}
                          className="p-1.5 text-navy-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Transaction' : 'Add Transaction'}
      >
        <ExpenseForm
          initialData={editingExpense || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingExpense(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        title="Delete Expense"
      >
        <div className="space-y-6">
          <p className="text-sm text-navy-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">
              {expenseToDelete?.description || 'this expense'}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={confirmDelete}
              disabled={isDeleteLoading}
              className="btn-primary flex-1 bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2"
            >
              {isDeleteLoading && <LoadingSpinner size="sm" />}
              Delete
            </button>
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setExpenseToDelete(null);
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;
