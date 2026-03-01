import OpenAI from 'openai';
import { kv } from '@vercel/kv';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Fetch all monthly asset KV entries sorted oldest → newest
async function getAllMonthlyData() {
  try {
    const keys = await kv.keys('assets:*');
    if (!keys || keys.length === 0) return [];
    const sorted = keys.sort();
    const entries = [];
    for (const key of sorted) {
      const data = await kv.get(key);
      if (data && data.assets && data.assets.length > 0) {
        entries.push({ key, ...data });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

// Fetch goals from KV
async function getGoals() {
  try {
    const data = await kv.get('goals:all');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  try {
    const [monthlyEntries, goals] = await Promise.all([
      getAllMonthlyData(),
      getGoals(),
    ]);

    if (monthlyEntries.length === 0 && goals.length === 0) {
      return res.status(200).json({
        insights: {
          wealthInsights: [{
            title: 'No data available yet',
            text: 'Add your assets in the Update Data tab to start generating AI insights.',
            detail: null,
            sentiment: 'neutral',
          }],
          savingsInsights: [],
          goalsInsights: [],
          recommendations: [],
        },
        meta: { generatedAt: new Date().toISOString(), netWorth: 0, dataSource: 'empty' },
      });
    }

    // Build real historical net worth from KV entries
    const netWorthHistory = monthlyEntries.map(entry => {
      const totalNetWorth = entry.assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
      return {
        month: entry.date || entry.key.replace('assets:', '').replace('_', '-'),
        netWorth: totalNetWorth,
        assetCount: entry.assets.length,
      };
    });

    // Current month = last entry (may be null if only goals exist)
    const latestEntry = monthlyEntries.length > 0 ? monthlyEntries[monthlyEntries.length - 1] : null;
    const currentNetWorth = latestEntry
      ? latestEntry.assets.reduce((sum, a) => sum + (a.currentValue || 0), 0)
      : 0;

    // Asset breakdown for current month
    const breakdown = {};
    if (latestEntry) {
      latestEntry.assets.forEach(a => {
        breakdown[a.name] = (breakdown[a.name] || 0) + a.currentValue;
      });
    }

    // Month-over-month change (only if we have 2+ months)
    let netWorthChange = null;
    let netWorthChangePct = null;
    if (netWorthHistory.length >= 2) {
      const prev = netWorthHistory[netWorthHistory.length - 2].netWorth;
      netWorthChange = currentNetWorth - prev;
      netWorthChangePct = prev > 0 ? ((netWorthChange / prev) * 100).toFixed(1) : null;
    }

    // Build the financial context with ONLY real data
    const financialData = {
      dataNote: 'All numbers below come directly from the user\'s actual database. Do not invent or reference any numbers not present here.',
      currentAssets: latestEntry ? latestEntry.assets.map(a => ({
        name: a.name,
        currentValue: a.currentValue,
        owner: a.owner || 'Unknown',
        monthlySnapshots: (a.monthlySnapshots || []).slice(-3),
      })) : [],
      currentNetWorth: currentNetWorth || 0,
      assetBreakdown: breakdown,
      assetCount: latestEntry ? latestEntry.assets.length : 0,
      monthsOfData: netWorthHistory.length,
      netWorthHistory: netWorthHistory.length > 1 ? netWorthHistory : null,
      netWorthChange: netWorthChange !== null ? {
        amount: netWorthChange,
        percentage: netWorthChangePct,
        direction: netWorthChange >= 0 ? 'increase' : 'decrease',
      } : null,
      goals: goals.length > 0 ? goals.map(g => ({
        name: g.name,
        category: g.category,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        progressPercent: Math.round(Math.min((g.currentAmount / g.targetAmount) * 100, 100)),
        deadline: g.deadline,
        status: g.status,
        priority: g.priority,
        remaining: Math.max(g.targetAmount - g.currentAmount, 0),
      })) : null,
    };

    const prompt = `You are a personal finance advisor for an Indian family. Analyze ONLY the data provided below — do not invent, assume, or reference any numbers that are not explicitly present in this data. All amounts are in Indian Rupees (₹).

REAL FINANCIAL DATA FROM DATABASE:
${JSON.stringify(financialData, null, 2)}

Generate a JSON response with exactly this structure:
{
  "wealthInsights": [
    {
      "title": "short title (5-8 words)",
      "text": "1-2 sentences using only numbers from the data above",
      "detail": "1-2 sentences of context or analysis",
      "sentiment": "positive | warning | neutral"
    }
  ],
  "savingsInsights": [
    { "title": "...", "text": "...", "detail": "...", "sentiment": "positive | warning | neutral" }
  ],
  "goalsInsights": [
    { "title": "...", "text": "...", "detail": "...", "sentiment": "positive | warning | neutral" }
  ],
  "recommendations": [
    { "heading": "short action-oriented heading", "body": "2-3 sentences of actionable advice" }
  ]
}

Rules:
- CRITICAL: Only use numbers that appear in the FINANCIAL DATA above. Never hallucinate figures.
- If there is only 1 month of data, do not make month-over-month comparisons — acknowledge it's a baseline.
- If netWorthHistory is null, there is no historical data to compare against.
- wealthInsights: 2-3 insights about current assets, net worth, portfolio composition
- savingsInsights: 1-2 insights. If no income/expense data exists in the data, acknowledge it is not yet tracked and recommend adding it.
- goalsInsights: 1-3 insights. If goals data exists, analyse progress, highlight behind/ahead goals, and compute months remaining. If no goals data, recommend setting financial goals.
- recommendations: 2-3 concrete suggestions based only on what is actually present in the data.
- Keep tone encouraging but honest.
- Respond with ONLY valid JSON, no markdown, no explanation`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('OpenAI did not return valid JSON. Raw: ' + raw.slice(0, 200));
    const insights = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      insights,
      meta: {
        generatedAt: new Date().toISOString(),
        netWorth: currentNetWorth,
        monthsOfData: netWorthHistory.length,
        dataSource: 'live',
      },
    });
  } catch (err) {
    console.error('AI Insights error:', err);
    return res.status(500).json({ error: 'Failed to generate insights', details: err.message });
  }
}
