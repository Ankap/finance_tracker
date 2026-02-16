import React from 'react';
import { CheckCircle, AlertCircle, User } from 'lucide-react';

const DashboardScreen = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <nav className="flex items-center gap-6">
              <button className="text-gray-900 font-medium border-b-2 border-gray-900 pb-1">
                Dashboard
              </button>
              <button className="text-gray-500 hover:text-gray-700">Wealth</button>
              <button className="text-gray-500 hover:text-gray-700">Goals</button>
              <button className="text-gray-500 hover:text-gray-700">Expenses</button>
            </nav>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <User className="text-gray-600" size={24} />
          </button>
        </div>

        {/* Net Worth Card */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-2">₹77,50,000</h2>
            <p className="text-gray-500 text-lg mb-4">Total Net Worth</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-600 font-semibold text-lg">+4.2%</span>
              <span className="text-gray-500">This Month</span>
              <span className="text-green-600">↑</span>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Insights</h3>
          
          <div className="space-y-4">
            {/* Insight 1 */}
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-gray-900">
                  Net worth increased by <span className="font-semibold">₹50,000</span> this month
                </p>
                <span className="text-xs text-gray-500 mt-1 inline-block">Compared to last month</span>
              </div>
            </div>

            {/* Insight 2 */}
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
              <AlertCircle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-gray-900">
                  Monthly expenses were <span className="font-semibold">₹13,000</span> higher than last month.
                </p>
                <span className="text-xs text-gray-500 mt-1 inline-block">Compared to last month</span>
              </div>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-gray-700 leading-relaxed">
                Overall, this month saw steady growth in assets with a noticeable rise in spending.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
