const { getRedis } = require('./redis');
const { getISOWeek, getISOWeekYear } = require('date-fns');

const ROOM_KEY = 'game:room';
const MAX_ROUNDS = parseInt(process.env.ROUNDS || '3');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const COUNTDOWN_MS = 3000;

function isoWeekKey(d = new Date()) {
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
}

function scoresKey(week) {
  return `game:scores:${week}`;
}

function emptyRoom() {
  return { players: [], state: 'lobby', maxRounds: MAX_ROUNDS, round: 1, goTime: null, times: {}, nextRound: null };
}

async function getRoom() {
  const r = await getRedis().get(ROOM_KEY);
  return r || emptyRoom();
}

async function setRoom(room) {
  await getRedis().set(ROOM_KEY, room);
}

function rankPoints(rank, total) {
  return Math.max(1, total - rank) * 3;
}

async function joinRoom({ playerId, name, hostPassword }) {
  const room = await getRoom();
  if (room.players.find(p => p.id === playerId)) return room;
  const isHost = !!(ADMIN_PASSWORD && hostPassword === ADMIN_PASSWORD);
  room.players.push({ id: playerId, name: String(name).trim().slice(0, 20), score: 0, isHost });
  await setRoom(room);
  return room;
}

async function leaveRoom(playerId) {
  const room = await getRoom();
  room.players = room.players.filter(p => p.id !== playerId);
  await setRoom(room);
  return room;
}

async function startGame(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  if (room.state !== 'lobby') throw new Error('Already started.');
  room.players.forEach(p => { p.score = 0; });
  room.state = 'tensecond';
  room.round = 1;
  room.maxRounds = MAX_ROUNDS;
  room.goTime = Date.now() + COUNTDOWN_MS;
  room.times = {};
  room.activePlayerIds = room.players.map(p => p.id);
  await setRoom(room);
  return room;
}

async function recordStop({ playerId, elapsed }) {
  const room = await getRoom();
  if (room.state !== 'tensecond') return { room, resolved: false };
  const activeIds = room.activePlayerIds || room.players.map(p => p.id);
  if (!activeIds.includes(playerId)) return { room, resolved: false }; // spectator
  if (room.times[playerId] !== undefined) return { room, resolved: false };

  const safe = typeof elapsed === 'number' && isFinite(elapsed) ? Math.max(0, elapsed) : 99999;
  room.times[playerId] = safe;

  const allStopped = activeIds.every(id => room.times[id] !== undefined);
  if (allStopped) {
    return { room: await resolveRound(room), resolved: true };
  }
  await setRoom(room);
  return { room, resolved: false };
}

async function resolveRound(room) {
  if (room.state !== 'tensecond') return room;
  room.state = '_resolving';
  const TARGET = 10000;
  const activeIds = room.activePlayerIds || room.players.map(p => p.id);
  const activePlayers = room.players.filter(p => activeIds.includes(p.id));

  activePlayers.forEach(p => {
    if (room.times[p.id] === undefined) room.times[p.id] = 99999;
  });

  const results = activePlayers.map(p => ({
    id: p.id,
    name: p.name,
    elapsed: room.times[p.id],
    diff: Math.abs(room.times[p.id] - TARGET),
  }));
  results.sort((a, b) => a.diff - b.diff);
  results.forEach((r, i) => {
    const p = room.players.find(x => x.id === r.id);
    const pts = rankPoints(i, activePlayers.length);
    p.score += pts;
    r.points = pts;
    r.totalScore = p.score;
  });

  room.results = results;

  const next = room.round + 1;
  if (next <= room.maxRounds) {
    room.state = 'waiting_next';
    room.nextRound = next;
  } else {
    const ranked = [...room.players].sort((a, b) => b.score - a.score);
    room.finalScores = ranked.map(p => ({ id: p.id, name: p.name, score: p.score || 0 }));
    room.state = 'results';
    await saveScores(ranked);
  }

  await setRoom(room);
  return room;
}

async function forceResolve(playerId) {
  const room = await getRoom();
  if (room.state !== 'tensecond') return room;
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) return room;
  return resolveRound(room);
}

async function startNextRound(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  if (room.state !== 'waiting_next') throw new Error('Not waiting for next round.');
  room.state = 'tensecond';
  room.round = room.nextRound;
  room.goTime = Date.now() + COUNTDOWN_MS;
  room.times = {};
  room.results = null;
  room.nextRound = null;
  room.activePlayerIds = room.players.map(p => p.id);
  await setRoom(room);
  return room;
}

const SPRINT_DURATION_MS = 10000;
const SPRINT_MAX_RATE = 15; // max presses/sec (anti-cheat cap)

async function startSprint(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  if (room.state !== 'lobby') throw new Error('Already started.');
  room.players.forEach(p => { p.score = 0; });
  room.state = 'sprint';
  const startTime = Date.now() + COUNTDOWN_MS;
  room.sprint = {
    presses: {},
    startTime,
    endTime: startTime + SPRINT_DURATION_MS,
  };
  room.activePlayerIds = room.players.map(p => p.id);
  room.players.forEach(p => { room.sprint.presses[p.id] = 0; });
  await setRoom(room);
  return room;
}

async function recordSprintPress({ playerId, count }) {
  const room = await getRoom();
  if (room.state !== 'sprint') return room;
  const activeIds = room.activePlayerIds || room.players.map(p => p.id);
  if (!activeIds.includes(playerId)) return room; // spectator
  const sprint = room.sprint;
  const now = Date.now();
  if (now < sprint.startTime || now > sprint.endTime + 500) return room;
  const maxAllowed = Math.ceil(((now - sprint.startTime) / 1000) * SPRINT_MAX_RATE);
  const capped = Math.min(Math.max(0, count), maxAllowed);
  sprint.presses[playerId] = Math.max(sprint.presses[playerId] || 0, capped);
  await setRoom(room);
  return room;
}

async function endSprint(playerId) {
  const room = await getRoom();
  if (room.state !== 'sprint') return room;
  const player = room.players.find(p => p.id === playerId);
  const timeUp = Date.now() >= room.sprint.endTime;
  if (!timeUp && !player?.isHost) return room;
  return resolveSprint(room);
}

async function resolveSprint(room) {
  if (room.state !== 'sprint') return room;
  room.state = '_resolving';
  const presses = room.sprint.presses;
  const ranked = [...room.players].sort((a, b) => (presses[b.id] || 0) - (presses[a.id] || 0));
  const sprintResults = ranked.map((p, i) => {
    const pts = rankPoints(i, room.players.length);
    p.score += pts;
    return { id: p.id, name: p.name, presses: presses[p.id] || 0, points: pts, totalScore: p.score };
  });
  room.sprint.results = sprintResults;
  room.finalScores = ranked.map(p => ({ id: p.id, name: p.name, score: p.score || 0 }));
  room.state = 'results';
  await saveScores(ranked);
  await setRoom(room);
  return room;
}

async function resetToLobby(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  room.state = 'lobby';
  room.round = 1;
  room.goTime = null;
  room.times = {};
  room.results = null;
  room.nextRound = null;
  room.finalScores = null;
  room.sprint = null;
  room.players.forEach(p => { p.score = 0; });
  await setRoom(room);
  return room;
}

async function checkTimeouts(room) {
  if (!room) return room;
  const now = Date.now();
  if (room.state === 'tensecond' && room.goTime && now > room.goTime + 25000) {
    const activeIds = room.activePlayerIds || room.players.map(p => p.id);
    activeIds.forEach(id => { if (room.times[id] === undefined) room.times[id] = 99999; });
    return resolveRound(room);
  }
  if (room.state === 'sprint' && room.sprint?.endTime && now > room.sprint.endTime + 2000) {
    return resolveSprint(room);
  }
  return room;
}

async function resetRoom() {
  await getRedis().del(ROOM_KEY);
}

async function saveScores(players) {
  const redis = getRedis();
  const week = isoWeekKey();
  const key = scoresKey(week);
  const entries = players
    .filter(p => p.name)
    .map(p => ({ name: p.name, score: Math.max(0, p.score || 0) }));
  if (entries.length) await redis.rpush(key, ...entries.map(e => JSON.stringify(e)));
}

async function getWeeklyLeaderboard(weekIso, limit = 50) {
  const redis = getRedis();
  const week = weekIso || isoWeekKey();
  const raw = await redis.lrange(scoresKey(week), 0, -1);
  const totals = {};
  const games = {};
  raw.forEach(item => {
    const e = typeof item === 'string' ? JSON.parse(item) : item;
    if (!e?.name) return;
    totals[e.name] = (totals[e.name] || 0) + e.score;
    games[e.name] = (games[e.name] || 0) + 1;
  });
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, totalPoints], i) => ({ rank: i + 1, displayName: name, totalPoints, gamesFinished: games[name] }));
}

module.exports = {
  isoWeekKey,
  getRoom,
  setRoom,
  joinRoom,
  leaveRoom,
  startGame,
  recordStop,
  resolveRound,
  forceResolve,
  startNextRound,
  startSprint,
  recordSprintPress,
  endSprint,
  resetToLobby,
  checkTimeouts,
  resetRoom,
  getWeeklyLeaderboard,
};
