import React, { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { assetsAPI, snapshotsAPI, goalsAPI, transactionsAPI } from '../services/api';
import { getExpensesData } from '../lib/expenses.data';
import { formatFullCurrency, formatCurrency } from '../utils/formatters';

// --- Component ---

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [snapshotData, setSnapshotData] = useState(null);
  const [netWorthData, setNetWorthData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [expenseData, setExpenseData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentMonthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        const [snapshotRes, netWorthRes, allGoalsRes, liveRes, expRes] = await Promise.all([
          snapshotsAPI.getLatest(),
          assetsAPI.getNetWorth(),
          goalsAPI.getAll(),
          transactionsAPI.getLiveMonthlySummary(),
          getExpensesData(currentMonthLabel),
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
        setNetWorthData(netWorthRes.data);
        setGoals(allGoalsRes.data || []);
        setExpenseData(expRes);
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
  const completedGoals = goals.filter(g => g.status === 'Completed').length;

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

          {/* Dummy MoM area chart */}
          {(() => {
            const W = 500, H = 130;
            const multipliers = [0.66, 0.71, 0.69, 0.74, 0.79, 0.85, 0.92, 1.0];
            const base = totalNetWorth || 8800000;
            const values = multipliers.map(m => Math.round(base * m));
            const months = Array.from({ length: 8 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - (7 - i));
              return d.toLocaleString('en-IN', { month: 'short' });
            });
            const minV = Math.min(...values) * 0.97;
            const maxV = Math.max(...values) * 1.01;
            const range = maxV - minV;
            const pad = { t: 10, r: 8, b: 24, l: 8 };
            const cW = W - pad.l - pad.r;
            const cH = H - pad.t - pad.b;
            const pts = values.map((v, i) => ({
              x: pad.l + (i / (values.length - 1)) * cW,
              y: pad.t + (1 - (v - minV) / range) * cH,
              month: months[i],
              value: v,
            }));
            const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            const area = `${line} L${pts[pts.length - 1].x},${H - pad.b} L${pts[0].x},${H - pad.b} Z`;
            return (
              <div className="mt-5 flex-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Monthly Trend</p>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#nwGrad)" />
                  <path d={line} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {pts.map((p, i) => (
                    i === pts.length - 1
                      ? <circle key={i} cx={p.x} cy={p.y} r="4" fill="#0d9488" />
                      : <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#0d9488" opacity="0.4" />
                  ))}
                  {pts.map((p, i) => (
                    <text key={i} x={p.x} y={H - 6} textAnchor="middle" fill="#9ca3af" fontSize="9">
                      {p.month}
                    </text>
                  ))}
                </svg>
              </div>
            );
          })()}
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

      {/* ── BOTTOM ROW: Monthly Snapshot (narrow) │ Spending │ Goals ── */}
      <div className="grid grid-cols-[2fr_3fr_3fr] gap-4 items-stretch">

        {/* 1st: Monthly Snapshot */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Snapshot</h3>
            <Link to="/expenses" className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors group">
              <span>Details</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {!expenseData ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading...</div>
          ) : (() => {
            const expDirect  = expenseData.expenses || {};
            const anuragCC   = (expenseData.creditCards || []).filter(c => c.owner === 'anurag').reduce((s, c) => s + (c.spend || 0), 0);
            const nidhiCC    = (expenseData.creditCards || []).filter(c => c.owner === 'nidhi' ).reduce((s, c) => s + (c.spend || 0), 0);

            const anuragSpend = (expDirect.anurag || 0) + anuragCC;
            const nidhiSpend  = (expDirect.nidhi  || 0) + nidhiCC;
            const totalSpend  = anuragSpend + nidhiSpend;

            const people = [
              { label: 'Anurag', amount: anuragSpend, direct: expDirect.anurag || 0, cc: anuragCC, from: 'from-blue-500',   to: 'to-blue-700',   ring: 'ring-blue-300'   },
              { label: 'Nidhi',  amount: nidhiSpend,  direct: expDirect.nidhi  || 0, cc: nidhiCC,  from: 'from-purple-500', to: 'to-purple-700', ring: 'ring-purple-300' },
            ];

            return (
              <div className="flex flex-col gap-3 flex-1">
                {/* Total expenses pill */}
                <div className="bg-gray-900 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total Expenses</span>
                  <span className="text-lg font-bold text-white leading-tight">{formatFullCurrency(totalSpend)}</span>
                </div>

                {/* Per-person tiles */}
                {people.map(({ label, amount, direct, cc, from, to, ring }) => {
                  const pct = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0;
                  return (
                    <div key={label} className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-3.5 flex flex-col gap-1.5 flex-1`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full bg-white/20 ring-2 ${ring} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-[10px] font-bold text-white">{label[0]}</span>
                          </div>
                          <span className="text-xs font-semibold text-white/90">{label}</span>
                        </div>
                        <span className="text-[10px] font-bold text-white/70 bg-white/15 px-1.5 py-0.5 rounded-full">{pct}%</span>
                      </div>
                      <p className="text-xl font-bold text-white leading-none">{formatFullCurrency(amount)}</p>
                      <div className="space-y-0.5">
                        {direct > 0 && <p className="text-[10px] text-white/65">UPI/cash {formatCurrency(direct, true)}</p>}
                        {cc     > 0 && <p className="text-[10px] text-white/65">CC {formatCurrency(cc, true)}</p>}
                        {direct === 0 && cc === 0 && <p className="text-[10px] text-white/50 italic">No data yet</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* 2nd: This Month's Spending */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">This Month&apos;s Spending</h3>
            <Link to="/expenses" className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors group">
              <span>View all</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {!expenseData ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading...</div>
          ) : (() => {
            const allItems = [
              ...(expenseData.categories || []).map(c => ({ key: `cat-${c.name}`, name: c.name, amount: c.amount, icon: c.icon || '📌' })),
              ...(expenseData.fixedExpenses || []).map(fe => ({ key: `fe-${fe.id}`, name: fe.label, amount: fe.amount, icon: fe.section === 'committed' ? '🔄' : '📌' })),
            ].sort((a, b) => b.amount - a.amount).slice(0, 10);

            if (!allItems.length) {
              return (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <p className="text-sm text-gray-400">No spending data yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Visit the Expenses tab to add your monthly transactions.</p>
                </div>
              );
            }

            const maxAmt = allItems[0].amount || 1;
            return (
              <div className="overflow-y-auto max-h-64 space-y-2.5 pr-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                {allItems.map(item => (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
                        <span className="text-sm font-semibold text-gray-900 ml-2 flex-shrink-0">{formatFullCurrency(item.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-teal-500 rounded-full" style={{ width: `${(item.amount / maxAmt) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* 3rd: Goals */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-gray-900">Goals</h3>
              <span className="text-sm text-gray-400">{completedGoals}/{goals.length} done</span>
            </div>
            <Link to="/goals" className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors group">
              <span>View all</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {goals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <p className="text-sm text-gray-500">No goals set yet</p>
              <button onClick={() => navigate('/goals')} className="text-sm text-teal-600 hover:underline">
                Add your first goal →
              </button>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {[...goals].sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount)).map((goal) => {
                const dotColor = { Completed: 'bg-green-500', Ahead: 'bg-teal-500', 'On Track': 'bg-blue-500' }[goal.status] || 'bg-orange-400';
                const barColor = { Completed: 'bg-green-500', Ahead: 'bg-teal-500', 'On Track': 'bg-blue-500' }[goal.status] || 'bg-orange-400';
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                const remaining = goal.targetAmount - goal.currentAmount;
                return (
                  <button
                    key={goal._id}
                    onClick={() => navigate('/goals')}
                    className="w-full flex items-start gap-3 group hover:bg-gray-50 rounded-xl px-2 py-1.5 -mx-2 transition-colors text-left"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{goal.name}</p>
                        <span className="text-xs font-semibold text-gray-500 flex-shrink-0 ml-2">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
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
        </div>

      </div>
    </div>
  );
};

export default DashboardScreen;
