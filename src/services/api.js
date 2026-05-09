// Static data - no API connections

const staticAssets = [
  {
    _id: '1',
    name: 'Mutual Funds',
    currentValue: 425000,
    owner: 'Joint',
    accountDetails: 'SBI MF + HDFC MF',
    monthlySnapshots: [
      { value: 400000, returnPercentage: 6.2 },
      { value: 425000, returnPercentage: 6.25 },
    ],
  },
  {
    _id: '2',
    name: 'Stocks',
    currentValue: 310000,
    owner: 'Anurag',
    accountDetails: 'Zerodha',
    monthlySnapshots: [
      { value: 290000, returnPercentage: 8.1 },
      { value: 310000, returnPercentage: 6.9 },
    ],
  },
  {
    _id: '3',
    name: 'EPF',
    currentValue: 285000,
    owner: 'Anurag',
    accountDetails: 'EPFO',
    monthlySnapshots: [
      { value: 275000, returnPercentage: 8.25 },
      { value: 285000, returnPercentage: 3.6 },
    ],
  },
  {
    _id: '4',
    name: 'Gold',
    currentValue: 180000,
    owner: 'Joint',
    accountDetails: 'SGB + Physical',
    monthlySnapshots: [
      { value: 170000, returnPercentage: 12.5 },
      { value: 180000, returnPercentage: 5.9 },
    ],
  },
  {
    _id: '5',
    name: 'Fixed Deposits',
    currentValue: 350000,
    owner: 'Nidhi',
    accountDetails: 'SBI FD',
    monthlySnapshots: [
      { value: 340000, returnPercentage: 7.1 },
      { value: 350000, returnPercentage: 2.9 },
    ],
  },
  {
    _id: '6',
    name: 'Bank Savings',
    currentValue: 125000,
    owner: 'Joint',
    accountDetails: 'HDFC Savings',
    monthlySnapshots: [
      { value: 110000, returnPercentage: 3.5 },
      { value: 125000, returnPercentage: 3.5 },
    ],
  },
];

const staticGoals = [
  {
    _id: 'g1',
    name: 'Emergency Fund',
    category: 'Emergency Fund',
    description: '6 months of expenses as safety net',
    targetAmount: 519000,
    currentAmount: 519000,
    deadline: '2025-06-30',
    status: 'Completed',
    priority: 'High',
  },
  {
    _id: 'g2',
    name: 'New Home Down Payment',
    category: 'House Purchase',
    description: 'Save for 20% down payment on a new home',
    targetAmount: 800000,
    currentAmount: 850000,
    deadline: '2027-12-31',
    status: 'Ahead',
    priority: 'High',
  },
  {
    _id: 'g3',
    name: 'Europe Trip',
    category: 'Travel',
    description: 'Dream vacation to Europe',
    targetAmount: 500000,
    currentAmount: 700000,
    deadline: '2026-06-30',
    status: 'Ahead',
    priority: 'Medium',
  },
  {
    _id: 'g4',
    name: 'Career Break Fund',
    category: 'Career Break',
    description: '1 year sabbatical fund',
    targetAmount: 1200000,
    currentAmount: 480000,
    deadline: '2028-12-31',
    status: 'On Track',
    priority: 'Medium',
  },
  {
    _id: 'g5',
    name: 'Retirement Corpus',
    category: 'Retirement',
    description: 'Long-term retirement savings',
    targetAmount: 10000000,
    currentAmount: 1675000,
    deadline: '2050-12-31',
    status: 'On Track',
    priority: 'High',
  },
];

const staticTransactions = [
  { _id: 't1', description: 'Grocery - BigBasket', amount: 3200, category: 'Groceries', type: 'Expense', date: '2026-02-14', paymentMethod: 'UPI' },
  { _id: 't2', description: 'Petrol', amount: 2500, category: 'Fuel', type: 'Expense', date: '2026-02-13', paymentMethod: 'Credit Card' },
  { _id: 't3', description: 'Amazon Shopping', amount: 4500, category: 'Shopping', type: 'Expense', date: '2026-02-12', paymentMethod: 'Credit Card' },
  { _id: 't4', description: 'Netflix + Spotify', amount: 800, category: 'Subscriptions', type: 'Expense', date: '2026-02-10', paymentMethod: 'Credit Card' },
  { _id: 't5', description: 'Electricity Bill', amount: 2800, category: 'Utilities', type: 'Expense', date: '2026-02-08', paymentMethod: 'UPI' },
  { _id: 't6', description: 'Dinner at Mainland China', amount: 3500, category: 'Dining Out', type: 'Expense', date: '2026-02-07', paymentMethod: 'Credit Card' },
  { _id: 't7', description: 'Monthly Rent', amount: 25000, category: 'Rent', type: 'Expense', date: '2026-02-01', paymentMethod: 'Bank Transfer' },
  { _id: 't8', description: 'Medical Checkup', amount: 1500, category: 'Medical', type: 'Expense', date: '2026-02-05', paymentMethod: 'UPI' },
  { _id: 't9', description: 'Movie Tickets', amount: 600, category: 'Entertainment', type: 'Expense', date: '2026-02-09', paymentMethod: 'UPI' },
  { _id: 't10', description: 'Home Insurance', amount: 5000, category: 'Insurance', type: 'Expense', date: '2026-02-03', paymentMethod: 'Bank Transfer' },
  { _id: 't11', description: 'Groceries - DMart', amount: 2800, category: 'Groceries', type: 'Expense', date: '2026-02-06', paymentMethod: 'UPI' },
  { _id: 't12', description: 'Gift for Mom', amount: 3000, category: 'Gifts', type: 'Expense', date: '2026-02-04', paymentMethod: 'UPI' },
];


const netWorthData = {
  totalNetWorth: 1675000,
  breakdown: {
    'Mutual Funds': 425000,
    'Fixed Deposits': 350000,
    'Stocks': 310000,
    'EPF': 285000,
    'Gold': 180000,
    'Bank Savings': 125000,
  },
};

const goalsSummary = {
  total: 5,
  completed: 1,
  onTrack: 2,
  ahead: 2,
  behind: 0,
};

const monthlySummary = {
  totalExpenses: 55200,
  transactionCount: 12,
  byCategory: {
    Rent: { total: 25000, count: 1, type: 'Expense' },
    Insurance: { total: 5000, count: 1, type: 'Expense' },
    Shopping: { total: 4500, count: 1, type: 'Expense' },
    'Dining Out': { total: 3500, count: 1, type: 'Expense' },
    Groceries: { total: 6000, count: 2, type: 'Expense' },
    Gifts: { total: 3000, count: 1, type: 'Expense' },
    Utilities: { total: 2800, count: 1, type: 'Expense' },
    Fuel: { total: 2500, count: 1, type: 'Expense' },
    Medical: { total: 1500, count: 1, type: 'Expense' },
    Subscriptions: { total: 800, count: 1, type: 'Expense' },
    Entertainment: { total: 600, count: 1, type: 'Expense' },
  },
};

const expenseInsights = {
  insights: [
    'Your spending is well-controlled this month with a 54.8% savings rate — excellent discipline!',
    'Rent remains your largest expense at 45% of total spending. Consider if there are ways to optimize housing costs.',
    'Grocery spending is consistent at ₹6,000. Dining out added ₹3,500 — combined food costs are within a healthy range.',
  ],
};

const wealthInsights = {
  topPerformers: [
    { name: 'Gold', growth: 10000, percentage: 5.9 },
    { name: 'Stocks', growth: 20000, percentage: 6.9 },
    { name: 'Mutual Funds', growth: 25000, percentage: 6.25 },
  ],
};

// Helpers for asset API calls that read/write JSON files via Next.js API routes

async function fetchAssetsFromFile(owner = null, month = null) {
  try {
    const url = month ? `/api/assets?month=${encodeURIComponent(month)}` : '/api/assets';
    const res = await fetch(url);
    if (!res.ok) throw new Error('API unavailable');
    const json = await res.json();
    const assets = json.data;
    return owner ? assets.filter(a => a.owner === owner) : assets;
  } catch {
    // Fallback to static data if the API route is unreachable
    return owner ? staticAssets.filter(a => a.owner === owner) : staticAssets;
  }
}

async function postToAssetsAPI(body) {
  try {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  } catch {
    return { data: { success: true } };
  }
}

export const assetsAPI = {
  getAll: async (owner = null, month = null) => {
    const assets = await fetchAssetsFromFile(owner, month);
    return { data: assets };
  },
  getById: (id) => Promise.resolve({ data: staticAssets.find(a => a._id === id) }),
  create: (assetData) => postToAssetsAPI({ action: 'create', ...assetData }),
  update: (assetId, patch) => postToAssetsAPI({ action: 'update', assetId, ...patch }),
  delete: (id) => postToAssetsAPI({ action: 'delete', assetId: id }),
  addSnapshot: (assetId, snapshot) =>
    postToAssetsAPI({ action: 'addSnapshot', assetId, ...snapshot }),
  resetMonth: (month) => postToAssetsAPI({ action: 'reset', month }),
  getNetWorth: async (owner = null, month = null) => {
    try {
      const assets = await fetchAssetsFromFile(owner, month);
      const totalNetWorth = assets.reduce((sum, a) => sum + a.currentValue, 0);
      const breakdown = {};
      assets.forEach(a => { breakdown[a.name] = (breakdown[a.name] || 0) + a.currentValue; });
      return { data: { totalNetWorth, breakdown } };
    } catch {
      const filtered = owner ? staticAssets.filter(a => a.owner === owner) : staticAssets;
      const totalNetWorth = filtered.reduce((sum, a) => sum + a.currentValue, 0);
      const breakdown = {};
      filtered.forEach(a => { breakdown[a.name] = (breakdown[a.name] || 0) + a.currentValue; });
      return { data: { totalNetWorth, breakdown } };
    }
  },
};

export const goalsAPI = {
  getAll: async () => {
    try {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error('API unavailable');
      return res.json();
    } catch {
      return { data: [] };
    }
  },
  getSummary: async () => {
    try {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error('API unavailable');
      const json = await res.json();
      const goals = json.data || [];
      return {
        data: {
          total: goals.length,
          completed: goals.filter(g => g.status === 'Completed').length,
          ahead: goals.filter(g => g.status === 'Ahead').length,
          onTrack: goals.filter(g => g.status === 'On Track').length,
          behind: goals.filter(g => g.status === 'Behind').length,
        },
      };
    } catch {
      return { data: { total: 0, completed: 0, ahead: 0, onTrack: 0, behind: 0 } };
    }
  },
  create: async (goal) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', goal }),
    });
    return res.json();
  },
  update: async (goal) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', goal }),
    });
    return res.json();
  },
  delete: async (id) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    return res.json();
  },
};

export const transactionsAPI = {
  getAll: () => Promise.resolve({ data: staticTransactions }),
  getById: (id) => Promise.resolve({ data: staticTransactions.find(t => t._id === id) }),
  create: () => Promise.resolve({ data: { success: true } }),
  createBulk: () => Promise.resolve({ data: { success: true } }),
  update: () => Promise.resolve({ data: { success: true } }),
  getLiveMonthlySummary: async () => {
    try {
      const now = new Date();
      const currKey = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevKey = `${prevDate.getFullYear()}_${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      const [expRes, incRes, prevExpRes] = await Promise.all([
        fetch(`/api/expenses?month=${currKey}`),
        fetch('/api/income'),
        fetch(`/api/expenses?month=${prevKey}`),
      ]);

      const expJson  = expRes.ok     ? await expRes.json()     : null;
      const incJson  = incRes.ok     ? await incRes.json()     : null;
      const prevJson = prevExpRes.ok ? await prevExpRes.json() : null;

      const global = incJson?.data  || {};
      const curr   = expJson?.data  || {};
      const prev   = prevJson?.data || {};

      // --- helpers (mirrors ExpensesClient exactly) ---
      const calcTotals = (d, globalInc, globalSips, globalFixed) => {
        const anuragSalary  = globalInc.anurag?.salary ?? 0;
        const nidhiSalary   = globalInc.nidhi?.salary  ?? 0;
        const anuragBonus   = d.income?.anurag?.bonus ?? 0;
        const nidhiBonus    = d.income?.nidhi?.bonus  ?? 0;
        const totalIncome   = anuragSalary + nidhiSalary + anuragBonus + nidhiBonus;

        const sips          = d.sips          ?? globalSips  ?? 0;
        const fixedExpenses = d.fixedExpenses ?? globalFixed ?? [];
        const totalFixed    = (fixedExpenses || []).reduce((s, f) => s + (f.amount || 0), 0);
        const totalCC       = (d.creditCards  || []).reduce((s, c) => s + (c.spend  || 0), 0);
        const catTotal      = (d.categories   || []).reduce((s, c) => s + (c.amount || 0), 0);
        const expAcc        = d.expenses || {};
        const totalExpenses = (expAcc.joint || 0) + (expAcc.anurag || 0) + (expAcc.nidhi || 0)
                              + totalFixed + sips + catTotal;
        const surplus       = totalIncome - totalExpenses - totalCC;
        const savingsRate   = totalIncome > 0 ? Math.round((surplus / totalIncome) * 100) : 0;
        return { totalIncome, totalExpenses, surplus, savingsRate };
      };

      const c = calcTotals(curr, global, global.sips, global.fixedExpenses);
      const p = calcTotals(prev, global, global.sips, global.fixedExpenses);

      return {
        data: {
          snapshot: {
            income:   { total: c.totalIncome },
            expenses: { total: c.totalExpenses },
            savings:  { rate: c.savingsRate, amount: c.surplus },
          },
          growth: {
            expenseChange:    c.totalExpenses - p.totalExpenses,
            savingsRateChange: c.savingsRate  - p.savingsRate,
          },
        },
      };
    } catch {
      return { data: null };
    }
  },
  delete: () => Promise.resolve({ data: { success: true } }),
  getMonthlySummary: () => Promise.resolve({ data: monthlySummary }),
  getCategoryTrends: () => Promise.resolve({ data: [] }),
  getCategoryBreakdown: () => Promise.resolve({ data: {} }),
};

export const snapshotsAPI = {
  getAll: async (startDate = null, endDate = null) => {
    try {
      const res = await fetch('/api/networth');
      if (!res.ok) throw new Error('API unavailable');
      const json = await res.json();
      let records = (json.data || []).map(r => ({
        date: r.date,
        netWorth: r.totalNetWorth,
        breakdown: r.breakdown,
      }));
      if (startDate) records = records.filter(r => r.date >= startDate.substring(0, 7));
      if (endDate)   records = records.filter(r => r.date <= endDate.substring(0, 7));
      return { data: records };
    } catch {
      return { data: [] };
    }
  },
  getLatest: async () => {
    try {
      const res = await fetch('/api/networth');
      if (!res.ok) throw new Error('API unavailable');
      const json = await res.json();
      const records = (json.data || []).sort((a, b) => a.date.localeCompare(b.date));
      if (records.length === 0) return { data: null };
      const latest = records[records.length - 1];
      const prev   = records.length > 1 ? records[records.length - 2] : null;
      const netWorthChange = prev ? latest.totalNetWorth - prev.totalNetWorth : 0;
      const netWorthChangePercentage = prev && prev.totalNetWorth > 0
        ? parseFloat(((netWorthChange / prev.totalNetWorth) * 100).toFixed(1))
        : 0;
      return { data: { growth: { netWorthChange, netWorthChangePercentage } } };
    } catch {
      return { data: null };
    }
  },
  getById: () => Promise.resolve({ data: null }),
  create: () => Promise.resolve({ data: { success: true } }),
  update: () => Promise.resolve({ data: { success: true } }),
  delete: () => Promise.resolve({ data: { success: true } }),
};

export const insightsAPI = {
  getDashboard: () => Promise.resolve({ data: {} }),
  getGoalInsights: () => Promise.resolve({ data: {} }),
  getExpenseInsights: () => Promise.resolve({ data: expenseInsights }),
  getWealthInsights: () => Promise.resolve({ data: wealthInsights }),
};

export const statementsAPI = {
  upload: () => Promise.resolve({ data: { statement: { _id: 'mock-1' } } }),
  process: () => Promise.resolve({ data: { success: true } }),
  getAll: () => Promise.resolve({ data: [] }),
  getById: () => Promise.resolve({ data: {} }),
  delete: () => Promise.resolve({ data: { success: true } }),
};
