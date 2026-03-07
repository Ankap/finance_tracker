import React, { useState } from 'react';
import { AccountPill, TrendBadge } from './Primitives';
import { ACCT_STYLES, ACCT_LABEL, fmt } from '../../lib/expenses.types';

function CategoryList({ categories, filter, setFilter, onClose }) {
  const filtered = filter === "all" ? categories : categories.filter(c => c.account === filter);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Category Breakdown</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {["all", "joint", "anurag", "nidhi"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, cursor: "pointer", border: `1px solid ${filter === f ? (f === "all" ? "#3d6b4f" : ACCT_STYLES[f].color) : "#e5e7eb"}`, background: filter === f ? (f === "all" ? "#f0faf4" : ACCT_STYLES[f].bg) : "#fff", color: filter === f ? (f === "all" ? "#3d6b4f" : ACCT_STYLES[f].color) : "#6b7280" }}>
              {f === "all" ? "All" : ACCT_LABEL[f]}
            </button>
          ))}
          {onClose && (
            <button onClick={onClose} title="Close" style={{ fontSize: 18, lineHeight: 1, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", marginLeft: 4, padding: "2px 6px" }}>✕</button>
          )}
        </div>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {filtered.map(cat => (
          <div key={cat.name} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22, width: 36, textAlign: "center" }}>{cat.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{cat.name}</span>
                <AccountPill account={cat.account} />
                <TrendBadge trend={cat.trend} />
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 4, height: 5 }}>
                <div style={{ width: `${Math.min(cat.pct * 2.8, 100)}%`, height: "100%", borderRadius: 4, background: ACCT_STYLES[cat.account].color }} />
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: 80 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{fmt(cat.amount)}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{cat.txns} txn{cat.txns !== 1 ? "s" : ""} · {cat.pct}%</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function CategoryBreakdown({ categories }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const expandBtn = (
    <button onClick={() => setExpanded(true)} title="Expand" style={{ fontSize: 13, lineHeight: 1, background: "none", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", color: "#6b7280", padding: "3px 8px", marginLeft: 4 }}>⤢</button>
  );

  return (
    <>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column", maxHeight: 420, boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Category Breakdown</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["all", "joint", "anurag", "nidhi"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, cursor: "pointer", border: `1px solid ${filter === f ? (f === "all" ? "#3d6b4f" : ACCT_STYLES[f].color) : "#e5e7eb"}`, background: filter === f ? (f === "all" ? "#f0faf4" : ACCT_STYLES[f].bg) : "#fff", color: filter === f ? (f === "all" ? "#3d6b4f" : ACCT_STYLES[f].color) : "#6b7280" }}>
                {f === "all" ? "All" : ACCT_LABEL[f]}
              </button>
            ))}
            {expandBtn}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {(filter === "all" ? categories : categories.filter(c => c.account === filter)).map(cat => (
            <div key={cat.name} style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22, width: 36, textAlign: "center" }}>{cat.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{cat.name}</span>
                  <AccountPill account={cat.account} />
                  <TrendBadge trend={cat.trend} />
                </div>
                <div style={{ background: "#f3f4f6", borderRadius: 4, height: 5 }}>
                  <div style={{ width: `${Math.min(cat.pct * 2.8, 100)}%`, height: "100%", borderRadius: 4, background: ACCT_STYLES[cat.account].color }} />
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 80 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{fmt(cat.amount)}</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{cat.txns} txn{cat.txns !== 1 ? "s" : ""} · {cat.pct}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {expanded && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setExpanded(false)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", width: "70vw", maxWidth: 900, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <CategoryList categories={categories} filter={filter} setFilter={setFilter} onClose={() => setExpanded(false)} />
          </div>
        </div>
      )}
    </>
  );
}
