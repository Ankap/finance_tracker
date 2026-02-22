import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, BarChart3, Sparkles } from 'lucide-react';
import { assetsAPI, insightsAPI } from '../services/api';
import { formatCurrency, formatPercentage, getAssetIcon } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const WealthOverview = () => {
  const [assets, setAssets] = useState([]);
  const [netWorthData, setNetWorthData] = useState(null);
  const [wealthInsights, setWealthInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const ownerFilter = selectedOwner === 'All' ? null : selectedOwner;
      const [assetsRes, netWorthRes, insightsRes] = await Promise.all([
        assetsAPI.getAll(ownerFilter),
        assetsAPI.getNetWorth(ownerFilter),
        insightsAPI.getWealthInsights(),
      ]);
      setAssets(assetsRes.data);
      setNetWorthData(netWorthRes.data);
      setWealthInsights(insightsRes.data);
    } catch (error) {
      console.error('Error fetching wealth data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  const chartData = netWorthData?.breakdown
    ? Object.entries(netWorthData.breakdown).map(([name, value]) => ({ name, value }))
    : [];

  const COLORS = ['#5f6f5f', '#7d8d7d', '#a3afa3', '#c7cfc7', '#86efac', '#4ade80'];

  return (
    /* Layout's main already has py-8 (64px) + sticky header (~73px) ≈ 137px consumed */
    <div className="flex flex-col gap-3">

      {/* Owner filter row */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wealth Overview</h2>
          <p className="text-gray-500 text-sm">Track your assets and investments</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Joint', 'Anurag', 'Nidhi'].map((owner) => (
            <button
              key={owner}
              onClick={() => setSelectedOwner(owner)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedOwner === owner
                  ? 'bg-sage-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {owner}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">

          {/* Net Worth */}
          <div className="card flex items-center justify-between py-3 flex-shrink-0">
            <div>
              <p className="text-sm text-gray-500">Total Net Worth</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(netWorthData?.totalNetWorth || 0, true)}
              </p>
            </div>
            {wealthInsights?.topPerformers?.[0] && (
              <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
                <TrendingUp size={16} />
                <span className="text-sm font-semibold">
                  {formatPercentage(wealthInsights.topPerformers[0].percentage)} this month
                </span>
              </div>
            )}
          </div>

          {/* Asset Allocation Chart */}
          <div className="card flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Asset Allocation</h3>
              <BarChart3 className="text-sage-600" size={16} />
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} width={55} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value, true)}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AI insight inline */}
            {wealthInsights?.topPerformers?.length > 0 && (
              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
                <Sparkles className="text-sage-600 flex-shrink-0" size={13} />
                <p className="text-xs text-gray-600">
                  Top performer: <span className="font-medium">{wealthInsights.topPerformers[0].name}</span>
                  {' '}· {formatCurrency(wealthInsights.topPerformers[0].growth)} growth
                </p>
              </div>
            )}
          </div>

          {/* Assets List */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Assets</h3>
            <div className="space-y-2">
              {assets.map((asset) => (
                <div
                  key={asset._id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-sage-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                    {getAssetIcon(asset.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{asset.name}</p>
                    <p className="text-xs text-gray-500 truncate">{asset.accountDetails || asset.owner}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(asset.currentValue, true)}
                    </p>
                    {asset.monthlySnapshots?.length > 0 && (
                      <p className={`text-xs ${
                        asset.monthlySnapshots[asset.monthlySnapshots.length - 1].returnPercentage >= 0
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {asset.monthlySnapshots[asset.monthlySnapshots.length - 1].returnPercentage >= 0 ? '+' : ''}
                        {formatPercentage(asset.monthlySnapshots[asset.monthlySnapshots.length - 1].returnPercentage)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default WealthOverview;
