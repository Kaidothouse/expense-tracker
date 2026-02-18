import { useState, useEffect, useCallback } from 'react';
import { budgetAPI } from '../services/api';

export const useBudget = () => {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await budgetAPI.getCurrent();
      setBudget(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch budget');
      console.error('Error fetching budget:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, []);

  const updateMonthlyBudget = async (amount) => {
    try {
      await budgetAPI.updateMonthly(amount);
      await fetchBudget();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update budget');
    }
  };

  return {
    budget,
    loading,
    error,
    refetch: fetchBudget,
    updateMonthlyBudget,
  };
};

export const useTrends = (months = 6) => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await budgetAPI.getTrends(months);
      setTrends(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trends');
      console.error('Error fetching trends:', err);
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return {
    trends,
    loading,
    error,
    refetch: fetchTrends,
  };
};
