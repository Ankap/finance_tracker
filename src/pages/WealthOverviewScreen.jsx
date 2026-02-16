import React from 'react';
import { Sparkles, User } from 'lucide-react';

const WealthOverviewScreen = () => {
  const assets = [
    {
      name: 'Bank savemet',
      subtitle: 'HDFC Savings Account',
      amount: 550000,
      icon: '🏦',
      color: 'bg-teal-100'
    },
    {
      name: 'EPF',
      subtitle: 'Dla Nob 22',
      amount: 320000,
      change: '-₹9,000',
      icon: '🏛️',
      color: 'bg-gray-100'
    },
    {
      name: 'Fixed Deposits',
      subtitle: 'Tate alc',
      amount: 200000,
      change: '~39,000',
      icon: '📊',
      color: 'bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-semibold text-gray-900">Wealth Overview</h1>
            <nav className="flex items-center gap-6">
              <button className="text-gray-500 hover:text-gray-700">Dashboard</button>
              <button className="text-gray-900 font-medium border-b-2 border-gray-900 pb-1">
                Wealth
              </button>
              <button className="text-gray-500 hover:text-gray-700">Goals</button>
              <button className="text-gray-500 hover:text-gray-700">Expenses</button>
            </nav>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <User className="text-gray-600" size={24} />
          </button>
        </div>

        {/* Total Net Worth */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <h2 className="text-lg text-gray-600 mb-2">Total Net</h2>
          <p className="text-5xl font-bold text-gray-900">₹12,50,000</p>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          {/* Mini Bar Chart */}
          <div className="flex items-end gap-3 h-32 mb-4">
            {/* Mutual Funds bars */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gray-200 rounded-t" style={{ height: '40%' }}></div>
              <div className="w-full bg-gray-300 rounded-t" style={{ height: '50%' }}></div>
              <div className="w-full bg-teal-600 rounded-t" style={{ height: '60%' }}></div>
            </div>
            
            {/* Spacer */}
            <div className="w-8"></div>
            
            {/* Stocks bars */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-gray-200 rounded-t" style={{ height: '50%' }}></div>
              <div className="w-full bg-gray-300 rounded-t" style={{ height: '65%' }}></div>
              <div className="w-full bg-teal-700 rounded-t" style={{ height: '80%' }}></div>
              <div className="w-full bg-teal-800 rounded-t" style={{ height: '100%' }}></div>
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-600 mb-8">
            <div className="text-center">
              <p>Mutual Funds</p>
              <p className="font-semibold text-gray-900">₹41,000</p>
            </div>
            <div className="text-center">
              <p>Stocks</p>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-teal-600" size={20} />
              <h3 className="font-semibold text-gray-900">AI Analysis</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-1">•</span>
                <p className="text-gray-700">
                  Most of the growth this month came from your mutual funds increasing in value by ₹59,000
                </p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-1">•</span>
                <p className="text-gray-700">
                  Fixed deposits also grew as you added ₹1,10,000 this month
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Assets</h3>
          <div className="space-y-4">
            {assets.map((asset, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`w-12 h-12 ${asset.color} rounded-full flex items-center justify-center text-2xl`}>
                  {asset.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                  <p className="text-sm text-gray-500">{asset.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₹{(asset.amount / 1000).toLocaleString('en-IN')},000
                  </p>
                  {asset.change && (
                    <p className="text-sm text-gray-500">{asset.change}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-900">Combined Total:</p>
              <p className="text-2xl font-bold text-gray-900">₹2,13,000</p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-teal-600" size={20} />
            <h3 className="font-semibold text-gray-900">AI Summary</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">•</span>
              <p className="text-gray-700">
                Expenses increased by ₹19,000 this month (April) compared
              </p>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">•</span>
              <p className="text-gray-700">
                Mainly driven by a higher than usual credit card bill
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WealthOverviewScreen;
