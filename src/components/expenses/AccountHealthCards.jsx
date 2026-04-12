import React, { useState } from 'react';
import { AccountPill, LedgerRow } from './Primitives';
import { ACCT_STYLES, fmt } from '../../lib/expenses.types';

// ── Inline list editor for money-in / money-out / cc-spends rows ──
function LineItemsEditor({ items, onChange, addLabel, color }) {
  const add    = () => onChange([...items, { label: "", amount: 0, _id: Date.now().toString() }]);
  const update = (idx, field, val) => onChange(items.map((it, i) => i === idx ? { ...it, [field]: field === "amount" ? (Number(val) || 0) : val } : it));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      {items.map((it, idx) => (
        <div key={it._id || idx} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
          <input
            value={it.label}
            onChange={e => update(idx, "label", e.target.value)}
            placeholder="Label"
            style={{ flex: 2, padding: "6px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 13, outline: "none" }}
          />
          <input
            type="number"
            value={it.amount}
            onChange={e => update(idx, "amount", e.target.value)}
            placeholder="₹"
            style={{ flex: 1, padding: "6px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600, outline: "none" }}
          />
          <button onClick={() => remove(idx)} style={{ background: "none", border: "none", fontSize: 16, color: "#ef4444", cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>
      ))}
      <button onClick={add} style={{ fontSize: 12, color, background: "none", border: `1px dashed ${color}`, borderRadius: 7, padding: "4px 12px", cursor: "pointer", marginTop: 2 }}>
        + {addLabel}
      </button>
    </div>
  );
}

// ── Per-account edit modal ──
function AccountEditModal({ acctKey, acct, onSave, onClose }) {
  const s = ACCT_STYLES[acctKey];
  const [opening,     setOpening]     = useState(acct.opening);
  const [moneyIn,     setMoneyIn]     = useState(acct.moneyIn.map((m, i) => ({ ...m, _id: i.toString() })));
  const [moneyOut,    setMoneyOut]    = useState(acct.moneyOut.map((m, i) => ({ ...m, _id: i.toString() })));
  const [ccBillPaid,  setCcBillPaid]  = useState(acct.ccBillPaid || 0);
  const [ccBillNote,  setCcBillNote]  = useState(acct.ccBillNote || "");
  const [ccSpends,    setCcSpends]    = useState((acct.ccSpends || []).map((m, i) => ({ ...m, _id: i.toString() })));
  const [hasCC,       setHasCC]       = useState(acct.ccBillPaid > 0 || (acct.ccSpends && acct.ccSpends.length > 0));

  const save = () => {
    onSave({
      ...acct,
      opening: Number(opening) || 0,
      moneyIn:    moneyIn.map(({ _id, ...rest }) => rest),
      moneyOut:   moneyOut.map(({ _id, ...rest }) => rest),
      ccBillPaid: hasCC ? (Number(ccBillPaid) || 0) : 0,
      ccBillNote: hasCC ? ccBillNote : null,
      ccSpends:   hasCC && ccSpends.length > 0 ? ccSpends.map(({ _id, ...rest }) => rest) : null,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "min(520px, 92vw)", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>Edit Account</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>{acct.label}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>

        {/* Opening balance */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Opening Balance (₹)</label>
          <input
            type="number"
            value={opening}
            onChange={e => setOpening(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Money In */}
        <div style={{ marginBottom: 18, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 10 }}>Money In</div>
          <LineItemsEditor items={moneyIn} onChange={setMoneyIn} addLabel="Add income row" color="#16a34a" />
        </div>

        {/* Money Out */}
        <div style={{ marginBottom: 18, background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 10 }}>Money Out</div>
          <LineItemsEditor items={moneyOut} onChange={setMoneyOut} addLabel="Add expense row" color="#dc2626" />
        </div>

        {/* Credit Card toggle */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={hasCC} onChange={e => setHasCC(e.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Has Credit Card</span>
          </label>
        </div>

        {hasCC && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 10 }}>Credit Card</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>CC Bill Paid (₹)</label>
              <input type="number" value={ccBillPaid} onChange={e => setCcBillPaid(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #fde68a", fontSize: 13, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>CC Bill Note</label>
              <input type="text" value={ccBillNote} onChange={e => setCcBillNote(e.target.value)} placeholder="e.g. HDFC Credit Card bill" style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #fde68a", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 8 }}>CC Spends (from statement)</div>
            <LineItemsEditor items={ccSpends} onChange={setCcSpends} addLabel="Add spend item" color="#92400e" />
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: s.color, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save Account</button>
        </div>
      </div>
    </div>
  );
}

export function AccountHealthCards({ accounts, onAccountsChange }) {
  const [expanded, setExpanded]   = useState(null);
  const [editingKey, setEditingKey] = useState(null);

  const handleSave = (key, updatedAcct) => {
    onAccountsChange({ ...accounts, [key]: updatedAcct });
  };

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>Account Balances</div>
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
        Money in and out per account.{" "}
        <span style={{ color: "#92400e", fontWeight: 600 }}>CC bill payments excluded from expenses</span> — card spends captured from card statement to avoid double-counting.
      </div>
      <div className="account-health-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {Object.entries(accounts).map(([key, acct]) => {
          const s      = ACCT_STYLES[key];
          const isOpen = expanded === key;
          return (
            <div key={key} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: s.light, borderBottom: "1px solid #e5e7eb", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <AccountPill account={key} />
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>{acct.ccBillPaid > 0 ? "💳 Has credit card" : "No credit card"}</div>
                </div>
                <button onClick={() => setEditingKey(key)} style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>✎ Edit</button>
              </div>
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {acct.moneyIn.map((m, i)  => <LedgerRow key={i} label={`+ ${m.label}`} amount={m.amount} color="#16a34a" />)}
                  {acct.moneyOut.map((m, i) => <LedgerRow key={i} label={`− ${m.label}`} amount={m.amount} color="#dc2626" />)}
                  {acct.moneyIn.length === 0 && acct.moneyOut.length === 0 && (
                    <div style={{ fontSize: 12, color: "#d1d5db", fontStyle: "italic" }}>No entries yet — click Edit to add.</div>
                  )}
                  {acct.ccBillPaid > 0 && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 10px", marginTop: 2 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
                          💳 CC bill ({fmt(acct.ccBillPaid)}) — deducted from account but <em>not counted as expense</em>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginLeft: 8 }}>−{fmt(acct.ccBillPaid)}</span>
                      </div>
                    </div>
                  )}
                </div>
                {acct.ccSpends && (
                  <>
                    <button onClick={() => setExpanded(isOpen ? null : key)} style={{ marginTop: 12, width: "100%", padding: "8px 0", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: s.color, cursor: "pointer" }}>
                      💳 {isOpen ? "Hide" : "View"} card spends · {acct.ccSpends.length} transactions
                    </button>
                    {isOpen && (
                      <div style={{ marginTop: 8, background: s.light, border: `1px solid ${s.border}`, borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginBottom: 8 }}>From card statement · included in category totals</div>
                        {acct.ccSpends.map((sp, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#374151", padding: "5px 0", borderBottom: i < acct.ccSpends.length - 1 ? `1px solid ${s.border}` : "none" }}>
                            <span>{sp.label}</span><span style={{ fontWeight: 600 }}>−{fmt(sp.amount)}</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: s.color, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${s.border}` }}>
                          <span>Total card spend</span><span>{fmt(acct.ccSpends.reduce((a, b) => a + b.amount, 0))}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingKey && (
        <AccountEditModal
          acctKey={editingKey}
          acct={accounts[editingKey]}
          onSave={(updated) => handleSave(editingKey, updated)}
          onClose={() => setEditingKey(null)}
        />
      )}
    </div>
  );
}
