import { kv } from '@vercel/kv';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseMonthParam(monthStr) {
  const parts = monthStr.trim().split(' ');
  if (parts.length !== 2) return null;
  const [monthName, year] = parts;
  const idx = MONTH_NAMES.indexOf(monthName);
  if (idx === -1) return null;
  return `${year}_${String(idx + 1).padStart(2, '0')}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}_${month}`;
}

function getPreviousMonthKey() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}_${month}`;
}

async function getSortedKeys() {
  const keys = await kv.keys('assets:*');
  return keys.sort();
}

async function readMonthData(monthKey) {
  return await kv.get(`assets:${monthKey}`);
}

// Aggregate assets across ALL monthly KV entries — later months overwrite earlier ones.
async function getAllAssetsAggregated() {
  const keys = await getSortedKeys();
  const assetMap = {};
  for (const key of keys) {
    const data = await kv.get(key);
    if (data && data.assets) {
      for (const asset of data.assets) {
        assetMap[asset._id] = asset;
      }
    }
  }
  return Object.values(assetMap);
}

// Return assets for a specific month by aggregating all entries up to and including
// that month. Later months overwrite earlier ones so each asset appears once with
// its most-recent-known value. This ensures assets added in prior months are always
// included (carry-forward), and a month that only updated some assets still shows
// all previously-added assets with their last recorded values.
async function getAssetsForMonth(monthKey) {
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

// Get or create the current month's KV entry.
async function getOrCreateCurrentMonthData() {
  const monthKey = getCurrentMonthKey();
  let data = await kv.get(`assets:${monthKey}`);

  if (!data) {
    const now = new Date();
    data = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      lastUpdated: now.toISOString(),
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
      const { action, assetId, value, returnPercentage, name, currentValue, owner } = req.body;

      const monthKey = getCurrentMonthKey();
      const fileData = await getOrCreateCurrentMonthData();

      if (action === 'addSnapshot') {
        // Calculate returnPercentage by comparing to the previous month's value.
        const prevMonthData = await readMonthData(getPreviousMonthKey());
        let calcReturn = returnPercentage || 0;
        if (prevMonthData) {
          const prevAsset = prevMonthData.assets.find(a => a._id === assetId);
          if (prevAsset && prevAsset.currentValue > 0) {
            calcReturn = parseFloat(((value - prevAsset.currentValue) / prevAsset.currentValue * 100).toFixed(2));
          }
        }

        const idx = fileData.assets.findIndex(a => a._id === assetId);
        if (idx >= 0) {
          // Asset already in current month entry — update it.
          fileData.assets[idx].currentValue = value;
          fileData.assets[idx].monthlySnapshots = [
            ...(fileData.assets[idx].monthlySnapshots || []),
            { value, returnPercentage: calcReturn, date: new Date().toISOString() },
          ];
        } else {
          // Asset not in current month yet — pull metadata from the aggregated history.
          const allAssets = await getAllAssetsAggregated();
          const existing = allAssets.find(a => a._id === assetId);
          if (existing) {
            fileData.assets.push({
              _id: existing._id,
              name: existing.name,
              owner: existing.owner,
              accountDetails: existing.accountDetails || '',
              currentValue: value,
              monthlySnapshots: [{ value, returnPercentage: calcReturn, date: new Date().toISOString() }],
            });
          }
        }
      } else if (action === 'create') {
        const newId = String(Date.now());
        fileData.assets.push({
          _id: newId,
          name,
          currentValue,
          owner,
          accountDetails: '',
          monthlySnapshots: [{ value: currentValue, returnPercentage: 0, date: new Date().toISOString() }],
        });
      } else if (action === 'update') {
        // Update metadata (name, owner, accountDetails) across ALL monthly entries so history stays consistent.
        const { assetId: updateId, name: newName, owner: newOwner, accountDetails: newDetails } = req.body;
        const allKeys = await getSortedKeys();
        for (const key of allKeys) {
          const monthData = await kv.get(key);
          if (monthData?.assets) {
            const idx = monthData.assets.findIndex(a => a._id === updateId);
            if (idx >= 0) {
              if (newName !== undefined)    monthData.assets[idx].name           = newName;
              if (newOwner !== undefined)   monthData.assets[idx].owner          = newOwner;
              if (newDetails !== undefined) monthData.assets[idx].accountDetails = newDetails;
              await kv.set(key, { ...monthData, lastUpdated: new Date().toISOString() });
            }
          }
        }
        return res.status(200).json({ data: { success: true } });
      } else if (action === 'delete') {
        const { assetId } = req.body;
        // Remove the asset from every monthly KV entry
        const allKeys = await getSortedKeys();
        for (const key of allKeys) {
          const monthData = await kv.get(key);
          if (monthData && monthData.assets) {
            const filtered = monthData.assets.filter(a => a._id !== assetId);
            if (filtered.length !== monthData.assets.length) {
              await kv.set(key, { ...monthData, assets: filtered, lastUpdated: new Date().toISOString() });
            }
          }
        }
        return res.status(200).json({ data: { success: true } });
      }

      fileData.lastUpdated = new Date().toISOString();
      await kv.set(`assets:${monthKey}`, fileData);

      return res.status(200).json({ data: { success: true } });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Assets API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
