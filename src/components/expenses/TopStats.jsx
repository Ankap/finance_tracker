import React, { useState } from 'react';
import { fmt } from '../../lib/expenses.types';

function InlineNumberModal({ title, fields, onSave, onClose }) {
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map(f => [f.key, f.value])));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>{f.label} (₹)</label>
            <input
              type="number"
              value={vals[f.key]}
              onChange={e => setVals(p => ({ ...p, [f.key]: Number(e.target.value) || 0 }))}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { onSave(vals); onClose(); }} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#3d6b4f", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export function TopStats({ totalExpenses, lastMonthExpenses, savingsRate, totalIncome, investable, income, onEditIncome, onExpensesClick, onEditLastMonth, onEditExpenses }) {
  const [editingExpenses, setEditingExpenses]   = useState(false);
  const [editingLastMonth, setEditingLastMonth] = useState(false);

  const delta = totalExpenses - lastMonthExpenses;
  const down  = delta < 0;
  const anuragTotal = income.anurag.salary + income.anurag.bonus;
  const nidhiTotal  = income.nidhi.salary  + income.nidhi.bonus;

  return (
    <>
      <div className="expenses-stats-row" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {/* Total Expenses */}
        <div style={{ flex: 1, minWidth: 220, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>Total Expenses</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setEditingExpenses(true)} style={{ fontSize: 11, fontWeight: 600, color: "#3d6b4f", background: "#f0faf4", border: "1px solid #bbf0d0", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>✎ Edit</button>
            </div>
          </div>
          <div onClick={onExpensesClick} style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4, cursor: onExpensesClick ? "pointer" : "default" }}>{fmt(totalExpenses)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: down ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 600 }}>{down ? `↓ ${fmt(Math.abs(delta))} vs last month` : `↑ ${fmt(delta)} vs last month`}</span>
            <button onClick={() => setEditingLastMonth(true)} title="Edit last month" style={{ fontSize: 10, color: "#9ca3af", background: "none", border: "1px solid #e5e7eb", borderRadius: 4, padding: "1px 5px", cursor: "pointer" }}>✎</button>
          </div>
        </div>

        {/* Total Savings */}
        <div style={{ flex: 1, minWidth: 220, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 22px" }}>
          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 6 }}>Total Savings</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: investable >= 0 ? "#111827" : "#dc2626", letterSpacing: "-0.5px", marginBottom: 4 }}>{fmt(Math.abs(investable))}{investable < 0 ? ' deficit' : ''}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: savingsRate >= 40 ? "#16a34a" : "#d97706", fontSize: 12, fontWeight: 600 }}>{savingsRate}% savings rate</span>
            <span style={{ fontSize: 11, color: "#d1d5db" }}>·</span>
            <span style={{ fontSize: 12, color: savingsRate >= 40 ? "#16a34a" : "#d97706", fontWeight: 500 }}>{savingsRate >= 40 ? "✓ above target" : "below 40% target"}</span>
          </div>
        </div>

        {/* Total Income */}
        <div style={{ flex: 1, minWidth: 220, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 22px" }}>
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

      {editingExpenses && (
        <InlineNumberModal
          title="Edit Monthly Expenses"
          fields={[
            { key: "joint",  label: "Joint Account Expenses",   value: 0 },
            { key: "anurag", label: "Anurag's Account Expenses", value: 0 },
            { key: "nidhi",  label: "Nidhi's Account Expenses",  value: 0 },
          ]}
          onSave={(vals) => onEditExpenses({ joint: vals.joint, anurag: vals.anurag, nidhi: vals.nidhi })}
          onClose={() => setEditingExpenses(false)}
        />
      )}

      {editingLastMonth && (
        <InlineNumberModal
          title="Edit Last Month Expenses"
          fields={[{ key: "amount", label: "Last Month Total Expenses", value: lastMonthExpenses }]}
          onSave={(vals) => onEditLastMonth(vals.amount)}
          onClose={() => setEditingLastMonth(false)}
        />
      )}
    </>
  );
}
