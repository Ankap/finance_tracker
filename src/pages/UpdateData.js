import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, TrendingUp, FileText, Check, Sparkles, X } from 'lucide-react';
import { assetsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

// ── Paytm category → icon mapping ──────────────────────────────────────────
const CATEGORY_ICONS = {
  food: '🍽️', dining: '🍽️', restaurant: '🍽️', 'food & drink': '🍽️', 'food and drink': '🍽️',
  grocery: '🛒', groceries: '🛒', supermarket: '🛒',
  shopping: '🛍️', fashion: '🛍️', clothing: '🛍️', apparel: '🛍️',
  entertainment: '🎬', movies: '🎬', streaming: '🎬',
  travel: '✈️', flight: '✈️', hotel: '✈️', holiday: '✈️',
  transport: '🚗', cab: '🚗', auto: '🚗', uber: '🚗', ola: '🚗',
  fuel: '⛽', petrol: '⛽', diesel: '⛽',
  health: '🏥', medical: '🏥', pharmacy: '🏥', medicine: '💊',
  utility: '💡', utilities: '💡', electricity: '💡', water: '💡',
  bill: '📱', bills: '📱', recharge: '📱', mobile: '📱', subscription: '📱',
  education: '🎓', course: '🎓', school: '🎓',
  gym: '🏋️', fitness: '🏋️',
  coffee: '☕', café: '☕', cafe: '☕',
  pet: '🐾',
  insurance: '🛡️',
  gift: '🎁', gifts: '🎁',
  home: '🏠', rent: '🏠', maintenance: '🏠',
};

function categoryToIcon(cat) {
  const lower = (cat || '').toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '🌐';
}

// ── CSV line parser (handles quoted fields) ─────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

// ── Generic CSV parser for Bank Statement / Credit Card / CSV File ───────────
function parseGenericCSV(arrayBuffer, options = {}) {
  const { excludeCreditCategories = [] } = options;
  const text = new TextDecoder('utf-8').decode(arrayBuffer);
  const lines = text.split(/\r?\n/).filter(l => l.trim());

  // Find header row — must contain a date column and some amount column
  let headerIdx = -1;
  let headers = [];
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const cols = parseCSVLine(lines[i]).map(c => c.replace(/^"|"$/g, '').toLowerCase().trim());
    if (cols.some(c => c.includes('date')) &&
        cols.some(c => c.includes('debit') || c.includes('withdrawal') || c.includes('amount') || c.includes('dr'))) {
      headerIdx = i;
      headers = cols;
      break;
    }
  }
  if (headerIdx === -1)
    return { error: 'Could not find a header row with Date and Amount/Debit columns.' };

  // Map column indices
  const find = (...terms) => {
    for (const t of terms) {
      const exact = headers.findIndex(h => h === t);
      if (exact !== -1) return exact;
    }
    for (const t of terms) {
      const partial = headers.findIndex(h => h.includes(t));
      if (partial !== -1) return partial;
    }
    return -1;
  };

  const dateCol   = find('date', 'txn date', 'transaction date', 'value date');
  const descCol   = find('narration', 'description', 'particulars', 'transaction remarks', 'details', 'remarks', 'transaction');
  const debitCol  = find('debit', 'withdrawal', 'debit amount', 'withdrawal amount (inr)');
  const creditCol = find('credit', 'deposit', 'credit amount', 'deposit amount (inr)');
  // Separate debit-indicator cols that might collide with Dr/Cr type col
  const amtCol    = debitCol === -1 ? find('amount') : -1;
  // Dr/Cr type indicator column (e.g. HDFC CC "Type" column with "Dr"/"Cr" values)
  const typeCol   = find('type', 'cr/dr', 'dr/cr', 'txn type', 'transaction type');

  if (dateCol === -1) return { error: '"Date" column not found in CSV.' };
  if (debitCol === -1 && amtCol === -1) return { error: 'No Debit/Amount column found in CSV.' };

  // monthMap: { 'YYYY_MM': { catMap: { name: { amount, txns } }, totalDebits, totalCredits } }
  const monthMap = {};

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]).map(c => c.replace(/^"|"$/g, '').trim());

    const txnDate = parsePaytmDate(row[dateCol]);
    if (!txnDate) continue;

    let debitAmt  = 0;
    let creditAmt = 0;

    if (debitCol !== -1) {
      // Separate Debit / Credit columns (classic bank statement format)
      const dv = String(row[debitCol] || '').replace(/[₹,\s]/g, '');
      debitAmt = parseFloat(dv) || 0;
      if (creditCol !== -1) {
        const cv = String(row[creditCol] || '').replace(/[₹,\s]/g, '');
        creditAmt = parseFloat(cv) || 0;
      }
    } else {
      // Single Amount column — use Dr/Cr type indicator if present, else use sign
      const v      = String(row[amtCol] || '').replace(/[₹,\s]/g, '');
      const parsed = parseFloat(v) || 0;
      if (parsed === 0) continue;

      if (typeCol !== -1) {
        const typeStr = String(row[typeCol] || '').toLowerCase().trim();
        if (typeStr === 'cr' || typeStr === 'credit' || typeStr.startsWith('cr')) {
          creditAmt = Math.abs(parsed);
        } else {
          debitAmt = Math.abs(parsed);
        }
      } else if (parsed < 0) {
        creditAmt = Math.abs(parsed);
      } else {
        // Unsigned amount — treat as debit unless matching credit column value
        if (creditCol !== -1) {
          const cr = parseFloat(String(row[creditCol] || '').replace(/[₹,\s]/g, '')) || 0;
          if (cr > 0 && parsed === cr) { creditAmt = cr; }
          else { debitAmt = parsed; }
        } else {
          debitAmt = parsed;
        }
      }
    }

    const desc     = descCol !== -1 ? String(row[descCol] || '').trim() : '';
    const category = desc || 'Others';
    const key      = `${txnDate.y}_${String(txnDate.m).padStart(2, '0')}`;

    if (!monthMap[key]) monthMap[key] = { catMap: {}, totalDebits: 0, totalCredits: 0 };

    if (debitAmt > 0) {
      if (!monthMap[key].catMap[category]) monthMap[key].catMap[category] = { amount: 0, txns: 0 };
      monthMap[key].catMap[category].amount += debitAmt;
      monthMap[key].catMap[category].txns   += 1;
      monthMap[key].totalDebits             += debitAmt;
    }
    if (creditAmt > 0) {
      const skipCredit = excludeCreditCategories.some(pat =>
        desc.toUpperCase().includes(pat.toUpperCase())
      );
      if (!skipCredit) monthMap[key].totalCredits += creditAmt;
    }
  }

  if (Object.keys(monthMap).length === 0)
    return { error: 'No debit transactions found in the CSV.' };

  const byMonth = {};
  for (const [monthKey, { catMap, totalDebits, totalCredits }] of Object.entries(monthMap)) {
    const netAmount  = Math.max(0, totalDebits - totalCredits);
    const categories = Object.entries(catMap)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, { amount, txns }]) => ({
        name,
        amount:  Math.round(amount),
        txns,
        icon:    categoryToIcon(name),
        account: 'joint',
        trend:   0,
        pct:     totalDebits > 0 ? parseFloat(((amount / totalDebits) * 100).toFixed(1)) : 0,
      }));
    byMonth[monthKey] = {
      categories,
      total:        Math.round(totalDebits),
      totalDebits:  Math.round(totalDebits),
      totalCredits: Math.round(totalCredits),
      netAmount:    Math.round(netAmount),
    };
  }

  return { byMonth };
}

// ── Paytm date parser ───────────────────────────────────────────────────────
function parsePaytmDate(val) {
  if (val == null || val === '') return null;
  if (val instanceof Date) return { y: val.getFullYear(), m: val.getMonth() + 1 };
  if (typeof val === 'number') {
    try { const p = XLSX.SSF.parse_date_code(val); return p ? { y: p.y, m: p.m } : null; }
    catch { return null; }
  }
  const s = String(val).trim();
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m1) return { y: +m1[3], m: +m1[2] };
  const m2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m2) return { y: +m2[1], m: +m2[2] };
  const d = new Date(s);
  return isNaN(d) ? null : { y: d.getFullYear(), m: d.getMonth() + 1 };
}

// ── Strip common Paytm prefixes from Transaction Details ────────────────────
function cleanTransactionDetail(s) {
  return (s || '')
    .replace(/^paid\s+to\s+/i,      '')
    .replace(/^payment\s+to\s+/i,   '')
    .replace(/^transfer\s+to\s+/i,  '')
    .replace(/^sent\s+to\s+/i,      '')
    .replace(/^recharge\s+for\s+/i, '')
    .replace(/^bill\s+payment\s+/i, '')
    .trim();
}

// ── Paytm Excel parser — auto-detects month from transaction dates ───────────
function parsePaytmExcel(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  // 1. Find the right sheet
  const sheetName = workbook.SheetNames.find(n => {
    const l = n.toLowerCase();
    return l.includes('passbook') || l.includes('payment history') || l.includes('transaction history');
  }) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // 2. Find header row — must contain both "Date" and "Amount"
  let headerIdx = -1;
  let rawHeaders = [];
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const cells = rows[i].map(c => String(c).trim());
    const lower = cells.map(c => c.toLowerCase());
    if (lower.includes('date') && lower.some(c => c === 'amount')) {
      headerIdx  = i;
      rawHeaders = cells;
      break;
    }
  }
  if (headerIdx === -1)
    return { error: `Could not find a header row with "Date" and "Amount" in sheet "${sheetName}".` };

  // 3. Map column names
  function colIdx(...names) {
    for (const name of names) {
      const exact = rawHeaders.findIndex(h => h.toLowerCase() === name.toLowerCase());
      if (exact !== -1) return exact;
    }
    for (const name of names) {
      const partial = rawHeaders.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
      if (partial !== -1) return partial;
    }
    return -1;
  }

  const dateCol    = colIdx('Date');
  const amtCol     = colIdx('Amount');
  const detailsCol = colIdx('Transaction Details');
  const tagsCol    = colIdx('Tags');
  const remarksCol = colIdx('Remarks');

  if (dateCol === -1) return { error: '"Date" column not found.' };
  if (amtCol  === -1) return { error: '"Amount" column not found.' };

  // 4. First pass — detect whether amounts are signed (negative = debit)
  const dataRows = rows.slice(headerIdx + 1);
  const hasNeg   = dataRows.some(r => {
    const v = String(r[amtCol] || '').replace(/[₹,\s]/g, '');
    return parseFloat(v) < 0;
  });

  // 5. Aggregate by month and category
  const monthMap = {}; // { 'YYYY_MM': { catName: { amount, txns } } }

  for (const row of dataRows) {
    const txnDate = parsePaytmDate(row[dateCol]);
    if (!txnDate) continue;

    const rawAmt = String(row[amtCol] || '').replace(/[₹,\s]/g, '');
    const amount = parseFloat(rawAmt);
    if (isNaN(amount) || amount === 0) continue;

    if (hasNeg && amount > 0) continue;
    const absAmount = Math.abs(amount);

    const tag      = tagsCol    !== -1 ? String(row[tagsCol]    || '').trim() : '';
    if (tag === '# Financial Services') continue;
    const details  = detailsCol !== -1 ? cleanTransactionDetail(String(row[detailsCol] || '')) : '';
    const remarks  = remarksCol !== -1 ? String(row[remarksCol] || '').trim() : '';
    const category = tag || details || remarks || 'Others';

    const key = `${txnDate.y}_${String(txnDate.m).padStart(2, '0')}`;
    if (!monthMap[key]) monthMap[key] = {};
    if (!monthMap[key][category]) monthMap[key][category] = { amount: 0, txns: 0 };
    monthMap[key][category].amount += absAmount;
    monthMap[key][category].txns   += 1;
  }

  if (Object.keys(monthMap).length === 0)
    return { error: `No debit transactions found in sheet "${sheetName}".` };

  // 6. Build result per month
  const byMonth = {};
  for (const [monthKey, catMap] of Object.entries(monthMap)) {
    const total      = Object.values(catMap).reduce((s, v) => s + v.amount, 0);
    const categories = Object.entries(catMap)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, { amount, txns }]) => ({
        name,
        amount:  Math.round(amount),
        txns,
        icon:    categoryToIcon(name),
        account: 'joint',
        trend:   0,
        pct:     total > 0 ? parseFloat(((amount / total) * 100).toFixed(1)) : 0,
      }));
    byMonth[monthKey] = {
      categories,
      total:        Math.round(total),
      totalDebits:  Math.round(total),
      totalCredits: 0,
      netAmount:    Math.round(total),
    };
  }

  return { byMonth, sheet: sheetName };
}

// ── Recalculate month totals after category edits/deletes ────────────────────
function recalcMonthTotals(categories, totalCredits) {
  const totalDebits = categories.reduce((sum, c) => sum + Math.max(0, c.amount), 0);
  const netAmount   = Math.max(0, totalDebits - totalCredits);
  const cats        = categories.map(c => ({
    ...c,
    pct: totalDebits > 0 ? parseFloat(((c.amount / totalDebits) * 100).toFixed(1)) : 0,
  }));
  return { categories: cats, totalDebits, netAmount, total: totalDebits };
}

// ── Main Component ───────────────────────────────────────────────────────────
const UpdateData = () => {
  const navigate                  = useNavigate();
  const [activeTab, setActiveTab] = useState('assets');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);  // { type, acct, result, conflictMonths }
  const [parsedPreview, setParsedPreview] = useState(null);  // { type, acct, result }
  const [editingItem, setEditingItem]     = useState(null);  // { monthKey, idx, name, amount, icon }
  const fileInputRef              = useRef(null);

  // Asset form state
  const [assetForm, setAssetForm] = useState({
    name: 'MF SIP',
    currentValue: '',
    returnPercentage: '',
    owner: 'Joint',
  });

  // Statement upload state
  const [statementUpload, setStatementUpload] = useState({
    file:          null,
    account:       'Joint',
    statementType: 'Bank Statement',
  });

  // ── Asset update ────────────────────────────────────────────────────────
  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const assetsResponse = await assetsAPI.getAll();
      const existingAsset  = assetsResponse.data.find(
        a => a.name === assetForm.name && a.owner === assetForm.owner
      );
      if (existingAsset) {
        await assetsAPI.addSnapshot(existingAsset._id, {
          value:            parseFloat(assetForm.currentValue),
          returnPercentage: parseFloat(assetForm.returnPercentage),
        });
      } else {
        await assetsAPI.create({
          name:         assetForm.name,
          currentValue: parseFloat(assetForm.currentValue),
          owner:        assetForm.owner,
        });
      }
      localStorage.setItem('ai_insights_stale', 'true');
      setSuccess(true);
      setAssetForm({ name: 'MF SIP', currentValue: '', returnPercentage: '', owner: 'Joint' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('Error updating asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Save parsed statement data to the API ─────────────────────────────────
  const doSave = async (type, acct, result) => {
    setLoading(true);
    try {
      for (const [monthKey, { categories, netAmount, totalDebits, totalCredits }] of Object.entries(result.byMonth)) {
        const tagged = categories.map(c => ({ ...c, account: acct, statementType: type }));
        // Add a deduction entry so category amounts sum to netAmount, not totalDebits
        if (totalCredits > 0) {
          tagged.push({
            name: 'Payments / Refunds',
            amount: -Math.round(totalCredits),
            txns: 0,
            icon: '↩️',
            account: acct,
            statementType: type,
            trend: 0,
            pct: 0,
          });
        }
        const saveAmount  = netAmount ?? totalDebits ?? 0;
        const accountEntries = saveAmount > 0
          ? [{ account: acct, entryType: 'moneyOut', label: `${type} Import`, amount: saveAmount }]
          : [];
        await fetch('/api/expenses', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'save', month: monthKey, categories: tagged, accountEntries }),
        });
      }
      setStatementUpload(s => ({ ...s, file: null }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPendingUpload(null);
      setParsedPreview(null);
      setUploadSuccess(true);
      setTimeout(() => { setUploadSuccess(false); navigate('/expenses'); }, 2000);
    } catch (err) {
      console.error('Statement import error:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelUpload = () => {
    setPendingUpload(null);
    setParsedPreview(null);
    setStatementUpload(s => ({ ...s, file: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Edit / delete individual line items in the preview ────────────────────
  const handleDeletePreviewItem = (monthKey, idx) => {
    setParsedPreview(prev => {
      const monthData = prev.result.byMonth[monthKey];
      const newCats   = monthData.categories.filter((_, i) => i !== idx);
      const updated   = recalcMonthTotals(newCats, monthData.totalCredits);
      return {
        ...prev,
        result: {
          ...prev.result,
          byMonth: { ...prev.result.byMonth, [monthKey]: { ...monthData, ...updated } },
        },
      };
    });
  };

  const handleSavePreviewEdit = () => {
    const { monthKey, idx, name, amount, icon } = editingItem;
    setParsedPreview(prev => {
      const monthData = prev.result.byMonth[monthKey];
      const newCats   = monthData.categories.map((c, i) =>
        i === idx ? { ...c, name: name.trim() || c.name, amount: Math.round(parseFloat(amount) || c.amount), icon: icon.trim() || c.icon } : c
      );
      const updated = recalcMonthTotals(newCats, monthData.totalCredits);
      return {
        ...prev,
        result: {
          ...prev.result,
          byMonth: { ...prev.result.byMonth, [monthKey]: { ...monthData, ...updated } },
        },
      };
    });
    setEditingItem(null);
  };

  // ── File selected — parse immediately and show review screen ─────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.pdf')) {
      alert('PDF parsing is not supported. Please export your statement as a CSV file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setParsedPreview(null);
    setStatementUpload(s => ({ ...s, file }));

    const type = statementUpload.statementType;
    const acct = statementUpload.account.toLowerCase();
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = type === 'Paytm'
        ? parsePaytmExcel(e.target.result)
        : parseGenericCSV(
            e.target.result,
            type.toLowerCase().includes('credit card') ? { excludeCreditCategories: ['payment'] } : {}
          );
      if (result.error) {
        alert('Could not parse file: ' + result.error);
        setStatementUpload(s => ({ ...s, file: null }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        setLoading(false);
        return;
      }

      // For credit card statements, merge ALL transactions into the current month
      if (type.toLowerCase().includes('credit card')) {
        const now = new Date();
        const currentKey = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
        let mergedTotalDebits  = 0;
        let mergedTotalCredits = 0;
        const catMap = {};
        for (const monthData of Object.values(result.byMonth)) {
          mergedTotalDebits  += monthData.totalDebits;
          mergedTotalCredits += monthData.totalCredits;
          for (const cat of monthData.categories) {
            if (!catMap[cat.name]) catMap[cat.name] = { amount: 0, txns: 0, icon: cat.icon };
            catMap[cat.name].amount += cat.amount;
            catMap[cat.name].txns   += cat.txns;
          }
        }
        const mergedCategories = Object.entries(catMap)
          .sort((a, b) => b[1].amount - a[1].amount)
          .map(([name, { amount, txns, icon }]) => ({
            name, amount, txns, icon,
            account: acct,
            trend: 0,
            pct: mergedTotalDebits > 0 ? parseFloat(((amount / mergedTotalDebits) * 100).toFixed(1)) : 0,
          }));
        const netAmount = Math.max(0, mergedTotalDebits - mergedTotalCredits);
        result.byMonth = {
          [currentKey]: {
            categories:   mergedCategories,
            total:        Math.round(mergedTotalDebits),
            totalDebits:  Math.round(mergedTotalDebits),
            totalCredits: Math.round(mergedTotalCredits),
            netAmount:    Math.round(netAmount),
          },
        };
      }

      setParsedPreview({ type, acct, result });
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Confirm preview → conflict-check → save ───────────────────────────────
  const handleConfirmPreview = async () => {
    if (!parsedPreview) return;
    const { type, acct, result } = parsedPreview;
    setLoading(true);
    try {
      const conflictMonths = [];
      for (const monthKey of Object.keys(result.byMonth)) {
        const resp = await fetch(`/api/expenses?month=${monthKey}`);
        if (resp.ok) {
          const { data: existing } = await resp.json();
          const hasConflict = (existing.categories || []).some(
            c => c.account === acct && c.statementType === type
          );
          if (hasConflict) conflictMonths.push(existing.monthLabel || monthKey);
        }
      }
      if (conflictMonths.length > 0) {
        setParsedPreview(null);
        setPendingUpload({ type, acct, result, conflictMonths });
        setLoading(false);
        return;
      }
      await doSave(type, acct, result);
    } catch (err) {
      console.error('Statement import error:', err);
      alert('Failed to save. Please try again.');
      setLoading(false);
    }
  };

  const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px' };
  const label = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 };
  const input = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, fontWeight: 500, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#fff' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>Update Data</div>
        <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 3 }}>Keep your financial data current</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb' }}>
        {[
          { id: 'assets',     Icon: TrendingUp, label: 'Update Assets'    },
          { id: 'statements', Icon: FileText,   label: 'Upload Statements' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #3d6b4f' : '2px solid transparent',
              color: activeTab === tab.id ? '#3d6b4f' : '#9ca3af',
              marginBottom: -1, transition: 'color 0.15s',
            }}
          >
            <tab.Icon size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* ── Update Assets ── */}
      {activeTab === 'assets' && (
        <form onSubmit={handleUpdateAsset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Config row */}
          <div style={{ display: 'flex', gap: 16 }}>

            {/* Asset Type */}
            <div style={{ ...card, flex: 2 }}>
              <span style={label}>Asset Type</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['MF SIP','MF Zerodha','Stocks','EPF','PPF','Gold','Silver','Fixed Deposits','Bank Savings','House','Other'].map(n => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setAssetForm({ ...assetForm, name: n })}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${assetForm.name === n ? '#3d6b4f' : '#e5e7eb'}`,
                      background: assetForm.name === n ? '#f0faf4' : '#fff',
                      color: assetForm.name === n ? '#3d6b4f' : '#6b7280',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner */}
            <div style={{ ...card, flex: 1 }}>
              <span style={label}>Owner</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Joint','Anurag','Nidhi'].map(owner => (
                  <button
                    type="button"
                    key={owner}
                    onClick={() => setAssetForm({ ...assetForm, owner })}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${assetForm.owner === owner ? '#3d6b4f' : '#e5e7eb'}`,
                      background: assetForm.owner === owner ? '#3d6b4f' : '#fff',
                      color: assetForm.owner === owner ? '#fff' : '#6b7280',
                    }}
                  >
                    {owner}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Values card */}
          <div style={card}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <span style={label}>Current Value</span>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: 14, fontWeight: 600, pointerEvents: 'none' }}>₹</span>
                  <input
                    type="number"
                    value={assetForm.currentValue}
                    onChange={e => setAssetForm({ ...assetForm, currentValue: e.target.value })}
                    style={{ ...input, paddingLeft: 28 }}
                    placeholder="4,25,000"
                    required
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={label}>Return % <span style={{ textTransform: 'none', fontWeight: 400, color: '#d1d5db' }}>(auto-calc if blank)</span></span>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={assetForm.returnPercentage}
                    onChange={e => setAssetForm({ ...assetForm, returnPercentage: e.target.value })}
                    style={{ ...input, paddingRight: 32 }}
                    placeholder="12.5"
                  />
                  <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13, pointerEvents: 'none' }}>%</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
              <button
                type="submit"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, border: 'none', background: '#3d6b4f', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}
              >
                {loading
                  ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />Saving…</>
                  : <>✓ Save Asset</>
                }
              </button>
              {success && (
                <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>✓ Saved successfully</span>
              )}
            </div>
          </div>

        </form>
      )}

      {/* ── Upload Statements ── */}
      {activeTab === 'statements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#3d6b4f', fontSize: 13, fontWeight: 600 }}>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-200 border-t-green-600" />
              {parsedPreview ? 'Saving to expenses…' : 'Processing file…'}
            </div>
          )}

          {/* Success */}
          {uploadSuccess && (
            <div style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>✓ Upload successful! Redirecting to expenses…</div>
          )}

          {/* Conflict */}
          {pendingUpload && !loading && (
            <div style={{ ...card, background: '#fffbeb', border: '1px solid #fcd34d', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0 }}>
                Data already exists for <strong>{pendingUpload.type}</strong> / <strong style={{ textTransform: 'capitalize' }}>{pendingUpload.acct}</strong> in:
              </p>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {pendingUpload.conflictMonths.map(m => <li key={m} style={{ fontSize: 12, color: '#b45309' }}>{m}</li>)}
              </ul>
              <p style={{ fontSize: 12, color: '#b45309', margin: 0 }}>Overwrite the existing data for these months?</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => doSave(pendingUpload.type, pendingUpload.acct, pendingUpload.result)}
                  style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#d97706', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Yes, Override
                </button>
                <button
                  onClick={cancelUpload}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          {parsedPreview && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>Review Transactions</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                    {parsedPreview.type} · <span style={{ textTransform: 'capitalize' }}>{parsedPreview.acct}</span> · {Object.keys(parsedPreview.result.byMonth).length} month(s) detected
                  </p>
                </div>
                <button onClick={cancelUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1 }}>✕</button>
              </div>

              {Object.entries(parsedPreview.result.byMonth).map(([monthKey, monthData]) => {
                const [y, m] = monthKey.split('_');
                const lbl      = new Date(+y, +m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
                const txnCount = monthData.categories.reduce((s, c) => s + c.txns, 0);
                return (
                  <div key={monthKey} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{lbl}</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{monthData.categories.length} categories · {txnCount} txns</span>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {monthData.categories.map((cat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid #f9fafb' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{cat.icon}</span>
                            <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                            <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>({cat.txns} txn{cat.txns !== 1 ? 's' : ''})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>₹{cat.amount.toLocaleString('en-IN')}</span>
                            <button
                              onClick={() => setEditingItem({ monthKey, idx, name: cat.name, amount: cat.amount, icon: cat.icon })}
                              title="Edit"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px 4px', fontSize: 13, lineHeight: 1 }}
                            >✏️</button>
                            <button
                              onClick={() => handleDeletePreviewItem(monthKey, idx)}
                              title="Delete"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px 4px', fontSize: 13, lineHeight: 1 }}
                            >✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '12px 18px', background: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
                        <span>Total Debits</span><span style={{ fontWeight: 600 }}>₹{monthData.totalDebits.toLocaleString('en-IN')}</span>
                      </div>
                      {monthData.totalCredits > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a' }}>
                          <span>Payments / Refunds</span><span style={{ fontWeight: 600 }}>− ₹{monthData.totalCredits.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 2 }}>
                        <span style={{ color: '#111827' }}>Net Spend</span>
                        <span style={{ color: '#3d6b4f' }}>₹{monthData.netAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Edit item modal */}
              {editingItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Edit Transaction</span>
                      <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                        Icon
                        <input
                          value={editingItem.icon}
                          onChange={e => setEditingItem(p => ({ ...p, icon: e.target.value }))}
                          style={{ display: 'block', marginTop: 4, width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 18, boxSizing: 'border-box' }}
                        />
                      </label>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                        Category Name
                        <input
                          value={editingItem.name}
                          onChange={e => setEditingItem(p => ({ ...p, name: e.target.value }))}
                          style={{ display: 'block', marginTop: 4, width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </label>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                        Amount (₹)
                        <input
                          type="number"
                          min="0"
                          value={editingItem.amount}
                          onChange={e => setEditingItem(p => ({ ...p, amount: e.target.value }))}
                          style={{ display: 'block', marginTop: 4, width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button
                        onClick={handleSavePreviewEdit}
                        style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: '#3d6b4f', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleConfirmPreview}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#3d6b4f', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✓ Confirm &amp; Save to Expenses
                </button>
                <button
                  onClick={cancelUpload}
                  style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload form */}
          {!parsedPreview && !pendingUpload && !uploadSuccess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Config row */}
              <div style={{ display: 'flex', gap: 16 }}>

                {/* Account */}
                <div style={{ ...card, flex: 1 }}>
                  <span style={label}>Account</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Joint','Anurag','Nidhi'].map(acct => (
                      <button
                        type="button"
                        key={acct}
                        onClick={() => setStatementUpload(s => ({ ...s, account: acct }))}
                        style={{
                          flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${statementUpload.account === acct ? '#3d6b4f' : '#e5e7eb'}`,
                          background: statementUpload.account === acct ? '#3d6b4f' : '#fff',
                          color: statementUpload.account === acct ? '#fff' : '#6b7280',
                        }}
                      >
                        {acct}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Statement Type */}
                <div style={{ ...card, flex: 2 }}>
                  <span style={label}>Statement Type</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Bank Statement','HDFC Credit Card','ICICI Credit Card','Paytm','CSV File'].map(type => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setStatementUpload(s => ({ ...s, statementType: type, file: null }))}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${statementUpload.statementType === type ? '#3d6b4f' : '#e5e7eb'}`,
                          background: statementUpload.statementType === type ? '#f0faf4' : '#fff',
                          color: statementUpload.statementType === type ? '#3d6b4f' : '#6b7280',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drop zone card */}
              <div style={card}>
                <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#eff6ff', borderRadius: 10, border: '1px solid #dbeafe', marginBottom: 16 }}>
                  <span style={{ flexShrink: 0 }}>📊</span>
                  <p style={{ fontSize: 12, color: '#1e40af', margin: 0, lineHeight: 1.6 }}>
                    <strong>{statementUpload.statementType === 'Paytm' ? 'Paytm Excel — ' : 'CSV Import — '}</strong>
                    {statementUpload.statementType === 'Paytm'
                      ? 'Upload your transaction history (.xlsx). Month is auto-detected and categories saved to expenses.'
                      : 'Upload your statement as a CSV. Net spend (debits minus refunds) is calculated and saved to expenses.'}
                  </p>
                </div>

                <label
                  htmlFor="file-upload"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '28px 24px', border: '2px dashed #e5e7eb', borderRadius: 12, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6daa84'; e.currentTarget.style.background = '#f0faf4'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={20} color="#9ca3af" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#3d6b4f' }}>Choose a file</span>
                    <span style={{ fontSize: 14, color: '#6b7280' }}> or drag and drop</span>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
                      {statementUpload.statementType === 'Paytm' ? 'Excel (.xlsx) up to 10 MB' : 'CSV up to 10 MB'}
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    accept={statementUpload.statementType === 'Paytm' ? '.xlsx,.xls' : '.csv'}
                    onChange={e => handleFileSelect(e.target.files[0] || null)}
                  />
                </label>

                {statementUpload.file && !loading && (
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>📎 {statementUpload.file.name}</p>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default UpdateData;
