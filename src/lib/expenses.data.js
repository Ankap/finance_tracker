function monthLabelToKey(label) {
  const d = new Date(`1 ${label}`);
  if (isNaN(d)) return null;
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}_${month}`;
}

export { monthLabelToKey };

const DEFAULT_DATA = {
  income: {
    anurag: { salary: 220000, bonus: 0 },
    nidhi:  { salary: 150000, bonus: 15000 },
  },
  sips: 45000,
  expenses: { joint: 52000, anurag: 18500, nidhi: 14200 },
  lastMonthExpenses: 71200,
  accounts: {
    joint: {
      label: "Joint Account",
      opening: 180000,
      moneyIn: [
        { label: "Transfer from Anurag", amount: 80000 },
        { label: "Transfer from Nidhi",  amount: 60000 },
      ],
      moneyOut: [
        { label: "Rent",          amount: 25000 },
        { label: "Groceries",     amount: 8500  },
        { label: "Utilities",     amount: 3900  },
        { label: "Subscriptions", amount: 1800  },
        { label: "SIPs",          amount: 45000 },
      ],
      ccBillPaid: 0, ccBillNote: null, ccSpends: null,
    },
    anurag: {
      label: "Anurag's Account",
      opening: 95000,
      moneyIn: [{ label: "Salary", amount: 220000 }],
      moneyOut: [
        { label: "Transfer to Joint", amount: 80000 },
        { label: "Insurance",         amount: 5000  },
        { label: "Fuel (UPI)",        amount: 2000  },
      ],
      ccBillPaid: 16500,
      ccBillNote: "HDFC Credit Card bill — card spends already captured from card statement",
      ccSpends: [
        { label: "Petrol – HP",       amount: 2500 },
        { label: "Dining Out",        amount: 3500 },
        { label: "Fuel – Indian Oil", amount: 2500 },
        { label: "Shopping – Myntra", amount: 8000 },
      ],
    },
    nidhi: {
      label: "Nidhi's Account",
      opening: 72000,
      moneyIn: [
        { label: "Salary", amount: 150000 },
        { label: "Bonus",  amount: 15000  },
      ],
      moneyOut: [
        { label: "Transfer to Joint", amount: 60000 },
        { label: "Gifts",             amount: 2000  },
      ],
      ccBillPaid: 14200,
      ccBillNote: "ICICI Credit Card bill — card spends already captured from card statement",
      ccSpends: [
        { label: "Amazon Shopping", amount: 5000 },
        { label: "Zara",            amount: 4800 },
        { label: "Swiggy",          amount: 2200 },
        { label: "Nykaa",           amount: 2200 },
      ],
    },
  },
  categories: [
    { name: "Rent",          amount: 25000, account: "joint",  pct: 29.5, txns: 1, icon: "🏠", trend:  0 },
    { name: "Shopping",      amount: 17800, account: "nidhi",  pct: 21.0, txns: 5, icon: "🛍️", trend: 30 },
    { name: "Groceries",     amount: 8500,  account: "joint",  pct: 10.0, txns: 4, icon: "🛒", trend: -5 },
    { name: "Insurance",     amount: 5000,  account: "anurag", pct:  5.9, txns: 1, icon: "🛡️", trend:  0 },
    { name: "Fuel",          amount: 4500,  account: "anurag", pct:  5.3, txns: 5, icon: "⛽", trend:  0 },
    { name: "Utilities",     amount: 3900,  account: "joint",  pct:  4.6, txns: 2, icon: "💡", trend: -8 },
    { name: "Dining Out",    amount: 3500,  account: "anurag", pct:  4.1, txns: 3, icon: "🍽️", trend: 12 },
    { name: "Gifts",         amount: 2000,  account: "nidhi",  pct:  2.4, txns: 1, icon: "🎁", trend:  0 },
    { name: "Subscriptions", amount: 1800,  account: "joint",  pct:  2.1, txns: 3, icon: "📱", trend:  0 },
  ],
  fixedExpenses: [
    { id: "fe1", label: "Home Loan EMI", amount: 35000 },
    { id: "fe2", label: "Car Insurance", amount: 4500  },
  ],
  creditCards: [
    { id: "cc1", cardName: "HDFC Regalia",   owner: "anurag", spend: 16500 },
    { id: "cc2", cardName: "ICICI Sapphiro", owner: "nidhi",  spend: 14200 },
  ],
  aiInsights: [
    "Shopping is up 30% — driven by Nidhi's credit card (Zara, Amazon, Nykaa). Worth a quick check.",
    "Savings rate is 43% this month — above your 40% target. Good month.",
    "After SIPs of ₹45k, you have ₹1.06L free to deploy toward your house fund.",
    "Anurag's account closes at ₹2.09L. Consider moving ₹1L to joint for the house fund.",
  ],
};

export async function getExpensesData(month) {
  try {
    const [expRes, incRes] = await Promise.all([
      fetch(`/api/expenses?month=${encodeURIComponent(month)}`),
      fetch('/api/income'),
    ]);
    if (!expRes.ok) throw new Error('API unavailable');
    const expJson = await expRes.json();
    const incJson = incRes.ok ? await incRes.json() : null;

    const global      = incJson?.data || {};
    const monthIncome = expJson.data?.income || {};

    // Salary: use the month's own saved salary if it was explicitly set (> 0),
    // otherwise fall back to global — so past months keep their locked-in salary
    // while future/new months inherit the latest global value.
    // Bonus: always monthly (specific to that month).
    const income = {
      anurag: {
        salary: monthIncome.anurag?.salary > 0
          ? monthIncome.anurag.salary
          : (global.anurag?.salary ?? DEFAULT_DATA.income.anurag.salary),
        bonus: monthIncome.anurag?.bonus ?? 0,
      },
      nidhi: {
        salary: monthIncome.nidhi?.salary > 0
          ? monthIncome.nidhi.salary
          : (global.nidhi?.salary ?? DEFAULT_DATA.income.nidhi.salary),
        bonus: monthIncome.nidhi?.bonus ?? 0,
      },
    };

    // SIPs and fixed expenses: use the month's own saved value if set (non-null),
    // otherwise fall back to global — so future months inherit current values
    // but past months keep their own locked-in values.
    const sips = expJson.data?.sips ?? global.sips ?? DEFAULT_DATA.sips;

    // Fixed expenses are global — all months always use the same list from /api/income.
    // Editing fixed expenses in any month updates the global list for all months.
    const fixedExpenses = global.fixedExpenses ?? DEFAULT_DATA.fixedExpenses;

    return { ...DEFAULT_DATA, ...expJson.data, income, sips, fixedExpenses, month };
  } catch {
    return { ...DEFAULT_DATA, month };
  }
}

export async function saveIncome(month, anuragSalary, anuragBonus, nidhiSalary, nidhiBonus) {
  try {
    // Salary saved globally — used as default for future months that haven't set their own.
    await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anurag: { salary: anuragSalary },
        nidhi:  { salary: nidhiSalary  },
      }),
    });
    // Salary + bonus both saved in monthly data — locks income to this specific month.
    // This prevents a future global salary change from retroactively altering past months.
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
        month,
        income: {
          anurag: { salary: anuragSalary, bonus: anuragBonus },
          nidhi:  { salary: nidhiSalary,  bonus: nidhiBonus  },
        },
      }),
    });
  } catch (e) {
    console.error('saveIncome failed', e);
  }
}

// Save fields that carry forward globally (sips, fixedExpenses).
export async function saveGlobalDefaults(payload) {
  try {
    await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('saveGlobalDefaults failed', e);
  }
}

export async function saveExpensesData(month, payload) {
  // payload can be any subset of the expenses object:
  // { income, sips, expenses, categories, fixedExpenses, creditCards, accounts, aiInsights }
  try {
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', month, ...payload }),
    });
  } catch (e) {
    console.error('saveExpensesData failed', e);
  }
}
