import React, { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetsAPI, transactionsAPI } from '../services/api';
import { getExpensesData } from '../lib/expenses.data';
import { formatFullCurrency, formatCurrency } from '../utils/formatters';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, Bar, BarChart, ComposedChart, Legend, LabelList } from 'recharts';

// --- Component ---

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [snapshotData, setSnapshotData] = useState(null);
  const [netWorthData, setNetWorthData] = useState(null);
  const [trendHistory, setTrendHistory] = useState([]);
  const [ccHistory, setCcHistory] = useState([]);
  const [ccCards, setCcCards] = useState([]);
  const [totalExpenseHistory, setTotalExpenseHistory] = useState([]);
  const [savingsHistory, setSavingsHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();

        // Last 6 months oldest→newest (same format WealthOverview uses for its month selector)
        const last6MonthDates = Array.from({ length: 6 }, (_, i) =>
          new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
        );

        const last6MonthLabels = last6MonthDates.map(d => d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }));

        const [netWorthRes, liveRes, ...rest] = await Promise.all([
          assetsAPI.getNetWorth(),
          transactionsAPI.getLiveMonthlySummary(),
          ...last6MonthDates.map(d =>
            assetsAPI.getNetWorth(null, d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }))
          ),
          ...last6MonthLabels.map(label => getExpensesData(label)),
        ]);

        const monthNWResults = rest.slice(0, 6);
        const monthExpResults = rest.slice(6, 12);

        const live = liveRes.data;

        // Derive MoM net worth change from asset data (same source as WealthOverview)
        const currNW = monthNWResults[5]?.data?.totalNetWorth || 0;
        const prevNW = monthNWResults[4]?.data?.totalNetWorth || 0;
        const netWorthChange = (currNW > 0 && prevNW > 0) ? currNW - prevNW : 0;
        const netWorthChangePercentage = (prevNW > 0 && netWorthChange !== 0)
          ? parseFloat(((netWorthChange / prevNW) * 100).toFixed(1))
          : 0;

        const mergedSnapshot = live ? {
          snapshot: live.snapshot,
          growth: {
            netWorthChange,
            netWorthChangePercentage,
            expenseChange:     live.growth.expenseChange,
            savingsRateChange: live.growth.savingsRateChange,
          },
        } : { growth: { netWorthChange, netWorthChangePercentage } };

        setSnapshotData(mergedSnapshot);
        setNetWorthData(netWorthRes.data);

        const history = last6MonthDates.map((d, i) => ({
          month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
          netWorth: monthNWResults[i]?.data?.totalNetWorth || null,
        }));
        setTrendHistory(history);

        // Credit card spend comes from statement-uploaded categories (statementType
        // like "HDFC Credit Card"), not the unused top-level `creditCards` field.
        // One bar per individual card (owner + bank), all in a single chart.
        const OWNER_LABEL = { anurag: 'Anurag', nidhi: 'Nidhi' };
        const monthCardTotals = monthExpResults.map(exp => {
          const totals = {};
          (exp?.categories || []).forEach(c => {
            if (!c.statementType?.includes('Credit Card')) return;
            const bank = c.statementType.replace(' Credit Card', '');
            const key = `${OWNER_LABEL[c.account] || c.account} · ${bank}`;
            totals[key] = (totals[key] || 0) + (c.amount || 0);
          });
          return totals;
        });

        const CARD_PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
        const cardKeys = Array.from(new Set(monthCardTotals.flatMap(t => Object.keys(t)))).sort();
        setCcCards(cardKeys.map((key, i) => ({ key, color: CARD_PALETTE[i % CARD_PALETTE.length] })));

        const ccByMonth = last6MonthDates.map((d, i) => {
          const totals = monthCardTotals[i];
          const row = { month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), total: 0 };
          cardKeys.forEach(key => {
            row[key] = totals[key] || 0;
            row.total += totals[key] || 0;
          });
          return row;
        });
        setCcHistory(ccByMonth);

        // Total household expense per month — Anurag + Nidhi + joint, combined.
        // Matches the definition used across the Expenses tab: direct UPI/cash spend +
        // all categorized spend (which already includes card statement uploads) +
        // fixed committed expenses + SIPs.
        const computeTotalSpend = (exp) => {
          if (!exp) return 0;
          const direct = exp.expenses || {};
          const catTotal = (exp.categories || []).reduce((s, c) => s + (c.amount || 0), 0);
          const fixedTotal = (exp.fixedExpenses || [])
            .filter(fe => (fe.section ?? 'fixed') === 'fixed')
            .reduce((s, f) => s + (f.amount || 0), 0);
          return (direct.anurag || 0) + (direct.nidhi || 0) + (direct.joint || 0) + catTotal + fixedTotal + (exp.sips || 0);
        };

        const totalExpHistory = last6MonthDates.map((d, i) => ({
          month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
          total: computeTotalSpend(monthExpResults[i]),
        }));
        setTotalExpenseHistory(totalExpHistory);

        // Monthly savings — combined household surplus, same formula as the live
        // summary card (income − expenses − CC spend). getExpensesData() already
        // resolves salary/sips/fixedExpenses against the global defaults per month.
        const computeSavings = (exp) => {
          if (!exp) return 0;
          const totalIncome = (exp.income?.anurag?.salary || 0) + (exp.income?.anurag?.bonus || 0)
                             + (exp.income?.nidhi?.salary  || 0) + (exp.income?.nidhi?.bonus  || 0);
          const catTotal    = (exp.categories || []).reduce((s, c) => s + (c.amount || 0), 0);
          const fixedTotal  = (exp.fixedExpenses || []).reduce((s, f) => s + (f.amount || 0), 0);
          const direct      = exp.expenses || {};
          const totalExpenses = (direct.joint || 0) + (direct.anurag || 0) + (direct.nidhi || 0)
                               + fixedTotal + (exp.sips || 0) + catTotal;
          return totalIncome - totalExpenses;
        };

        const savingsHist = last6MonthDates.map((d, i) => ({
          month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
          savings: computeSavings(monthExpResults[i]),
        }));
        setSavingsHistory(savingsHist);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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

  const growth = snapshotData?.growth || {};
  const totalNetWorth = netWorthData?.totalNetWorth || 0;

  return (
    <div className="space-y-4">

      {/* ── TOP ROW: Net Worth + chart (left 30%) │ Portfolio Mix (right 70%) ── */}
      <div className="grid grid-cols-[3fr_7fr] gap-4">

        {/* Left: Net Worth hero + dummy MoM chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Net Worth</p>
              <p className="text-4xl font-bold text-gray-900 leading-none">
                {totalNetWorth > 0 ? formatFullCurrency(totalNetWorth) : '—'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {growth.netWorthChange != null && growth.netWorthChange !== 0 ? (
                  <>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${growth.netWorthChange > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {growth.netWorthChange > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                      {growth.netWorthChange > 0 ? '+' : ''}{formatCurrency(growth.netWorthChange)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${growth.netWorthChange > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {growth.netWorthChangePercentage > 0 ? '+' : ''}{growth.netWorthChangePercentage?.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400">vs last month</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">No prior month comparison yet</span>
                )}
              </div>
            </div>
            <Link to="/wealth" className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors">
              All assets <ArrowRight size={12} />
            </Link>
          </div>

          {/* Monthly Trend chart */}
          <div className="mt-5 flex-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Monthly Trend</p>
            {trendHistory.every(r => r.netWorth === null) ? (
              <div className="flex items-center justify-center h-28 text-xs text-gray-400">
                No history yet — record net worth monthly via Update Data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={trendHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(value) => [formatFullCurrency(value), 'Net Worth']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontWeight: 600, color: '#374151' }}
                    cursor={{ stroke: '#0d9488', strokeWidth: 1, strokeDasharray: '4 2' }}
                  />
                  <Area type="monotone" dataKey="netWorth" stroke="#0d9488" strokeWidth={2.5} fill="url(#nwGrad)" dot={{ r: 2.5, fill: '#0d9488', strokeWidth: 0 }} activeDot={{ r: 4.5, fill: '#0d9488', strokeWidth: 0 }} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Portfolio Mix — horizontal row */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Portfolio Mix</p>
          {!totalNetWorth ? (
            <p className="text-sm text-gray-400">No assets recorded yet.</p>
          ) : (() => {
            const COLORS = ['#0d9488','#059669','#16a34a','#0f766e','#0284c7','#7c3aed','#db2777','#ea580c'];
            const W = 900;
            const PAD = 8;
            const GAP = 10;
            const MAX_R = 72, MIN_R = 22;

            const entries = Object.entries(netWorthData?.breakdown || {}).sort(([, a], [, b]) => b - a);
            if (!entries.length) return <p className="text-sm text-gray-400">No breakdown data.</p>;

            const maxVal = entries[0][1] || 1;
            const rawData = entries.map(([name, value], i) => ({
              name, value,
              pct: value / totalNetWorth,
              r: MIN_R + Math.sqrt(value / maxVal) * (MAX_R - MIN_R),
              color: COLORS[i % COLORS.length],
            }));

            // Scale all radii down proportionally if bubbles won't fit in one row
            const rawTotalW = rawData.reduce((s, c) => s + c.r * 2, 0) + GAP * (rawData.length - 1);
            const availW = W - PAD * 2;
            const scale = rawTotalW > availW ? availW / rawTotalW : 1;

            const data = rawData.map(c => ({ ...c, r: c.r * scale }));
            const maxR = Math.max(...data.map(c => c.r));
            const dynH = Math.ceil(maxR * 2) + PAD * 2;
            const cy = dynH / 2;

            // Place bubbles left-to-right
            let curX = PAD;
            const placed = data.map(c => {
              curX += c.r;
              const b = { ...c, x: curX, y: cy };
              curX += c.r + GAP;
              return b;
            });

            // Centre the whole row horizontally
            const rowWidth = curX - GAP - PAD;
            const shift = (W - rowWidth) / 2;
            placed.forEach(b => { b.x += shift; });

            return (
              <div>
                <svg viewBox={`0 0 ${W} ${dynH}`} className="w-full" style={{ height: dynH }}>
                  {placed.map((b, i) => (
                    <g key={i}>
                      <circle cx={b.x} cy={b.y} r={b.r} fill={b.color} />
                      <circle cx={b.x} cy={b.y} r={b.r} fill="none" stroke="white" strokeWidth="2.5" opacity="0.2" />
                      {b.r >= 50 && (
                        <>
                          <text x={b.x} y={b.y - 11} textAnchor="middle" fill="white" fontSize="10" fontWeight="500" opacity="0.9">
                            {b.name.length > 12 ? b.name.slice(0, 11) + '…' : b.name}
                          </text>
                          <text x={b.x} y={b.y + 3} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
                            {formatFullCurrency(b.value)}
                          </text>
                          <text x={b.x} y={b.y + 17} textAnchor="middle" fill="white" fontSize="9" opacity="0.85">
                            {(b.pct * 100).toFixed(0)}%
                          </text>
                        </>
                      )}
                      {b.r >= 32 && b.r < 50 && (
                        <>
                          <text x={b.x} y={b.y + 3} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">
                            {(b.pct * 100).toFixed(0)}%
                          </text>
                          <text x={b.x} y={b.y + 14} textAnchor="middle" fill="white" fontSize="7.5" opacity="0.85">
                            {b.name.split(' ')[0].slice(0, 9)}
                          </text>
                        </>
                      )}
                      {b.r < 32 && (
                        <text x={b.x} y={b.y + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">
                          {(b.pct * 100).toFixed(0)}%
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {placed.map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                      <span className="text-[10px] text-gray-500">{b.name}</span>
                      <span className="text-[10px] font-semibold text-gray-700">{formatFullCurrency(b.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

      </div>

      {/* ── BOTTOM ROW: Total Expenses (narrow) │ Credit Card Spend │ Goals ── */}
      <div className="grid grid-cols-[2fr_3fr_3fr] gap-4 items-stretch">

        {/* 1st: Total Expenses — month wise, household combined */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-gray-900">Total Expenses</h3>
            <Link to="/expenses" className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors group">
              <span>Details</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Anurag + Nidhi, last 6 months</p>

          {totalExpenseHistory.every(m => m.total === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <p className="text-sm text-gray-400">No expense data yet.</p>
              <p className="text-xs text-gray-400 mt-1">Visit the Expenses tab to add your monthly transactions.</p>
            </div>
          ) : (
            <>
              <div className="h-[110px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={totalExpenseHistory} margin={{ top: 18, right: 16, left: 16, bottom: 0 }} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip
                      formatter={(value) => [formatFullCurrency(value), 'Total Expenses']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      labelStyle={{ fontWeight: 600, color: '#374151' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    {/* stem */}
                    <Bar dataKey="total" fill="#0d9488" fillOpacity={0.55} barSize={3} radius={[2, 2, 0, 0]} />
                    {/* dot + value label, no connecting line */}
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="transparent"
                      dot={{ r: 5, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="total"
                        position="top"
                        formatter={(value) => (value > 0 ? formatCurrency(value, false) : '')}
                        style={{ fontSize: 9.5, fontWeight: 600, fill: '#374151' }}
                      />
                    </Line>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* 2nd: Credit Card Spend — month wise, per card, faceted by owner */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-gray-900">Credit Card Spend</h3>
            <Link to="/expenses" className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors group">
              <span>View all</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Last 6 months, by card</p>

          {ccHistory.every(m => m.total === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <p className="text-sm text-gray-400">No credit card spend recorded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Visit the Expenses tab to add card statements.</p>
            </div>
          ) : (
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ccHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="24%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    formatter={(value, name) => [formatFullCurrency(value), name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontWeight: 600, color: '#374151' }}
                    cursor={{ fill: '#f9fafb' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10, color: '#6b7280' }}
                  />
                  {ccCards.map(card => (
                    <Bar key={card.key} dataKey={card.key} name={card.key} fill={card.color} radius={[3, 3, 0, 0]} maxBarSize={11} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 3rd: Savings — month wise, household combined */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-gray-900">Savings</h3>
            <Link to="/expenses" className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors group">
              <span>Details</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Anurag + Nidhi, last 6 months</p>

          {savingsHistory.every(m => m.savings === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <p className="text-sm text-gray-400">No savings data yet.</p>
              <p className="text-xs text-gray-400 mt-1">Visit the Expenses tab to add income and expenses.</p>
            </div>
          ) : (() => {
            const maxAbs = Math.max(1, ...savingsHistory.map(m => Math.abs(m.savings)));
            const R = 22;
            const CIRC = 2 * Math.PI * R;
            return (
              <div className="flex-1 flex items-center">
                <div className="grid grid-cols-6 gap-1 w-full">
                  {savingsHistory.map(m => {
                    const hasData = m.savings !== 0;
                    const frac = hasData ? Math.abs(m.savings) / maxAbs : 0;
                    const isNeg = m.savings < 0;
                    const color = isNeg ? '#e34948' : '#0d9488';
                    return (
                      <div key={m.month} className="flex flex-col items-center gap-1">
                        <svg viewBox="0 0 60 60" className="w-full max-w-[52px]">
                          <circle cx="30" cy="30" r={R} fill="none" stroke="#f0efec" strokeWidth="5" />
                          {hasData && (
                            <circle
                              cx="30" cy="30" r={R} fill="none" stroke={color} strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={`${CIRC * frac} ${CIRC}`}
                              transform="rotate(-90 30 30)"
                            />
                          )}
                          <text x="30" y="34" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={hasData ? '#111827' : '#9ca3af'}>
                            {hasData ? formatCurrency(m.savings, false).replace('₹', '') : '—'}
                          </text>
                        </svg>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
};

export default DashboardScreen;
