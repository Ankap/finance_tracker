import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { goalsAPI } from '../services/api';

const CATEGORIES = [
  'Emergency Fund', 'House Purchase', 'Education', 'Retirement',
  'Travel', 'Career Break', 'Vehicle', 'Wedding', 'Other',
];
const PRIORITIES = ['High', 'Medium', 'Low'];

const CATEGORY_META = {
  'Emergency Fund': { color: '#10b981', bg: '#f0fdf4', icon: '🛡️' },
  'House Purchase':  { color: '#f97316', bg: '#fff7ed', icon: '🏡' },
  'Education':       { color: '#3b82f6', bg: '#eff6ff', icon: '🎓' },
  'Retirement':      { color: '#8b5cf6', bg: '#f5f3ff', icon: '🌴' },
  'Travel':          { color: '#06b6d4', bg: '#ecfeff', icon: '✈️' },
  'Career Break':    { color: '#ec4899', bg: '#fdf2f8', icon: '🌸' },
  'Vehicle':         { color: '#f59e0b', bg: '#fffbeb', icon: '🚗' },
  'Wedding':         { color: '#db2777', bg: '#fdf2f8', icon: '💍' },
  'Other':           { color: '#6366f1', bg: '#eef2ff', icon: '🎯' },
};

const STATUS_META = {
  'Completed': { color: '#059669', bg: '#f0fdf4', border: '#a7f3d0',  bar: '#10b981' },
  'Ahead':     { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',  bar: '#3b82f6' },
  'On Track':  { color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe',  bar: '#6366f1' },
  'Behind':    { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa',  bar: '#f97316' },
};

const PRIORITY_META = {
  'High':   { color: '#dc2626', bg: '#fff5f5', border: '#fecaca' },
  'Medium': { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'Low':    { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

function fmtFull(n) {
  if (n == null) return '₹0';
  const abs = Math.abs(Math.round(n));
  const sign = n < 0 ? '−₹' : '₹';
  return sign + abs.toLocaleString('en-IN');
}

function fmtShort(n) {
  if (!n) return '₹0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-₹' : '₹';
  if (abs >= 10000000) return sign + (abs / 10000000).toFixed(1) + ' Cr';
  if (abs >= 100000)   return sign + (abs / 100000).toFixed(1) + 'L';
  if (abs >= 1000)     return sign + (abs / 1000).toFixed(0) + 'k';
  return sign + abs.toFixed(0);
}

function computeStatus(currentAmount, targetAmount, deadline) {
  const progress = currentAmount / targetAmount;
  if (progress >= 1) return 'Completed';
  if (!deadline) return 'On Track';
  const total = new Date(deadline) - new Date('2024-01-01');
  const elapsed = Date.now() - new Date('2024-01-01');
  const expected = elapsed / total;
  if (progress >= expected + 0.1) return 'Ahead';
  if (progress < expected - 0.1) return 'Behind';
  return 'On Track';
}

function progressBarColor(pct) {
  if (pct >= 100) return '#15803d';
  if (pct >= 90)  return '#059669';
  if (pct >= 80)  return '#10b981';
  if (pct >= 70)  return '#22c55e';
  if (pct >= 60)  return '#84cc16';
  if (pct >= 50)  return '#eab308';
  if (pct >= 40)  return '#f59e0b';
  if (pct >= 30)  return '#f97316';
  if (pct >= 20)  return '#f43f5e';
  if (pct >= 10)  return '#fb923c';
  return '#dc2626';
}

function daysLeft(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

const emptyForm = {
  name: '', category: 'Other', description: '',
  targetAmount: '', currentAmount: '', deadline: '', priority: 'Medium',
};

function GoalModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      targetAmount:  parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount) || 0,
      status: computeStatus(parseFloat(form.currentAmount) || 0, parseFloat(form.targetAmount), form.deadline),
    });
    setSaving(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{initial ? 'Edit Goal' : 'Add New Goal'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Goal Name */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Goal Name</div>
              <input
                required
                placeholder="e.g. Europe Trip"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
              />
            </div>

            {/* Category pills */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(c => {
                  const m = CATEGORY_META[c] || CATEGORY_META['Other'];
                  const sel = form.category === c;
                  return (
                    <button
                      key={c} type="button" onClick={() => set('category', c)}
                      style={{
                        padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${sel ? m.color : '#e5e7eb'}`,
                        background: sel ? m.bg : '#fff',
                        color: sel ? m.color : '#6b7280',
                        transition: 'all 0.12s',
                      }}
                    >
                      {m.icon} {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Description <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </div>
              <input
                placeholder="Short note"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
              />
            </div>

            {/* Amounts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Target (₹)</div>
                <input
                  required type="number" min="1" placeholder="5000000"
                  value={form.targetAmount}
                  onChange={e => set('targetAmount', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Saved So Far (₹)</div>
                <input
                  type="number" min="0" placeholder="0"
                  value={form.currentAmount}
                  onChange={e => set('currentAmount', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box', color: '#111827' }}
                />
              </div>
            </div>

            {/* Deadline + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Target Deadline</div>
                <input
                  required type="date"
                  value={form.deadline}
                  onChange={e => set('deadline', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#374151' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Priority</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {PRIORITIES.map(p => {
                    const m = PRIORITY_META[p];
                    const sel = form.priority === p;
                    return (
                      <button
                        key={p} type="button" onClick={() => set('priority', p)}
                        style={{
                          flex: 1, padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `2px solid ${sel ? m.color : '#e5e7eb'}`,
                          background: sel ? m.bg : '#fff',
                          color: sel ? m.color : '#9ca3af',
                          transition: 'all 0.12s',
                        }}
                      >{p}</button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', gap: 10, padding: '0 24px 22px' }}>
            <button
              type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
            >Cancel</button>
            <button
              type="submit" disabled={saving}
              style={{ flex: 2, padding: '10px 0', borderRadius: 9, border: 'none', background: '#2d6a4f', fontSize: 14, fontWeight: 700, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s' }}
            >{saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Goal'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Goals = () => {
  const [goals, setGoals]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterStatus, setFilterStatus]   = useState('All');

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await goalsAPI.getAll();
      setGoals(res.data || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const markInsightsStale = () => localStorage.setItem('ai_insights_stale', 'true');

  const handleAdd = async (goalData) => {
    await goalsAPI.create(goalData);
    markInsightsStale();
    setShowModal(false);
    fetchGoals();
  };

  const handleEdit = async (goalData) => {
    await goalsAPI.update({ ...editingGoal, ...goalData });
    markInsightsStale();
    setEditingGoal(null);
    fetchGoals();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await goalsAPI.delete(confirmDelete._id);
    markInsightsStale();
    setConfirmDelete(null);
    fetchGoals();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
        <div style={{ width: 44, height: 44, border: '3px solid #f3f4f6', borderTop: '3px solid #0d9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // Summary stats
  const totalTarget = goals.reduce((s, g) => s + (g.targetAmount  || 0), 0);
  const totalSaved  = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);
  const overallPct  = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const completedCount = goals.filter(g => g.status === 'Completed').length;
  const behindCount    = goals.filter(g => g.status === 'Behind').length;

  const STATUS_FILTERS = ['All', 'On Track', 'Ahead', 'Behind', 'Completed'];

  const visibleGoals = (filterStatus === 'All' ? goals : goals.filter(g => g.status === filterStatus))
    .slice()
    .sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>Goals</div>
          <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 3 }}>Track your financial milestones · {goals.length} goal{goals.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status filter pills */}
          {STATUS_FILTERS.map(s => {
            const active = filterStatus === s;
            const m = STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '6px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${active ? (m ? m.border : '#0d9488') : '#e5e7eb'}`,
                  background: active ? (m ? m.bg : '#f0fdfa') : '#fff',
                  color: active ? (m ? m.color : '#0f766e') : '#6b7280',
                  transition: 'all 0.15s',
                }}
              >
                {s === 'All' ? `All (${goals.length})` : s}
              </button>
            );
          })}
          <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, background: '#2d6a4f', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            <Plus size={16} /> Add Goal
          </button>
        </div>
      </div>

      {/* ── Summary stat card ── */}
      {goals.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #f0faf4 0%, #fff 70%)', border: '1px solid #b7e4c7', borderRadius: 12, padding: '12px 20px', display: 'flex', gap: 0, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Overall progress */}
          <div style={{ flex: '1 1 160px', paddingRight: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#52966e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Overall Progress</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2d6a4f', letterSpacing: '-0.5px', lineHeight: 1 }}>{overallPct.toFixed(0)}%</div>
            <div style={{ marginTop: 6, background: '#d1fae5', borderRadius: 100, height: 5, overflow: 'hidden', maxWidth: 160 }}>
              <div style={{ height: '100%', borderRadius: 100, background: 'linear-gradient(90deg, #10b981, #2d6a4f)', width: `${overallPct}%`, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: '#74b08a', marginTop: 4 }}>{completedCount} of {goals.length} completed{behindCount > 0 ? ` · ${behindCount} behind` : ''}</div>
          </div>


        </div>
      )}

      {/* ── Goal Cards Grid ── */}
      {visibleGoals.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {visibleGoals.map((goal) => {
            const progress  = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const days      = daysLeft(goal.deadline);
            const cm        = CATEGORY_META[goal.category] || CATEGORY_META['Other'];
            const sm        = STATUS_META[goal.status] || STATUS_META['On Track'];
            const pm        = PRIORITY_META[goal.priority] || PRIORITY_META['Medium'];

            return (
              <div
                key={goal._id}
                className="group"
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s', position: 'relative' }}
              >

                {/* Top row: icon + name + actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: cm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: `1px solid ${cm.color}22` }}>
                    {cm.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{goal.name}</div>
                    {goal.description && (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{goal.description}</div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: sm.color, background: sm.bg, border: `1px solid ${sm.border}`, borderRadius: 100, padding: '2px 8px' }}>{goal.status}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: pm.color, background: pm.bg, border: `1px solid ${pm.border}`, borderRadius: 100, padding: '2px 8px' }}>{goal.priority}</span>
                    </div>
                  </div>
                  {/* Edit / Delete — hover reveal */}
                  <div className="opacity-0 group-hover:opacity-100" style={{ display: 'flex', gap: 4, flexShrink: 0, transition: 'opacity 0.15s' }}>
                    <button
                      onClick={() => setEditingGoal(goal)}
                      title="Edit"
                      style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', padding: '5px 7px', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                    ><Pencil size={13} /></button>
                    <button
                      onClick={() => setConfirmDelete({ _id: goal._id, name: goal.name })}
                      title="Delete"
                      style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', padding: '5px 7px', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                    ><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Progress bar + % */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{fmtFull(goal.currentAmount)} saved</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: sm.color, letterSpacing: '-0.5px' }}>{progress.toFixed(0)}%</span>
                  </div>
                  <div style={{ position: 'relative', paddingBottom: goal.targetAmount > 500000 ? 14 : 0 }}>
                    <div style={{ background: '#f3f4f6', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 100, background: progressBarColor(progress), width: `${progress}%`, transition: 'width 0.5s ease' }} />
                    </div>
                    {goal.targetAmount > 500000 && [25, 50, 75].map(m => {
                      const reached = progress >= m;
                      return (
                        <React.Fragment key={m}>
                          <div style={{ position: 'absolute', left: `${m}%`, top: 0, transform: 'translateX(-50%)', width: 2, height: 8, background: 'rgba(255,255,255,0.8)', zIndex: 1, pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', left: `${m}%`, top: 11, transform: 'translateX(-50%)', fontSize: 9, fontWeight: 700, color: reached ? '#2d6a4f' : '#6b7280', whiteSpace: 'nowrap' }}>
                            {fmtShort(goal.targetAmount * m / 100)}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Target</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{fmtShort(goal.targetAmount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Remaining</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: remaining > 0 ? '#374151' : '#10b981' }}>
                      {remaining > 0 ? fmtShort(remaining) : '✓ Done'}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                      <Calendar size={9} /> Deadline
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: days != null && days < 30 && goal.status !== 'Completed' ? '#ea580c' : '#374151' }}>
                      {goal.deadline
                        ? new Date(goal.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                        : '—'}
                    </div>
                    {days != null && goal.status !== 'Completed' && (
                      <div style={{ fontSize: 10, color: days < 0 ? '#ef4444' : days < 90 ? '#ea580c' : '#9ca3af', fontWeight: 600, marginTop: 1 }}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : `${days}d left`}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : goals.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 48, lineHeight: 1 }}>🎯</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#374151' }}>No Goals Yet</div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>Start tracking your financial milestones</div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9, background: '#2d6a4f', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8 }}
          >
            <Plus size={16} /> Add Your First Goal
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '40px 24px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          No {filterStatus} goals found.
        </div>
      )}

      {/* ── Add Modal ── */}
      {showModal && <GoalModal onSave={handleAdd} onClose={() => setShowModal(false)} />}

      {/* ── Edit Modal ── */}
      {editingGoal && <GoalModal initial={editingGoal} onSave={handleEdit} onClose={() => setEditingGoal(null)} />}

      {/* ── Delete Confirm ── */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: 28, width: 300, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={16} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Delete goal?</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{confirmDelete.name}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>This will permanently remove the goal. This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: '#ef4444', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Goals;
