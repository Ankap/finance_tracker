import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Lightbulb, MoreVertical } from 'lucide-react';
import { assetsAPI, snapshotsAPI, goalsAPI } from '../services/api';
import { formatFullCurrency, formatCurrency } from '../utils/formatters';

// --- Financial Health Score Calculation ---

const calculateSavingsScore = (savingsRate) => {
  if (savingsRate >= 50) return 100;
  if (savingsRate >= 30) return 70 + ((savingsRate - 30) / 20) * 30;
  if (savingsRate >= 20) return 40 + ((savingsRate - 20) / 10) * 30;
  if (savingsRate >= 10) return 20 + ((savingsRate - 10) / 10) * 20;
  return (savingsRate / 10) * 20;
};

const calculateGoalScore = (goalsSummary) => {
  if (!goalsSummary || goalsSummary.total === 0) return 50;
  const goodGoals = (goalsSummary.onTrack || 0) + (goalsSummary.completed || 0) + (goalsSummary.ahead || 0);
  return (goodGoals / goalsSummary.total) * 100;
};

const calculateDiversificationScore = (breakdown) => {
  if (!breakdown) return 0;
  const count = Object.keys(breakdown).length;
  if (count >= 5) return 100;
  if (count === 4) return 80;
  if (count === 3) return 60;
  if (count === 2) return 40;
  return 20;
};

const calculateExpenseScore = (income, expenses) => {
  if (!income || income === 0) return 50;
  const ratio = (expenses / income) * 100;
  if (ratio < 30) return 100;
  if (ratio < 50) return 80;
  if (ratio < 70) return 60;
  if (ratio < 90) return 40;
  return 20;
};

const calculateGrowthScore = (growthPercentage) => {
  if (growthPercentage > 5) return 100;
  if (growthPercentage > 2) return 80;
  if (growthPercentage > 0) return 60;
  if (growthPercentage > -2) return 40;
  return 20;
};

const calculateHealthScore = (snapshotData, goalsSummary, netWorthData) => {
  const savingsRate = snapshotData?.snapshot?.savings?.rate || 0;
  const income = snapshotData?.snapshot?.income?.total || 0;
  const expenses = snapshotData?.snapshot?.expenses?.total || 0;
  const growthPct = snapshotData?.growth?.netWorthChangePercentage || 0;
  const breakdown = netWorthData?.breakdown || {};

  const savingsScore = calculateSavingsScore(savingsRate);
  const goalScore = calculateGoalScore(goalsSummary);
  const diversificationScore = calculateDiversificationScore(breakdown);
  const expenseScore = calculateExpenseScore(income, expenses);
  const growthScore = calculateGrowthScore(growthPct);

  const total = Math.round(
    savingsScore * 0.30 +
    goalScore * 0.20 +
    diversificationScore * 0.15 +
    expenseScore * 0.15 +
    growthScore * 0.20
  );

  return Math.min(100, Math.max(0, total));
};

const getStatusInfo = (score) => {
  if (score >= 86) return { label: 'Excellent', color: 'bg-green-600', textColor: 'text-green-700', ringColor: '#16a34a' };
  if (score >= 76) return { label: 'Stable', color: 'bg-teal-600', textColor: 'text-teal-700', ringColor: '#5F9B95' };
  if (score >= 61) return { label: 'Good', color: 'bg-blue-600', textColor: 'text-blue-700', ringColor: '#2563eb' };
  if (score >= 41) return { label: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-600', ringColor: '#f97316' };
  return { label: 'Needs Attention', color: 'bg-red-500', textColor: 'text-red-600', ringColor: '#ef4444' };
};

// --- Component ---

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [snapshotData, setSnapshotData] = useState(null);
  const [goalsSummary, setGoalsSummary] = useState(null);
  const [netWorthData, setNetWorthData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [snapshots, setSnapshots] = useState([]);

  const getDateRange = (period) => {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case '1M': start.setMonth(start.getMonth() - 1); break;
      case '3M': start.setMonth(start.getMonth() - 3); break;
      case '6M': start.setMonth(start.getMonth() - 6); break;
      case '1Y': start.setFullYear(start.getFullYear() - 1); break;
      case 'All': start.setFullYear(2000); break;
      default: start.setFullYear(start.getFullYear() - 1);
    }
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { startDate, endDate } = getDateRange(selectedPeriod);
        const [snapshotRes, goalsRes, netWorthRes, snapshotsRes] = await Promise.all([
          snapshotsAPI.getLatest(),
          goalsAPI.getSummary(),
          assetsAPI.getNetWorth(),
          snapshotsAPI.getAll(startDate, endDate),
        ]);
        setSnapshotData(snapshotRes.data);
        setGoalsSummary(goalsRes.data);
        setNetWorthData(netWorthRes.data);
        setSnapshots(snapshotsRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const generateChartPath = () => {
    if (!snapshots.length) return { linePath: '', areaPath: '', points: [] };
    const sorted = [...snapshots].sort((a, b) => new Date(a.month || a.date) - new Date(b.month || b.date));
    const values = sorted.map(s => s.netWorth?.total || s.netWorth || s.totalAssets || 0);
    const width = 600, height = 160, padding = 10;
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal || 1;

    const pts = values.map((v, i) => ({
      x: padding + (i / Math.max(values.length - 1, 1)) * (width - 2 * padding),
      y: padding + (1 - (v - minVal) / range) * (height - 2 * padding),
      value: v,
      date: sorted[i].date,
    }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L ${pts[pts.length - 1].x},${height} L ${pts[0].x},${height} Z`;
    return { linePath, areaPath, points: pts };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  const healthScore = calculateHealthScore(snapshotData, goalsSummary, netWorthData);
  const status = getStatusInfo(healthScore);

  const snapshot = snapshotData?.snapshot || {};
  const growth = snapshotData?.growth || {};
  const totalNetWorth = netWorthData?.totalNetWorth || 0;
  const income = snapshot.income?.total || 0;
  const expenses = snapshot.expenses?.total || 0;
  const savingsRate = snapshot.savings?.rate || 0;
  const savingsAmount = snapshot.savings?.amount || 0;

  return (
    <div className="space-y-8">
      {/* Financial Health & Monthly Snapshot */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Financial Health Score */}
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r="56" stroke={status.ringColor} strokeWidth="12" fill="none" strokeDasharray={`${(healthScore/100)*352} 352`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{healthScore}</span>
                <span className="text-sm text-gray-500">/100</span>
                <span className="text-xs text-gray-500 mt-1">{status.label}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Health: <span className={status.textColor}>{healthScore}/100</span></h3>
              <div className={`${status.color} text-white px-8 py-3 rounded-lg inline-block font-medium`}>{status.label}</div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-gray-200 self-stretch"></div>
          <div className="lg:hidden w-full border-t border-gray-200"></div>

          {/* Monthly Snapshot */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-teal-100 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Monthly Snapshot</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Income:</span>
                <span className="font-semibold text-gray-900">{formatFullCurrency(income)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Expenses:</span>
                <span className="font-semibold text-gray-900">{formatFullCurrency(expenses)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Savings Rate:</span>
                <span className="font-semibold text-gray-900">{savingsRate.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Savings:</span>
                <span className="font-semibold text-gray-900">{formatFullCurrency(savingsAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
          {/* Net Worth Card with Chart */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-5xl font-bold text-gray-900 mb-2">{formatFullCurrency(totalNetWorth)}</h2>
                <p className="text-gray-500 text-lg">Total Net Worth</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Chart */}
            <div className="relative h-48 mb-6">
              {(() => {
                const { linePath, areaPath, points } = generateChartPath();
                if (!points.length) {
                  return (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No snapshot data for this period
                    </div>
                  );
                }
                return (
                  <svg className="w-full h-full" viewBox="0 0 600 180">
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#86CCC5" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#86CCC5" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#areaGradient)" />
                    <path d={linePath} fill="none" stroke="#5F9B95" strokeWidth="3" strokeLinecap="round" />
                    {points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="4" fill="#5F9B95" />
                    ))}
                  </svg>
                );
              })()}
              {growth.netWorthChange >= 0 && (
                <div className="absolute top-4 right-8 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    {growth.netWorthChange > 0 ? `+${formatCurrency(growth.netWorthChange)} this month` : 'Highest this year!'}
                  </span>
                </div>
              )}
            </div>

            {/* Time Periods */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {['1M', '3M', '6M', '1Y', 'All'].map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    selectedPeriod === period
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

          </div>

          {/* Key Insights - Combined */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="text-gray-700" size={24} />
              <h3 className="text-xl font-semibold text-gray-900">Key Insights</h3>
              <button className="ml-auto p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="text-gray-400" size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {growth.netWorthChange !== 0 && (
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${growth.netWorthChange >= 0 ? 'bg-teal-100' : 'bg-orange-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {growth.netWorthChange >= 0 ? <CheckCircle className="text-teal-600" size={16} /> : <AlertCircle className="text-orange-500" size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">
                      Net worth {growth.netWorthChange >= 0 ? 'increased' : 'decreased'} by <span className="font-semibold">{formatCurrency(Math.abs(growth.netWorthChange))}</span> this month
                      {growth.netWorthChangePercentage ? ` (${growth.netWorthChangePercentage > 0 ? '+' : ''}${growth.netWorthChangePercentage.toFixed(1)}%)` : ''}
                    </p>
                    <span className="text-xs text-gray-500 mt-1 inline-block">Compared to last month.</span>
                  </div>
                </div>
              )}
              {growth.expenseChange !== 0 && (
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${growth.expenseChange <= 0 ? 'bg-teal-100' : 'bg-orange-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {growth.expenseChange <= 0 ? <CheckCircle className="text-teal-600" size={16} /> : <AlertCircle className="text-orange-500" size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">
                      Monthly expenses were <span className="font-semibold">{formatCurrency(Math.abs(growth.expenseChange))}</span> {growth.expenseChange > 0 ? 'higher' : 'lower'} than last month
                    </p>
                    <span className="text-xs text-gray-500 mt-1 inline-block">Compared to last month.</span>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                <div className={`w-8 h-8 ${savingsRate >= 30 ? 'bg-teal-100' : 'bg-orange-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {savingsRate >= 30 ? <CheckCircle className="text-teal-600" size={16} /> : <AlertCircle className="text-orange-500" size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">
                    {savingsRate >= 30
                      ? `Great savings discipline! You're saving ${savingsRate.toFixed(0)}% of your income this month.`
                      : `Your savings rate is ${savingsRate.toFixed(0)}% this month. Consider aiming for at least 30%.`}
                  </p>
                </div>
              </div>
              {goalsSummary && goalsSummary.behind > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="text-orange-500" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">
                      {goalsSummary.behind} of {goalsSummary.total} goals are behind schedule. Review your contributions to stay on track.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
