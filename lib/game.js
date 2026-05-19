const { getRedis } = require('./redis');

const ROOM_KEY = 'game:room';
const TARGET = 50;
const COUNTDOWN_MS = 3000;
const GAME_TIMEOUT_MS = 30000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const MAX_RATE = 15;

function emptyRoom() {
  return { players: [], state: 'lobby', rankCounter: 0, goTime: null, startedAt: null, resetAt: null };
}

async function getRoom() {
  const r = await getRedis().get(ROOM_KEY);
  return r || emptyRoom();
}

async function setRoom(room) {
  await getRedis().set(ROOM_KEY, room);
}

async function checkTimeouts(room) {
  const now = Date.now();
  if (room.state === 'countdown' && room.goTime && now >= room.goTime) {
    room.state = 'playing';
    room.startedAt = room.goTime;
    await setRoom(room);
  } else if (room.state === 'playing' && room.startedAt && now > room.startedAt + GAME_TIMEOUT_MS) {
    room = await endGame(room);
  } else if (room.state === 'results') {
    if (!room.resetAt) {
      room.resetAt = now + 15000;
      await setRoom(room);
    } else if (now >= room.resetAt) {
      room.state = 'lobby';
      room.players.forEach(p => { p.presses = 0; p.rank = null; p.finishedAt = null; });
      room.goTime = null;
      room.startedAt = null;
      room.resetAt = null;
      await setRoom(room);
    }
  }
  return room;
}

async function joinRoom({ playerId, name, hostPassword }) {
  let room = await getRoom();
  room = await checkTimeouts(room);
  if (room.players.find(p => p.id === playerId)) return room;
  if (hostPassword && hostPassword !== ADMIN_PASSWORD) throw new Error('Incorrect host password.');
  if (room.state !== 'lobby') throw new Error('Game in progress. Please wait.');
  if (room.players.find(p => p.name === name)) throw new Error('Nickname already taken.');
  const isHost = !!(ADMIN_PASSWORD && hostPassword === ADMIN_PASSWORD);
  room.players.push({ id: playerId, name: String(name).trim().slice(0, 16), isHost, presses: 0, rank: null, finishedAt: null });
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
  room.players.forEach(p => { p.presses = 0; p.rank = null; p.finishedAt = null; });
  room.rankCounter = 0;
  room.state = 'countdown';
  room.goTime = Date.now() + COUNTDOWN_MS;
  room.startedAt = null;
  room.resetAt = null;
  await setRoom(room);
  return room;
}

async function recordPress({ playerId, count }) {
  let room = await getRoom();
  room = await checkTimeouts(room);
  if (room.state !== 'playing') return { room };
  const player = room.players.find(p => p.id === playerId);
  if (!player || player.rank !== null) return { room };
  const now = Date.now();
  const elapsed = (now - room.startedAt) / 1000;
  const maxAllowed = Math.min(Math.ceil(elapsed * MAX_RATE), TARGET);
  const capped = Math.min(Math.max(0, Number(count) || 0), maxAllowed);
  if (capped <= player.presses) return { room };
  player.presses = capped;
  if (player.presses >= TARGET) {
    player.presses = TARGET;
    player.rank = ++room.rankCounter;
    player.finishedAt = now;
    if (room.players.every(p => p.rank !== null)) room = await endGame(room);
    else await setRoom(room);
  } else {
    await setRoom(room);
  }
  return { room };
}

async function endGame(room) {
  if (room.state === 'results') return room;
  room.players.filter(p => p.rank === null).sort((a, b) => b.presses - a.presses).forEach(p => { p.rank = ++room.rankCounter; });
  room.state = 'results';
  room.resetAt = Date.now() + 15000;
  await setRoom(room);
  return room;
}

async function resetToLobby(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  room.state = 'lobby';
  room.players.forEach(p => { p.presses = 0; p.rank = null; p.finishedAt = null; });
  room.goTime = null;
  room.startedAt = null;
  room.resetAt = null;
  await setRoom(room);
  return room;
}

function publicRoom(room) {
  return {
    state: room.state,
    target: TARGET,
    goTime: room.goTime,
    startedAt: room.startedAt,
    resetAt: room.resetAt,
    players: room.players.map(({ id, name, isHost, presses, rank, finishedAt }) => ({
      id, name, isHost,
      presses: Math.min(presses || 0, TARGET),
      rank,
      progress: Math.min(100, Math.round(((presses || 0) / TARGET) * 100)),
      timeTaken: (rank != null && finishedAt && room.startedAt)
        ? ((finishedAt - room.startedAt) / 1000).toFixed(2)
        : null,
    })),
  };
}

module.exports = { getRoom, setRoom, joinRoom, leaveRoom, startGame, recordPress, checkTimeouts, resetToLobby, publicRoom };
