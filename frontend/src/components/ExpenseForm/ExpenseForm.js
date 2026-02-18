import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
};

const ExpenseForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const { categories, loading: categoriesLoading } = useCategories();
  const [formData, setFormData] = useState({
    amount: initialData.amount ?? '',
    description: initialData.description || '',
    date: initialData.date || getTodayString(),
    type: initialData.type || 'expense',
    categoryId: initialData.categoryId ?? '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const validate = () => {
    const newErrors = {};
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date,
        categoryId: formData.categoryId || null,
      });
    } catch (error) {
      console.error('Error submitting expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      categoryId: '', // Reset category when type changes
    }));
  };

  const displayCategories = formData.type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-navy-600">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2 px-4 font-medium transition-colors duration-200 ${
            formData.type === 'expense'
              ? 'bg-purple-600 text-white'
              : 'bg-navy-700 text-navy-400 hover:text-white'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2 px-4 font-medium transition-colors duration-200 ${
            formData.type === 'income'
              ? 'bg-green-600 text-white'
              : 'bg-navy-700 text-navy-400 hover:text-white'
          }`}
        >
          Income
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium mb-2">Amount</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className={`input w-full ${errors.amount ? 'border-red-500' : ''}`}
          placeholder="0.00"
          step="0.01"
          autoFocus
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input w-full"
          placeholder="Enter description"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-2">Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="input w-full"
          max={getTodayString()}
        />
        {errors.date && (
          <p className="text-red-500 text-sm mt-1">{errors.date}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        {categoriesLoading ? (
          <div className="flex items-center gap-2 text-sm text-navy-400">
            <LoadingSpinner size="sm" />
            Loading categories...
          </div>
        ) : (
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="select w-full"
          >
            <option value="">Select a category</option>
            {displayCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading && <LoadingSpinner size="sm" />}
          {loading ? 'Saving...' : initialData.id ? 'Update' : 'Add'} {formData.type}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
