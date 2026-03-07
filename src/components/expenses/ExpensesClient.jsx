import React, { useState, useRef } from 'react';
import { TopStats }           from './TopStats';
import { MoneyFlowBanner }    from './MoneyFlowBanner';
import { AccountHealthCards } from './AccountHealthCards';
import { AIInsights }         from './AIInsights';
import { CategoryBreakdown }  from './CategoryBreakdown';
import { IncomeEditModal }    from './IncomeEditModal';

export function ExpensesClient({ data }) {
  const categoryRef = useRef(null);
  const [income, setIncome]               = useState(data.income);
  const [showModal, setShowModal]         = useState(false);
  const [fixedExpenses, setFixedExpenses] = useState(data.fixedExpenses || []);
  const [creditCards, setCreditCards]     = useState(data.creditCards || []);

  const totalIncome   = income.anurag.salary + income.anurag.bonus + income.nidhi.salary + income.nidhi.bonus;
  const totalExpenses = data.expenses.joint + data.expenses.anurag + data.expenses.nidhi;
  const surplus       = totalIncome - totalExpenses;
  const totalFixed    = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const totalCC       = creditCards.reduce((s, c) => s + c.spend, 0);
  const investable    = surplus - data.sips - totalFixed - totalCC;
  const savingsRate   = Math.round((surplus / totalIncome) * 100);

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>Expenses</div>
            <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 3 }}>Monthly money flow · {data.month}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 14px", fontSize: 14, color: "#374151", fontWeight: 500 }}>
            📅 {data.month}
          </div>
        </div>
        <TopStats totalExpenses={totalExpenses} lastMonthExpenses={data.lastMonthExpenses} savingsRate={savingsRate} totalIncome={totalIncome} income={income} onEditIncome={() => setShowModal(true)} onExpensesClick={() => categoryRef.current?.scrollIntoView({ behavior: 'smooth' })} />
        <MoneyFlowBanner investable={investable} totalIncome={totalIncome} fixedExpenses={fixedExpenses} onFixedExpensesChange={setFixedExpenses} creditCards={creditCards} onCreditCardsChange={setCreditCards} />
        <AccountHealthCards accounts={data.accounts} />
        <div ref={categoryRef} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <CategoryBreakdown categories={data.categories} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <AIInsights insights={data.aiInsights} />
          </div>
        </div>
      </div>
      {showModal && (
        <IncomeEditModal
          month={data.month}
          income={income}
          onSave={(vals) => {
            setIncome({
              anurag: { salary: vals.anuragSalary, bonus: vals.anuragBonus },
              nidhi:  { salary: vals.nidhiSalary,  bonus: vals.nidhiBonus  },
            });
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
