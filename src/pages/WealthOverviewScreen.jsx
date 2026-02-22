import React, { useState, useEffect } from 'react';
import { Sparkles, User, Home as HomeIcon, Plane, Shield, ChevronRight, Plus } from 'lucide-react';
import { snapshotsAPI } from '../services/api';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/formatters';

const goals = [
  {
    icon: <Shield size={16} className="text-teal-600" />,
    iconBg: 'bg-teal-50',
    name: 'Emergency Fund',
    current: 519000,
    target: 519000,
    progress: 100,
    status: 'Completed',
    statusColor: 'bg-green-100 text-green-700',
    barColor: 'bg-green-500',
  },
  {
    icon: <HomeIcon size={16} className="text-blue-600" />,
    iconBg: 'bg-blue-50',
    name: 'New Home',
    current: 850000,
    target: 800000,
    progress: 106,
    status: 'Ahead',
    statusColor: 'bg-teal-100 text-teal-700',
    barColor: 'bg-teal-500',
  },
  {
    icon: <Plane size={16} className="text-orange-600" />,
    iconBg: 'bg-orange-50',
    name: 'Travel Fund',
    current: 700000,
    target: 500000,
    progress: 140,
    status: 'Ahead',
    statusColor: 'bg-teal-100 text-teal-700',
    barColor: 'bg-teal-500',
  },
];

const assets = [
  { name: 'Bank Savings', subtitle: 'HDFC Savings Account', amount: 550000, icon: '🏦', color: 'bg-teal-50' },
  { name: 'EPF', subtitle: 'Dla Nob 22', amount: 320000, change: '-₹9,000', icon: '🏛️', color: 'bg-gray-100' },
  { name: 'Fixed Deposits', subtitle: 'Tate alc', amount: 200000, change: '~₹39,000', icon: '📊', color: 'bg-orange-50' },
];

const WealthOverviewScreen = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedRange, setSelectedRange] = useState('1Y');

  useEffect(() => {
    let mounted = true;
    snapshotsAPI.getAll().then(res => {
      if (!mounted) return;
      setSnapshots(res.data || []);
    }).catch(err => console.error(err));
    return () => { mounted = false; };
  }, []);

  const chartData = (() => {
    if (!snapshots || snapshots.length === 0) return [];
    const sorted = [...snapshots].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1] ? new Date(sorted[sorted.length - 1].date) : new Date();
    let filtered = sorted;
    if (selectedRange === 'YTD') {
      const start = new Date(latest.getFullYear(), 0, 1);
      filtered = sorted.filter(s => new Date(s.date) >= start);
    } else if (selectedRange !== 'All') {
      const monthsMap = { '3M': 3, '6M': 6, '1Y': 12 };
      const months = monthsMap[selectedRange] || 12;
      const lower = new Date(latest);
      lower.setMonth(lower.getMonth() - (months - 1));
      filtered = sorted.filter(s => new Date(s.date) >= lower);
    }
    return filtered.map(s => ({
      date: new Date(s.date).toLocaleString('en-IN', { month: 'short' }),
      netWorth: s.netWorth || s.totalAssets || 0,
    }));
  })();

  const completedCount = goals.filter(g => g.progress >= 100).length;

  return (
    <div className="h-screen bg-gray-50 p-4 overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold text-gray-900">Wealth Overview</h1>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <button className="hover:text-gray-800">Dashboard</button>
              <button className="text-gray-900 font-medium border-b-2 border-gray-900 pb-0.5">Wealth</button>
              <button className="hover:text-gray-800">Goals</button>
              <button className="hover:text-gray-800">Expenses</button>
            </nav>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-md">
            <User className="text-gray-600" size={20} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Left column: wealth content */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">

            {/* Total Net */}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-xs text-gray-500">Total Net Worth</p>
                <p className="text-2xl font-bold text-gray-900">₹12,50,000</p>
              </div>
              <div className="text-xs text-gray-400">Updated: Apr 2026</div>
            </div>

            {/* Chart + AI */}
            <div className="bg-white rounded-2xl p-3 shadow-sm flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Net Worth</h3>
                <div className="flex gap-1">
                  {['3M', '6M', 'YTD', '1Y', 'All'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRange(r)}
                      className={`px-2 py-0.5 rounded-md text-xs font-medium ${selectedRange === r ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} width={55} />
                    <Tooltip formatter={(value) => formatCurrency(value, true)} />
                    <Line type="monotone" dataKey="netWorth" stroke="#0f766e" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2 flex items-start gap-2">
                <Sparkles className="text-teal-600 flex-shrink-0 mt-0.5" size={14} />
                <p className="text-xs text-gray-600">Most growth from mutual funds · Fixed deposits up ₹1,10,000</p>
              </div>
            </div>

            {/* Assets */}
            <div className="bg-white rounded-2xl p-3 shadow-sm flex-1 min-h-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Assets</h3>
              <div className="space-y-2">
                {assets.map((asset, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${asset.color} rounded-full flex items-center justify-center text-base`}>
                      {asset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                      <p className="text-xs text-gray-400 truncate">{asset.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">₹{(asset.amount / 1000).toLocaleString('en-IN')}K</p>
                      {asset.change && <p className="text-xs text-gray-400">{asset.change}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">Combined Total</p>
                <p className="text-sm font-bold text-gray-900">₹10,70,000</p>
              </div>
            </div>
          </div>

          {/* Right column: Goals snapshot */}
          <aside className="w-72 flex-shrink-0 flex flex-col gap-3">

            {/* Goals header card */}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-xs text-gray-500">Goals</p>
                <p className="text-base font-bold text-gray-900">{completedCount} of {goals.length} completed</p>
              </div>
              <button className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium">
                View All <ChevronRight size={14} />
              </button>
            </div>

            {/* Goal cards */}
            <div className="flex flex-col gap-3 flex-1">
              {goals.map((goal, i) => (
                <button
                  key={i}
                  className="bg-white rounded-2xl p-4 shadow-sm text-left hover:shadow-md hover:ring-1 hover:ring-teal-100 transition-all group w-full"
                  onClick={() => {/* navigate to Goals */}}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 ${goal.iconBg} rounded-full flex items-center justify-center`}>
                        {goal.icon}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{goal.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${goal.statusColor}`}>
                        {goal.status}
                      </span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full ${goal.barColor} transition-all`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      ₹{(goal.current / 100000).toFixed(2)}L saved
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {Math.min(goal.progress, 100)}% of ₹{(goal.target / 100000).toFixed(2)}L
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Add goal */}
            <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors flex-shrink-0">
              <Plus size={14} />
              Add Goal
            </button>

          </aside>
        </div>
      </div>
    </div>
  );
};

export default WealthOverviewScreen;
