import { kv } from '@vercel/kv';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseMonthParam(monthStr) {
  if (/^\d{4}_\d{2}$/.test(monthStr.trim())) return monthStr.trim();
  const parts = monthStr.trim().split(' ');
  if (parts.length !== 2) return null;
  const [monthName, year] = parts;
  const idx = MONTH_NAMES.indexOf(monthName);
  if (idx === -1) return null;
  return `${year}_${String(idx + 1).padStart(2, '0')}`;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { month } = req.query;

      if (month) {
        const monthKey = parseMonthParam(month);
        if (!monthKey) return res.status(400).json({ error: 'Invalid month format. Use "YYYY_MM" or "Month YYYY".' });
        const data = await kv.get(`networth:${monthKey}`);
        if (!data) return res.status(404).json({ error: `No networth data found for ${month}.` });
        return res.status(200).json({ data });
      }

      // Return all months sorted chronologically
      const keys = await kv.keys('networth:*');
      const sorted = keys.sort();
      const results = await Promise.all(sorted.map(k => kv.get(k)));
      return res.status(200).json({ data: results.filter(Boolean) });
    }

    if (req.method === 'POST') {
      const { month, totalNetWorth, breakdown } = req.body;
      if (!month || totalNetWorth == null) {
        return res.status(400).json({ error: 'month and totalNetWorth are required.' });
      }
      const monthKey = parseMonthParam(month);
      if (!monthKey) {
        return res.status(400).json({ error: 'Invalid month format. Use "YYYY_MM" or "Month YYYY".' });
      }
      const [year, mo] = monthKey.split('_').map(Number);
      const record = {
        year,
        month: mo,
        date: `${year}-${String(mo).padStart(2, '0')}`,
        monthKey,
        totalNetWorth: Number(totalNetWorth),
        breakdown: breakdown || {},
        lastUpdated: new Date().toISOString(),
      };
      await kv.set(`networth:${monthKey}`, record);
      return res.status(200).json({ data: record });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Networth API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
