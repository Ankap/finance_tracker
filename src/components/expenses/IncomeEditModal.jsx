import React, { useState } from 'react';
import { ACCT_STYLES } from '../../lib/expenses.types';

export function IncomeEditModal({ month, income, onSave, onClose }) {
  const [vals, setVals] = useState({
    anuragSalary: income.anurag.salary,
    anuragBonus:  income.anurag.bonus,
    nidhiSalary:  income.nidhi.salary,
    nidhiBonus:   income.nidhi.bonus,
  });

  const set = (k, v) => setVals(p => ({ ...p, [k]: Number(v) || 0 }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>Update Income</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>{month} · Salaries carry forward — only update when something changes</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>
        {[
          { person: "Anurag", sk: "anuragSalary", bk: "anuragBonus", acct: "anurag" },
          { person: "Nidhi",  sk: "nidhiSalary",  bk: "nidhiBonus",  acct: "nidhi"  },
        ].map(({ person, sk, bk, acct }) => (
          <div key={person} style={{ background: ACCT_STYLES[acct].bg, border: `1px solid ${ACCT_STYLES[acct].border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: ACCT_STYLES[acct].color, marginBottom: 12 }}>{person}&apos;s Income</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Monthly Salary (₹)</label>
                <input type="number" value={vals[sk]} onChange={e => set(sk, e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Bonus this month (₹)</label>
                <input type="number" value={vals[bk]} onChange={e => set(bk, e.target.value)} placeholder="0" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave(vals)} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#3d6b4f", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save Income for {month}</button>
        </div>
      </div>
    </div>
  );
}
