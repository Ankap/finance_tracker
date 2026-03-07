import React from 'react';
import { fmt } from '../../lib/expenses.types';

export function TopStats({ totalExpenses, lastMonthExpenses, savingsRate, totalIncome, income, onEditIncome, onExpensesClick }) {
  const delta       = totalExpenses - lastMonthExpenses;
  const down        = delta < 0;
  const anuragTotal = income.anurag.salary + income.anurag.bonus;
  const nidhiTotal  = income.nidhi.salary  + income.nidhi.bonus;

  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div onClick={onExpensesClick} style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 22px", cursor: onExpensesClick ? "pointer" : "default" }}>
        <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>Total Expenses</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>{fmt(totalExpenses)}</div>
        <span style={{ color: down ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 600 }}>{down ? `↓ ${fmt(Math.abs(delta))} vs last month` : `↑ ${fmt(delta)} vs last month`}</span>
      </div>

      <div style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 22px" }}>
        <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>Savings Rate</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>{savingsRate}%</div>
        <span style={{ color: savingsRate >= 40 ? "#16a34a" : "#d97706", fontSize: 12, fontWeight: 600 }}>{savingsRate >= 40 ? "✓ Above 40% target" : "Below 40% target"}</span>
      </div>

      <div style={{ flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>Total Income</div>
          <button onClick={onEditIncome} style={{ fontSize: 11, fontWeight: 600, color: "#3d6b4f", background: "#f0faf4", border: "1px solid #bbf0d0", borderRadius: 6, padding: "2px 8px", cursor: "pointer", whiteSpace: "nowrap" }}>✎ Edit</button>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>{fmt(totalIncome)}</div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {fmt(anuragTotal)} Anurag{income.anurag.bonus > 0 && <span style={{ color: "#16a34a" }}> +bonus</span>}
          &nbsp;·&nbsp;
          {fmt(nidhiTotal)} Nidhi{income.nidhi.bonus > 0 && <span style={{ color: "#16a34a" }}> +bonus</span>}
        </div>
      </div>
    </div>
  );
}
