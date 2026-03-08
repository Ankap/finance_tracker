import React, { useState } from 'react';

export function AIInsights({ insights, onInsightsChange }) {
  const [editingIdx, setEditingIdx] = useState(null); // null | "new" | number
  const [editText, setEditText]     = useState("");

  const openEdit = (idx) => { setEditText(insights[idx]); setEditingIdx(idx); };
  const openAdd  = () => { setEditText(""); setEditingIdx("new"); };
  const cancel   = () => setEditingIdx(null);

  const save = () => {
    const text = editText.trim();
    if (!text) return;
    if (editingIdx === "new") {
      onInsightsChange([...insights, text]);
    } else {
      onInsightsChange(insights.map((ins, i) => i === editingIdx ? text : ins));
    }
    setEditingIdx(null);
  };

  const remove = (idx) => onInsightsChange(insights.filter((_, i) => i !== idx));

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>AI Summary</span>
        </div>
        <button onClick={openAdd} style={{ fontSize: 12, fontWeight: 600, color: "#3d6b4f", background: "#f0faf4", border: "1px solid #bbf0d0", borderRadius: 20, padding: "4px 12px", cursor: "pointer" }}>+ Add</button>
      </div>

      {insights.length === 0 && (
        <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No insights yet — add one above.</div>
      )}

      {insights.map((ins, i) => (
        <div key={i} style={{ background: "#f8faff", border: "1px solid #e0e7ff", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: i < insights.length - 1 ? 10 : 0, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ flex: 1 }}>{ins}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
            <button onClick={() => openEdit(i)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9ca3af", padding: "2px 4px", lineHeight: 1 }}>✎</button>
            <button onClick={() => remove(i)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", padding: "2px 4px", lineHeight: 1 }}>✕</button>
          </div>
        </div>
      ))}

      {editingIdx !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#111827" }}>{editingIdx === "new" ? "Add Insight" : "Edit Insight"}</div>
              <button onClick={cancel} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder="e.g. Savings rate is 43% this month — above your 40% target."
              autoFocus
              rows={4}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, lineHeight: 1.6, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={cancel} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
              <button onClick={save} style={{ flex: 2, padding: 10, borderRadius: 8, border: "none", background: "#3d6b4f", fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>{editingIdx === "new" ? "Add Insight" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
