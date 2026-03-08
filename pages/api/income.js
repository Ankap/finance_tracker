import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const SEED_PATH = path.join(process.cwd(), 'data', 'income.json');

async function getIncomeData() {
  let data = await kv.get('income');
  if (!data) {
    if (fs.existsSync(SEED_PATH)) {
      data = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
    } else {
      data = {
        anurag:        { salary: 0 },
        nidhi:         { salary: 0 },
        sips:          0,
        fixedExpenses: [],
        lastUpdated:   new Date().toISOString(),
      };
    }
    await kv.set('income', data);
  }
  return data;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await getIncomeData();
      return res.status(200).json({ data });
    }

    if (req.method === 'POST') {
      const { anurag, nidhi, sips, fixedExpenses } = req.body;
      const data = await getIncomeData();
      if (anurag         !== undefined) data.anurag        = anurag;
      if (nidhi          !== undefined) data.nidhi         = nidhi;
      if (sips           !== undefined) data.sips          = sips;
      if (fixedExpenses  !== undefined) data.fixedExpenses = fixedExpenses;
      data.lastUpdated = new Date().toISOString();
      await kv.set('income', data);
      return res.status(200).json({ data: { success: true } });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Income API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
