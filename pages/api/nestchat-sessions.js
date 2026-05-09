import { kv } from '@vercel/kv';

const INDEX_KEY = 'chat:session:index';

async function getIndex() {
  return (await kv.get(INDEX_KEY).catch(() => null)) || [];
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      if (id) {
        const session = await kv.get(`chat:session:${id}`);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        return res.status(200).json({ data: session });
      }
      const index = await getIndex();
      return res.status(200).json({ data: index });
    }

    if (req.method === 'POST') {
      const { action, id, title, messages } = req.body;

      if (action === 'save') {
        const now = new Date().toISOString();
        const session = { id, title, updatedAt: now, messages };

        // Preserve original createdAt if session already exists
        const existing = await kv.get(`chat:session:${id}`).catch(() => null);
        session.createdAt = existing?.createdAt || now;

        await kv.set(`chat:session:${id}`, session);

        // Update index (newest first)
        const index = await getIndex();
        const idx = index.findIndex(s => s.id === id);
        const summary = { id, title, createdAt: session.createdAt, updatedAt: now, messageCount: messages.length };
        if (idx >= 0) {
          index[idx] = summary;
        } else {
          index.unshift(summary);
        }
        // Keep at most 50 sessions in the index
        await kv.set(INDEX_KEY, index.slice(0, 50));
        return res.status(200).json({ data: { success: true, id } });
      }

      if (action === 'delete') {
        await kv.del(`chat:session:${id}`).catch(() => {});
        const index = (await getIndex()).filter(s => s.id !== id);
        await kv.set(INDEX_KEY, index);
        return res.status(200).json({ data: { success: true } });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Chat sessions API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
