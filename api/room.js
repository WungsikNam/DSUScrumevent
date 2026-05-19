const { getRoom, checkTimeouts, publicRoom } = require('../lib/game');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    let room = await getRoom();
    room = await checkTimeouts(room);
    res.json(publicRoom(room));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
