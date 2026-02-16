import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Target, AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { assetsAPI, snapshotsAPI, goalsAPI } from '../services/api';
import { formatFullCurrency, formatCurrency } from '../utils/formatters';

const AISummary = () => {
  const [loading, setLoading] = useState(true);
  const [snapshotData, setSnapshotData] = useState(null);
  const [goalsSummary, setGoalsSummary] = useState(null);
  const [netWorthData, setNetWorthData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [snapshotRes, goalsRes, netWorthRes] = await Promise.all([
          snapshotsAPI.getLatest(),
          goalsAPI.getSummary(),
          assetsAPI.getNetWorth(),
        ]);
        setSnapshotData(snapshotRes.data);
        setGoalsSummary(goalsRes.data);
        setNetWorthData(netWorthRes.data);
      } catch (error) {
        console.error('Error fetching AI summary data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  const snapshot = snapshotData?.snapshot || {};
  const growth = snapshotData?.growth || {};
  const totalNetWorth = netWorthData?.totalNetWorth || 0;
  const income = snapshot.income?.total || 0;
  const expenses = snapshot.expenses?.total || 0;
  const savingsRate = snapshot.savings?.rate || 0;
  const savingsAmount = snapshot.savings?.amount || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Sparkles className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Summary</h1>
          <p className="text-gray-500">Comprehensive insights across your finances</p>
        </div>
      </div>

      {/* Wealth Overview Insights */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-teal-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Wealth Overview Insights</h2>
        </div>
        <div className="space-y-4">
          {growth.netWorthChange !== 0 && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 ${growth.netWorthChange >= 0 ? 'bg-teal-100' : 'bg-red-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                {growth.netWorthChange >= 0 ? <ArrowUpRight className="text-teal-600" size={20} /> : <ArrowDownRight className="text-red-600" size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Net Worth Movement</h3>
                <p className="text-gray-700">
                  Your net worth {growth.netWorthChange >= 0 ? 'increased' : 'decreased'} by <span className="font-semibold">{formatCurrency(Math.abs(growth.netWorthChange))}</span> this month
                  {growth.netWorthChangePercentage ? ` (${growth.netWorthChangePercentage > 0 ? '+' : ''}${growth.netWorthChangePercentage.toFixed(1)}%)` : ''}.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {growth.netWorthChange >= 0
                    ? 'This positive trend indicates healthy financial growth. Keep up the momentum by maintaining your savings discipline and investment strategy.'
                    : 'While this represents a decrease, temporary fluctuations are normal. Focus on your long-term goals and consider reviewing your expense patterns.'}
                </p>
              </div>
            </div>
          )}

          {netWorthData?.breakdown && Object.keys(netWorthData.breakdown).length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="text-purple-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Asset Diversification</h3>
                <p className="text-gray-700">
                  Your wealth is spread across {Object.keys(netWorthData.breakdown).length} different asset types, with a total net worth of <span className="font-semibold">{formatFullCurrency(totalNetWorth)}</span>.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {Object.keys(netWorthData.breakdown).length >= 5
                    ? 'Excellent diversification! You have a well-balanced portfolio across multiple asset classes, which helps minimize risk.'
                    : Object.keys(netWorthData.breakdown).length >= 3
                    ? 'Good diversification. Consider adding more asset types to further spread your risk and optimize returns.'
                    : 'Your assets are concentrated in fewer categories. Consider diversifying into more asset types like mutual funds, stocks, or fixed deposits to reduce risk.'}
                </p>
              </div>
            </div>
          )}

          {growth.expenseChange !== 0 && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 ${growth.expenseChange <= 0 ? 'bg-teal-100' : 'bg-orange-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                {growth.expenseChange <= 0 ? <CheckCircle className="text-teal-600" size={20} /> : <AlertCircle className="text-orange-500" size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Expense Trends</h3>
                <p className="text-gray-700">
                  Your monthly expenses were <span className="font-semibold">{formatCurrency(Math.abs(growth.expenseChange))}</span> {growth.expenseChange > 0 ? 'higher' : 'lower'} than last month.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {growth.expenseChange > 0
                    ? 'This increase in expenses has impacted your savings. Review your spending categories to identify areas where you can optimize and reduce unnecessary costs.'
                    : 'Great job controlling your expenses! This reduction has positively contributed to your savings this month. Try to maintain this discipline.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Savings & Income Insights */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Savings & Income Analysis</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className={`w-10 h-10 ${savingsRate >= 30 ? 'bg-teal-100' : 'bg-orange-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
              {savingsRate >= 30 ? <CheckCircle className="text-teal-600" size={20} /> : <AlertCircle className="text-orange-500" size={20} />}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Savings Performance</h3>
              <p className="text-gray-700">
                You're saving <span className="font-semibold">{savingsRate.toFixed(0)}%</span> of your income this month, which amounts to <span className="font-semibold">{formatFullCurrency(savingsAmount)}</span>.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {savingsRate >= 50
                  ? 'Outstanding! You\'re saving 50% or more of your income. This exceptional savings rate will help you achieve your financial goals much faster.'
                  : savingsRate >= 30
                  ? 'Great savings discipline! You\'re on track with a healthy 30%+ savings rate. To further accelerate your wealth building, aim for 40-50%.'
                  : savingsRate >= 20
                  ? 'Good start with a 20%+ savings rate. Try to gradually increase this to 30% or more by optimizing expenses or increasing income streams.'
                  : 'Your savings rate is below the recommended 20%. Consider reviewing your budget to find opportunities to reduce expenses and increase savings.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Income vs Expenses Ratio</h3>
              <p className="text-gray-700">
                With an income of <span className="font-semibold">{formatFullCurrency(income)}</span> and expenses of <span className="font-semibold">{formatFullCurrency(expenses)}</span>, your expense ratio is <span className="font-semibold">{income > 0 ? ((expenses / income) * 100).toFixed(0) : 0}%</span>.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {income > 0 && (expenses / income) * 100 < 30
                  ? 'Excellent expense control! You\'re keeping expenses well below 30% of income, which gives you significant room for savings and investments.'
                  : income > 0 && (expenses / income) * 100 < 50
                  ? 'Good balance between income and expenses. Aim to keep expenses below 50% to maintain healthy savings.'
                  : income > 0 && (expenses / income) * 100 < 70
                  ? 'Your expenses are taking up a significant portion of your income. Look for opportunities to reduce non-essential spending.'
                  : 'Your expenses are consuming most of your income. It\'s important to create a budget and identify areas where you can cut back to improve your financial health.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Insights */}
      {goalsSummary && goalsSummary.total > 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Goals Progress</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 ${goalsSummary.behind > 0 ? 'bg-orange-100' : 'bg-teal-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                {goalsSummary.behind > 0 ? <AlertCircle className="text-orange-500" size={20} /> : <CheckCircle className="text-teal-600" size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Overall Goal Status</h3>
                <p className="text-gray-700">
                  You have <span className="font-semibold">{goalsSummary.total} goals</span> in total.
                  {goalsSummary.onTrack > 0 && ` ${goalsSummary.onTrack} on track,`}
                  {goalsSummary.ahead > 0 && ` ${goalsSummary.ahead} ahead of schedule,`}
                  {goalsSummary.completed > 0 && ` ${goalsSummary.completed} completed,`}
                  {goalsSummary.behind > 0 && ` and ${goalsSummary.behind} behind schedule.`}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {goalsSummary.behind > 0
                    ? 'Some goals need attention. Review the behind-schedule goals and consider increasing contributions or adjusting timelines to get back on track.'
                    : 'Excellent goal management! All your goals are either on track, ahead, or completed. Keep maintaining this discipline.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-8 border border-teal-100">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-teal-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
        </div>
        <div className="space-y-3">
          {savingsRate < 30 && (
            <div className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">•</span>
              <p className="text-gray-700">
                <span className="font-semibold">Boost your savings rate:</span> Aim to save at least 30% of your income. Consider automating savings transfers right after receiving income.
              </p>
            </div>
          )}
          {Object.keys(netWorthData?.breakdown || {}).length < 5 && (
            <div className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">•</span>
              <p className="text-gray-700">
                <span className="font-semibold">Diversify your portfolio:</span> Spread investments across different asset classes (stocks, mutual funds, fixed deposits, real estate) to minimize risk.
              </p>
            </div>
          )}
          {growth.expenseChange > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">•</span>
              <p className="text-gray-700">
                <span className="font-semibold">Review expense patterns:</span> Your expenses increased this month. Analyze spending categories and identify areas to optimize.
              </p>
            </div>
          )}
          {goalsSummary?.behind > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-teal-600 mt-1">•</span>
              <p className="text-gray-700">
                <span className="font-semibold">Focus on lagging goals:</span> {goalsSummary.behind} goal{goalsSummary.behind > 1 ? 's are' : ' is'} behind schedule. Consider increasing monthly contributions or adjusting target dates.
              </p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-teal-600 mt-1">•</span>
            <p className="text-gray-700">
              <span className="font-semibold">Build an emergency fund:</span> Ensure you have 6-12 months of expenses saved in a liquid, easily accessible account.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-teal-600 mt-1">•</span>
            <p className="text-gray-700">
              <span className="font-semibold">Review investments quarterly:</span> Regularly assess your portfolio performance and rebalance if needed to maintain your target asset allocation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISummary;
