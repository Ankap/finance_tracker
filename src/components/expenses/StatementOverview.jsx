import React from 'react';
import { ACCT_STYLES, ACCT_LABEL } from '../../lib/expenses.types';

const fmtFull = (n) => {
  if (n == null) return '₹0';
  const abs = Math.abs(Math.round(n));
  return n < 0 ? `−₹${abs.toLocaleString('en-IN')}` : `₹${abs.toLocaleString('en-IN')}`;
};

const TYPE_ICON = {
  'Bank Statement':    '🏦',
  'HDFC Credit Card':  '💳',
  'ICICI Credit Card': '💳',
  'HSBC Credit Card':  '💳',
  'Paytm':             '📱',
  'CSV File':          '📄',
};

const ACCT_ORDER = ['joint', 'anurag', 'nidhi'];

// Sort order within an account: bank first, then cards alphabetically, then paytm/csv last
const TYPE_ORDER = [
  'Bank Statement',
  'HDFC Credit Card',
  'ICICI Credit Card',
  'HSBC Credit Card',
  'Paytm',
  'CSV File',
];

function typeSort(a, b) {
  return (TYPE_ORDER.indexOf(a) === -1 ? 99 : TYPE_ORDER.indexOf(a))
       - (TYPE_ORDER.indexOf(b) === -1 ? 99 : TYPE_ORDER.indexOf(b));
}

export function StatementOverview({ categories }) {
  // Group categories that have a statementType by (account, statementType)
  const sourceMap = {};

  for (const cat of (categories || [])) {
    if (!cat.statementType) continue;
    const acct = (cat.account || 'joint').toLowerCase();
    const key  = `${acct}||${cat.statementType}`;
    if (!sourceMap[key]) {
      sourceMap[key] = { acct, statementType: cat.statementType, amount: 0, txns: 0 };
    }
    sourceMap[key].amount += cat.amount;
    sourceMap[key].txns   += cat.txns || 0;
  }

  // Build sorted rows: joint → anurag → nidhi, within each by TYPE_ORDER
  const rows = [];
  for (const acct of ACCT_ORDER) {
    const acctRows = Object.values(sourceMap)
      .filter(r => r.acct === acct)
      .sort((a, b) => typeSort(a.statementType, b.statementType));
    rows.push(...acctRows);
  }

  const grandTotal = rows.reduce((s, r) => s + Math.max(r.amount, 0), 0);

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
      padding: '20px 24px', boxSizing: 'border-box',
      flex: 1, display: 'flex', flexDirection: 'column', maxHeight: 480,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Statement Overview</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>By source · uploaded statements</div>
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#3d6b4f' }}>{fmtFull(grandTotal)}</div>
      </div>

      {rows.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '20px 0' }}>
          No uploaded statement data yet this month
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {rows.map((row, i) => {
          const style   = ACCT_STYLES[row.acct] || ACCT_STYLES.joint;
          const icon    = TYPE_ICON[row.statementType] || '📄';
          const isLast  = i === rows.length - 1;
          const amt     = Math.round(row.amount);
          const isCredit = amt < 0;

          return (
            <div
              key={`${row.acct}-${row.statementType}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 0',
                borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
              }}
            >
              {/* Icon badge */}
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: style.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, flexShrink: 0,
              }}>
                {icon}
              </div>

              {/* Label + type + account badge */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: 13, color: '#111827',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {row.statementType}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: style.color, background: style.bg,
                    padding: '1px 7px', borderRadius: 10,
                  }}>
                    {ACCT_LABEL[row.acct] || row.acct}
                  </span>
                  {row.txns > 0 && (
                    <span style={{ fontSize: 11, color: '#d1d5db' }}>
                      · {row.txns} txn{row.txns !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: isCredit ? '#16a34a' : '#111827' }}>
                  {isCredit ? `+${fmtFull(Math.abs(amt))}` : fmtFull(amt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {rows.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 12, marginTop: 4, borderTop: '2px solid #f3f4f6',
        }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#3d6b4f' }}>{fmtFull(grandTotal)}</span>
        </div>
      )}
    </div>
  );
}
