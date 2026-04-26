import React, { useState } from 'react';
import { fmt } from '../../lib/expenses.types';

function PillGroup({ items, month, canEdit, onEdit, onDelete }) {
  if (items.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic" }}>
        No items yet — click + Add to get started.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map(fe => {
        const editable = canEdit && fe.addedMonth === month;
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
            {editable && (
              <>
                <button
                  onClick={() => onEdit(fe)}
                  title="Edit"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9ca3af", padding: "0 1px", lineHeight: 1 }}
                >✎</button>
                <button
                  onClick={() => onDelete(fe.id)}
                  title="Delete"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#fca5a5", padding: "0 1px", lineHeight: 1 }}
                >✕</button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MoneyFlowBanner({ investable, totalIncome, fixedExpenses, onFixedExpensesChange, canEditFixed, month }) {
  const [editTarget, setEditTarget] = useState(null); // null | "new" | fe object
  const [editVals, setEditVals]     = useState({ label: "", amount: "", months: "", section: "fixed" });

  const fixedItems     = fixedExpenses.filter(fe => (fe.section ?? 'fixed') === 'fixed');
  const committedItems = fixedExpenses.filter(fe => (fe.section ?? 'fixed') === 'committed');
  const totalFixed     = fixedItems.reduce((s, f) => s + f.amount, 0);
  const totalCommitted = committedItems.reduce((s, f) => s + f.amount, 0);

  const openAdd    = (section) => { setEditVals({ label: "", amount: "", months: "", section }); setEditTarget("new"); };
  const openEdit   = (fe) => {
    setEditVals({ label: fe.label, amount: String(fe.amount), months: fe.months ? String(fe.months) : "", section: fe.section ?? 'fixed' });
    setEditTarget(fe);
  };
  const cancelEdit = () => setEditTarget(null);
  const saveEdit   = () => {
    const label   = editVals.label.trim();
    const amount  = Number(editVals.amount);
    const months  = editVals.months !== "" ? Number(editVals.months) : 0;
    const section = editVals.section;
    if (!label || !amount || amount <= 0) return;
    if (editTarget === "new") {
      onFixedExpensesChange([...fixedExpenses, { id: Date.now().toString(), label, amount, months: months || 0, addedMonth: month, section }]);
    } else {
      onFixedExpensesChange(fixedExpenses.map(fe => fe.id === editTarget.id ? { ...fe, label, amount, months: months || 0, section } : fe));
    }
    setEditTarget(null);
  };
  const deleteExpense = (id) => onFixedExpensesChange(fixedExpenses.filter(fe => fe.id !== id));

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "22px 24px" }}>

      {/* Section header */}
      <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>Monthly Money Flow</div>
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Track your recurring commitments each month</div>

      {/* ── Subsection 1: Fixed Expenses ── */}
      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.8px" }}>Fixed Expenses</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#1e40af", letterSpacing: "-0.5px" }}>{fmt(totalFixed)}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>/ mo</span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#15803d",
              background: "#dcfce7", border: "1px solid #86efac",
              borderRadius: 4, padding: "1px 7px",
            }}>counted in expenses</span>
          </div>
          {canEditFixed && (
            <button
              onClick={() => openAdd('fixed')}
              style={{
                fontSize: 12, fontWeight: 600, color: "#1e40af",
                background: "#eff6ff", border: "1px solid #bfdbfe",
                borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >+ Add</button>
          )}
        </div>
        <PillGroup items={fixedItems} month={month} canEdit={canEditFixed} onEdit={openEdit} onDelete={deleteExpense} />
      </div>

      {/* ── Subsection 2: Committed Payments ── */}
      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.8px" }}>Committed Payments</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#6b7280", letterSpacing: "-0.5px" }}>{fmt(totalCommitted)}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>/ mo</span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#92400e",
              background: "#fef3c7", border: "1px solid #fcd34d",
              borderRadius: 4, padding: "1px 7px",
            }}>reference only</span>
          </div>
          {canEditFixed && (
            <button
              onClick={() => openAdd('committed')}
              style={{
                fontSize: 12, fontWeight: 600, color: "#6b7280",
                background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >+ Add</button>
          )}
        </div>
        <PillGroup items={committedItems} month={month} canEdit={canEditFixed} onEdit={openEdit} onDelete={deleteExpense} />
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
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>
                {editTarget === "new" ? "Add Commitment" : "Edit Commitment"}
              </div>
              <button onClick={cancelEdit} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>EMIs, rent, insurance — recurring committed expenses</div>

            {/* Section selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Section</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { value: "fixed",     label: "Fixed Expenses",     desc: "counted in expenses" },
                  { value: "committed", label: "Committed Payments",  desc: "reference only"      },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEditVals(p => ({ ...p, section: opt.value }))}
                    style={{
                      flex: 1, padding: "8px 10px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                      border: `2px solid ${editVals.section === opt.value ? (opt.value === 'fixed' ? '#1e40af' : '#6b7280') : '#e5e7eb'}`,
                      background: editVals.section === opt.value ? (opt.value === 'fixed' ? '#eff6ff' : '#f9fafb') : '#fff',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: editVals.section === opt.value ? (opt.value === 'fixed' ? '#1e40af' : '#374151') : '#6b7280' }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Label</label>
              <input
                type="text"
                value={editVals.label}
                onChange={e => setEditVals(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. House Rent"
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
                style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: editVals.section === 'fixed' ? "#1e40af" : "#4b5563", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}
              >
                {editTarget === "new" ? "Add" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
