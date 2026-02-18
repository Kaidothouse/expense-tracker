import { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseAPI } from '../services/api';

export const useExpenses = (filters) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filterKey = JSON.stringify(filters || {});
  const stableFilters = useMemo(() => filters || {}, [filterKey]);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await expenseAPI.getAll(stableFilters);
      setExpenses(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [filterKey, stableFilters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = async (data) => {
    try {
      const response = await expenseAPI.create(data);
      await fetchExpenses();
      return response.data.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create expense');
    }
  };

  const updateExpense = async (id, data) => {
    try {
      const response = await expenseAPI.update(id, data);
      await fetchExpenses();
      return response.data.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update expense');
    }
  };

  const deleteExpense = async (id) => {
    try {
      await expenseAPI.delete(id);
      await fetchExpenses();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  return {
    expenses,
    loading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
