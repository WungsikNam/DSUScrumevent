const { getRedis } = require('./redis');

const ROOM_KEY = 'game:room';
const TARGET = 50;
const COUNTDOWN_MS = 3000;
const GAME_TIMEOUT_MS = 30000;
const REACTION_TIMEOUT_MS = 5000;
const COLOR_ROUND_MS = 3000;
const COLOR_PAUSE_MS = 1500;
const COLOR_MAX_ROUNDS = 10;
const EMOJI_POOL = ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐯','🦁','🐮','🐸','🐵','🐔','🐧','🦄','🦋','🦀','🐙','🦈','🐬','🦅','🦉','🍎','🍋','🍇','🍓','🍔','🍕','🌮','🍣','🍩','🎂','⚽','🏀','🎯','🎮','🎸','🎹','🚀','🌈'];
const EMOJI_MAX_ROUNDS = 10;
const EMOJI_ROUND_MS = 4000;
const EMOJI_PAUSE_MS = 1500;
const TYPING_PHRASES = ['speed is key','quick fingers','game on','type faster','champion','rapid fire','blazing fast','word wizard','keyboard warrior','lightning bolt','finger sprint','top speed','ready set go','fast hands','turbo type','hit the keys','full speed','type it up','go go go','unstoppable'];
const TYPING_MAX_ROUNDS = 5;
const TYPING_ROUND_MS = 10000;
const TYPING_PAUSE_MS = 2000;
const QUIZ_QUESTIONS = [
  { image: '/quiz/michael-jackson.webp', correct: 'Michael Jackson', options: ['Michael Jackson', 'Captain Jang', 'Ferdinand Marcos Jr.', 'Jang Jae-joong'] },
  { image: '/quiz/marcos.webp',          correct: 'Ferdinand Marcos Jr.', options: ['Michael Jackson', 'Ferdinand Marcos Jr.', 'Captain Jang', 'Jang Jae-joong'] },
  { image: '/quiz/jang.webp',            correct: 'Captain Jang',   options: ['Michael Jackson', 'Ferdinand Marcos Jr.', 'Captain Jang', 'Jang Jae-joong'] },
];
const QUIZ_ROUND_MS = 8000;
const QUIZ_PAUSE_MS = 2000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const MAX_RATE = 15;
const COLOR_LIST = ['red', 'blue', 'green', 'yellow'];

function randomColor() { return COLOR_LIST[Math.floor(Math.random() * COLOR_LIST.length)]; }
function shuffleColors() { return [...COLOR_LIST].sort(() => Math.random() - 0.5); }
function randomEmojiRound() {
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
  const options = shuffled.slice(0, 4);
  const target = options[Math.floor(Math.random() * 4)];
  return { target, options };
}

function emptyRoom() {
  return { players: [], state: 'lobby', gameType: null, rankCounter: 0, goTime: null, startedAt: null, signalTime: null, briefingEndTime: null, colorGame: null, resetAt: null };
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

  } else if (room.state === 'briefing' && room.briefingEndTime && now >= room.briefingEndTime) {
    if (room.gameType === 'reaction') {
      room.state = 'playing';
      room.signalTime = now + 3000 + Math.floor(Math.random() * 4000);
    } else if (room.gameType === 'color') {
      room.state = 'playing';
      room.colorGame.round = 1;
      room.colorGame.currentColor = randomColor();
      room.colorGame.buttonOrder = shuffleColors();
      room.colorGame.roundStartTime = now;
      room.colorGame.roundWinner = null;
      room.colorGame.nextRoundAt = null;
    } else if (room.gameType === 'quiz') {
      if (!room.quizGame) return room;
      const q = QUIZ_QUESTIONS[0];
      room.state = 'playing';
      room.quizGame.round = 1;
      room.quizGame.image = q.image;
      room.quizGame.options = [...q.options].sort(() => Math.random() - 0.5);
      room.quizGame.correctAnswer = null;
      room.quizGame.roundStartTime = now;
      room.quizGame.roundWinner = null;
      room.quizGame.nextRoundAt = null;
    } else if (room.gameType === 'typing') {
      if (!room.typingGame) return room;
      const phrase = TYPING_PHRASES[Math.floor(Math.random() * TYPING_PHRASES.length)];
      room.state = 'playing';
      room.typingGame.round = 1;
      room.typingGame.phrase = phrase;
      room.typingGame.usedPhrases = [phrase];
      room.typingGame.roundStartTime = now;
      room.typingGame.roundWinner = null;
      room.typingGame.nextRoundAt = null;
    } else if (room.gameType === 'emoji') {
      const { target, options } = randomEmojiRound();
      room.state = 'playing';
      room.emojiGame.round = 1;
      room.emojiGame.target = target;
      room.emojiGame.options = options;
      room.emojiGame.roundStartTime = now;
      room.emojiGame.roundWinner = null;
      room.emojiGame.nextRoundAt = null;
    }
    await setRoom(room);

  } else if (room.state === 'playing' && room.gameType === 'sprint' && room.startedAt && now > room.startedAt + GAME_TIMEOUT_MS) {
    room = await endSprintGame(room);

  } else if (room.state === 'playing' && room.gameType === 'reaction' && room.signalTime && now > room.signalTime + REACTION_TIMEOUT_MS) {
    room.players.forEach(p => { if (p.reactionTime === null) p.reactionTime = 99998; });
    room = await endReactionGame(room);

  } else if (room.state === 'playing' && room.gameType === 'emoji' && room.emojiGame) {
    const eg = room.emojiGame;
    if (eg.nextRoundAt !== null && now >= eg.nextRoundAt) {
      if (eg.round >= eg.maxRounds) {
        room = await endEmojiGame(room);
      } else {
        const { target, options } = randomEmojiRound();
        eg.round++; eg.target = target; eg.options = options;
        eg.roundStartTime = now; eg.roundWinner = null; eg.nextRoundAt = null;
        await setRoom(room);
      }
    } else if (eg.nextRoundAt === null && eg.roundStartTime && now > eg.roundStartTime + EMOJI_ROUND_MS) {
      eg.roundWinner = null; eg.nextRoundAt = now + EMOJI_PAUSE_MS;
      await setRoom(room);
    }

  } else if (room.state === 'playing' && room.gameType === 'color' && room.colorGame) {
    const cg = room.colorGame;
    if (cg.nextRoundAt !== null && now >= cg.nextRoundAt) {
      if (cg.round >= cg.maxRounds) {
        room = await endColorGame(room);
      } else {
        cg.round++;
        cg.currentColor = randomColor();
        cg.buttonOrder = shuffleColors();
        cg.roundStartTime = now;
        cg.roundWinner = null;
        cg.nextRoundAt = null;
        await setRoom(room);
      }
    } else if (cg.nextRoundAt === null && cg.roundStartTime && now > cg.roundStartTime + COLOR_ROUND_MS) {
      cg.roundWinner = null;
      cg.nextRoundAt = now + COLOR_PAUSE_MS;
      await setRoom(room);
    }

  } else if (room.state === 'playing' && room.gameType === 'quiz' && room.quizGame) {
    const qg = room.quizGame;
    if (qg.nextRoundAt !== null && now >= qg.nextRoundAt) {
      if (qg.round >= qg.maxRounds) {
        room = await endQuizGame(room);
      } else {
        qg.round++;
        const q = QUIZ_QUESTIONS[qg.round - 1];
        qg.image = q.image;
        qg.options = [...q.options].sort(() => Math.random() - 0.5);
        qg.correctAnswer = null;
        qg.roundStartTime = now; qg.roundWinner = null; qg.nextRoundAt = null;
        await setRoom(room);
      }
    } else if (qg.nextRoundAt === null && qg.roundStartTime && now > qg.roundStartTime + QUIZ_ROUND_MS) {
      qg.correctAnswer = QUIZ_QUESTIONS[qg.round - 1].correct;
      qg.roundWinner = null; qg.nextRoundAt = now + QUIZ_PAUSE_MS;
      await setRoom(room);
    }

  } else if (room.state === 'playing' && room.gameType === 'typing' && room.typingGame) {
    const tg = room.typingGame;
    if (tg.nextRoundAt !== null && now >= tg.nextRoundAt) {
      if (tg.round >= tg.maxRounds) {
        room = await endTypingGame(room);
      } else {
        const usedPhrases = tg.usedPhrases || [];
        const available = TYPING_PHRASES.filter(p => !usedPhrases.includes(p));
        const pool = available.length > 0 ? available : TYPING_PHRASES;
        const phrase = pool[Math.floor(Math.random() * pool.length)];
        tg.round++; tg.phrase = phrase; tg.usedPhrases = [...usedPhrases, phrase];
        tg.roundStartTime = now; tg.roundWinner = null; tg.nextRoundAt = null;
        await setRoom(room);
      }
    } else if (tg.nextRoundAt === null && tg.roundStartTime && now > tg.roundStartTime + TYPING_ROUND_MS) {
      tg.roundWinner = null; tg.nextRoundAt = now + TYPING_PAUSE_MS;
      await setRoom(room);
    }

  } else if (room.state === 'playing' && room.gameType === 'emoji' && room.emojiGame &&
    room.emojiGame.roundStartTime && now > room.emojiGame.roundStartTime + EMOJI_ROUND_MS * room.emojiGame.maxRounds + 10000) {
    room = await endEmojiGame(room);

  } else if (room.state === 'results') {
    if (!room.resetAt) {
      room.resetAt = now + 15000;
      await setRoom(room);
    } else if (now >= room.resetAt) {
      room.state = 'lobby';
      room.gameType = null;
      room.colorGame = null;
      room.players.forEach(p => { p.presses = 0; p.rank = null; p.finishedAt = null; p.reactionTime = null; p.tooEarly = false; p.score = 0; });
      room.goTime = null; room.startedAt = null; room.signalTime = null; room.briefingEndTime = null; room.resetAt = null;
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
  const isHost = !!(ADMIN_PASSWORD && hostPassword === ADMIN_PASSWORD);
  room.players = room.players.filter(p => p.name !== String(name).trim().slice(0, 16));
  room.players.push({ id: playerId, name: String(name).trim().slice(0, 16), isHost, presses: 0, rank: null, finishedAt: null, reactionTime: null, tooEarly: false, score: 0 });
  await setRoom(room);
  return room;
}

async function leaveRoom(playerId) {
  const room = await getRoom();
  room.players = room.players.filter(p => p.id !== playerId);
  await setRoom(room);
  return room;
}

// ── Sprint ───────────────────────────────────────────────────────

async function startGame(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  if (room.state !== 'lobby') throw new Error('Already started.');
  room.players.forEach(p => { p.presses = 0; p.rank = null; p.finishedAt = null; });
  room.rankCounter = 0;
  room.gameType = 'sprint';
  room.state = 'countdown';
  room.goTime = Date.now() + COUNTDOWN_MS;
  room.startedAt = null; room.signalTime = null; room.briefingEndTime = null; room.colorGame = null; room.resetAt = null;
  await setRoom(room);
  return room;
}

async function recordPress({ playerId, count }) {
  let room = await getRoom();
  room = await checkTimeouts(room);
  if (room.state !== 'playing' || room.gameType !== 'sprint') return { room };
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
    room = await endSprintGame(room);
  } else {
    await setRoom(room);
  }
  return { room };
}

async function endSprintGame(room) {
  if (room.state === 'results') return room;
  room.players.filter(p => p.rank === null).sort((a, b) => b.presses - a.presses).forEach(p => { p.rank = ++room.rankCounter; });
  room.state = 'results';
  room.resetAt = Date.now() + 15000;
  await setRoom(room);
  return room;
}

// ── Reaction ─────────────────────────────────────────────────────

async function startReactionGame(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  if (room.state !== 'lobby') throw new Error('Already started.');
  room.players.forEach(p => { p.reactionTime = null; p.tooEarly = false; p.rank = null; });
  room.rankCounter = 0;
  room.gameType = 'reaction';
  room.state = 'briefing';
  room.briefingEndTime = Date.now() + 5000;
  room.signalTime = null; room.colorGame = null; room.goTime = null; room.startedAt = null; room.resetAt = null;
  await setRoom(room);
  return room;
}

async function recordReaction({ playerId, reactionTime }) {
  let room = await getRoom();
  room = await checkTimeouts(room);
  if (room.state !== 'playing' || room.gameType !== 'reaction') return { room };
  const player = room.players.find(p => p.id === playerId);
  if (!player || player.reactionTime !== null) return { room };
  const now = Date.now();
  if (now < room.signalTime || Number(reactionTime) < 0) {
    player.tooEarly = true;
    player.reactionTime = 99999;
  } else {
    player.reactionTime = Math.max(0, Math.min(Number(reactionTime) || 0, now - room.signalTime + 1000));
  }
  if (room.players.every(p => p.reactionTime !== null)) {
    room = await endReactionGame(room);
  } else {
    await setRoom(room);
  }
  return { room };
}

async function endReactionGame(room) {
  if (room.state === 'results') return room;
  const sorted = [...room.players].sort((a, b) => a.reactionTime - b.reactionTime);
  sorted.forEach((p, i) => { p.rank = i + 1; });
  room.state = 'results';
  room.resetAt = Date.now() + 15000;
  await setRoom(room);
  return room;
}

// ── Color Rush ───────────────────────────────────────────────────

async function startColorGame(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  if (room.state !== 'lobby') throw new Error('Already started.');
  room.players.forEach(p => { p.score = 0; p.rank = null; });
  room.rankCounter = 0;
  room.gameType = 'color';
  room.state = 'briefing';
  room.briefingEndTime = Date.now() + 5000;
  room.colorGame = { round: 0, maxRounds: COLOR_MAX_ROUNDS, currentColor: null, buttonOrder: shuffleColors(), roundStartTime: null, roundWinner: null, nextRoundAt: null };
  room.signalTime = null; room.goTime = null; room.startedAt = null; room.resetAt = null;
  await setRoom(room);
  return room;
}

async function recordColorTap({ playerId, color }) {
  let room = await getRoom();
  room = await checkTimeouts(room);
  if (room.state !== 'playing' || room.gameType !== 'color') return { room };
  const cg = room.colorGame;
  if (cg.nextRoundAt !== null) return { room };
  if (color !== cg.currentColor) return { room };
  const player = room.players.find(p => p.id === playerId);
  if (!player) return { room };
  player.score = (player.score || 0) + 1;
  cg.roundWinner = playerId;
  cg.nextRoundAt = Date.now() + COLOR_PAUSE_MS;
  await setRoom(room);
  return { room };
}

async function endColorGame(room) {
  if (room.state === 'results') return room;
  const sorted = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  sorted.forEach((p, i) => { p.rank = i + 1; });
  room.state = 'results';
  room.resetAt = Date.now() + 15000;
  await setRoom(room);
  return room;
}

// ── Emoji Rush ───────────────────────────────────────────────────

async function startEmojiGame(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  if (room.state !== 'lobby') throw new Error('Already started.');
  room.players.forEach(p => { p.score = 0; p.rank = null; });
  room.rankCounter = 0;
  room.gameType = 'emoji';
  room.state = 'briefing';
  room.briefingEndTime = Date.now() + 5000;
  room.emojiGame = { round: 0, maxRounds: EMOJI_MAX_ROUNDS, target: null, options: [], roundStartTime: null, roundWinner: null, nextRoundAt: null };
  room.colorGame = null; room.signalTime = null; room.goTime = null; room.startedAt = null; room.resetAt = null;
  await setRoom(room);
  return room;
}

async function recordEmojiTap({ playerId, emoji }) {
  let room = await getRoom();
  room = await checkTimeouts(room);
  if (room.state !== 'playing' || room.gameType !== 'emoji') return { room };
  const eg = room.emojiGame;
  if (eg.nextRoundAt !== null || emoji !== eg.target) return { room };
  const player = room.players.find(p => p.id === playerId);
  if (!player) return { room };
  player.score = (player.score || 0) + 1;
  eg.roundWinner = playerId;
  eg.nextRoundAt = Date.now() + EMOJI_PAUSE_MS;
  await setRoom(room);
  return { room };
}

async function endEmojiGame(room) {
  if (room.state === 'results') return room;
  const sorted = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  sorted.forEach((p, i) => { p.rank = i + 1; });
  room.state = 'results';
  room.resetAt = Date.now() + 15000;
  await setRoom(room);
  return room;
}

// ── Photo Quiz ───────────────────────────────────────────────────

async function startQuizGame(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  if (room.state !== 'lobby') throw new Error('Already started.');
  room.players.forEach(p => { p.score = 0; p.rank = null; });
  room.rankCounter = 0;
  room.gameType = 'quiz';
  room.state = 'briefing';
  room.briefingEndTime = Date.now() + 4000;
  room.quizGame = { round: 0, maxRounds: QUIZ_QUESTIONS.length, image: null, options: [], correctAnswer: null, roundStartTime: null, roundWinner: null, nextRoundAt: null };
  room.colorGame = null; room.emojiGame = null; room.typingGame = null; room.signalTime = null; room.goTime = null; room.startedAt = null; room.resetAt = null;
  await setRoom(room);
  return room;
}

async function recordQuizAnswer({ playerId, answer }) {
  let room = await getRoom();
  room = await checkTimeouts(room);
  if (room.state !== 'playing' || room.gameType !== 'quiz') return { room };
  const qg = room.quizGame;
  if (qg.nextRoundAt !== null) return { room };
  const correct = QUIZ_QUESTIONS[qg.round - 1].correct;
  if (answer !== correct) return { room };
  const player = room.players.find(p => p.id === playerId);
  if (!player) return { room };
  player.score = (player.score || 0) + 1;
  qg.roundWinner = playerId;
  qg.correctAnswer = correct;
  qg.nextRoundAt = Date.now() + QUIZ_PAUSE_MS;
  await setRoom(room);
  return { room };
}

async function endQuizGame(room) {
  if (room.state === 'results') return room;
  const sorted = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  sorted.forEach((p, i) => { p.rank = i + 1; });
  room.state = 'results';
  room.resetAt = Date.now() + 15000;
  await setRoom(room);
  return room;
}

// ── Typing Rush ──────────────────────────────────────────────────

async function startTypingGame(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  if (room.state !== 'lobby') throw new Error('Already started.');
  room.players.forEach(p => { p.score = 0; p.rank = null; });
  room.rankCounter = 0;
  room.gameType = 'typing';
  room.state = 'briefing';
  room.briefingEndTime = Date.now() + 5000;
  room.typingGame = { round: 0, maxRounds: TYPING_MAX_ROUNDS, phrase: null, usedPhrases: [], roundStartTime: null, roundWinner: null, nextRoundAt: null };
  room.colorGame = null; room.emojiGame = null; room.quizGame = null; room.signalTime = null; room.goTime = null; room.startedAt = null; room.resetAt = null;
  await setRoom(room);
  return room;
}

async function recordTypingSubmit({ playerId, text }) {
  let room = await getRoom();
  room = await checkTimeouts(room);
  if (room.state !== 'playing' || room.gameType !== 'typing') return { room };
  const tg = room.typingGame;
  if (tg.nextRoundAt !== null) return { room };
  if ((text || '').trim().toLowerCase() !== tg.phrase.toLowerCase()) return { room };
  const player = room.players.find(p => p.id === playerId);
  if (!player) return { room };
  player.score = (player.score || 0) + 1;
  tg.roundWinner = playerId;
  tg.winnerTime = Date.now() - (tg.roundStartTime || Date.now());
  tg.nextRoundAt = Date.now() + TYPING_PAUSE_MS;
  await setRoom(room);
  return { room };
}

async function endTypingGame(room) {
  if (room.state === 'results') return room;
  const sorted = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  sorted.forEach((p, i) => { p.rank = i + 1; });
  room.state = 'results';
  room.resetAt = Date.now() + 15000;
  await setRoom(room);
  return room;
}

// ── Common ───────────────────────────────────────────────────────

async function resetToLobby(playerId) {
  const room = await getRoom();
  const player = room.players.find(p => p.id === playerId);
  if (!player?.isHost) throw new Error('Not host.');
  room.state = 'lobby';
  room.gameType = null;
  room.colorGame = null;
  room.players.forEach(p => { p.presses = 0; p.rank = null; p.finishedAt = null; p.reactionTime = null; p.tooEarly = false; p.score = 0; });
  room.goTime = null; room.startedAt = null; room.signalTime = null; room.briefingEndTime = null; room.resetAt = null;
  await setRoom(room);
  return room;
}

function publicRoom(room) {
  return {
    state: room.state,
    gameType: room.gameType,
    target: TARGET,
    goTime: room.goTime,
    startedAt: room.startedAt,
    signalTime: room.signalTime,
    briefingEndTime: room.briefingEndTime || null,
    colorGame: room.colorGame || null,
    emojiGame: room.emojiGame || null,
    quizGame: room.quizGame ? { round: room.quizGame.round, maxRounds: room.quizGame.maxRounds, image: room.quizGame.image, options: room.quizGame.options, correctAnswer: room.quizGame.correctAnswer, roundStartTime: room.quizGame.roundStartTime, roundWinner: room.quizGame.roundWinner, nextRoundAt: room.quizGame.nextRoundAt } : null,
    typingGame: room.typingGame ? { round: room.typingGame.round, maxRounds: room.typingGame.maxRounds, phrase: room.typingGame.phrase, roundStartTime: room.typingGame.roundStartTime, roundWinner: room.typingGame.roundWinner, winnerTime: room.typingGame.winnerTime ?? null, nextRoundAt: room.typingGame.nextRoundAt } : null,
    resetAt: room.resetAt,
    players: room.players.map(({ id, name, isHost, presses, rank, finishedAt, reactionTime, tooEarly, score }) => ({
      id, name, isHost, rank,
      presses: Math.min(presses || 0, TARGET),
      progress: Math.min(100, Math.round(((presses || 0) / TARGET) * 100)),
      timeTaken: (rank != null && finishedAt && room.startedAt) ? ((finishedAt - room.startedAt) / 1000).toFixed(2) : null,
      reactionTime: reactionTime ?? null,
      tooEarly: !!tooEarly,
      score: score || 0,
    })),
  };
}

module.exports = { getRoom, setRoom, joinRoom, leaveRoom, startGame, recordPress, startReactionGame, recordReaction, startColorGame, recordColorTap, startEmojiGame, recordEmojiTap, startTypingGame, recordTypingSubmit, startQuizGame, recordQuizAnswer, checkTimeouts, resetToLobby, publicRoom };
