import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Sparkles, Maximize2, X } from 'lucide-react';
import { assetsAPI } from '../services/api';
import { formatCurrency, formatPercentage, getAssetIcon, formatDate } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const WealthOverview = () => {
  const [assets, setAssets] = useState([]);
  const [netWorthData, setNetWorthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const ownerFilter = selectedOwner === 'All' ? null : selectedOwner;
      const [assetsRes, netWorthRes] = await Promise.all([
        assetsAPI.getAll(ownerFilter),
        assetsAPI.getNetWorth(ownerFilter),
      ]);
      setAssets(assetsRes.data);
      setNetWorthData(netWorthRes.data);
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

  const getAddedDate = (asset) => {
    const firstSnapDate = asset.monthlySnapshots?.[0]?.date;
    if (firstSnapDate) return formatDate(firstSnapDate, 'short');
    const idAsNum = Number(asset._id);
    if (!isNaN(idAsNum) && idAsNum > 1_000_000_000_000) return formatDate(new Date(idAsNum), 'short');
    return null;
  };

  // Derive top performer from the already-filtered assets array
  const topPerformer = assets.length > 0
    ? assets.reduce((best, asset) => {
        const r = asset.monthlySnapshots?.length
          ? asset.monthlySnapshots[asset.monthlySnapshots.length - 1].returnPercentage
          : -Infinity;
        const br = best.monthlySnapshots?.length
          ? best.monthlySnapshots[best.monthlySnapshots.length - 1].returnPercentage
          : -Infinity;
        return r > br ? asset : best;
      })
    : null;
  const topPerformerReturn = topPerformer?.monthlySnapshots?.length
    ? topPerformer.monthlySnapshots[topPerformer.monthlySnapshots.length - 1].returnPercentage
    : 0;
  const topPerformerGrowth = (() => {
    const snaps = topPerformer?.monthlySnapshots;
    if (!snaps || snaps.length < 2) return 0;
    return snaps[snaps.length - 1].value - snaps[snaps.length - 2].value;
  })();

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
            {topPerformer && (
              <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
                <TrendingUp size={16} />
                <span className="text-sm font-semibold">
                  {formatPercentage(topPerformerReturn)} this month
                </span>
              </div>
            )}
          </div>

          {/* Asset Allocation + Assets List — side by side */}
          <div className="flex gap-3 items-stretch">

            {/* Asset Allocation Chart */}
            <div className="card flex-1 min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Asset Allocation</h3>
                <button
                  onClick={() => setIsChartExpanded(true)}
                  className="p-1 rounded-lg text-gray-400 hover:text-sage-600 hover:bg-gray-100 transition-colors"
                  title="Expand chart"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
              <div className="flex-1 min-h-0">
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
              {topPerformer && (
                <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
                  <Sparkles className="text-sage-600 flex-shrink-0" size={13} />
                  <p className="text-xs text-gray-600">
                    Top performer: <span className="font-medium">{topPerformer.name}</span>
                    {' '}· {formatCurrency(topPerformerGrowth)} growth
                  </p>
                </div>
              )}
            </div>

            {/* Assets List */}
            <div className="card flex-1 min-w-0 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex-shrink-0">Assets</h3>
              <div className="space-y-2 overflow-y-auto h-[292px]">
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
                      {getAddedDate(asset) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {getAddedDate(asset)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
      </div>

      {/* Expanded chart modal */}
      {isChartExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setIsChartExpanded(false)}
        >
          <div
            className="card w-full max-w-3xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Asset Allocation</h3>
              <button
                onClick={() => setIsChartExpanded(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 12 }} width={65} />
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
            {topPerformer && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Sparkles className="text-sage-600 flex-shrink-0" size={13} />
                <p className="text-xs text-gray-600">
                  Top performer: <span className="font-medium">{topPerformer.name}</span>
                  {' '}· {formatCurrency(topPerformerGrowth)} growth
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WealthOverview;
