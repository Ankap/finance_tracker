import { kv } from '@vercel/kv';

const GOALS_KEY = 'goals:all';

async function readGoals() {
  const data = await kv.get(GOALS_KEY);
  return Array.isArray(data) ? data : [];
}

async function writeGoals(goals) {
  await kv.set(GOALS_KEY, goals);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const goals = await readGoals();
      return res.status(200).json({ data: goals });
    }

    if (req.method === 'POST') {
      const { action, goal } = req.body;
      const goals = await readGoals();

      if (action === 'create') {
        const newGoal = { ...goal, _id: String(Date.now()) };
        goals.push(newGoal);
        await writeGoals(goals);
        return res.status(200).json({ data: newGoal });
      }

      if (action === 'update') {
        const idx = goals.findIndex(g => g._id === goal._id);
        if (idx === -1) return res.status(404).json({ error: 'Goal not found' });
        goals[idx] = { ...goals[idx], ...goal };
        await writeGoals(goals);
        return res.status(200).json({ data: goals[idx] });
      }

      if (action === 'delete') {
        const { id } = req.body;
        const filtered = goals.filter(g => g._id !== id);
        await writeGoals(filtered);
        return res.status(200).json({ data: { success: true } });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Goals API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
