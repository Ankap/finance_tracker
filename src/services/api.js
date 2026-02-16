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

const staticSnapshots = [
  { _id: 's1', month: '2025-03-01', date: '2025-03-01', netWorth: 1120000, totalAssets: 1120000, snapshot: { income: { total: 185000 }, expenses: { total: 98000 }, savings: { rate: 47, amount: 87000 } }, growth: { netWorthChange: 42000, netWorthChangePercentage: 3.9, expenseChange: -2000 } },
  { _id: 's2', month: '2025-04-01', date: '2025-04-01', netWorth: 1165000, totalAssets: 1165000, snapshot: { income: { total: 185000 }, expenses: { total: 95000 }, savings: { rate: 48.6, amount: 90000 } }, growth: { netWorthChange: 45000, netWorthChangePercentage: 4.0, expenseChange: -3000 } },
  { _id: 's3', month: '2025-05-01', date: '2025-05-01', netWorth: 1210000, totalAssets: 1210000, snapshot: { income: { total: 190000 }, expenses: { total: 102000 }, savings: { rate: 46.3, amount: 88000 } }, growth: { netWorthChange: 45000, netWorthChangePercentage: 3.9, expenseChange: 7000 } },
  { _id: 's4', month: '2025-06-01', date: '2025-06-01', netWorth: 1260000, totalAssets: 1260000, snapshot: { income: { total: 190000 }, expenses: { total: 94000 }, savings: { rate: 50.5, amount: 96000 } }, growth: { netWorthChange: 50000, netWorthChangePercentage: 4.1, expenseChange: -8000 } },
  { _id: 's5', month: '2025-07-01', date: '2025-07-01', netWorth: 1305000, totalAssets: 1305000, snapshot: { income: { total: 195000 }, expenses: { total: 99000 }, savings: { rate: 49.2, amount: 96000 } }, growth: { netWorthChange: 45000, netWorthChangePercentage: 3.6, expenseChange: 5000 } },
  { _id: 's6', month: '2025-08-01', date: '2025-08-01', netWorth: 1350000, totalAssets: 1350000, snapshot: { income: { total: 195000 }, expenses: { total: 97000 }, savings: { rate: 50.3, amount: 98000 } }, growth: { netWorthChange: 45000, netWorthChangePercentage: 3.4, expenseChange: -2000 } },
  { _id: 's7', month: '2025-09-01', date: '2025-09-01', netWorth: 1400000, totalAssets: 1400000, snapshot: { income: { total: 200000 }, expenses: { total: 105000 }, savings: { rate: 47.5, amount: 95000 } }, growth: { netWorthChange: 50000, netWorthChangePercentage: 3.7, expenseChange: 8000 } },
  { _id: 's8', month: '2025-10-01', date: '2025-10-01', netWorth: 1455000, totalAssets: 1455000, snapshot: { income: { total: 200000 }, expenses: { total: 92000 }, savings: { rate: 54, amount: 108000 } }, growth: { netWorthChange: 55000, netWorthChangePercentage: 3.9, expenseChange: -13000 } },
  { _id: 's9', month: '2025-11-01', date: '2025-11-01', netWorth: 1510000, totalAssets: 1510000, snapshot: { income: { total: 200000 }, expenses: { total: 98000 }, savings: { rate: 51, amount: 102000 } }, growth: { netWorthChange: 55000, netWorthChangePercentage: 3.8, expenseChange: 6000 } },
  { _id: 's10', month: '2025-12-01', date: '2025-12-01', netWorth: 1570000, totalAssets: 1570000, snapshot: { income: { total: 205000 }, expenses: { total: 110000 }, savings: { rate: 46.3, amount: 95000 } }, growth: { netWorthChange: 60000, netWorthChangePercentage: 4.0, expenseChange: 12000 } },
  { _id: 's11', month: '2026-01-01', date: '2026-01-01', netWorth: 1625000, totalAssets: 1625000, snapshot: { income: { total: 205000 }, expenses: { total: 96000 }, savings: { rate: 53.2, amount: 109000 } }, growth: { netWorthChange: 55000, netWorthChangePercentage: 3.5, expenseChange: -14000 } },
  { _id: 's12', month: '2026-02-01', date: '2026-02-01', netWorth: 1675000, totalAssets: 1675000, snapshot: { income: { total: 210000 }, expenses: { total: 95000 }, savings: { rate: 54.8, amount: 115000 } }, growth: { netWorthChange: 50000, netWorthChangePercentage: 3.1, expenseChange: -1000 } },
];

const latestSnapshot = staticSnapshots[staticSnapshots.length - 1];

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

// Mock API that returns static data wrapped in { data: ... } to match axios response format

export const assetsAPI = {
  getAll: (owner = null) => {
    const filtered = owner ? staticAssets.filter(a => a.owner === owner) : staticAssets;
    return Promise.resolve({ data: filtered });
  },
  getById: (id) => Promise.resolve({ data: staticAssets.find(a => a._id === id) }),
  create: () => Promise.resolve({ data: { success: true } }),
  update: () => Promise.resolve({ data: { success: true } }),
  delete: () => Promise.resolve({ data: { success: true } }),
  addSnapshot: () => Promise.resolve({ data: { success: true } }),
  getNetWorth: () => Promise.resolve({ data: netWorthData }),
};

export const goalsAPI = {
  getAll: () => Promise.resolve({ data: staticGoals }),
  getById: (id) => Promise.resolve({ data: staticGoals.find(g => g._id === id) }),
  create: () => Promise.resolve({ data: { success: true } }),
  update: () => Promise.resolve({ data: { success: true } }),
  delete: () => Promise.resolve({ data: { success: true } }),
  addProgress: () => Promise.resolve({ data: { success: true } }),
  getSummary: () => Promise.resolve({ data: goalsSummary }),
};

export const transactionsAPI = {
  getAll: () => Promise.resolve({ data: staticTransactions }),
  getById: (id) => Promise.resolve({ data: staticTransactions.find(t => t._id === id) }),
  create: () => Promise.resolve({ data: { success: true } }),
  createBulk: () => Promise.resolve({ data: { success: true } }),
  update: () => Promise.resolve({ data: { success: true } }),
  delete: () => Promise.resolve({ data: { success: true } }),
  getMonthlySummary: () => Promise.resolve({ data: monthlySummary }),
  getCategoryTrends: () => Promise.resolve({ data: [] }),
  getCategoryBreakdown: () => Promise.resolve({ data: {} }),
};

export const snapshotsAPI = {
  getAll: () => Promise.resolve({ data: staticSnapshots }),
  getLatest: () => Promise.resolve({ data: latestSnapshot }),
  getById: (id) => Promise.resolve({ data: staticSnapshots.find(s => s._id === id) }),
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
