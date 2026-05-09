import OpenAI from 'openai';
import { kv } from '@vercel/kv';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const MODEL       = 'gpt-4.1-mini';
const MAX_TOKENS  = 800;
const TEMPERATURE = 0.5;

// ─── TOOLS ───────────────────────────────────────────────────────────────────
// Add OpenAI function-calling tools here. Leave the array empty for none.
//
// Example tool shape:
// {
//   type: 'function',
//   function: {
//     name: 'send_reminder',
//     description: 'Send a financial reminder to the user',
//     parameters: {
//       type: 'object',
//       properties: {
//         message: { type: 'string', description: 'Reminder text' },
//       },
//       required: ['message'],
//     },
//   },
// },
const TOOLS = [];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function sendSSE(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function thinking(res, step) {
  sendSSE(res, { type: 'thinking', step });
}

function fmt(amount) {
  return amount != null ? `₹${Number(amount).toLocaleString('en-IN')}` : 'N/A';
}

function monthKey(monthsAgo = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── FETCH FINANCIAL DATA FROM KV ────────────────────────────────────────────
async function fetchFinancialData(res) {
  thinking(res, 'Reading your financial data...');

  const [assetKeys, networthKeys, goals, income, currMonth, prevMonth] = await Promise.all([
    kv.keys('assets:*').catch(() => []),
    kv.keys('networth:*').catch(() => []),
    kv.get('goals:all').catch(() => []),
    kv.get('income').catch(() => null),
    kv.get(`expenses:${monthKey(0)}`).catch(() => null),
    kv.get(`expenses:${monthKey(1)}`).catch(() => null),
  ]);

  thinking(res, 'Analysing portfolio & wealth...');

  // Build latest snapshot per asset (later months overwrite earlier ones)
  const assetMap = {};
  for (const key of (assetKeys || []).sort()) {
    const data = await kv.get(key);
    if (data?.assets) {
      for (const asset of data.assets) assetMap[asset._id] = asset;
    }
  }
  const assets = Object.values(assetMap);
  const netWorth = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);

  // Load historical networth records (one per month, stored by saveNetworthSnapshot)
  const networthHistory = [];
  for (const key of (networthKeys || []).sort()) {
    const record = await kv.get(key);
    if (record) networthHistory.push(record);
  }

  thinking(res, 'Checking goals & expenses...');

  const globalIncome  = income || {};
  const sips          = currMonth?.sips ?? globalIncome.sips ?? 0;
  const fixedExpenses = currMonth?.fixedExpenses ?? globalIncome.fixedExpenses ?? [];

  const calcMonth = (data) => {
    if (!data) return null;
    const totalIncome =
      (globalIncome.anurag?.salary ?? 0) +
      (globalIncome.nidhi?.salary  ?? 0) +
      (data.income?.anurag?.bonus  ?? 0) +
      (data.income?.nidhi?.bonus   ?? 0);
    const fixedTotal = (fixedExpenses || []).reduce((s, f) => s + (f.amount || 0), 0);
    const ccTotal    = (data.creditCards || []).reduce((s, c) => s + (c.spend || 0), 0);
    const catTotal   = (data.categories  || []).reduce((s, c) => s + (c.amount || 0), 0);
    const accExp     = data.expenses || {};
    const totalExpenses = (accExp.joint || 0) + (accExp.anurag || 0) + (accExp.nidhi || 0)
                        + fixedTotal + (sips || 0) + catTotal;
    const savings     = totalIncome - totalExpenses - ccTotal;
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
    return {
      totalIncome, totalExpenses, ccTotal, savings, savingsRate,
      sips, fixedExpenses,
      categories: data.categories,
      creditCards: data.creditCards,
      accounts:    data.accounts,
      monthLabel:  data.monthLabel,
    };
  };

  thinking(res, 'Building personalised context...');

  return {
    today:          new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    currentMonth:   new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
    netWorth,
    networthHistory,
    assets: assets.map(a => ({
      name:    a.name,
      owner:   a.owner,
      value:   a.currentValue,
      account: a.accountDetails,
      recentSnapshots: (a.monthlySnapshots || []).slice(-3),
    })),
    income: {
      anuragSalary:  globalIncome.anurag?.salary ?? 0,
      nidhiSalary:   globalIncome.nidhi?.salary  ?? 0,
      sips,
      fixedExpenses: (fixedExpenses || []).map(f => ({ name: f.name, amount: f.amount })),
    },
    currentMonthExpenses:  calcMonth(currMonth),
    previousMonthExpenses: calcMonth(prevMonth),
    goals: Array.isArray(goals) ? goals.map(g => ({
      name:      g.name,
      category:  g.category,
      target:    g.targetAmount,
      saved:     g.currentAmount,
      progress:  Math.round(Math.min((g.currentAmount / g.targetAmount) * 100, 100)),
      remaining: Math.max(g.targetAmount - g.currentAmount, 0),
      deadline:  g.deadline,
      status:    g.status,
      priority:  g.priority,
    })) : [],
  };
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
// This is what NestChat "knows" before every conversation.
// Edit the text inside the return statement to change its personality or rules.
function buildSystemPrompt(data) {
  const { today, currentMonth, netWorth, networthHistory, assets, income, goals } = data;
  const curr = data.currentMonthExpenses;
  const prev = data.previousMonthExpenses;

  const assetLines = assets.map(a =>
    `  - ${a.name} (${a.owner}): ${fmt(a.value)}${a.account ? ` — ${a.account}` : ''}`
  ).join('\n') || '  No assets recorded yet.';

  const networthHistoryLines = networthHistory.length > 0
    ? networthHistory.map(r => {
        const label = new Date(`${r.date}-01`).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        return `  - ${label}: ${fmt(r.totalNetWorth)}`;
      }).join('\n')
    : '  No historical data yet.';

  const goalLines = goals.map(g =>
    `  - ${g.name}: ${fmt(g.saved)} / ${fmt(g.target)} (${g.progress}%, ${g.status})${g.deadline ? `, target ${g.deadline}` : ''}`
  ).join('\n') || '  No goals added yet.';

  const currSection = curr ? `
Current month (${currentMonth}):
  Income:         ${fmt(curr.totalIncome)}
  Expenses:       ${fmt(curr.totalExpenses)}
  Credit Cards:   ${fmt(curr.ccTotal)}
  Savings:        ${fmt(curr.savings)} (${curr.savingsRate}% rate)
  SIPs:           ${fmt(curr.sips)}
  Fixed Expenses: ${(curr.fixedExpenses || []).map(f => `${f.name} ${fmt(f.amount)}`).join(', ') || 'none'}
  Categories:     ${(curr.categories   || []).map(c => `${c.name || c.category} ${fmt(c.amount)}`).join(', ') || 'none'}
  Credit Cards:   ${(curr.creditCards  || []).map(c => `${c.name || c.bank} ${fmt(c.spend)}`).join(', ') || 'none'}`
  : 'No expense data for current month.';

  const prevSection = prev
    ? `\nPrevious month:\n  Income: ${fmt(prev.totalIncome)}, Expenses: ${fmt(prev.totalExpenses)}, Savings Rate: ${prev.savingsRate}%`
    : '';

  // ── EDIT PROMPT BELOW ─────────────────────────────────────────────────────
  return `You are NestChat, a personal AI finance advisor for Anurag & Nidhi (an Indian family).

TODAY: ${today}

━━━ REAL FINANCIAL DATA ━━━

NET WORTH: ${fmt(netWorth)} across ${assets.length} assets

NET WORTH HISTORY (by month):
${networthHistoryLines}

ASSETS (current):
${assetLines}

INCOME (monthly base):
  Anurag: ${fmt(income.anuragSalary)} | Nidhi: ${fmt(income.nidhiSalary)}
  SIPs: ${fmt(income.sips)}
  Fixed expenses: ${income.fixedExpenses.map(f => `${f.name} ${fmt(f.amount)}`).join(', ') || 'none'}

EXPENSES:
${currSection}${prevSection}

GOALS:
${goalLines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUCTIONS:
- Answer ONLY using the data above. Never invent numbers.
- If data for a question is missing, say so honestly and suggest adding it.
- Be concise and conversational. Simple questions: 2-3 sentences. Analysis: structured with key numbers.
- Format Indian currency naturally: ₹50,000 or ₹5L or ₹1.2Cr.
- Refer to them by name (Anurag & Nidhi) for a personal touch.
- Remember conversation history and build on earlier points.
- Vary your tone — do not repeat the same caveat every message.`;
  // ── END PROMPT ─────────────────────────────────────────────────────────────
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const { messages = [] } = req.body;

    // Step 1 — load all financial data and build the prompt
    const financialData = await fetchFinancialData(res);
    const systemPrompt  = buildSystemPrompt(financialData);

    thinking(res, 'Generating your answer...');

    // Step 2 — call OpenAI with the full conversation history
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const stream = await openai.chat.completions.create({
      model:      MODEL,
      messages:   chatMessages,
      tools:      TOOLS.length > 0 ? TOOLS : undefined,
      stream:     true,
      temperature: TEMPERATURE,
      max_tokens:  MAX_TOKENS,
    });

    // Step 3 — stream tokens back to the client
    sendSSE(res, { type: 'stream_start' });
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) sendSSE(res, { type: 'text', content: token });
    }
    sendSSE(res, { type: 'done' });

  } catch (err) {
    console.error('NestChat error:', err);
    sendSSE(res, { type: 'error', message: err.message });
  }

  res.end();
}
