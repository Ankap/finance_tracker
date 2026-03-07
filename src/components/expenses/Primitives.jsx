import React from 'react';
import { ACCT_STYLES, ACCT_LABEL, fmt } from '../../lib/expenses.types';

export function AccountPill({ account }) {
  const s = ACCT_STYLES[account];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, color: s.color, background: s.bg, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {ACCT_LABEL[account]}
    </span>
  );
}

export function TrendBadge({ trend }) {
  if (!trend) return null;
  const up = trend > 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20, color: up ? "#dc2626" : "#16a34a", background: up ? "#fef2f2" : "#f0fdf4" }}>
      {up ? `↑${trend}%` : `↓${Math.abs(trend)}%`}
    </span>
  );
}

export function FlowBox({ label, amount, sub, color, bg, border }) {
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: "-0.5px" }}>{fmt(amount)}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export function LedgerRow({ label, amount, color, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 600, color }}>{fmt(amount)}</span>
    </div>
  );
}
