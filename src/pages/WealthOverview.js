import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Sparkles, Maximize2, X, Trash2, Pencil } from 'lucide-react';
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

const MONTHS    = getMonthRange();
const ASSET_TYPES = ['MF SIP', 'MF Zerodha', 'Stocks', 'EPF', 'PPF', 'Gold', 'Silver', 'Fixed Deposits', 'Bank Savings', 'House', 'Other'];
const CHART_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#84cc16'];

const OWNER_META = {
  joint:  { color: '#3d6b4f', bg: '#f0faf4', border: '#b7e4c7', label: 'Joint'  },
  anurag: { color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', label: 'Anurag' },
  nidhi:  { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Nidhi'  },
};

function fmtFull(n) {
  if (n == null) return '₹0';
  const abs = Math.abs(Math.round(n));
  const sign = n < 0 ? '−₹' : '₹';
  return sign + abs.toLocaleString('en-IN');
}

function OwnerBadge({ owner }) {
  const key = (owner || 'joint').toLowerCase();
  const m = OWNER_META[key] || OWNER_META.joint;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      color: m.color, background: m.bg,
      border: `1px solid ${m.border}`,
      borderRadius: 100, padding: '2px 9px',
      letterSpacing: '0.02em',
    }}>
      {m.label}
    </span>
  );
}

function EditAssetModal({ asset, onSave, onClose }) {
  const [name, setName]                  = useState(asset.name);
  const [owner, setOwner]                = useState(asset.owner || 'Joint');
  const [accountDetails, setDetails]     = useState(asset.accountDetails || '');
  const [currentValue, setValue]         = useState(asset.currentValue ?? '');
  const [principalAmount, setPrincipal]  = useState(asset.principalAmount ?? '');
  const [saving, setSaving]              = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ name, owner, accountDetails, currentValue: Number(currentValue), principalAmount: Number(principalAmount) || 0 });
    setSaving(false);
  };

  const ownerKey = owner.toLowerCase();
  const om = OWNER_META[ownerKey] || OWNER_META.joint;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Edit Asset</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Asset type */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Asset Type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ASSET_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setName(t)}
                  style={{
                    padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                    borderColor: name === t ? '#0d9488' : '#e5e7eb',
                    background:  name === t ? '#f0fdfa' : '#fff',
                    color:       name === t ? '#0f766e' : '#6b7280',
                  }}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Owner</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Joint', 'Anurag', 'Nidhi'].map(o => {
                const m = OWNER_META[o.toLowerCase()];
                const sel = owner === o;
                return (
                  <button
                    key={o}
                    onClick={() => setOwner(o)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      border: `2px solid ${sel ? m.color : '#e5e7eb'}`,
                      background: sel ? m.color : '#fff',
                      color: sel ? '#fff' : '#6b7280',
                      transition: 'all 0.15s',
                    }}
                  >{o}</button>
                );
              })}
            </div>
          </div>

          {/* Account details */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Account Details <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </div>
            <input
              placeholder="e.g. HDFC MF, Zerodha"
              value={accountDetails}
              onChange={e => setDetails(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
            />
          </div>

          {/* Principal amount */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Principal Amount (₹)</div>
            <input
              type="number"
              min="0"
              placeholder="e.g. 400000"
              value={principalAmount}
              onChange={e => setPrincipal(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
            />
          </div>

          {/* Current value */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Current Value (₹)</div>
            <input
              type="number"
              min="0"
              placeholder="e.g. 500000"
              value={currentValue}
              onChange={e => setValue(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '0 24px 20px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px 0', borderRadius: 9, border: 'none', background: om.color, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const WealthOverview = () => {
  const [assets, setAssets]                         = useState([]);
  const [totalNetWorth, setTotalNetWorth]           = useState(0);
  const [nwChange, setNwChange]                     = useState(0);
  const [nwChangePct, setNwChangePct]               = useState(0);
  const [loading, setLoading]                       = useState(true);
  const [selectedOwner, setSelectedOwner]           = useState('All');
  const [selectedMonth, setSelectedMonth]           = useState(MONTHS[0]);
  const [isChartExpanded, setIsChartExpanded]       = useState(false);
  const [confirmDeleteAsset, setConfirmDeleteAsset] = useState(null);
  const [editingAsset, setEditingAsset]             = useState(null);
  const [expandedGroups, setExpandedGroups]         = useState(new Set());

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const ownerFilter    = selectedOwner === 'All' ? null : selectedOwner;
      const selectedIdx    = MONTHS.indexOf(selectedMonth);
      const prevMonthLabel = selectedIdx >= 0 && selectedIdx + 1 < MONTHS.length ? MONTHS[selectedIdx + 1] : null;

      const [assetsRes, allForMonthRes, prevNWRes] = await Promise.all([
        assetsAPI.getAll(ownerFilter, selectedMonth),
        ownerFilter ? assetsAPI.getAll(null, selectedMonth) : null,
        prevMonthLabel ? assetsAPI.getNetWorth(null, prevMonthLabel) : Promise.resolve({ data: null }),
      ]);

      const allForMonth = ownerFilter ? allForMonthRes.data : assetsRes.data;
      const currentNW   = allForMonth.reduce((sum, a) => sum + (a.currentValue || 0), 0);
      const prevNW      = prevNWRes?.data?.totalNetWorth || 0;
      const change      = prevNW > 0 ? currentNW - prevNW : 0;
      const changePct   = prevNW > 0 ? (change / prevNW) * 100 : 0;

      setAssets(assetsRes.data);
      setTotalNetWorth(currentNW);
      setNwChange(change);
      setNwChangePct(changePct);
    } catch (error) {
      console.error('Error fetching wealth data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedOwner, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <div style={{ width: 44, height: 44, border: '3px solid #f3f4f6', borderTop: '3px solid #0d9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const chartData = assets.length > 0
    ? Object.entries(
        assets.reduce((acc, a) => {
          if (!acc[a.name]) acc[a.name] = { principal: 0, current: 0 };
          acc[a.name].principal += a.principalAmount || 0;
          acc[a.name].current  += a.currentValue    || 0;
          return acc;
        }, {})
      ).sort((a, b) => b[1].current - a[1].current)
       .map(([name, vals]) => ({ name, principal: vals.principal, current: vals.current }))
    : [];

  const getAddedDate = (asset) => {
    const idAsNum = Number(asset._id);
    if (!isNaN(idAsNum) && idAsNum > 1_000_000_000_000) return formatDate(new Date(idAsNum), 'short');
    return null;
  };

  const groupedMap = assets.reduce((acc, a) => {
    if (!acc[a.name]) acc[a.name] = { name: a.name, total: 0, items: [] };
    acc[a.name].total += a.currentValue || 0;
    acc[a.name].items.push(a);
    return acc;
  }, {});
  const groups = Object.values(groupedMap).sort((a, b) => b.total - a.total);

  const toggleGroup = (name) => setExpandedGroups(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const top3Performers = assets.length > 0
    ? [...assets]
        .filter(a => a.principalAmount > 0)
        .map(a => ({ asset: a, gain: ((a.currentValue - a.principalAmount) / a.principalAmount) * 100 }))
        .sort((a, b) => b.gain - a.gain)
        .slice(0, 3)
        .map(x => x.asset)
    : [];

  const handleEdit = async ({ currentValue, principalAmount, ...metaPatch }) => {
    const { _id, currentValue: oldValue } = editingAsset;
    setEditingAsset(null);
    setAssets(prev => prev.map(a => a._id === _id ? { ...a, ...metaPatch, currentValue, principalAmount } : a));
    setTotalNetWorth(prev => prev + (currentValue - oldValue));
    const calls = [assetsAPI.update(_id, metaPatch)];
    if (currentValue !== oldValue || principalAmount !== undefined) {
      calls.push(assetsAPI.addSnapshot(_id, { value: currentValue, principalAmount }));
    }
    await Promise.all(calls);
    fetchData(true);
  };

  const handleDelete = async () => {
    if (!confirmDeleteAsset) return;
    const { _id } = confirmDeleteAsset;
    const deletedAsset = assets.find(a => a._id === _id);
    setConfirmDeleteAsset(null);
    setAssets(prev => prev.filter(a => a._id !== _id));
    setTotalNetWorth(prev => prev - (deletedAsset?.currentValue || 0));
    await assetsAPI.delete(_id);
    fetchData(true);
  };

  const isPositiveChange = nwChange >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>Wealth Overview</div>
          <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 3 }}>Track your assets and investments · {selectedMonth}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Month selector */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 10, pointerEvents: 'none', fontSize: 14 }}>📅</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 9, padding: '7px 12px 7px 30px', fontSize: 13, color: '#374151', fontWeight: 600, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', outline: 'none' }}
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />

          {/* Owner filter pills */}
          {['All', 'Joint', 'Anurag', 'Nidhi'].map(owner => {
            const key = owner.toLowerCase();
            const m = key === 'all' ? null : OWNER_META[key];
            const active = selectedOwner === owner;
            return (
              <button
                key={owner}
                onClick={() => setSelectedOwner(owner)}
                style={{
                  padding: '6px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${active ? (m ? m.border : '#0d9488') : '#e5e7eb'}`,
                  background: active ? (m ? m.bg : '#f0fdfa') : '#fff',
                  color: active ? (m ? m.color : '#0f766e') : '#6b7280',
                  transition: 'all 0.15s',
                }}
              >{owner}</button>
            );
          })}
        </div>
      </div>

      {/* ── Combined stat card ── */}
      <div style={{ background: 'linear-gradient(135deg, #f0faf4 0%, #fff 70%)', border: '1px solid #b7e4c7', borderRadius: 14, padding: '18px 24px', display: 'flex', gap: 0, flexWrap: 'wrap' }}>

        {/* Net Worth */}
        <div style={{ flex: '1 1 180px', paddingRight: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#52966e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Total Net Worth</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2d6a4f', letterSpacing: '-1px', lineHeight: 1 }}>{fmtFull(totalNetWorth)}</div>
          <div style={{ fontSize: 12, color: '#74b08a', marginTop: 5 }}>{assets.length} asset{assets.length !== 1 ? 's' : ''} · {chartData.length} categor{chartData.length !== 1 ? 'ies' : 'y'}</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: '#b7e4c7', alignSelf: 'stretch', margin: '0 24px 0 0', flexShrink: 0 }} />

        {/* MoM Change */}
        <div style={{ flex: '1 1 160px', paddingRight: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#52966e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Month-on-Month</div>
          {nwChange !== 0 ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: isPositiveChange ? '#2d6a4f' : '#dc2626', letterSpacing: '-0.5px', lineHeight: 1 }}>
                {isPositiveChange ? '+' : '−'}{fmtFull(Math.abs(nwChange))}
              </div>
              <div style={{ fontSize: 12, color: isPositiveChange ? '#52966e' : '#ef4444', marginTop: 5, fontWeight: 600 }}>
                {isPositiveChange ? '▲' : '▼'} {Math.abs(nwChangePct).toFixed(1)}% vs last month
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#c1d9ca', letterSpacing: '-0.5px', lineHeight: 1 }}>—</div>
              <div style={{ fontSize: 12, color: '#a8c9b5', marginTop: 5 }}>No prior month data yet</div>
            </>
          )}
        </div>

        {/* Divider */}
        {top3Performers.length > 0 && <div style={{ width: 1, background: '#b7e4c7', alignSelf: 'stretch', margin: '0 24px 0 0', flexShrink: 0 }} />}

        {/* Top 3 Performers */}
        {top3Performers.length > 0 && (
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#52966e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Top Performers</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {top3Performers.map((a, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.7)', border: '1px solid #b7e4c7', borderRadius: 20, padding: '4px 10px 4px 7px' }}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{medals[i]}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f' }}>{a.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Chart + Assets ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', flexWrap: 'wrap', height: 320 }}>

        {/* Asset Allocation Chart */}
        <div style={{ flex: '0 0 calc(60% - 10px)', minWidth: 280, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Asset Allocation</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Breakdown by asset type</div>
            </div>
            <button
              onClick={() => setIsChartExpanded(true)}
              style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
              title="Expand chart"
            >
              <Maximize2 size={13} /> Expand
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: '#cbd5e1' }} />
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Principal</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: '#0d9488' }} />
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Current Value</span>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 13 }}>No assets recorded yet.</div>
          ) : (
            <div style={{ flex: 1, minHeight: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 80, left: 0, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    formatter={(value, name) => [fmtFull(value), name === 'current' ? 'Current Value' : 'Principal']}
                    contentStyle={{ fontSize: 12, borderRadius: 9, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontWeight: 700, color: '#111827' }}
                    cursor={{ fill: 'rgba(13,148,136,0.06)' }}
                  />
                  <Bar dataKey="principal" name="Principal" barSize={9} radius={[0, 4, 4, 0]} fill="#cbd5e1"
                    label={{ position: 'right', content: ({ x, y, width, height, value }) => (
                      <text x={x + width + 6} y={y + height / 2 + 1} dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#94a3b8">
                        {fmtFull(value)}
                      </text>
                    )}}
                  />
                  <Bar dataKey="current" name="Current Value" barSize={9} radius={[0, 6, 6, 0]}
                    label={{ position: 'right', content: ({ x, y, width, height, value }) => (
                      <text x={x + width + 6} y={y + height / 2 + 1} dominantBaseline="middle" fontSize={11} fontWeight={700} fill="#374151">
                        {fmtFull(value)}
                      </text>
                    )}}
                  >
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Assets List */}
        <div style={{ flex: '0 0 calc(40% - 10px)', minWidth: 240, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Assets</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{assets.length} {assets.length === 1 ? 'item' : 'items'} · {selectedOwner === 'All' ? 'all owners' : selectedOwner}</div>
          </div>

          {assets.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#d1d5db', fontSize: 13 }}>
              <span style={{ fontSize: 28 }}>📭</span>
              No assets found. Add assets via <strong>Update Data</strong>.
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 230, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {groups.map((group, gi) => {
                const color      = CHART_COLORS[gi % CHART_COLORS.length];
                const isExpanded = expandedGroups.has(group.name);
                const isLastGroup = gi === groups.length - 1;
                return (
                  <div key={group.name} style={{ borderBottom: isLastGroup && !isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(group.name)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {getAssetIcon(group.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{group.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{group.items.length} account{group.items.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#111827', flexShrink: 0 }}>{fmtFull(group.total)}</div>
                      <span style={{ fontSize: 9, color: '#9ca3af', flexShrink: 0, marginLeft: 4 }}>{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    {/* Expanded individual accounts */}
                    {isExpanded && (
                      <div style={{ paddingBottom: 4 }}>
                        {group.items.map((asset, ii) => {
                          const addedDate  = getAddedDate(asset);
                          const isLastItem = ii === group.items.length - 1;
                          return (
                            <div
                              key={asset._id}
                              className="group"
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 6px 44px', borderBottom: isLastItem ? 'none' : '1px solid #f9fafb', position: 'relative' }}
                            >
                              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <OwnerBadge owner={asset.owner} />
                                {asset.accountDetails && (
                                  <span style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{asset.accountDetails}</span>
                                )}
                                {addedDate && <span style={{ fontSize: 10, color: '#d1d5db' }}>{addedDate}</span>}
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 12, color: '#374151' }}>{fmtFull(asset.currentValue)}</div>
                                {asset.principalAmount > 0 && (() => {
                                  const gain = asset.currentValue - asset.principalAmount;
                                  return (
                                    <div style={{ fontSize: 10, color: gain >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                      {gain >= 0 ? '+' : ''}{fmtFull(gain)}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100" style={{ display: 'flex', gap: 2, flexShrink: 0, transition: 'opacity 0.15s' }}>
                                <button onClick={() => setEditingAsset(asset)} title="Edit" style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', padding: '4px 6px', color: '#9ca3af', display: 'flex', alignItems: 'center' }}><Pencil size={12} /></button>
                                <button onClick={() => setConfirmDeleteAsset({ _id: asset._id, name: asset.name })} title="Delete" style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', padding: '4px 6px', color: '#ef4444', display: 'flex', alignItems: 'center' }}><Trash2 size={12} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* ── Modals ── */}

      {editingAsset && (
        <EditAssetModal asset={editingAsset} onSave={handleEdit} onClose={() => setEditingAsset(null)} />
      )}

      {confirmDeleteAsset && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }} onClick={() => setConfirmDeleteAsset(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 300, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={16} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Delete asset?</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{confirmDeleteAsset.name}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
              This will permanently remove the asset and all its history. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDeleteAsset(null)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: '#ef4444', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {isChartExpanded && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 24 }} onClick={() => setIsChartExpanded(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 720, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Asset Allocation</div>
              <button onClick={() => setIsChartExpanded(false)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
            </div>
            {/* Expanded legend */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#cbd5e1' }} />
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Principal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#0d9488' }} />
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Current Value</span>
              </div>
            </div>
            <div style={{ height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 100, left: 0, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip
                    formatter={(value, name) => [fmtFull(value), name === 'current' ? 'Current Value' : 'Principal']}
                    contentStyle={{ fontSize: 12, borderRadius: 9, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontWeight: 700, color: '#111827' }}
                    cursor={{ fill: 'rgba(13,148,136,0.06)' }}
                  />
                  <Bar dataKey="principal" name="Principal" barSize={12} radius={[0, 4, 4, 0]} fill="#cbd5e1"
                    label={{ position: 'right', content: ({ x, y, width, height, value }) => (
                      <text x={x + width + 8} y={y + height / 2 + 1} dominantBaseline="middle" fontSize={11} fontWeight={600} fill="#94a3b8">
                        {fmtFull(value)}
                      </text>
                    )}}
                  />
                  <Bar dataKey="current" name="Current Value" barSize={12} radius={[0, 6, 6, 0]}
                    label={{ position: 'right', content: ({ x, y, width, height, value }) => (
                      <text x={x + width + 8} y={y + height / 2 + 1} dominantBaseline="middle" fontSize={12} fontWeight={700} fill="#374151">
                        {fmtFull(value)}
                      </text>
                    )}}
                  >
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {top3Performers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                <Sparkles size={13} style={{ color: '#0d9488', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#374151' }}>
                  Top performer: <strong>{top3Performers[0].name}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default WealthOverview;
