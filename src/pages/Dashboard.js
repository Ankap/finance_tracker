import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Lightbulb, MoreVertical, X, Info, ArrowRight, TrendingUp, TrendingDown, Minus, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { assetsAPI, snapshotsAPI, goalsAPI, transactionsAPI } from '../services/api';
import { formatFullCurrency, formatCurrency, getGoalIcon } from '../utils/formatters';

// --- Financial Health Score Calculation ---

const calculateSavingsScore = (savingsRate) => {
  if (savingsRate >= 50) return 100;
  if (savingsRate >= 30) return 70 + ((savingsRate - 30) / 20) * 30;
  if (savingsRate >= 20) return 40 + ((savingsRate - 20) / 10) * 30;
  if (savingsRate >= 10) return 20 + ((savingsRate - 10) / 10) * 20;
  return (savingsRate / 10) * 20;
};

const calculateGoalScore = (goalsSummary) => {
  if (!goalsSummary || goalsSummary.total === 0) return 0;
  const goodGoals = (goalsSummary.onTrack || 0) + (goalsSummary.completed || 0) + (goalsSummary.ahead || 0);
  return (goodGoals / goalsSummary.total) * 100;
};

const calculateDiversificationScore = (breakdown) => {
  if (!breakdown) return 0;
  const count = Object.keys(breakdown).length;
  if (count === 0) return 0;
  if (count >= 5) return 100;
  if (count === 4) return 80;
  if (count === 3) return 60;
  if (count === 2) return 40;
  return 20;
};

const calculateExpenseScore = (income, expenses) => {
  if (!income || income === 0) return 0;
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
  const totalNetWorth = netWorthData?.totalNetWorth || 0;

  // Return 0 until the user has entered at least some real data
  const hasData = income > 0 || expenses > 0 || totalNetWorth > 0;
  if (!hasData) return 0;

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [snapshotData, setSnapshotData] = useState(null);
  const [goalsSummary, setGoalsSummary] = useState(null);
  const [netWorthData, setNetWorthData] = useState(null);
  const [goals, setGoals] = useState([]);
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
        const [snapshotRes, goalsRes, netWorthRes, snapshotsRes, allGoalsRes, liveRes] = await Promise.all([
          snapshotsAPI.getLatest(),
          goalsAPI.getSummary(),
          assetsAPI.getNetWorth(),
          snapshotsAPI.getAll(startDate, endDate),
          goalsAPI.getAll(),
          transactionsAPI.getLiveMonthlySummary(),
        ]);
        const live = liveRes.data;
        const baseSnapshot = snapshotRes.data;
        const mergedSnapshot = live ? {
          ...baseSnapshot,
          snapshot: live.snapshot,
          growth: {
            ...baseSnapshot?.growth,
            expenseChange:    live.growth.expenseChange,
            savingsRateChange: live.growth.savingsRateChange,
          },
        } : baseSnapshot;
        setSnapshotData(mergedSnapshot);
        setGoalsSummary(goalsRes.data);
        setNetWorthData(netWorthRes.data);
        setSnapshots(snapshotsRes.data || []);
        setGoals(allGoalsRes.data || []);
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

  const savingsRateChange = growth.savingsRateChange || 0;

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

  const completedGoals = goals.filter(g => g.status === 'Completed').length;

  return (
    <div className="space-y-8">

      {/* Financial Health Modal */}
      {showHealthModal && (() => {
        // Read AI recommendations from the same localStorage cache as AISummary — no API call
        let aiRecommendations = null;
        try {
          const raw = localStorage.getItem('ai_insights_cache');
          if (raw) {
            const cached = JSON.parse(raw);
            if (cached.v === 'v2' && cached.insights?.recommendations?.length) {
              aiRecommendations = cached.insights.recommendations;
            }
          }
        } catch {}

        const scoreRows = [
          { label: 'Savings Rate',        weight: '30%', score: savingsScore,       color: 'bg-teal-500',   tip: savingsRate >= 50 ? null : savingsRate >= 30 ? `Raise savings from ${savingsRate.toFixed(0)}% → 50%` : `Raise savings from ${savingsRate.toFixed(0)}% → 30%` },
          { label: 'Goals Progress',      weight: '20%', score: goalScore,          color: 'bg-blue-500',   tip: goalScore >= 80 ? null : goalsSummary?.total === 0 ? 'Set at least one financial goal' : 'Move more goals to On Track or ahead' },
          { label: 'Asset Diversification', weight: '15%', score: diversificationScore, color: 'bg-purple-500', tip: diversificationScore >= 100 ? null : `Add more asset types (${Object.keys(netWorthData?.breakdown || {}).length}/5)` },
          { label: 'Expense Control',     weight: '15%', score: expenseScore,       color: 'bg-orange-500', tip: expenseScore >= 80 ? null : `Expenses at ${income > 0 ? ((expenses / income) * 100).toFixed(0) : 0}% of income — aim for <50%` },
          { label: 'Wealth Growth',       weight: '20%', score: growthScore,        color: 'bg-green-500',  tip: growthScore >= 80 ? null : 'Keep net worth growing month over month' },
        ];

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${status.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Info className="text-white" size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Financial Health Score</h2>
                    <p className="text-xs text-gray-500">{status.label} · {healthScore}/100</p>
                  </div>
                </div>
                <button onClick={() => setShowHealthModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="text-gray-500" size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">

                {/* Score breakdown — compact */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Score breakdown</p>
                  <div className="space-y-2.5">
                    {scoreRows.map(({ label, weight, score, color, tip }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{label}</span>
                            <span className="text-xs text-gray-400">{weight}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{score.toFixed(0)}/100</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-1.5">
                          <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
                        </div>
                        {tip && <p className="text-xs text-gray-400 mt-0.5">↑ {tip}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations — primary focus */}
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-5 border border-teal-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-teal-600" size={18} />
                      <h3 className="font-semibold text-gray-900">How to Improve Your Score</h3>
                    </div>
                    {aiRecommendations && (
                      <button
                        onClick={() => { setShowHealthModal(false); navigate('/ai-summary'); }}
                        className="text-xs text-teal-600 hover:underline flex items-center gap-1"
                      >
                        Full analysis <ArrowRight size={12} />
                      </button>
                    )}
                  </div>

                  {aiRecommendations ? (
                    <div className="space-y-3">
                      {aiRecommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-teal-700 text-xs font-bold">{i + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{rec.heading}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{rec.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">
                        AI-powered recommendations aren&apos;t generated yet. Visit the AI Summary screen to generate personalised advice based on your data.
                      </p>
                      <button
                        onClick={() => { setShowHealthModal(false); navigate('/ai-summary'); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors"
                      >
                        <Sparkles size={14} />
                        Generate AI Recommendations
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowHealthModal(false)}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-6 rounded-xl font-medium transition-colors text-sm"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Two-column outer layout: left stacks Health+Snapshot then Chart+Insights; right is Goals spanning full height */}
      <div className="flex gap-6 items-stretch">

        {/* Left: stacked rows */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">

          {/* Financial Health + Monthly Snapshot */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Financial Health Score */}
              <button
                onClick={() => setShowHealthModal(true)}
                className="flex items-center gap-6 hover:bg-gray-50 p-4 rounded-xl transition-colors cursor-pointer flex-shrink-0"
              >
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                    {healthScore > 0 && (
                      <circle cx="64" cy="64" r="56" stroke={status.ringColor} strokeWidth="12" fill="none" strokeDasharray={`${(healthScore/100)*352} 352`} strokeLinecap="round" />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {healthScore > 0 ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">{healthScore}</span>
                        <span className="text-sm text-gray-500">/100</span>
                        <span className="text-xs text-gray-500 mt-1">{status.label}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 text-center px-2">No data yet</span>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Financial Health:{' '}
                    <span className={healthScore > 0 ? status.textColor : 'text-gray-400'}>
                      {healthScore > 0 ? `${healthScore}/100` : '—'}
                    </span>
                  </h3>
                  {healthScore > 0 ? (
                    <div className={`${status.color} text-white px-8 py-3 rounded-lg inline-block font-medium`}>{status.label}</div>
                  ) : (
                    <div className="bg-gray-100 text-gray-500 px-8 py-3 rounded-lg inline-block font-medium">Add data to see score</div>
                  )}
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Info size={14} />
                    Click to see how this is calculated
                  </p>
                </div>
              </button>

              <div className="hidden lg:block w-px bg-gray-200 self-stretch"></div>
              <div className="lg:hidden w-full border-t border-gray-200"></div>

              {/* Monthly Snapshot — tighter grid, left-aligned */}
              <div className="flex flex-col justify-center flex-1">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 bg-teal-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Monthly Snapshot</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Income</p>
                    <p className="font-semibold text-gray-900">{formatFullCurrency(income)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Expenses</p>
                    <p className="font-semibold text-gray-900">{formatFullCurrency(expenses)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Savings Rate</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{savingsRate.toFixed(0)}%</p>
                      {renderChangeIndicator(savingsRateChange)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Savings</p>
                    <p className="font-semibold text-gray-900">{formatFullCurrency(savingsAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Worth Chart & Key Insights */}
          <div className="grid grid-cols-2 gap-6 flex-1">

            {/* Net Worth */}
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

              <div className="relative h-40 mb-6">
                {(() => {
                  const { linePath, areaPath, points } = generateChartPath();
                  if (!points.length) {
                    return <div className="flex items-center justify-center h-full text-gray-400">No snapshot data for this period</div>;
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
                      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#5F9B95" />)}
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

              <div className="flex items-center justify-center gap-2 mb-4">
                {['1M', '3M', '6M', '1Y', 'All'].map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      selectedPeriod === period ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              <Link to="/wealth" className="flex items-center justify-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors group">
                <span>View all assets</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Key Insights */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="text-gray-700" size={24} />
                <h3 className="text-xl font-semibold text-gray-900">Key Insights</h3>
              </div>
              <div className="space-y-3">
                {(() => {
                  const insights = [];
                  if (growth.netWorthChange) {
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
                  if (growth.expenseChange) {
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
                  if (income > 0) {
                    insights.push(
                      <div key="savings" className="flex items-start gap-3">
                        <div className={`w-8 h-8 ${savingsRate >= 30 ? 'bg-teal-100' : 'bg-orange-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          {savingsRate >= 30 ? <CheckCircle className="text-teal-600" size={16} /> : <AlertCircle className="text-orange-500" size={16} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {savingsRate >= 30 ? `Great job! Saving ${savingsRate.toFixed(0)}% of income this month.` : `Savings rate is ${savingsRate.toFixed(0)}%. Aim for at least 30%.`}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (goalsSummary && goalsSummary.behind > 0) {
                    insights.push(
                      <div key="goals" className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle className="text-orange-500" size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{goalsSummary.behind} of {goalsSummary.total} goals behind schedule</p>
                        </div>
                      </div>
                    );
                  }
                  const assetTypes = Object.keys(netWorthData?.breakdown || {}).length;
                  if (assetTypes > 0) {
                    insights.push(
                      <div key="diversification" className="flex items-start gap-3">
                        <div className={`w-8 h-8 ${assetTypes >= 5 ? 'bg-teal-100' : 'bg-blue-100'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <CheckCircle className={assetTypes >= 5 ? 'text-teal-600' : 'text-blue-600'} size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {assetTypes >= 5 ? `Excellent diversification across ${assetTypes} asset types` : `Portfolio spread across ${assetTypes} asset type${assetTypes !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (insights.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                        <p className="text-sm text-gray-400">No insights yet.</p>
                        <p className="text-xs text-gray-400">Add income, expenses, and assets to see your personalised insights.</p>
                      </div>
                    );
                  }
                  return insights.slice(0, 5);
                })()}
              </div>
              <Link to="/ai-summary" className="mt-6 flex items-center justify-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors group">
                <span>View all insights</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        </div>

        {/* Right: Goals — spans the full height of both left rows */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Goals</h3>
            <span className="text-sm text-gray-400">{completedGoals}/{goals.length} done</span>
          </div>

          {goals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <p className="text-sm text-gray-500">No goals set yet</p>
              <button onClick={() => navigate('/goals')} className="text-sm text-teal-600 hover:underline">
                Add your first goal →
              </button>
            </div>
          ) : (
            <div className="space-y-5 flex-1">
              {goals.map((goal) => {
                const dotColor = {
                  Completed:  'bg-green-500',
                  Ahead:      'bg-teal-500',
                  'On Track': 'bg-blue-500',
                }[goal.status] || 'bg-orange-400';

                const barColor = {
                  Completed:  'bg-green-500',
                  Ahead:      'bg-teal-500',
                  'On Track': 'bg-blue-500',
                }[goal.status] || 'bg-orange-400';

                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

                const remaining = goal.targetAmount - goal.currentAmount;

                return (
                  <button
                    key={goal._id}
                    onClick={() => navigate('/goals')}
                    className="w-full flex items-start gap-3 group hover:bg-gray-50 rounded-xl px-3 py-2 -mx-3 transition-colors text-left"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{goal.name}</p>
                        <span className="text-xs font-semibold text-gray-500 flex-shrink-0 ml-2">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{formatCurrency(goal.currentAmount, true)} saved</span>
                        {remaining > 0
                          ? <span className="text-xs text-gray-400">{formatCurrency(remaining, true)} left</span>
                          : <span className="text-xs text-green-600 font-medium">Completed!</span>
                        }
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Link to="/goals" className="mt-6 flex items-center justify-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors group">
            <span>View all goals</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default DashboardScreen;
