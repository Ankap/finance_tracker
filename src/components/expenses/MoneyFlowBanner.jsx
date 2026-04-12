import React, { useState } from 'react';
import { fmt } from '../../lib/expenses.types';

export function MoneyFlowBanner({ investable, totalIncome, fixedExpenses, onFixedExpensesChange, canEditFixed, month }) {
  const [editTarget, setEditTarget] = useState(null); // null | "new" | { id, label, amount }
  const [editVals, setEditVals]     = useState({ label: "", amount: "", months: "" });

  const totalFixed = fixedExpenses.reduce((s, f) => s + f.amount, 0);

  const openAdd    = () => { setEditVals({ label: "", amount: "", months: "" }); setEditTarget("new"); };
  const openEdit   = (fe) => { setEditVals({ label: fe.label, amount: String(fe.amount), months: fe.months ? String(fe.months) : "" }); setEditTarget(fe); };
  const cancelEdit = () => setEditTarget(null);
  const saveEdit   = () => {
    const label  = editVals.label.trim();
    const amount = Number(editVals.amount);
    const months = editVals.months !== "" ? Number(editVals.months) : 0;
    if (!label || !amount || amount <= 0) return;
    if (editTarget === "new") {
      onFixedExpensesChange([...fixedExpenses, { id: Date.now().toString(), label, amount, months: months || 0, addedMonth: month }]);
    } else {
      onFixedExpensesChange(fixedExpenses.map(fe => fe.id === editTarget.id ? { ...fe, label, amount, months: months || 0 } : fe));
    }
    setEditTarget(null);
  };
  const deleteExpense = (id) => onFixedExpensesChange(fixedExpenses.filter(fe => fe.id !== id));

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "22px 24px" }}>

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>Monthly Money Flow</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>Fixed commitments deducted from your investable surplus</div>
        </div>
        {canEditFixed && (
          <button
            onClick={openAdd}
            style={{
              fontSize: 12, fontWeight: 600, color: "#1e40af",
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 8, padding: "6px 14px", cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0, marginLeft: 16,
            }}
          >
            + Add commitment
          </button>
        )}
      </div>

      {/* Fixed commitments row */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.8px" }}>Fixed</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#1e40af", letterSpacing: "-0.5px" }}>{fmt(totalFixed)}</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>/ mo</span>
        </div>

        {fixedExpenses.length === 0 ? (
          <div style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic" }}>
            No commitments yet — add EMIs, rent, or insurance.
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {fixedExpenses.map(fe => {
              const canEdit = fe.addedMonth === month;
              return (
                <div
                  key={fe.id}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    background: "#f5f7ff", border: "1px solid #c7d2fe",
                    borderRadius: 100, padding: "5px 8px 5px 14px",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{fe.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>{fmt(fe.amount)}</span>
                  <span style={{
                    fontSize: 10, color: "#6366f1",
                    background: "#e0e7ff", borderRadius: 4,
                    padding: "1px 6px", fontWeight: 600,
                  }}>
                    {fe.months > 0 ? `${fe.months} mo` : "∞"}
                  </span>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => openEdit(fe)}
                        title="Edit"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9ca3af", padding: "0 1px", lineHeight: 1 }}
                      >✎</button>
                      <button
                        onClick={() => deleteExpense(fe.id)}
                        title="Delete"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#fca5a5", padding: "0 1px", lineHeight: 1 }}
                      >✕</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider arrow */}
      <div style={{ textAlign: "center", color: "#d1d5db", fontSize: 18, margin: "18px 0 14px" }}>↓</div>

      {/* Investable Surplus card */}
      <div style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        border: "1px solid #86efac", borderRadius: 12,
        padding: "16px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 14, color: "#15803d", fontWeight: 700, marginBottom: 3 }}>💰 Investable Surplus this month</div>
          <div style={{ fontSize: 12, color: "#4b7a5a" }}>
            After expenses{totalFixed > 0 ? " and fixed commitments" : ""} — free to deploy toward your house fund
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 30, fontWeight: 800, letterSpacing: "-1px",
            color: investable >= 0 ? "#166534" : "#dc2626",
          }}>
            {fmt(Math.abs(investable))}{investable < 0 ? " over" : ""}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {totalIncome > 0 ? `${Math.round((investable / totalIncome) * 100)}% of income` : ""}
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      {editTarget !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>
                {editTarget === "new" ? "Add Fixed Commitment" : "Edit Fixed Commitment"}
              </div>
              <button onClick={cancelEdit} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>EMIs, rent, insurance — recurring committed expenses</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Label</label>
              <input
                type="text"
                value={editVals.label}
                onChange={e => setEditVals(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Home Loan EMI"
                autoFocus
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Amount (₹)</label>
              <input
                type="number"
                value={editVals.amount}
                onChange={e => setEditVals(p => ({ ...p, amount: e.target.value }))}
                placeholder="0"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Duration (months)</label>
              <input
                type="number"
                min="1"
                value={editVals.months}
                onChange={e => setEditVals(p => ({ ...p, months: e.target.value }))}
                placeholder="Leave blank for permanent"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>e.g. 12 for a 1-year EMI. Leave blank if it never ends.</div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={cancelEdit}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}
              >Cancel</button>
              <button
                onClick={saveEdit}
                style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#1e40af", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
              >
                {editTarget === "new" ? "Add Commitment" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
