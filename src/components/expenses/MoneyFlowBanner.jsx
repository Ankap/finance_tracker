import React, { useState } from 'react';
import { fmt, ACCT_STYLES, ACCT_LABEL } from '../../lib/expenses.types';

export function MoneyFlowBanner({ investable, totalIncome, sips, onSipsChange, fixedExpenses, onFixedExpensesChange, canEditFixed, month, creditCards, onCreditCardsChange }) {
  const [editTarget, setEditTarget]     = useState(null); // null | "new" | { id, label, amount }
  const [editVals, setEditVals]         = useState({ label: "", amount: "", months: "" });
  const [ccEditTarget, setCcEditTarget] = useState(null); // null | "new" | { id, cardName, owner, spend }
  const [ccEditVals, setCcEditVals]     = useState({ cardName: "", owner: "anurag", spend: "" });
  const [editingSips, setEditingSips]   = useState(false);
  const [sipsInput, setSipsInput]       = useState("");

  const totalFixed = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const totalCC    = creditCards.reduce((s, c) => s + c.spend, 0);

  // ── Fixed expenses handlers ──
  const openAdd  = () => { setEditVals({ label: "", amount: "", months: "" }); setEditTarget("new"); };
  const openEdit = (fe) => { setEditVals({ label: fe.label, amount: String(fe.amount), months: fe.months ? String(fe.months) : "" }); setEditTarget(fe); };
  const cancelEdit = () => setEditTarget(null);
  const saveEdit = () => {
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

  // ── Credit card handlers ──
  const openCcAdd    = () => { setCcEditVals({ cardName: "", owner: "anurag", spend: "" }); setCcEditTarget("new"); };
  const openCcEdit   = (cc) => { setCcEditVals({ cardName: cc.cardName, owner: cc.owner, spend: String(cc.spend) }); setCcEditTarget(cc); };
  const cancelCcEdit = () => setCcEditTarget(null);
  const saveCcEdit   = () => {
    const cardName = ccEditVals.cardName.trim();
    const spend    = Number(ccEditVals.spend);
    if (!cardName || !spend || spend <= 0) return;
    if (ccEditTarget === "new") {
      onCreditCardsChange([...creditCards, { id: Date.now().toString(), cardName, owner: ccEditVals.owner, spend }]);
    } else {
      onCreditCardsChange(creditCards.map(cc => cc.id === ccEditTarget.id ? { ...cc, cardName, owner: ccEditVals.owner, spend } : cc));
    }
    setCcEditTarget(null);
  };
  const deleteCC = (id) => onCreditCardsChange(creditCards.filter(cc => cc.id !== id));

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px" }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>Monthly Money Flow</div>
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>Fixed commitments deducted from your investable surplus</div>

      {/* Fixed + CC side by side */}
      <div className="money-flow-cols" style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>

        {/* Fixed Commitments */}
        <div style={{ flex: 1, minWidth: 220, background: "#fafafa", border: "1px solid #e0e7ff", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fixed</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1e40af", letterSpacing: "-0.5px", marginTop: 2 }}>
                {fmt(totalFixed)}<span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginLeft: 4 }}>/ mo</span>
              </div>
            </div>
            {canEditFixed && <button onClick={openAdd} style={{ fontSize: 11, fontWeight: 600, color: "#1e40af", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>+ Add</button>}
          </div>
          {fixedExpenses.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No fixed commitments yet.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {fixedExpenses.map(fe => (
                <div key={fe.id} style={{ background: "#fff", border: "1px solid #e0e7ff", borderRadius: 7, padding: "6px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{fe.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>{fmt(fe.amount)}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{fe.months > 0 ? `${fe.months} mo` : "permanent"}</div>
                  </div>
                  {fe.addedMonth === month && <button onClick={() => openEdit(fe)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9ca3af", padding: "1px 3px" }}>✎</button>}
                  {fe.addedMonth === month && <button onClick={() => deleteExpense(fe.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", padding: "1px 3px" }}>✕</button>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIPs */}
        <div style={{ flex: 1, minWidth: 220, background: "#fafafa", border: "1px solid #6ee7b7", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.5px" }}>SIPs</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#065f46", letterSpacing: "-0.5px", marginTop: 2 }}>
                {fmt(sips)}<span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginLeft: 4 }}>/ mo</span>
              </div>
            </div>
            <button
              onClick={() => { setSipsInput(String(sips)); setEditingSips(true); }}
              style={{ fontSize: 11, fontWeight: 600, color: "#065f46", background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
            >✎ Edit</button>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Monthly SIP investments deducted before surplus</div>
        </div>

        {/* Credit Card Spends */}
        <div style={{ flex: 1, minWidth: 220, background: "#fafafa", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px" }}>Variable · CC</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626", letterSpacing: "-0.5px", marginTop: 2 }}>
                {fmt(totalCC)}<span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af", marginLeft: 4 }}>this month</span>
              </div>
            </div>
            <button onClick={openCcAdd} style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>+ Add</button>
          </div>
          {creditCards.length === 0 ? (
            <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No cards yet.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {creditCards.map(cc => (
                <div key={cc.id} style={{ background: "#fff", border: `1px solid ${ACCT_STYLES[cc.owner]?.border || "#fecaca"}`, borderRadius: 7, padding: "6px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: ACCT_STYLES[cc.owner]?.color, background: ACCT_STYLES[cc.owner]?.bg, borderRadius: 3, padding: "1px 5px" }}>{ACCT_LABEL[cc.owner]}</span>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>💳 {cc.cardName}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>{fmt(cc.spend)}</div>
                  </div>
                  <button onClick={() => openCcEdit(cc)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9ca3af", padding: "1px 3px" }}>✎</button>
                  <button onClick={() => deleteCC(cc.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", padding: "1px 3px" }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 18, marginBottom: 12 }}>↓</div>
      <div style={{ background: "#f0faf4", border: "1px solid #6ee7b7", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: "#2d6a4f", fontWeight: 600, marginBottom: 2 }}>💰 Investable Surplus this month</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>After expenses, SIPs{totalFixed > 0 ? ", fixed commitments" : ""}{totalCC > 0 ? ", and CC spends" : ""} — free to deploy toward your house fund</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: investable >= 0 ? "#166534" : "#dc2626", letterSpacing: "-1px" }}>{fmt(Math.abs(investable))}{investable < 0 ? " over" : ""}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{Math.round((investable / totalIncome) * 100)}% of income</div>
        </div>
      </div>

      {/* SIPs edit modal */}
      {editingSips && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>Edit Monthly SIPs</div>
              <button onClick={() => setEditingSips(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Total SIP amount per month (₹)</label>
            <input
              type="number"
              value={sipsInput}
              onChange={e => setSipsInput(e.target.value)}
              autoFocus
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box", marginBottom: 20 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditingSips(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { const v = Number(sipsInput) || 0; onSipsChange(v); setEditingSips(false); }} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#065f46", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save SIPs</button>
            </div>
          </div>
        </div>
      )}

      {/* CC Add / Edit modal */}
      {ccEditTarget !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>{ccEditTarget === "new" ? "Add Credit Card" : "Edit Credit Card"}</div>
              <button onClick={cancelCcEdit} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Track monthly spends per card</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Card Name</label>
              <input type="text" value={ccEditVals.cardName} onChange={e => setCcEditVals(p => ({ ...p, cardName: e.target.value }))} placeholder="e.g. HDFC Regalia" autoFocus style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Card Owner</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["anurag", "nidhi", "joint"].map(o => (
                  <button key={o} onClick={() => setCcEditVals(p => ({ ...p, owner: o }))} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${ccEditVals.owner === o ? ACCT_STYLES[o].color : "#e5e7eb"}`, background: ccEditVals.owner === o ? ACCT_STYLES[o].bg : "#fff", color: ccEditVals.owner === o ? ACCT_STYLES[o].color : "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {ACCT_LABEL[o]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Total Spend this month (₹)</label>
              <input type="number" value={ccEditVals.spend} onChange={e => setCcEditVals(p => ({ ...p, spend: e.target.value }))} placeholder="0" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={cancelCcEdit} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveCcEdit} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#dc2626", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {ccEditTarget === "new" ? "Add Card" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Expense Add / Edit modal */}
      {editTarget !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>{editTarget === "new" ? "Add Fixed Expense" : "Edit Fixed Expense"}</div>
              <button onClick={cancelEdit} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>EMIs, rent, insurance — recurring committed expenses</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Label</label>
              <input type="text" value={editVals.label} onChange={e => setEditVals(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Home Loan EMI" autoFocus style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Amount (₹)</label>
              <input type="number" value={editVals.amount} onChange={e => setEditVals(p => ({ ...p, amount: e.target.value }))} placeholder="0" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Duration (months)</label>
              <input type="number" min="1" value={editVals.months} onChange={e => setEditVals(p => ({ ...p, months: e.target.value }))} placeholder="Leave blank for permanent" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>e.g. 12 for a 1-year EMI. Leave blank if it never ends.</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={cancelEdit} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveEdit} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#1e40af", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                {editTarget === "new" ? "Add Expense" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
