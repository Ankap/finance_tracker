export const ACCT_STYLES = {
  joint:  { color: "#2d6a4f", bg: "#d8f3dc", border: "#b7e4c7", light: "#f0faf4" },
  anurag: { color: "#1e40af", bg: "#dbeafe", border: "#bfdbfe", light: "#eff6ff" },
  nidhi:  { color: "#6d28d9", bg: "#ede9fe", border: "#ddd6fe", light: "#faf5ff" },
};

export const ACCT_LABEL = {
  joint: "Joint", anurag: "Anurag", nidhi: "Nidhi",
};

export const fmt = (n) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(1)}k`
  : `₹${n}`;
