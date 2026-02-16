import React from 'react';
import { Home as HomeIcon, Plane, Shield, User } from 'lucide-react';

const GoalsScreen = () => {
  const goals = [
    {
      icon: <Shield className="text-teal-600" size={24} />,
      name: 'Emergency Fund',
      current: 59000,
      target: 519000,
      progress: 11.4,
      change: '+4,335,004p'
    },
    {
      icon: <HomeIcon className="text-teal-600" size={24} />,
      name: 'New Home',
      current: 85000,
      target: 80000,
      progress: 106.25,
      change: '+8,518,004p'
    },
    {
      icon: <Plane className="text-orange-600" size={24} />,
      name: 'Travel Fund',
      current: 70000,
      target: 50000,
      progress: 140,
      change: ''
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-semibold text-gray-900">Goals</h1>
            <nav className="flex items-center gap-6">
              <button className="text-gray-500 hover:text-gray-700">Dashboard</button>
              <button className="text-gray-500 hover:text-gray-700">Wealth</button>
              <button className="text-gray-900 font-medium border-b-2 border-gray-900 pb-1">
                Goals
              </button>
              <button className="text-gray-500 hover:text-gray-700">Expenses</button>
            </nav>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <User className="text-gray-600" size={24} />
          </button>
        </div>

        {/* Goals List */}
        <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
          {goals.map((goal, index) => (
            <div key={index}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  {goal.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Goal</p>
                  <p className="font-semibold text-gray-900">₹{(goal.target / 1000).toFixed(0)},000</p>
                </div>
                <div className="text-right ml-6">
                  <p className="text-2xl font-bold text-gray-900">₹{(goal.current / 1000).toFixed(0)},000</p>
                  {goal.change && (
                    <p className="text-xs text-green-600">{goal.change}</p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      goal.progress > 100 
                        ? 'bg-blue-500' 
                        : goal.progress > 70 
                        ? 'bg-orange-500' 
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="pt-6 border-t border-gray-200 flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 text-lg">↑</span>
            </div>
            <p className="text-gray-700">
              Overall, total net worth increased by <span className="font-semibold">₹50,000</span>
              {' '}(4.2%)
            </p>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-center gap-8 mt-8 text-gray-500">
          <button className="flex items-center gap-2 hover:text-gray-700">
            <HomeIcon size={20} />
            <span className="text-sm">Dashboard</span>
          </button>
          <button className="flex items-center gap-2 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm">Wealth</span>
          </button>
          <button className="flex items-center gap-2 text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Goals</span>
          </button>
          <button className="flex items-center gap-2 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Expenses</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalsScreen;
