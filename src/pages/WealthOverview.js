import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Sparkles, Maximize2, X, Trash2, Pencil } from 'lucide-react';
import { assetsAPI } from '../services/api';
import { formatCurrency, formatPercentage, getAssetIcon, formatDate } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function getMonthRange() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }));
  }
  return months;
}

const MONTHS = getMonthRange();
const ASSET_TYPES = ['MF SIP', 'MF Zerodha', 'Stocks', 'EPF', 'PPF', 'Gold', 'Silver', 'Fixed Deposits', 'Bank Savings', 'House', 'Other'];

function EditAssetModal({ asset, onSave, onClose }) {
  const [name, setName]               = useState(asset.name);
  const [owner, setOwner]             = useState(asset.owner || 'Joint');
  const [accountDetails, setDetails]  = useState(asset.accountDetails || '');
  const [currentValue, setValue]      = useState(asset.currentValue ?? '');
  const [saving, setSaving]           = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ name, owner, accountDetails, currentValue: Number(currentValue) });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit Asset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Asset type pills */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Asset Type</label>
            <div className="flex flex-wrap gap-1.5">
              {ASSET_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setName(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    name === t
                      ? 'border-sage-600 bg-sage-50 text-sage-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {/* Owner */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Owner</label>
            <div className="flex gap-2">
              {['Joint', 'Anurag', 'Nidhi'].map(o => (
                <button
                  key={o}
                  onClick={() => setOwner(o)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    owner === o
                      ? 'border-sage-600 bg-sage-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          {/* Account details */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Account Details <span className="text-gray-400">(optional)</span></label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-sage-400"
              placeholder="e.g. HDFC MF, Zerodha"
              value={accountDetails}
              onChange={e => setDetails(e.target.value)}
            />
          </div>
          {/* Current value */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Current Value (₹)</label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-sage-400"
              placeholder="e.g. 500000"
              value={currentValue}
              onChange={e => setValue(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-sage-600 text-white hover:bg-sage-700 transition-colors disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const WealthOverview = () => {
  const [assets, setAssets] = useState([]);
  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [confirmDeleteAsset, setConfirmDeleteAsset] = useState(null);
  const [editingAsset, setEditingAsset]             = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const ownerFilter = selectedOwner === 'All' ? null : selectedOwner;
      const [assetsRes, allAssetsRes] = await Promise.all([
        assetsAPI.getAll(ownerFilter, selectedMonth),
        assetsAPI.getAll(null, null),
      ]);
      setAssets(assetsRes.data);
      setTotalNetWorth(allAssetsRes.data.reduce((sum, a) => sum + (a.currentValue || 0), 0));
    } catch (error) {
      console.error('Error fetching wealth data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedOwner, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  const chartData = assets.length > 0
    ? Object.entries(
        assets.reduce((acc, a) => { acc[a.name] = (acc[a.name] || 0) + a.currentValue; return acc; }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];

  const COLORS = ['#5f6f5f', '#7d8d7d', '#a3afa3', '#c7cfc7', '#86efac', '#4ade80'];

  const getAddedDate = (asset) => {
    const firstSnapDate = asset.monthlySnapshots?.[0]?.date;
    if (firstSnapDate) return formatDate(firstSnapDate, 'short');
    const idAsNum = Number(asset._id);
    if (!isNaN(idAsNum) && idAsNum > 1_000_000_000_000) return formatDate(new Date(idAsNum), 'short');
    return null;
  };

  // Derive top performer from the already-filtered assets array
  const topPerformer = assets.length > 0
    ? assets.reduce((best, asset) => {
        const r = asset.monthlySnapshots?.length
          ? asset.monthlySnapshots[asset.monthlySnapshots.length - 1].returnPercentage
          : -Infinity;
        const br = best.monthlySnapshots?.length
          ? best.monthlySnapshots[best.monthlySnapshots.length - 1].returnPercentage
          : -Infinity;
        return r > br ? asset : best;
      })
    : null;
  const topPerformerReturn = topPerformer?.monthlySnapshots?.length
    ? topPerformer.monthlySnapshots[topPerformer.monthlySnapshots.length - 1].returnPercentage
    : 0;
  const topPerformerGrowth = (() => {
    const snaps = topPerformer?.monthlySnapshots;
    if (!snaps || snaps.length < 2) return 0;
    return snaps[snaps.length - 1].value - snaps[snaps.length - 2].value;
  })();

  const handleEdit = async ({ currentValue, ...metaPatch }) => {
    const { _id, currentValue: oldValue } = editingAsset;
    setEditingAsset(null);

    // Optimistic update — reflect changes immediately
    setAssets(prev => prev.map(a => a._id === _id ? { ...a, ...metaPatch, currentValue } : a));
    setTotalNetWorth(prev => prev + (currentValue - oldValue));

    const calls = [assetsAPI.update(_id, metaPatch)];
    if (currentValue !== oldValue) {
      calls.push(assetsAPI.addSnapshot(_id, { value: currentValue }));
    }
    await Promise.all(calls);
    fetchData(true);
  };

  const handleDelete = async () => {
    if (!confirmDeleteAsset) return;
    const { _id } = confirmDeleteAsset;
    const deletedAsset = assets.find(a => a._id === _id);
    setConfirmDeleteAsset(null);

    // Optimistic update — reflect changes immediately
    setAssets(prev => prev.filter(a => a._id !== _id));
    setTotalNetWorth(prev => prev - (deletedAsset?.currentValue || 0));

    await assetsAPI.delete(_id);
    fetchData(true);
  };

  return (
    /* Layout's main already has py-8 (64px) + sticky header (~73px) ≈ 137px consumed */
    <div className="flex flex-col gap-3">

      {/* Header row */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wealth Overview</h2>
          <p className="text-gray-500 text-sm">Track your assets and investments</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month selector */}
          <div className="relative inline-flex items-center">
            <span className="absolute left-2.5 pointer-events-none text-sm">📅</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-700 font-medium cursor-pointer appearance-none outline-none"
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          {/* Divider */}
          <div className="h-5 w-px bg-gray-200" />
          {/* Owner filter */}
          {['All', 'Joint', 'Anurag', 'Nidhi'].map((owner) => (
            <button
              key={owner}
              onClick={() => setSelectedOwner(owner)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedOwner === owner
                  ? 'bg-sage-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {owner}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">

          {/* Net Worth */}
          <div className="card flex items-center justify-between py-3 flex-shrink-0">
            <div>
              <p className="text-sm text-gray-500">Total Net Worth</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalNetWorth, true)}
              </p>
            </div>
            {topPerformer && (
              <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
                <TrendingUp size={16} />
                <span className="text-sm font-semibold">
                  {formatPercentage(topPerformerReturn)} this month
                </span>
              </div>
            )}
          </div>

          {/* Asset Allocation + Assets List — side by side */}
          <div className="flex gap-3 items-stretch">

            {/* Asset Allocation Chart */}
            <div className="card flex-1 min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Asset Allocation</h3>
                <button
                  onClick={() => setIsChartExpanded(true)}
                  className="p-1 rounded-lg text-gray-400 hover:text-sage-600 hover:bg-gray-100 transition-colors"
                  title="Expand chart"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} width={55} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value, true)}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* AI insight inline */}
              {topPerformer && (
                <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
                  <Sparkles className="text-sage-600 flex-shrink-0" size={13} />
                  <p className="text-xs text-gray-600">
                    Top performer: <span className="font-medium">{topPerformer.name}</span>
                    {' '}· {formatCurrency(topPerformerGrowth)} growth
                  </p>
                </div>
              )}
            </div>

            {/* Assets List */}
            <div className="card flex-1 min-w-0 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex-shrink-0">Assets</h3>
              <div className="space-y-2 overflow-y-auto h-[292px]">
                {assets.map((asset) => (
                  <div
                    key={asset._id}
                    className="group flex items-center gap-3 p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-9 h-9 bg-sage-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                      {getAssetIcon(asset.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{asset.name}</p>
                      <p className="text-xs text-gray-500 truncate">{asset.accountDetails || asset.owner}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(asset.currentValue, true)}
                      </p>
                      {asset.monthlySnapshots?.length > 0 && (
                        <p className={`text-xs ${
                          asset.monthlySnapshots[asset.monthlySnapshots.length - 1].returnPercentage >= 0
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {asset.monthlySnapshots[asset.monthlySnapshots.length - 1].returnPercentage >= 0 ? '+' : ''}
                          {formatPercentage(asset.monthlySnapshots[asset.monthlySnapshots.length - 1].returnPercentage)}
                        </p>
                      )}
                      {getAddedDate(asset) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {getAddedDate(asset)}
                        </p>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-all flex-shrink-0">
                      <button
                        onClick={() => setEditingAsset(asset)}
                        className="p-1 rounded-lg text-gray-400 hover:text-sage-600 hover:bg-sage-50 transition-colors"
                        title="Edit asset"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteAsset({ _id: asset._id, name: asset.name })}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete asset"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
      </div>

      {/* Edit asset modal */}
      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          onSave={handleEdit}
          onClose={() => setEditingAsset(null)}
        />
      )}

      {/* Delete confirmation popup */}
      {confirmDeleteAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirmDeleteAsset(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-72 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Delete asset?</p>
                <p className="text-xs text-gray-500 mt-0.5">{confirmDeleteAsset.name}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">This will permanently remove the asset and all its history. This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteAsset(null)}
                className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded chart modal */}
      {isChartExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setIsChartExpanded(false)}
        >
          <div
            className="card w-full max-w-3xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Asset Allocation</h3>
              <button
                onClick={() => setIsChartExpanded(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} width={65} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value, true)}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {topPerformer && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Sparkles className="text-sage-600 flex-shrink-0" size={13} />
                <p className="text-xs text-gray-600">
                  Top performer: <span className="font-medium">{topPerformer.name}</span>
                  {' '}· {formatCurrency(topPerformerGrowth)} growth
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WealthOverview;
