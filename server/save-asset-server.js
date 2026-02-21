const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json({ limit: '1mb' }));

// Simple CORS for local dev
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const STORE_DIR = path.join(__dirname, '..', 'store');

if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

app.post('/assets', (req, res) => {
  try {
    const asset = req.body;
    if (!asset || !asset._id) return res.status(400).json({ error: 'Invalid asset payload' });

    const filename = `asset-${asset._id}.json`;
    const filepath = path.join(STORE_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(asset, null, 2), 'utf8');

    return res.json({ success: true, file: filepath });
  } catch (err) {
    console.error('Failed to save asset file', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
});

app.get('/assets', (_req, res) => {
  try {
    const files = fs.readdirSync(STORE_DIR).filter(f => f.endsWith('.json'));
    const assets = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(STORE_DIR, f), 'utf8'));
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    return res.json(assets);
  } catch (err) {
    console.error('Failed to read assets', err);
    return res.status(500).json({ error: 'Failed to read assets' });
  }
});

app.get('/assets/:id', (req, res) => {
  try {
    const id = req.params.id;
    const filename = `asset-${id}.json`;
    const filepath = path.join(STORE_DIR, filename);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });
    const asset = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    return res.json(asset);
  } catch (err) {
    console.error('Failed to read asset', err);
    return res.status(500).json({ error: 'Failed to read asset' });
  }
});

app.put('/assets/:id', (req, res) => {
  try {
    const id = req.params.id;
    const asset = req.body;
    if (!asset) return res.status(400).json({ error: 'Invalid payload' });
    const filename = `asset-${id}.json`;
    const filepath = path.join(STORE_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(asset, null, 2), 'utf8');
    return res.json({ success: true, file: filepath });
  } catch (err) {
    console.error('Failed to update asset', err);
    return res.status(500).json({ error: 'Failed to update' });
  }
});

app.delete('/assets/:id', (req, res) => {
  try {
    const id = req.params.id;
    const filename = `asset-${id}.json`;
    const filepath = path.join(STORE_DIR, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete asset', err);
    return res.status(500).json({ error: 'Failed to delete' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Save-asset server listening on port ${PORT}`));
