const { startNextRound } = require('../lib/game');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { playerId } = req.body;
    const room = await startNextRound(playerId);
    res.json({ ok: true, room });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
