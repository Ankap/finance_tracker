import React, { useState, useEffect } from 'react';
import { Target, Calendar, Plus, Pencil, Trash2, X } from 'lucide-react';
import { goalsAPI } from '../services/api';
import { formatCurrency, formatDate, getGoalIcon, getStatusColor } from '../utils/formatters';

const CATEGORIES = [
  'Emergency Fund', 'House Purchase', 'Education', 'Retirement',
  'Travel', 'Career Break', 'Vehicle', 'Wedding', 'Other',
];
const PRIORITIES = ['High', 'Medium', 'Low'];

const emptyForm = {
  name: '',
  category: 'Other',
  description: '',
  targetAmount: '',
  currentAmount: '',
  deadline: '',
  priority: 'Medium',
};

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

function GoalModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const goal = {
      ...form,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount) || 0,
      status: computeStatus(
        parseFloat(form.currentAmount) || 0,
        parseFloat(form.targetAmount),
        form.deadline,
      ),
    };
    await onSave(goal);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {initial ? 'Edit Goal' : 'Add New Goal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
            <input
              className="input-field"
              placeholder="e.g. Europe Trip"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input-field" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
            <input
              className="input-field"
              placeholder="Short description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹)</label>
              <input
                type="number"
                className="input-field"
                placeholder="500000"
                value={form.targetAmount}
                onChange={e => set('targetAmount', e.target.value)}
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount (₹)</label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={form.currentAmount}
                onChange={e => set('currentAmount', e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Deadline</label>
            <input
              type="date"
              className="input-field"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const response = await goalsAPI.getAll();
      setGoals(response.data || []);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    await goalsAPI.delete(id);
    markInsightsStale();
    fetchGoals();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  const totalProgress = goals.length > 0
    ? goals.reduce((sum, g) => sum + Math.min((g.currentAmount / g.targetAmount) * 100, 100), 0) / goals.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Goals</h2>
          <p className="text-gray-500 mt-1">Track your financial milestones</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Overall Progress */}
      {goals.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Overall Progress</h3>
            <span className="text-2xl font-bold text-sage-700">{totalProgress.toFixed(0)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3">
            <div
              className="bg-sage-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(totalProgress, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {goals.filter(g => g.status === 'Completed').length} of {goals.length} goals completed
          </p>
        </div>
      )}

      {/* Goals Grid — 2 columns */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.currentAmount;

            return (
              <div key={goal._id} className="card hover:shadow-md transition-shadow flex flex-col">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                      {getGoalIcon(goal.category)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{goal.name}</h3>
                      {goal.description && (
                        <p className="text-xs text-gray-500 truncate">{goal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="p-1.5 text-gray-400 hover:text-sage-600 hover:bg-sage-50 rounded-lg transition-colors"
                      title="Edit goal"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Status badge */}
                <div className="mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{formatCurrency(goal.currentAmount, true)}</span>
                    <span className="font-semibold text-sage-700">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        goal.status === 'Completed' ? 'bg-purple-500'
                        : goal.status === 'Ahead' ? 'bg-blue-500'
                        : goal.status === 'On Track' ? 'bg-green-500'
                        : 'bg-orange-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 mt-auto">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Target</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(goal.targetAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {remaining > 0 ? formatCurrency(remaining) : '✓ Done'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-0.5">
                      <Calendar size={10} />Deadline
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(goal.deadline, 'month-year')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Target className="mx-auto mb-4 text-gray-300" size={56} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Goals Yet</h3>
          <p className="text-gray-500 mb-6">Start tracking your financial milestones</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Add Your First Goal
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <GoalModal onSave={handleAdd} onClose={() => setShowModal(false)} />
      )}

      {/* Edit Modal */}
      {editingGoal && (
        <GoalModal
          initial={editingGoal}
          onSave={handleEdit}
          onClose={() => setEditingGoal(null)}
        />
      )}
    </div>
  );
};

export default Goals;
