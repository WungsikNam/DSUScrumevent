const { getWeeklyLeaderboard, isoWeekKey } = require('../lib/game');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    let week = typeof req.query.week === 'string' ? req.query.week.trim() : '';
    if (week && !/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/i.test(week)) {
      return res.status(400).json({ error: 'Invalid week format' });
    }
    week = week || isoWeekKey();
    const leaders = await getWeeklyLeaderboard(week, req.query.limit ? Number(req.query.limit) : 50);
    res.json({ week, leaders });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
