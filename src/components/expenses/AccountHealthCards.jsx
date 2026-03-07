import React, { useState } from 'react';
import { AccountPill, LedgerRow } from './Primitives';
import { ACCT_STYLES, fmt } from '../../lib/expenses.types';

export function AccountHealthCards({ accounts }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>Account Balances</div>
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
        Opening → salary in → expenses out → closing balance.{" "}
        <span style={{ color: "#92400e", fontWeight: 600 }}>CC bill payments excluded from expenses</span> — card spends captured from card statement to avoid double-counting.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {Object.entries(accounts).map(([key, acct]) => {
          const s        = ACCT_STYLES[key];
          const totalIn  = acct.moneyIn.reduce((a, b) => a + b.amount, 0);
          const totalOut = acct.moneyOut.reduce((a, b) => a + b.amount, 0);
          const closing  = acct.opening + totalIn - totalOut - acct.ccBillPaid;
          const isOpen   = expanded === key;
          return (
            <div key={key} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: s.light, borderBottom: "1px solid #e5e7eb", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <AccountPill account={key} />
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>{acct.ccBillPaid > 0 ? "💳 Has credit card" : "No credit card"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Closing Balance</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: closing > 50000 ? "#166534" : "#d97706", letterSpacing: "-0.5px" }}>{fmt(closing)}</div>
                </div>
              </div>
              <div style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <LedgerRow label="Opening balance" amount={acct.opening} color="#6b7280" />
                  {acct.moneyIn.map((m, i)  => <LedgerRow key={i} label={`+ ${m.label}`} amount={m.amount} color="#16a34a" />)}
                  {acct.moneyOut.map((m, i) => <LedgerRow key={i} label={`− ${m.label}`} amount={m.amount} color="#dc2626" />)}
                  {acct.ccBillPaid > 0 && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 10px", marginTop: 2 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
                          💳 CC bill ({fmt(acct.ccBillPaid)}) — account deducted but <em>not counted as expense</em>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginLeft: 8 }}>−{fmt(acct.ccBillPaid)}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: 8, marginTop: 4 }}>
                    <LedgerRow label="= Closing balance" amount={closing} color={closing > 50000 ? "#166534" : "#d97706"} bold />
                  </div>
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
    </div>
  );
}
