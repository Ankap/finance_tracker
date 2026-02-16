import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Lightbulb, MoreVertical, X, Info, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [showHealthModal, setShowHealthModal] = useState(false);

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

  // Calculate individual component scores for modal display
  const savingsScore = calculateSavingsScore(savingsRate);
  const goalScore = calculateGoalScore(goalsSummary);
  const diversificationScore = calculateDiversificationScore(netWorthData?.breakdown);
  const expenseScore = calculateExpenseScore(income, expenses);
  const growthScore = calculateGrowthScore(growth.netWorthChangePercentage || 0);

  // Calculate percentage changes for monthly snapshot
  // TODO: Replace dummy data with actual API data when available
  const incomeChange = growth.incomeChange || 0;
  const incomeChangePercentage = growth.incomeChangePercentage || 5.2; // Dummy data
  const expenseChange = growth.expenseChange || 0;
  const expenseChangePercentage = growth.expenseChangePercentage || -3.1; // Dummy data
  const savingsRateChange = growth.savingsRateChange || 2.5; // Dummy data
  const savingsAmountChange = growth.savingsAmountChange || 0;
  const savingsAmountChangePercentage = growth.savingsAmountChangePercentage || 8.7; // Dummy data

  // Helper function to render change indicator
  const renderChangeIndicator = (changePercentage, value = null) => {
    if (changePercentage === 0 || changePercentage === null || changePercentage === undefined) {
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <Minus size={14} />
          <span className="text-xs">0%</span>
        </div>
      );
    }

    const isPositive = changePercentage > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
      <div className={`flex items-center gap-1 ${color} ${bgColor} px-2 py-0.5 rounded`}>
        <Icon size={14} />
        <span className="text-xs font-medium">
          {Math.abs(changePercentage).toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Financial Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${status.color} rounded-full flex items-center justify-center`}>
                  <Info className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Financial Health Score</h2>
                  <p className="text-sm text-gray-500">Understanding your {healthScore}/100 score</p>
                </div>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="text-gray-500" size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Overall Status */}
              <div className={`${status.color} bg-opacity-10 border-2 border-${status.color} rounded-xl p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Your Status</p>
                    <p className={`text-2xl font-bold ${status.textColor}`}>{status.label}</p>
                  </div>
                  <div className={`text-4xl font-bold ${status.textColor}`}>{healthScore}/100</div>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Info size={18} />
                  How is this calculated?
                </h3>
                <p className="text-sm text-blue-800">
                  Your financial health score is calculated by analyzing 5 key areas of your finances. Each area contributes a specific percentage to your overall score.
                </p>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Score Breakdown</h3>

                {/* Savings Rate */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                      <h4 className="font-semibold text-gray-900">Savings Rate</h4>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">30% weight</span>
                    </div>
                    <span className="font-bold text-teal-600">{savingsScore.toFixed(0)}/100</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Your current savings rate: <span className="font-semibold">{savingsRate.toFixed(0)}%</span></p>
                  <div className="bg-gray-100 rounded-full h-2 mb-2">
                    <div className="bg-teal-600 rounded-full h-2" style={{ width: `${savingsScore}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {savingsRate >= 50 ? 'Excellent! You\'re saving 50% or more.' :
                     savingsRate >= 30 ? 'Great job! Aim for 50% for an excellent score.' :
                     savingsRate >= 20 ? 'Good start. Try to reach 30% for better health.' :
                     'Consider increasing your savings to at least 20% of income.'}
                  </p>
                </div>

                {/* Goals Progress */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <h4 className="font-semibold text-gray-900">Goals Progress</h4>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">20% weight</span>
                    </div>
                    <span className="font-bold text-blue-600">{goalScore.toFixed(0)}/100</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {goalsSummary?.total > 0
                      ? `${(goalsSummary.onTrack || 0) + (goalsSummary.completed || 0) + (goalsSummary.ahead || 0)} of ${goalsSummary.total} goals on track`
                      : 'No goals set yet'}
                  </p>
                  <div className="bg-gray-100 rounded-full h-2 mb-2">
                    <div className="bg-blue-600 rounded-full h-2" style={{ width: `${goalScore}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {goalsSummary?.total === 0 ? 'Set financial goals to improve this score.' :
                     goalScore >= 80 ? 'Excellent goal management!' :
                     'Keep working on your goals to improve this score.'}
                  </p>
                </div>

                {/* Diversification */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <h4 className="font-semibold text-gray-900">Asset Diversification</h4>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">15% weight</span>
                    </div>
                    <span className="font-bold text-purple-600">{diversificationScore.toFixed(0)}/100</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    You have {Object.keys(netWorthData?.breakdown || {}).length} asset types
                  </p>
                  <div className="bg-gray-100 rounded-full h-2 mb-2">
                    <div className="bg-purple-600 rounded-full h-2" style={{ width: `${diversificationScore}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {diversificationScore >= 100 ? 'Excellent diversification across 5+ asset types!' :
                     diversificationScore >= 60 ? 'Good spread. Consider adding more asset types.' :
                     'Diversify across more asset types to reduce risk.'}
                  </p>
                </div>

                {/* Expense Control */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      <h4 className="font-semibold text-gray-900">Expense Control</h4>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">15% weight</span>
                    </div>
                    <span className="font-bold text-orange-600">{expenseScore.toFixed(0)}/100</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Expenses are {income > 0 ? ((expenses / income) * 100).toFixed(0) : 0}% of income
                  </p>
                  <div className="bg-gray-100 rounded-full h-2 mb-2">
                    <div className="bg-orange-600 rounded-full h-2" style={{ width: `${expenseScore}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {expenseScore >= 100 ? 'Excellent! Expenses under 30% of income.' :
                     expenseScore >= 60 ? 'Good control. Keep expenses below 50%.' :
                     'Try to reduce expenses relative to your income.'}
                  </p>
                </div>

                {/* Wealth Growth */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <h4 className="font-semibold text-gray-900">Wealth Growth</h4>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">20% weight</span>
                    </div>
                    <span className="font-bold text-green-600">{growthScore.toFixed(0)}/100</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Net worth changed by {growth.netWorthChangePercentage > 0 ? '+' : ''}{(growth.netWorthChangePercentage || 0).toFixed(1)}% this month
                  </p>
                  <div className="bg-gray-100 rounded-full h-2 mb-2">
                    <div className="bg-green-600 rounded-full h-2" style={{ width: `${growthScore}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {growthScore >= 100 ? 'Excellent! Growing over 5% monthly.' :
                     growthScore >= 60 ? 'Positive growth. Keep it up!' :
                     growthScore >= 40 ? 'Small growth is still progress.' :
                     'Focus on growing your net worth consistently.'}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-sm text-gray-700">
                  Your overall score of <span className="font-bold">{healthScore}/100</span> is calculated by combining these 5 areas with their respective weights.
                  Focus on improving the areas with lower scores to boost your overall financial health.
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowHealthModal(false)}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Health & Monthly Snapshot */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Financial Health Score */}
          <button
            onClick={() => setShowHealthModal(true)}
            className="flex items-center gap-6 hover:bg-gray-50 p-4 rounded-xl transition-colors cursor-pointer"
          >
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
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Health: <span className={status.textColor}>{healthScore}/100</span></h3>
              <div className={`${status.color} text-white px-8 py-3 rounded-lg inline-block font-medium`}>{status.label}</div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Info size={14} />
                Click to see how this is calculated
              </p>
            </div>
          </button>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-gray-200 self-stretch"></div>
          <div className="lg:hidden w-full border-t border-gray-200"></div>

          {/* Monthly Snapshot */}
          <div className="flex-1 w-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-teal-100 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Monthly Snapshot</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 flex-1 content-center">
              {/* Income */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Income:</span>
                <span className="font-semibold text-gray-900">{formatFullCurrency(income)}</span>
                {renderChangeIndicator(incomeChangePercentage)}
              </div>

              {/* Expenses */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Expenses:</span>
                <span className="font-semibold text-gray-900">{formatFullCurrency(expenses)}</span>
                {renderChangeIndicator(expenseChangePercentage)}
              </div>

              {/* Savings Rate */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Savings Rate:</span>
                <span className="font-semibold text-gray-900">{savingsRate.toFixed(0)}%</span>
                {renderChangeIndicator(savingsRateChange)}
              </div>

              {/* Savings */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Savings:</span>
                <span className="font-semibold text-gray-900">{formatFullCurrency(savingsAmount)}</span>
                {renderChangeIndicator(savingsAmountChangePercentage)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Worth Chart & Key Insights - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Net Worth Card with Chart - Left Half */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">{formatFullCurrency(totalNetWorth)}</h2>
                <p className="text-gray-500 text-base">Total Net Worth</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="text-gray-400" size={20} />
              </button>
            </div>

            {/* Chart */}
            <div className="relative h-40 mb-6">
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
                  <svg className="w-full h-full" viewBox="0 0 600 160">
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
                <div className="absolute top-2 right-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs text-gray-700">
                    {growth.netWorthChange > 0 ? `+${formatCurrency(growth.netWorthChange)}` : 'Highest!'}
                  </span>
                </div>
              )}
            </div>

            {/* Time Periods */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {['1M', '3M', '6M', '1Y', 'All'].map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    selectedPeriod === period
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* View Assets Link */}
            <Link
              to="/wealth"
              className="flex items-center justify-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors group"
            >
              <span>View all assets</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Key Insights - Right Half */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="text-gray-700" size={24} />
              <h3 className="text-xl font-semibold text-gray-900">Key Insights</h3>
            </div>
            <div className="space-y-3">
              {(() => {
                const insights = [];

                // Insight 1: Net Worth Change
                if (growth.netWorthChange !== 0) {
                  insights.push(
                    <div key="networth" className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${growth.netWorthChange >= 0 ? 'bg-teal-100' : 'bg-orange-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        {growth.netWorthChange >= 0 ? <CheckCircle className="text-teal-600" size={16} /> : <AlertCircle className="text-orange-500" size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Net worth {growth.netWorthChange >= 0 ? 'increased' : 'decreased'} by <span className="font-semibold">{formatCurrency(Math.abs(growth.netWorthChange))}</span>
                          {growth.netWorthChangePercentage ? ` (${growth.netWorthChangePercentage > 0 ? '+' : ''}${growth.netWorthChangePercentage.toFixed(1)}%)` : ''}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Insight 2: Expense Change
                if (growth.expenseChange !== 0) {
                  insights.push(
                    <div key="expense" className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${growth.expenseChange <= 0 ? 'bg-teal-100' : 'bg-orange-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        {growth.expenseChange <= 0 ? <CheckCircle className="text-teal-600" size={16} /> : <AlertCircle className="text-orange-500" size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Expenses were <span className="font-semibold">{formatCurrency(Math.abs(growth.expenseChange))}</span> {growth.expenseChange > 0 ? 'higher' : 'lower'} than last month
                        </p>
                      </div>
                    </div>
                  );
                }

                // Insight 3: Savings Rate
                insights.push(
                  <div key="savings" className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${savingsRate >= 30 ? 'bg-teal-100' : 'bg-orange-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {savingsRate >= 30 ? <CheckCircle className="text-teal-600" size={16} /> : <AlertCircle className="text-orange-500" size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {savingsRate >= 30
                          ? `Great job! Saving ${savingsRate.toFixed(0)}% of income this month.`
                          : `Savings rate is ${savingsRate.toFixed(0)}%. Aim for at least 30%.`}
                      </p>
                    </div>
                  </div>
                );

                // Insight 4: Goals Behind
                if (goalsSummary && goalsSummary.behind > 0) {
                  insights.push(
                    <div key="goals" className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertCircle className="text-orange-500" size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          {goalsSummary.behind} of {goalsSummary.total} goals behind schedule
                        </p>
                      </div>
                    </div>
                  );
                }

                // Insight 5: Asset Diversification
                const assetTypes = Object.keys(netWorthData?.breakdown || {}).length;
                insights.push(
                  <div key="diversification" className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${assetTypes >= 5 ? 'bg-teal-100' : 'bg-blue-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <CheckCircle className={assetTypes >= 5 ? 'text-teal-600' : 'text-blue-600'} size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {assetTypes >= 5
                          ? `Excellent diversification across ${assetTypes} asset types`
                          : `Portfolio spread across ${assetTypes} asset type${assetTypes !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                );

                // Show max 5 insights
                return insights.slice(0, 5);
              })()}
            </div>

            {/* View All Link */}
            <Link
              to="/ai-summary"
              className="mt-6 flex items-center justify-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors group"
            >
              <span>View all insights</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
