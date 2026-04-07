import React from 'react';
import { Home as HomeIcon, Plane, Shield } from 'lucide-react';

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
    <div>
      <div className="max-w-2xl mx-auto">
        {/* Page title */}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Goals</h1>

        {/* Goals List */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
          {goals.map((goal, index) => (
            <div key={index}>
              <div className="flex flex-wrap items-start gap-3 sm:gap-4 mb-3">
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
                <div className="text-right sm:ml-6">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{(goal.current / 1000).toFixed(0)},000</p>
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

      </div>
    </div>
  );
};

export default GoalsScreen;
