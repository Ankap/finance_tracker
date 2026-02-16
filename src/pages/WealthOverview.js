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

  const fetchWealthData = useCallback(async () => {
    try {
      setLoading(true);
      const ownerFilter = selectedOwner === 'All' ? null : selectedOwner;
      
      const [assetsResponse, netWorthResponse, insightsResponse] = await Promise.all([
        assetsAPI.getAll(ownerFilter),
        assetsAPI.getNetWorth(),
        insightsAPI.getWealthInsights(),
      ]);

      setAssets(assetsResponse.data);
      setNetWorthData(netWorthResponse.data);
      setWealthInsights(insightsResponse.data);
    } catch (error) {
      console.error('Error fetching wealth data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOwner]);

  useEffect(() => {
    fetchWealthData();
  }, [fetchWealthData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  const chartData = netWorthData?.breakdown
    ? Object.entries(netWorthData.breakdown).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const COLORS = ['#5f6f5f', '#7d8d7d', '#a3afa3', '#c7cfc7', '#86efac', '#4ade80'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Wealth Overview</h2>
          <p className="text-gray-500 mt-1">Track your assets and investments</p>
        </div>

        {/* Owner Filter */}
        <div className="flex gap-2">
          {['All', 'Joint', 'Anurag', 'Nidhi'].map((owner) => (
            <button
              key={owner}
              onClick={() => setSelectedOwner(owner)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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

      {/* Total Net Worth */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Net</h3>
        <p className="text-4xl font-bold text-gray-900">
          {formatCurrency(netWorthData?.totalNetWorth || 0, true)}
        </p>
      </div>

      {/* Asset Breakdown Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Asset Allocation</h3>
          <BarChart3 className="text-sage-600" size={24} />
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value) => formatCurrency(value, true)}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Analysis */}
      {wealthInsights?.topPerformers && wealthInsights.topPerformers.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-sage-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">AI Analysis</h3>
          </div>

          <div className="space-y-4">
            {wealthInsights.topPerformers.map((performer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getAssetIcon(performer.name)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{performer.name}</p>
                    <p className="text-sm text-gray-600">
                      Growth: {formatCurrency(performer.growth)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp size={20} />
                    <span className="font-semibold">
                      {formatPercentage(performer.percentage)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Assets</h3>

        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center text-2xl">
                  {getAssetIcon(asset.name)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                  <p className="text-sm text-gray-500">{asset.accountDetails || asset.owner}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(asset.currentValue, true)}
                </p>
                {asset.monthlySnapshots && asset.monthlySnapshots.length > 0 && (
                  <p className={`text-sm ${
                    asset.monthlySnapshots[asset.monthlySnapshots.length - 1].returnPercentage >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
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
  );
};

export default WealthOverview;
