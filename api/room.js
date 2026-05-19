const { getRoom, checkTimeouts } = require('../lib/game');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const room = await checkTimeouts(await getRoom());
    res.json(room);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
