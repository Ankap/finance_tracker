import React, { useState, useEffect } from 'react';
import { ExpensesClient } from '../components/expenses/ExpensesClient';
import { getExpensesData } from '../lib/expenses.data';

function getCurrentMonth() {
  return new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

const Expenses = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpensesData(getCurrentMonth()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  return <ExpensesClient data={data} />;
};

export default Expenses;
