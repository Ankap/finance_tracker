import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

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

// On first deployment, seed KV from the bundled read-only JSON files in /data.
async function seedAllFromFiles() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(dataDir)) return;
    const files = fs.readdirSync(dataDir)
      .filter(f => f.startsWith('assets_') && f.endsWith('.json'))
      .sort();
    for (const file of files) {
      const monthKey = file.replace('assets_', '').replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      await kv.set(`assets:${monthKey}`, data);
    }
  } catch (e) {
    console.error('Seed error:', e);
  }
}

// Get or create the current month's KV entry.
async function getOrCreateCurrentMonthData() {
  const monthKey = getCurrentMonthKey();
  let data = await kv.get(`assets:${monthKey}`);

  if (!data) {
    // Try to seed from the bundled JSON file first (handles initial migration).
    const filePath = path.join(process.cwd(), 'data', `assets_${monthKey}.json`);
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      const now = new Date();
      data = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        lastUpdated: now.toISOString(),
        assets: [],
      };
    }
    await kv.set(`assets:${monthKey}`, data);
  }

  return data;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Auto-seed from bundled JSON files on first deployment (KV is empty).
      const keys = await getSortedKeys();
      if (keys.length === 0) {
        await seedAllFromFiles();
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
