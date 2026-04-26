import React, { useState } from 'react';
import { AccountPill, TrendBadge } from './Primitives';
import { ACCT_STYLES, ACCT_LABEL, fmt } from '../../lib/expenses.types';

// Full Indian-locale amount: ₹29,800 or −₹500
const fmtFull = (n) => {
  if (n == null) return '₹0';
  const abs = Math.abs(Math.round(n));
  return n < 0 ? `−₹${abs.toLocaleString('en-IN')}` : `₹${abs.toLocaleString('en-IN')}`;
};

const ICONS = ["🏠","🛍️","🛒","🛡️","⛽","💡","🍽️","🎁","📱","✈️","🏥","🎓","🚗","💊","🎬","🏋️","🍕","☕","🐾","🌐"];

function CategoryModal({ cat, onSave, onClose, totalAmount }) {
  const [vals, setVals] = useState({
    name:    cat?.name    || "",
    icon:    cat?.icon    || "🛒",
    account: cat?.account || "joint",
    amount:  cat?.amount  || 0,
    txns:    cat?.txns    || 1,
    trend:   cat?.trend   || 0,
  });

  const save = () => {
    if (!vals.name.trim() || !vals.amount) return;
    const newTotal = totalAmount - (cat?.amount || 0) + Number(vals.amount);
    const pct = newTotal > 0 ? parseFloat(((Number(vals.amount) / newTotal) * 100).toFixed(1)) : 0;
    onSave({ ...vals, amount: Number(vals.amount), txns: Number(vals.txns) || 1, trend: Number(vals.trend) || 0, pct });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>{cat ? "Edit Category" : "Add Category"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>

        {/* Icon picker */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Icon</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ICONS.map(ic => (
              <button key={ic} onClick={() => setVals(p => ({ ...p, icon: ic }))} style={{ fontSize: 18, width: 36, height: 36, borderRadius: 8, border: `2px solid ${vals.icon === ic ? "#3d6b4f" : "#e5e7eb"}`, background: vals.icon === ic ? "#f0faf4" : "#fff", cursor: "pointer" }}>{ic}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Category Name</label>
            <input value={vals.name} onChange={e => setVals(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Groceries" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Amount (₹)</label>
            <input type="number" value={vals.amount} onChange={e => setVals(p => ({ ...p, amount: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Account</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["joint", "anurag", "nidhi"].map(o => (
              <button key={o} onClick={() => setVals(p => ({ ...p, account: o }))} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${vals.account === o ? ACCT_STYLES[o].color : "#e5e7eb"}`, background: vals.account === o ? ACCT_STYLES[o].bg : "#fff", color: vals.account === o ? ACCT_STYLES[o].color : "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {ACCT_LABEL[o]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Transactions</label>
            <input type="number" value={vals.txns} onChange={e => setVals(p => ({ ...p, txns: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>MoM Trend (%)</label>
            <input type="number" value={vals.trend} onChange={e => setVals(p => ({ ...p, trend: e.target.value }))} placeholder="0 = no change" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#3d6b4f", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>{cat ? "Save Changes" : "Add Category"}</button>
        </div>
      </div>
    </div>
  );
}

function recalcPct(cats) {
  const total = cats.reduce((s, c) => s + c.amount, 0);
  return cats.map(c => ({ ...c, pct: total > 0 ? parseFloat(((c.amount / total) * 100).toFixed(1)) : 0 }));
}

function CategoryList({ categories, filter, setFilter, onClose, onCategoriesChange }) {
  const [editingCat, setEditingCat] = useState(null); // null | "new" | cat object
  const filtered = (filter === "all" ? categories : categories.filter(c => (c.account || '').toLowerCase() === filter))
    .slice().sort((a, b) => b.amount - a.amount);
  const totalAmount    = categories.reduce((s, c) => s + c.amount, 0);
  const filteredTotal  = filtered.reduce((s, c) => s + c.amount, 0);

  const handleSave = (saved) => {
    let updated;
    if (editingCat === "new") {
      updated = [...categories, { ...saved, name: saved.name }];
    } else {
      updated = categories.map(c => c.name === editingCat.name ? { ...c, ...saved } : c);
    }
    onCategoriesChange(recalcPct(updated));
  };

  const handleDelete = (name) => onCategoriesChange(recalcPct(categories.filter(c => c.name !== name)));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Category Breakdown</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: filter === "all" ? "#3d6b4f" : (ACCT_STYLES[filter] || ACCT_STYLES.joint).color }}>
            {fmtFull(filteredTotal)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {["all", "joint", "anurag", "nidhi"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, cursor: "pointer", border: `1px solid ${filter === f ? (f === "all" ? "#3d6b4f" : ACCT_STYLES[f].color) : "#e5e7eb"}`, background: filter === f ? (f === "all" ? "#f0faf4" : ACCT_STYLES[f].bg) : "#fff", color: filter === f ? (f === "all" ? "#3d6b4f" : ACCT_STYLES[f].color) : "#6b7280" }}>
              {f === "all" ? "All" : ACCT_LABEL[f]}
            </button>
          ))}
          <button onClick={() => setEditingCat("new")} style={{ fontSize: 12, fontWeight: 600, color: "#3d6b4f", background: "#f0faf4", border: "1px solid #bbf0d0", borderRadius: 20, padding: "4px 12px", cursor: "pointer" }}>+ Add</button>
          {onClose && <button onClick={onClose} title="Close" style={{ fontSize: 18, lineHeight: 1, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", marginLeft: 4, padding: "2px 6px" }}>✕</button>}
        </div>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {filtered.map(cat => (
          <div key={`${cat.account || 'unknown'}-${cat.name}`} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22, width: 36, textAlign: "center" }}>{cat.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{cat.name}</span>
                <AccountPill account={cat.account} />
                <TrendBadge trend={cat.trend} />
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 4, height: 5 }}>
                <div style={{ width: `${Math.min(cat.pct * 2.8, 100)}%`, height: "100%", borderRadius: 4, background: (ACCT_STYLES[cat.account] || ACCT_STYLES.joint).color }} />
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: 80 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{fmtFull(cat.amount)}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{cat.txns} txn{cat.txns !== 1 ? "s" : ""} · {cat.pct}%</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button onClick={() => setEditingCat(cat)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9ca3af", padding: "2px 4px" }}>✎</button>
              <button onClick={() => handleDelete(cat.name)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", padding: "2px 4px" }}>✕</button>
            </div>
          </div>
        ))}
      </div>
      {editingCat !== null && (
        <CategoryModal
          cat={editingCat === "new" ? null : editingCat}
          totalAmount={totalAmount}
          onSave={handleSave}
          onClose={() => setEditingCat(null)}
        />
      )}
    </>
  );
}

export function CategoryBreakdown({ categories, onCategoriesChange }) {
  const [filter, setFilter]     = useState("all");
  const [expanded, setExpanded] = useState(false);

  const visibleCats   = (filter === "all" ? categories : categories.filter(c => (c.account || '').toLowerCase() === filter))
    .slice().sort((a, b) => b.amount - a.amount);
  const filteredTotal = visibleCats.reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column", maxHeight: 420, boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Category Breakdown</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: filter === "all" ? "#3d6b4f" : (ACCT_STYLES[filter] || ACCT_STYLES.joint).color }}>
              {fmtFull(filteredTotal)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                fontSize: 12, fontWeight: 600, padding: "4px 8px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${filter === "all" ? "#3d6b4f" : (ACCT_STYLES[filter] || ACCT_STYLES.joint).color}`,
                background: filter === "all" ? "#f0faf4" : (ACCT_STYLES[filter] || ACCT_STYLES.joint).bg,
                color: filter === "all" ? "#3d6b4f" : (ACCT_STYLES[filter] || ACCT_STYLES.joint).color,
                outline: "none", appearance: "auto",
              }}
            >
              <option value="all">All</option>
              {["joint", "anurag", "nidhi"].map(f => (
                <option key={f} value={f}>{ACCT_LABEL[f]}</option>
              ))}
            </select>
            <button onClick={() => setExpanded(true)} title="Expand" style={{ fontSize: 13, lineHeight: 1, background: "none", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", color: "#6b7280", padding: "3px 8px" }}>⤢</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {visibleCats.map(cat => (
            <div key={`${cat.account || 'unknown'}-${cat.name}`} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22, width: 36, textAlign: "center" }}>{cat.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{cat.name}</span>
                  <AccountPill account={cat.account} />
                  <TrendBadge trend={cat.trend} />
                </div>
                <div style={{ background: "#f3f4f6", borderRadius: 4, height: 5 }}>
                  <div style={{ width: `${Math.min(cat.pct * 2.8, 100)}%`, height: "100%", borderRadius: 4, background: (ACCT_STYLES[cat.account] || ACCT_STYLES.joint).color }} />
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 80 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{fmtFull(cat.amount)}</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{cat.txns} txn{cat.txns !== 1 ? "s" : ""} · {cat.pct}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setExpanded(false)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", width: "70vw", maxWidth: 900, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <CategoryList
              categories={categories}
              filter={filter}
              setFilter={setFilter}
              onClose={() => setExpanded(false)}
              onCategoriesChange={onCategoriesChange}
            />
          </div>
        </div>
      )}
    </>
  );
}
