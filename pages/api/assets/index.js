import { kv } from '@vercel/kv';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseMonthParam(monthStr) {
  if (!monthStr) return null;
  const s = monthStr.trim();
  if (/^\d{4}_\d{2}$/.test(s)) return s;
  const parts = s.split(' ');
  if (parts.length !== 2) return null;
  const [monthName, year] = parts;
  const idx = MONTH_NAMES.indexOf(monthName);
  if (idx === -1) return null;
  return `${year}_${String(idx + 1).padStart(2, '0')}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function getSortedKeys() {
  const keys = await kv.keys('assets:*');
  return keys.sort();
}

async function getAllAssetsAggregated() {
  const keys = await getSortedKeys();
  const assetMap = {};
  for (const key of keys) {
    const data = await kv.get(key);
    if (data?.assets) {
      for (const asset of data.assets) {
        assetMap[asset._id] = asset;
      }
    }
  }
  return Object.values(assetMap);
}

// Strict: return only assets explicitly stored for the given month.
async function getAssetsForMonth(monthKey) {
  const data = await kv.get(`assets:${monthKey}`);
  return data?.assets ?? [];
}

// Carry-forward: aggregate all entries up to and including monthKey.
// Used only for networth snapshot so it reflects all known asset values.
async function getAssetsCarryForward(monthKey) {
  const allKeys = await getSortedKeys();
  const targetKey = `assets:${monthKey}`;
  const priorKeys = allKeys.filter(k => k <= targetKey);
  if (priorKeys.length === 0) return [];
  const assetMap = {};
  for (const key of priorKeys) {
    const d = await kv.get(key);
    if (d?.assets) {
      for (const asset of d.assets) {
        assetMap[asset._id] = asset;
      }
    }
  }
  return Object.values(assetMap);
}

async function saveNetworthSnapshot(monthKey) {
  const assets = await getAssetsCarryForward(monthKey);
  const totalNetWorth = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const breakdown = {};
  for (const asset of assets) {
    breakdown[asset.name] = (breakdown[asset.name] || 0) + (asset.currentValue || 0);
  }
  const [year, mo] = monthKey.split('_').map(Number);
  await kv.set(`networth:${monthKey}`, {
    year, month: mo,
    date: `${year}-${String(mo).padStart(2, '0')}`,
    monthKey, totalNetWorth, breakdown,
    lastUpdated: new Date().toISOString(),
  });
}

async function getOrCreateMonthData(monthKey) {
  let data = await kv.get(`assets:${monthKey}`);
  if (!data) {
    const [year, month] = monthKey.split('_').map(Number);
    data = {
      year, month,
      date: `${year}-${String(month).padStart(2, '0')}`,
      lastUpdated: new Date().toISOString(),
      assets: [],
    };
    await kv.set(`assets:${monthKey}`, data);
  }
  return data;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { month } = req.query;
      if (month) {
        const monthKey = parseMonthParam(month);
        if (!monthKey) return res.status(400).json({ error: 'Invalid month format' });
        const assets = await getAssetsForMonth(monthKey);
        return res.status(200).json({ data: assets });
      }
      const assets = await getAllAssetsAggregated();
      return res.status(200).json({ data: assets });
    }

    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'addSnapshot') {
        const { assetId, value, principalAmount, month } = req.body;
        const monthKey = parseMonthParam(month) || getCurrentMonthKey();
        const fileData = await getOrCreateMonthData(monthKey);

        const idx = fileData.assets.findIndex(a => a._id === assetId);
        if (idx >= 0) {
          fileData.assets[idx].currentValue = value;
          if (principalAmount !== undefined) fileData.assets[idx].principalAmount = principalAmount;
        } else {
          const allAssets = await getAllAssetsAggregated();
          const existing = allAssets.find(a => a._id === assetId);
          if (existing) {
            fileData.assets.push({
              _id: existing._id,
              name: existing.name,
              owner: existing.owner,
              accountDetails: existing.accountDetails || '',
              principalAmount: principalAmount ?? existing.principalAmount ?? 0,
              currentValue: value,
            });
          }
        }

        fileData.lastUpdated = new Date().toISOString();
        await kv.set(`assets:${monthKey}`, fileData);
        await saveNetworthSnapshot(monthKey);
        return res.status(200).json({ data: { success: true } });
      }

      if (action === 'create') {
        const { name, currentValue, owner, accountDetails, principalAmount } = req.body;
        const monthKey = getCurrentMonthKey();
        const fileData = await getOrCreateMonthData(monthKey);
        const newId = String(Date.now());
        fileData.assets.push({
          _id: newId,
          name,
          owner,
          accountDetails: accountDetails || '',
          principalAmount: principalAmount ?? 0,
          currentValue,
        });
        fileData.lastUpdated = new Date().toISOString();
        await kv.set(`assets:${monthKey}`, fileData);
        await saveNetworthSnapshot(monthKey);
        return res.status(200).json({ data: { success: true } });
      }

      if (action === 'update') {
        const { assetId, name, owner, accountDetails } = req.body;
        const allKeys = await getSortedKeys();
        for (const key of allKeys) {
          const monthData = await kv.get(key);
          if (monthData?.assets) {
            const idx = monthData.assets.findIndex(a => a._id === assetId);
            if (idx >= 0) {
              if (name !== undefined)           monthData.assets[idx].name           = name;
              if (owner !== undefined)          monthData.assets[idx].owner          = owner;
              if (accountDetails !== undefined) monthData.assets[idx].accountDetails = accountDetails;
              await kv.set(key, { ...monthData, lastUpdated: new Date().toISOString() });
            }
          }
        }
        return res.status(200).json({ data: { success: true } });
      }

      if (action === 'delete') {
        const { assetId } = req.body;
        const allKeys = await getSortedKeys();
        for (const key of allKeys) {
          const monthData = await kv.get(key);
          if (monthData?.assets) {
            const filtered = monthData.assets.filter(a => a._id !== assetId);
            if (filtered.length !== monthData.assets.length) {
              await kv.set(key, { ...monthData, assets: filtered, lastUpdated: new Date().toISOString() });
            }
          }
        }
        return res.status(200).json({ data: { success: true } });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Assets API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
