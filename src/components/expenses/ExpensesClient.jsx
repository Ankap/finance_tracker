import React, { useState, useRef, useEffect } from 'react';
import { TopStats }           from './TopStats';
import { MoneyFlowBanner }    from './MoneyFlowBanner';
import { CategoryBreakdown }  from './CategoryBreakdown';
import { StatementOverview }  from './StatementOverview';
import { IncomeEditModal }    from './IncomeEditModal';
import { saveIncome, saveExpensesData, saveGlobalDefaults, monthLabelToKey } from '../../lib/expenses.data';

const BLANK = {
  income:           { anurag: { salary: 0, bonus: 0 }, nidhi: { salary: 0, bonus: 0 } },
  sips:             0,
  expenses:         { joint: 0, anurag: 0, nidhi: 0 },
  lastMonthExpenses:0,
  accounts: {
    joint:  { label: 'Joint Account',    opening: 0, moneyIn: [], moneyOut: [], ccBillPaid: 0, ccBillNote: null, ccSpends: null },
    anurag: { label: "Anurag's Account", opening: 0, moneyIn: [], moneyOut: [], ccBillPaid: 0, ccBillNote: null, ccSpends: null },
    nidhi:  { label: "Nidhi's Account",  opening: 0, moneyIn: [], moneyOut: [], ccBillPaid: 0, ccBillNote: null, ccSpends: null },
  },
  categories:    [],
  fixedExpenses: [],
  creditCards:   [],
};

export function ExpensesClient({ data, months, selectedMonth, onMonthChange }) {
  const categoryRef = useRef(null);

  const [income, setIncome]                       = useState(data.income);
  const [showModal, setShowModal]                 = useState(false);
  const [fixedExpenses, setFixedExpenses]         = useState(data.fixedExpenses || []);
  const [creditCards, setCreditCards]             = useState(data.creditCards || []);
  const [sips, setSips]                           = useState(data.sips || 0);
  const [expenses, setExpenses]                   = useState(data.expenses || { joint: 0, anurag: 0, nidhi: 0 });
  const [lastMonthExpenses, setLastMonthExpenses] = useState(data.lastMonthExpenses || 0);
  const [accounts, setAccounts]                   = useState(data.accounts || {});
  const [categories, setCategories]               = useState(data.categories || []);

  // Re-sync all state when the loaded month data changes
  useEffect(() => {
    setIncome(data.income);
    setSips(data.sips || 0);
    setExpenses(data.expenses || { joint: 0, anurag: 0, nidhi: 0 });
    setLastMonthExpenses(data.lastMonthExpenses || 0);
    setAccounts(data.accounts || {});
    setCategories(data.categories || []);
    setFixedExpenses(data.fixedExpenses || []);
    setCreditCards(data.creditCards || []);
  }, [data]);

  const persist = (patch) => saveExpensesData(data.month, patch);

  const handleClear = async () => {
    if (!window.confirm('Clear ALL data for this month and start from scratch?')) return;
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset', month: data.month }),
    });
    // Reset local state immediately
    setIncome(BLANK.income);
    setSips(BLANK.sips);
    setExpenses(BLANK.expenses);
    setLastMonthExpenses(BLANK.lastMonthExpenses);
    setAccounts(BLANK.accounts);
    setCategories(BLANK.categories);
    setFixedExpenses(BLANK.fixedExpenses);
    setCreditCards(BLANK.creditCards);
  };

  const totalIncome  = income.anurag.salary + income.anurag.bonus + income.nidhi.salary + income.nidhi.bonus;
  const viewedKey    = monthLabelToKey(data.month) || '';

  const getEndMonthKey = (fe) => {
    if (!fe.months || fe.months <= 0) return null; // permanent
    const d = new Date(`1 ${fe.addedMonth}`);
    d.setMonth(d.getMonth() + fe.months - 1);
    return `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const visibleFixed = fixedExpenses.filter(fe => {
    const startKey = fe.addedMonth ? monthLabelToKey(fe.addedMonth) : null;
    if (startKey && startKey > viewedKey) return false;
    const endKey = getEndMonthKey(fe);
    if (endKey && endKey < viewedKey) return false;
    return true;
  });
  const hiddenFixed  = fixedExpenses.filter(fe => fe.addedMonth && monthLabelToKey(fe.addedMonth) > viewedKey);
  // Only "fixed" section items count toward total expenses
  const totalFixed   = visibleFixed.filter(fe => (fe.section ?? 'fixed') === 'fixed').reduce((s, f) => s + f.amount, 0);
  const totalCC         = creditCards.reduce((s, c) => s + c.spend, 0);
  const categoriesTotal = categories.reduce((s, c) => s + c.amount, 0);
  const totalExpenses   = expenses.joint + expenses.anurag + expenses.nidhi + totalFixed + sips + categoriesTotal;
  const surplus         = totalIncome - totalExpenses - totalCC;
  const investable      = surplus;
  const savingsRate     = totalIncome > 0 ? Math.round((surplus / totalIncome) * 100) : 0;

  return (
    <div style={{ background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="expenses-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>Expenses</div>
            <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 3 }}>Monthly money flow · {data.month}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: 10, pointerEvents: "none", fontSize: 14 }}>📅</span>
              <select
                value={selectedMonth || data.month}
                onChange={e => onMonthChange && onMonthChange(e.target.value)}
                style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px 6px 30px", fontSize: 14, color: "#374151", fontWeight: 500, cursor: "pointer", appearance: "none", WebkitAppearance: "none", outline: "none" }}
              >
                {(months || [data.month]).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleClear}
              style={{ background: "#fff", border: "1px solid #fca5a5", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#dc2626", fontWeight: 600, cursor: "pointer" }}
              title="Clear all data for this month"
            >
              🗑 Clear Data
            </button>
          </div>
        </div>

        <TopStats
          totalExpenses={totalExpenses}
          lastMonthExpenses={lastMonthExpenses}
          savingsRate={savingsRate}
          totalIncome={totalIncome}
          investable={investable}
          income={income}
          onEditIncome={() => setShowModal(true)}
          onExpensesClick={() => categoryRef.current?.scrollIntoView({ behavior: 'smooth' })}
          onEditLastMonth={(v) => { setLastMonthExpenses(v); persist({ lastMonthExpenses: v }); }}
          onEditExpenses={(v) => { setExpenses(v); persist({ expenses: v }); }}
        />

        <MoneyFlowBanner
          investable={investable}
          totalIncome={totalIncome}
          fixedExpenses={visibleFixed}
          onFixedExpensesChange={(v) => { const updated = [...v, ...hiddenFixed]; setFixedExpenses(updated); saveGlobalDefaults({ fixedExpenses: updated }); }}
          canEditFixed={true}
          month={data.month}
        />

        <div ref={categoryRef} className="expenses-bottom-row" style={{ display: "flex", gap: 20, alignItems: "stretch", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 280, display: "flex", flexDirection: "column" }}>
            <CategoryBreakdown
              categories={categories}
              onCategoriesChange={(v) => { setCategories(v); persist({ categories: v }); }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column" }}>
            <StatementOverview categories={categories} />
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
            saveIncome(data.month, vals.anuragSalary, vals.anuragBonus, vals.nidhiSalary, vals.nidhiBonus);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
