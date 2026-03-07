export async function getExpensesData(month) {
  // TODO: replace with real DB query e.g. prisma.monthlySnapshot.findFirst({ where: { month } })
  return {
    month,
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
      { id: "fe2", label: "Car Insurance", amount: 4500 },
    ],
    creditCards: [
      { id: "cc1", cardName: "HDFC Regalia",    owner: "anurag", spend: 16500 },
      { id: "cc2", cardName: "ICICI Sapphiro",  owner: "nidhi",  spend: 14200 },
    ],
    aiInsights: [
      "Shopping is up 30% — driven by Nidhi's credit card (Zara, Amazon, Nykaa). Worth a quick check.",
      "Savings rate is 43% this month — above your 40% target. Good month.",
      "After SIPs of ₹45k, you have ₹1.06L free to deploy toward your house fund.",
      "Anurag's account closes at ₹2.09L. Consider moving ₹1L to joint for the house fund.",
    ],
  };
}

export async function saveIncome(month, anuragSalary, anuragBonus, nidhiSalary, nidhiBonus) {
  // TODO: persist to DB
  console.log("saveIncome", { month, anuragSalary, anuragBonus, nidhiSalary, nidhiBonus });
}
