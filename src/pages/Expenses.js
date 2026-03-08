import React, { useState, useEffect } from 'react';
import { ExpensesClient } from '../components/expenses/ExpensesClient';
import { getExpensesData } from '../lib/expenses.data';

function getLast12Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }));
  }
  return months;
}

const MONTHS = getLast12Months();

const Expenses = () => {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    setLoading(true);
    getExpensesData(selectedMonth).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  return (
    <ExpensesClient
      data={data}
      months={MONTHS}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
    />
  );
};

export default Expenses;
