import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, Plus } from 'lucide-react';
import { goalsAPI } from '../services/api';
import { formatCurrency, formatDate, getGoalIcon, getStatusColor } from '../utils/formatters';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsAPI.getAll();
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  const totalProgress = goals.length > 0
    ? goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount) * 100, 0) / goals.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Goals</h2>
          <p className="text-gray-500 mt-1">Track your financial milestones</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Overall Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Overall Progress</h3>
          <span className="text-2xl font-bold text-sage-700">
            {totalProgress.toFixed(0)}%
          </span>
        </div>

        <div className="flex-1 bg-gray-200 rounded-full h-3">
          <div
            className="bg-sage-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(totalProgress, 100)}%` }}
          />
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Overall, total net worth increased by ₹50,000 (4.2%)
        </p>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const requiredMonthly = goal.calculateRequiredMonthlyContribution
            ? goal.calculateRequiredMonthlyContribution()
            : 0;

          return (
            <div key={goal._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center text-3xl">
                    {getGoalIcon(goal.category)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{goal.name}</h3>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(goal.status)}`}>
                  {goal.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {formatCurrency(goal.currentAmount, true)} of {formatCurrency(goal.targetAmount, true)}
                  </span>
                  <span className="font-semibold text-sage-700">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      goal.status === 'Completed'
                        ? 'bg-purple-600'
                        : goal.status === 'Ahead'
                        ? 'bg-blue-600'
                        : goal.status === 'On Track'
                        ? 'bg-green-600'
                        : 'bg-orange-600'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Goal Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Target</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Remaining</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(goal.targetAmount - goal.currentAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar size={12} />
                    Deadline
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(goal.deadline, 'month-year')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    goal.priority === 'High'
                      ? 'bg-red-100 text-red-700'
                      : goal.priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {goal.priority}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="card text-center py-12">
          <Target className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Goals Yet</h3>
          <p className="text-gray-500 mb-6">Start tracking your financial goals</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add Your First Goal</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Goals;
