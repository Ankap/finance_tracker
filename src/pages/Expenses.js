import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, Sparkles, Calendar } from 'lucide-react';
import { transactionsAPI, insightsAPI } from '../services/api';
import { formatCurrency, getCategoryIcon } from '../utils/formatters';

const Expenses = () => {
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const fetchExpenseData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryResponse, insightsResponse, transactionsResponse] = await Promise.all([
        transactionsAPI.getMonthlySummary(selectedMonth.year, selectedMonth.month),
        insightsAPI.getExpenseInsights(),
        transactionsAPI.getAll({
          type: 'Expense',
          startDate: new Date(selectedMonth.year, selectedMonth.month - 1, 1),
          endDate: new Date(selectedMonth.year, selectedMonth.month, 0),
        }),
      ]);

      setSummary(summaryResponse.data);
      setInsights(insightsResponse.data.insights || []);
      setTransactions(transactionsResponse.data);
    } catch (error) {
      console.error('Error fetching expense data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchExpenseData();
  }, [fetchExpenseData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  const categoryData = summary?.byCategory
    ? Object.entries(summary.byCategory)
        .filter(([_, data]) => data.type === 'Expense')
        .map(([category, data]) => ({
          category,
          total: data.total,
          count: data.count,
          percentage: (data.total / summary.totalExpenses) * 100,
        }))
        .sort((a, b) => b.total - a.total)
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Expenses</h2>
          <p className="text-gray-500 mt-1">Track your spending patterns</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-gray-500" />
          <select
            value={`${selectedMonth.year}-${selectedMonth.month}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedMonth({ year: parseInt(year), month: parseInt(month) });
            }}
            className="input-field w-auto"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              return (
                <option key={i} value={`${year}-${month}`}>
                  {date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Total Expenses</h4>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary?.totalExpenses || 0, true)}
          </p>
        </div>

        <div className="card">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Transactions</h4>
          <p className="text-3xl font-bold text-gray-900">{summary?.transactionCount || 0}</p>
        </div>

        <div className="card">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Top Category</h4>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(categoryData[0]?.category || '')}</span>
            <div>
              <p className="font-semibold text-gray-900">{categoryData[0]?.category || 'N/A'}</p>
              <p className="text-sm text-gray-600">
                {categoryData[0] ? formatCurrency(categoryData[0].total) : '₹0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {insights.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-sage-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">AI Summary</h3>
          </div>

          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-gray-700 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Category Breakdown</h3>

        <div className="space-y-4">
          {categoryData.map(({ category, total, count, percentage }) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{category}</p>
                    <p className="text-sm text-gray-500">{count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(total, true)}</p>
                  <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-sage-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Transactions</h3>

        <div className="space-y-3">
          {transactions.slice(0, 10).map((txn) => (
            <div
              key={txn._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getCategoryIcon(txn.category)}</span>
                <div>
                  <p className="font-medium text-gray-900">{txn.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(txn.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {' • '}
                    {txn.category}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(txn.amount)}</p>
                <p className="text-xs text-gray-500">{txn.paymentMethod}</p>
              </div>
            </div>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Receipt className="mx-auto mb-2" size={48} />
            <p>No transactions found for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
