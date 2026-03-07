import React from 'react';

export function AIInsights({ insights }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>✦</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>AI Summary</span>
      </div>
      {insights.map((ins, i) => (
        <div key={i} style={{ background: "#f8faff", border: "1px solid #e0e7ff", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: i < insights.length - 1 ? 10 : 0 }}>
          {ins}
        </div>
      ))}
    </div>
  );
}
