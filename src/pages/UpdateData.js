import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, TrendingUp, Target, FileText, Check, Sparkles } from 'lucide-react';
import { assetsAPI, statementsAPI } from '../services/api';

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
    byMonth[monthKey] = { categories, total: Math.round(total) };
  }

  return { byMonth, sheet: sheetName };
}

// ── Main Component ───────────────────────────────────────────────────────────
const UpdateData = () => {
  const [activeTab, setActiveTab] = useState('assets');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const fileInputRef              = useRef(null);

  // Asset form state
  const [assetForm, setAssetForm] = useState({
    name: 'Mutual Funds',
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
      setAssetForm({ name: 'Mutual Funds', currentValue: '', returnPercentage: '', owner: 'Joint' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('Error updating asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── File selected → parse & auto-save Paytm Excel ──────────────────────
  const handleFileChange = (file) => {
    setStatementUpload(s => ({ ...s, file }));
    if (!file || statementUpload.statementType !== 'Paytm') return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = parsePaytmExcel(e.target.result);
      if (result.error) {
        alert('Could not parse Paytm file: ' + result.error);
        setStatementUpload(s => ({ ...s, file: null }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setLoading(true);
      const account = statementUpload.account.toLowerCase();
      try {
        for (const [monthKey, { categories }] of Object.entries(result.byMonth)) {
          const tagged = categories.map(c => ({ ...c, account }));
          await fetch('/api/expenses', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ action: 'save', month: monthKey, categories: tagged }),
          });
        }
        setStatementUpload(s => ({ ...s, file: null }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } catch (err) {
        console.error('Paytm import error:', err);
        alert('Failed to save. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Non-Paytm statement upload ──────────────────────────────────────────
  const handleStatementUpload = async (e) => {
    e.preventDefault();
    if (statementUpload.statementType === 'Paytm') return;
    setLoading(true);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append('statement',     statementUpload.file);
      formData.append('account',       statementUpload.account);
      formData.append('statementType', statementUpload.statementType);
      const response = await statementsAPI.upload(formData);
      await statementsAPI.process(response.data.statement._id);
      setSuccess(true);
      setStatementUpload(s => ({ ...s, file: null }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading statement:', error);
      alert('Error uploading statement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Update Data</h2>
        <p className="text-gray-500 mt-1">Keep your financial data current</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'assets',     icon: <TrendingUp size={20} />, label: 'Update Assets'    },
          { id: 'goals',      icon: <Target     size={20} />, label: 'Review Goals'     },
          { id: 'statements', icon: <FileText   size={20} />, label: 'Upload Statements' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-sage-700 border-b-2 border-sage-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">{tab.icon}<span>{tab.label}</span></div>
          </button>
        ))}
      </div>

      {/* ── Update Assets ── */}
      {activeTab === 'assets' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-sage-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Update Assets</h3>
          </div>
          <form onSubmit={handleUpdateAsset} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
                <select value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} className="input-field" required>
                  <option>Mutual Funds</option><option>Stocks</option><option>EPF</option>
                  <option>Gold</option><option>Silver</option><option>Fixed Deposits</option>
                  <option>Bank Savings</option><option>House</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                <select value={assetForm.owner} onChange={e => setAssetForm({ ...assetForm, owner: e.target.value })} className="input-field" required>
                  <option>Joint</option><option>Anurag</option><option>Nidhi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Value (₹)</label>
                <input type="number" value={assetForm.currentValue} onChange={e => setAssetForm({ ...assetForm, currentValue: e.target.value })} className="input-field" placeholder="425000" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Return % (since last update)</label>
                <input type="number" step="0.01" value={assetForm.returnPercentage} onChange={e => setAssetForm({ ...assetForm, returnPercentage: e.target.value })} className="input-field" placeholder="12.5" required />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Updating…</span></> : <><Check size={20} /><span>Update Asset</span></>}
              </button>
              {success && <div className="flex items-center gap-2 text-green-600"><Check size={20} /><span className="font-medium">Asset updated successfully!</span></div>}
            </div>
          </form>
          <div className="mt-8 p-4 bg-sage-50 rounded-lg border border-sage-100">
            <div className="flex items-start gap-3">
              <Sparkles className="text-sage-600 mt-1" size={20} />
              <div>
                <p className="font-medium text-gray-900 mb-1">Tip</p>
                <p className="text-sm text-gray-600">Update your assets monthly to track growth. Return percentage is automatically calculated from the change in value since your last update.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Goals ── */}
      {activeTab === 'goals' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-sage-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Review Goals</h3>
          </div>
          <div className="text-center py-12">
            <Target className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-2">Goal progress is updated automatically based on your asset values</p>
            <p className="text-sm text-gray-500">Go to the Goals page to view detailed progress</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { label: 'Emergency Fund', val: '₹5.19L', goal: 'Goal ₹5.19L', color: 'green', pct: 100 },
              { label: 'New Home',       val: '₹8.5L',  goal: 'Goal ₹8L',    color: 'blue',  pct: 106 },
              { label: 'Travel Fund',    val: '₹7L',    goal: 'Goal ₹5L',    color: 'orange',pct: 140 },
            ].map(g => (
              <div key={g.label} className={`p-4 bg-${g.color}-50 rounded-lg`}>
                <p className="text-sm text-gray-600 mb-1">{g.label}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">{g.val}</span>
                  <span className={`text-${g.color}-600 text-sm`}>{g.goal}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className={`bg-${g.color}-600 h-1.5 rounded-full`} style={{ width: `${Math.min(g.pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upload Statements ── */}
      {activeTab === 'statements' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="text-sage-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Upload Statements</h3>
          </div>

          <form onSubmit={handleStatementUpload} className="space-y-6">
            {/* Row 1: Account · Statement Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                <select
                  value={statementUpload.account}
                  onChange={e => setStatementUpload(s => ({ ...s, account: e.target.value }))}
                  className="input-field"
                >
                  <option>Joint</option><option>Anurag</option><option>Nidhi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statement Type</label>
                <select
                  value={statementUpload.statementType}
                  onChange={e => setStatementUpload(s => ({ ...s, statementType: e.target.value, file: null }))}
                  className="input-field"
                >
                  <option>Bank Statement</option>
                  <option>Credit Card</option>
                  <option>Paytm</option>
                  <option>CSV File</option>
                </select>
              </div>
            </div>

            {/* Paytm info banner */}
            {statementUpload.statementType === 'Paytm' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <span style={{ fontSize: 18 }}>📊</span>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Paytm Excel Import — </span>
                  Upload your Paytm transaction history (.xlsx). Month is detected automatically from transaction dates and categories are saved directly to the expense screen.
                </p>
              </div>
            )}

            {/* File upload zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File {statementUpload.statementType === 'Paytm' ? '(Excel .xlsx / .xls)' : '(PDF or CSV)'}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-sage-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-sage-600 hover:text-sage-500">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        ref={fileInputRef}
                        accept={statementUpload.statementType === 'Paytm' ? '.xlsx,.xls' : '.pdf,.csv'}
                        onChange={e => handleFileChange(e.target.files[0] || null)}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {statementUpload.statementType === 'Paytm' ? 'Excel file (.xlsx) up to 10 MB' : 'PDF or CSV up to 10 MB'}
                  </p>
                  {statementUpload.file && (
                    <p className="text-sm text-sage-600 font-medium mt-2">{statementUpload.file.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-4">
              {statementUpload.statementType !== 'Paytm' && (
                <button type="submit" disabled={loading || !statementUpload.file} className="btn-primary flex items-center gap-2">
                  {loading
                    ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /><span>Processing…</span></>
                    : <><Upload size={20} /><span>Upload & Process</span></>}
                </button>
              )}

              {statementUpload.statementType === 'Paytm' && loading && (
                <div className="flex items-center gap-2 text-sage-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sage-600" />
                  <span className="font-medium">Saving categories…</span>
                </div>
              )}

              {statementUpload.statementType === 'Paytm' && !statementUpload.file && !success && !loading && (
                <p className="text-sm text-gray-400">Select an Excel file to auto-import categories.</p>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check size={20} />
                  <span className="font-medium">
                    {statementUpload.statementType === 'Paytm'
                      ? 'Categories saved to expense screen!'
                      : 'Statement uploaded successfully!'}
                  </span>
                </div>
              )}
            </div>
          </form>

          <div className="mt-8 space-y-3">
            <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <Check className="text-green-600" size={20} />
              <p className="text-sm text-gray-700"><span className="font-medium">Added ₹1,10,000 this Fixed Deposits</span></p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <Check className="text-green-600" size={20} />
              <p className="text-sm text-gray-700"><span className="font-medium">Emergency Fund reached to 25% milestone</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Review ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-sage-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-900">AI Review</h3>
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-sage-50 rounded-lg"><p className="text-gray-700">You added the most to your fixed deposits this month.</p></div>
          <div className="p-4 bg-sage-50 rounded-lg"><p className="text-gray-700">The emergency fund hit an important milestone too.</p></div>
        </div>
        <button className="mt-6 w-full btn-primary">Done</button>
      </div>
    </div>
  );
};

export default UpdateData;
