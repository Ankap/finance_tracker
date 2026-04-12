import { kv } from '@vercel/kv';

function getMonthKey(date) {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}_${month}`;
}

function getCurrentMonthKey() {
  return getMonthKey(new Date());
}

function monthLabelToKey(label) {
  // Convert "March 2026" → "2026_03"
  const d = new Date(`1 ${label}`);
  if (isNaN(d)) return null;
  return getMonthKey(d);
}

// Get or create the data entry for a given month key.
async function getOrCreateMonthData(monthKey) {
  let data = await kv.get(`expenses:${monthKey}`);

  if (!data) {
    const [year, month] = monthKey.split('_').map(Number);
    const monthLabel = new Date(year, month - 1, 1)
      .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    data = {
      year,
      month,
      monthLabel,
      lastUpdated: new Date().toISOString(),
      income: { anurag: { salary: 0, bonus: 0 }, nidhi: { salary: 0, bonus: 0 } },
      sips: null,
      expenses: { joint: 0, anurag: 0, nidhi: 0 },
      lastMonthExpenses: 0,
      accounts: {},
      categories: [],
      fixedExpenses: null,
      creditCards: [],
      aiInsights: [],
    };
    await kv.set(`expenses:${monthKey}`, data);
  }

  return data;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { month } = req.query; // optional "March 2026" label or "2026_03" key

      let monthKey;
      if (month) {
        // Accept either "2026_03" or "March 2026"
        monthKey = month.includes('_') ? month : monthLabelToKey(month);
        if (!monthKey) return res.status(400).json({ error: 'Invalid month format' });
      } else {
        monthKey = getCurrentMonthKey();
      }

      const data = await getOrCreateMonthData(monthKey);
      return res.status(200).json({ data });
    }

    if (req.method === 'POST') {
      const { action, month, ...fields } = req.body;

      let monthKey;
      if (month) {
        monthKey = month.includes('_') ? month : monthLabelToKey(month);
        if (!monthKey) return res.status(400).json({ error: 'Invalid month format' });
      } else {
        monthKey = getCurrentMonthKey();
      }

      const data = await getOrCreateMonthData(monthKey);

      if (action === 'save') {
        const { month: _m, action: _a, ...snapshot } = req.body;

        // Merge categories by account so uploading one account doesn't wipe others.
        if (snapshot.categories && Array.isArray(snapshot.categories) && snapshot.categories.length > 0) {
          const incomingAccounts = new Set(snapshot.categories.map(c => c.account).filter(Boolean));
          if (incomingAccounts.size > 0) {
            const kept = (data.categories || []).filter(c => !incomingAccounts.has(c.account));
            snapshot.categories = [...kept, ...snapshot.categories];
          }
        }

        // Append account moneyIn/moneyOut entries without overriding the whole accounts object.
        if (snapshot.accountEntries && Array.isArray(snapshot.accountEntries)) {
          if (!data.accounts) data.accounts = {};
          for (const entry of snapshot.accountEntries) {
            const { account, entryType, label, amount } = entry;
            if (!data.accounts[account]) {
              const labels = { joint: 'Joint Account', anurag: "Anurag's Account", nidhi: "Nidhi's Account" };
              data.accounts[account] = {
                label: labels[account] || account,
                opening: 0, moneyIn: [], moneyOut: [], ccBillPaid: 0, ccBillNote: null, ccSpends: null,
              };
            }
            const arrKey = entryType === 'moneyIn' ? 'moneyIn' : 'moneyOut';
            if (!Array.isArray(data.accounts[account][arrKey])) data.accounts[account][arrKey] = [];
            data.accounts[account][arrKey].push({ label, amount });
          }
          delete snapshot.accountEntries; // prevent Object.assign from overriding accounts
        }

        Object.assign(data, snapshot);

      } else if (action === 'saveIncome') {
        const { anuragSalary, anuragBonus, nidhiSalary, nidhiBonus } = fields;
        data.income = {
          anurag: { salary: anuragSalary, bonus: anuragBonus },
          nidhi:  { salary: nidhiSalary,  bonus: nidhiBonus  },
        };

      } else if (action === 'saveExpenses') {
        const { joint, anurag, nidhi } = fields;
        if (joint  !== undefined) data.expenses.joint  = joint;
        if (anurag !== undefined) data.expenses.anurag = anurag;
        if (nidhi  !== undefined) data.expenses.nidhi  = nidhi;

      } else if (action === 'saveCategories') {
        data.categories = fields.categories;

      } else if (action === 'saveFixedExpenses') {
        data.fixedExpenses = fields.fixedExpenses;

      } else if (action === 'saveCreditCards') {
        data.creditCards = fields.creditCards;

      } else if (action === 'saveAccounts') {
        data.accounts = fields.accounts;

      } else if (action === 'saveAiInsights') {
        data.aiInsights = fields.aiInsights;

      } else if (action === 'reset') {
        // Wipe the month back to a blank template
        const [y, m] = monthKey.split('_').map(Number);
        const monthLabel = new Date(y, m - 1, 1)
          .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        Object.assign(data, {
          year: y, month: m, monthLabel,
          income: { anurag: { salary: 0, bonus: 0 }, nidhi: { salary: 0, bonus: 0 } },
          sips: 0,
          expenses: { joint: 0, anurag: 0, nidhi: 0 },
          lastMonthExpenses: 0,
          accounts: {
            joint:  { label: 'Joint Account',    opening: 0, moneyIn: [], moneyOut: [], ccBillPaid: 0, ccBillNote: null, ccSpends: null },
            anurag: { label: "Anurag's Account", opening: 0, moneyIn: [], moneyOut: [], ccBillPaid: 0, ccBillNote: null, ccSpends: null },
            nidhi:  { label: "Nidhi's Account",  opening: 0, moneyIn: [], moneyOut: [], ccBillPaid: 0, ccBillNote: null, ccSpends: null },
          },
          categories: [],
          fixedExpenses: null,
          fixedExpensesLocked: false,
          creditCards: [],
          aiInsights: [],
        });

      } else {
        return res.status(400).json({ error: `Unknown action: ${action}` });
      }

      data.lastUpdated = new Date().toISOString();
      await kv.set(`expenses:${monthKey}`, data);

      return res.status(200).json({ data: { success: true } });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Expenses API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
