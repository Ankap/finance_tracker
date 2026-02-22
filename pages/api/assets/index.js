import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

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

function getSortedFiles() {
  if (!fs.existsSync(dataDir)) return [];
  return fs.readdirSync(dataDir)
    .filter(f => f.startsWith('assets_') && f.endsWith('.json'))
    .sort();
}

function readFileData(monthKey) {
  const filePath = path.join(dataDir, `assets_${monthKey}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Aggregate assets across ALL monthly files — later months overwrite earlier ones
// so each asset reflects its most recently updated value.
function getAllAssetsAggregated() {
  const files = getSortedFiles();
  const assetMap = {};
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    for (const asset of data.assets) {
      assetMap[asset._id] = asset;
    }
  }
  return Object.values(assetMap);
}

function getCurrentMonthFilePath() {
  return path.join(dataDir, `assets_${getCurrentMonthKey()}.json`);
}

// Get or create the current month's file — starts with EMPTY assets.
// Previous months' assets are NOT copied; the GET endpoint aggregates across files.
function getOrCreateCurrentMonthData() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const currentFilePath = getCurrentMonthFilePath();

  if (fs.existsSync(currentFilePath)) {
    return JSON.parse(fs.readFileSync(currentFilePath, 'utf8'));
  }

  const now = new Date();
  const newData = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    lastUpdated: now.toISOString(),
    assets: [],
  };

  fs.writeFileSync(currentFilePath, JSON.stringify(newData, null, 2));
  return newData;
}

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Return all assets aggregated from every monthly file
      const assets = getAllAssetsAggregated();
      return res.status(200).json({ data: assets });
    }

    if (req.method === 'POST') {
      const { action, assetId, value, returnPercentage, name, currentValue, owner } = req.body;

      const fileData = getOrCreateCurrentMonthData();
      const currentFilePath = getCurrentMonthFilePath();

      if (action === 'addSnapshot') {
        // Calculate returnPercentage by comparing to the previous month's value
        const prevMonthData = readFileData(getPreviousMonthKey());
        let calcReturn = returnPercentage || 0;
        if (prevMonthData) {
          const prevAsset = prevMonthData.assets.find(a => a._id === assetId);
          if (prevAsset && prevAsset.currentValue > 0) {
            calcReturn = parseFloat(((value - prevAsset.currentValue) / prevAsset.currentValue * 100).toFixed(2));
          }
        }

        const idx = fileData.assets.findIndex(a => a._id === assetId);
        if (idx >= 0) {
          // Asset already in current month file — update it
          fileData.assets[idx].currentValue = value;
          fileData.assets[idx].monthlySnapshots = [
            ...(fileData.assets[idx].monthlySnapshots || []),
            { value, returnPercentage: calcReturn, date: new Date().toISOString() },
          ];
        } else {
          // Asset not in current month file yet — pull its metadata from the aggregated history
          const allAssets = getAllAssetsAggregated();
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
      fs.writeFileSync(currentFilePath, JSON.stringify(fileData, null, 2));

      return res.status(200).json({ data: { success: true } });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Assets API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
