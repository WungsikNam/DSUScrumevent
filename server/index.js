const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// React 빌드 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));

const rooms = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function getRoomBySocket(socketId) {
  return Object.values(rooms).find(r => r.players.some(p => p.id === socketId));
}

function rankPoints(rank, total) {
  return Math.max(1, total - rank) * 3;
}

io.on('connection', (socket) => {
  // 방 생성
  socket.on('create_room', ({ name }) => {
    const code = generateCode();
    rooms[code] = {
      code,
      host: socket.id,
      players: [{ id: socket.id, name, score: 0 }],
      state: 'lobby',
      gameData: {}
    };
    socket.join(code);
    socket.emit('room_joined', { code, players: rooms[code].players, isHost: true });
  });

  // 방 입장
  socket.on('join_room', ({ name, code }) => {
    const room = rooms[code.toUpperCase()];
    if (!room) { socket.emit('error', { message: '방을 찾을 수 없어요! 코드를 확인해 주세요.' }); return; }
    if (room.state !== 'lobby') { socket.emit('error', { message: '이미 게임이 시작됐어요!' }); return; }
    if (room.players.length >= 10) { socket.emit('error', { message: '방이 꽉 찼어요! (최대 10명)' }); return; }
    room.players.push({ id: socket.id, name, score: 0 });
    socket.join(room.code);
    io.to(room.code).emit('room_updated', { players: room.players });
    socket.emit('room_joined', { code: room.code, players: room.players, isHost: false });
  });

  // 게임 시작 (호스트만)
  socket.on('start_game', () => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.host !== socket.id || room.players.length < 2) return;
    startRPS(room);
  });

  // 가위바위보 선택
  socket.on('rps_choice', ({ choice }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.state !== 'rps') return;
    const gd = room.gameData;
    if (gd.choices[socket.id]) return;
    gd.choices[socket.id] = choice;
    io.to(room.code).emit('rps_waiting', { count: Object.keys(gd.choices).length, total: room.players.length });
    if (Object.keys(gd.choices).length === room.players.length) resolveRPS(room);
  });

  // 10초 챌린지 멈춤
  socket.on('ten_second_stop', ({ elapsed }) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.state !== 'tensecond') return;
    const gd = room.gameData;
    if (gd.times[socket.id] !== undefined) return;
    gd.times[socket.id] = elapsed;
    io.to(room.code).emit('tensecond_waiting', { count: Object.keys(gd.times).length, total: room.players.length });
    if (Object.keys(gd.times).length === room.players.length) resolveTenSecond(room);
  });

  // 반응속도 탭
  socket.on('reaction_tap', () => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.state !== 'reaction') return;
    const gd = room.gameData;
    if (gd.taps[socket.id] !== undefined || gd.earlyTaps[socket.id]) return;

    if (!gd.goTime) {
      // 너무 일찍!
      gd.earlyTaps[socket.id] = true;
      socket.emit('reaction_early', {});
      checkReactionDone(room);
      return;
    }

    gd.taps[socket.id] = Date.now() - gd.goTime;
    io.to(room.code).emit('reaction_someone_tapped', {
      count: Object.keys(gd.taps).length,
      total: room.players.length
    });
    checkReactionDone(room);
  });

  socket.on('disconnect', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) { delete rooms[room.code]; return; }
    if (room.host === socket.id) room.host = room.players[0].id;
    io.to(room.code).emit('room_updated', { players: room.players });
  });
});

// ──────────────────── 게임 로직 ────────────────────

function startRPS(room) {
  room.state = 'rps';
  room.gameData = { round: 1, maxRounds: 3, choices: {}, totalWins: {} };
  room.players.forEach(p => { room.gameData.totalWins[p.id] = 0; });
  io.to(room.code).emit('game_start', { game: 'rps', round: 1, maxRounds: 3 });
}

function resolveRPS(room) {
  const { choices, totalWins } = room.gameData;
  const beats = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

  const roundWins = {};
  room.players.forEach(p => { roundWins[p.id] = 0; });

  room.players.forEach(p1 => {
    room.players.forEach(p2 => {
      if (p1.id === p2.id) return;
      if (beats[choices[p1.id]] === choices[p2.id]) {
        roundWins[p1.id]++;
        totalWins[p1.id]++;
      }
    });
  });

  const result = room.players.map(p => ({
    id: p.id,
    name: p.name,
    choice: choices[p.id],
    wins: roundWins[p.id]
  }));

  io.to(room.code).emit('rps_result', { result, round: room.gameData.round });

  setTimeout(() => {
    if (room.gameData.round < room.gameData.maxRounds) {
      room.gameData.round++;
      room.gameData.choices = {};
      io.to(room.code).emit('rps_next_round', { round: room.gameData.round });
    } else {
      // RPS 총점 계산
      const sorted = [...room.players].sort((a, b) => totalWins[b.id] - totalWins[a.id]);
      sorted.forEach((p, i) => { p.score += rankPoints(i, room.players.length); });
      startTenSecond(room);
    }
  }, 3000);
}

function startTenSecond(room) {
  room.state = 'tensecond';
  room.gameData = { times: {} };

  // 3초 카운트다운 후 시작
  let count = 3;
  io.to(room.code).emit('game_start', { game: 'tensecond', countdown: count });

  const tick = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(tick);
      room.gameData.startedAt = Date.now();
      io.to(room.code).emit('tensecond_go', {});

      // 20초 후 자동 마감
      setTimeout(() => {
        if (room.state !== 'tensecond') return;
        room.players.forEach(p => {
          if (room.gameData.times[p.id] === undefined) room.gameData.times[p.id] = 99999;
        });
        resolveTenSecond(room);
      }, 20000);
    } else {
      io.to(room.code).emit('tensecond_countdown', { count });
    }
  }, 1000);
}

function resolveTenSecond(room) {
  if (room.state !== 'tensecond') return;
  room.state = '_resolving_ten';
  const TARGET = 10000;
  const results = room.players.map(p => ({
    id: p.id,
    name: p.name,
    elapsed: room.gameData.times[p.id] ?? 99999,
    diff: Math.abs((room.gameData.times[p.id] ?? 99999) - TARGET)
  }));

  results.sort((a, b) => a.diff - b.diff);
  results.forEach((r, i) => {
    const p = room.players.find(p => p.id === r.id);
    const pts = rankPoints(i, room.players.length);
    p.score += pts;
    r.points = pts;
    r.totalScore = p.score;
  });

  io.to(room.code).emit('tensecond_result', { results });
  setTimeout(() => startReaction(room), 4000);
}

function startReaction(room) {
  room.state = 'reaction';
  room.gameData = { taps: {}, earlyTaps: {}, goTime: null };
  io.to(room.code).emit('game_start', { game: 'reaction' });

  const delay = 2000 + Math.random() * 5000;
  setTimeout(() => {
    if (room.state !== 'reaction') return;
    room.gameData.goTime = Date.now();
    io.to(room.code).emit('reaction_go', {});

    setTimeout(() => {
      if (room.state !== 'reaction') return;
      room.players.forEach(p => {
        if (!room.gameData.taps[p.id] && !room.gameData.earlyTaps[p.id]) {
          room.gameData.taps[p.id] = 9999;
        }
      });
      resolveReaction(room);
    }, 5000);
  }, delay);
}

function checkReactionDone(room) {
  const { taps, earlyTaps } = room.gameData;
  const done = Object.keys(taps).length + Object.keys(earlyTaps).length;
  if (done >= room.players.length) resolveReaction(room);
}

function resolveReaction(room) {
  if (room.state !== 'reaction') return;
  room.state = '_resolving_reaction';

  const { taps, earlyTaps } = room.gameData;
  const valid = room.players
    .filter(p => taps[p.id] !== undefined && taps[p.id] < 9999)
    .map(p => ({ id: p.id, name: p.name, time: taps[p.id], early: false, dnf: false }))
    .sort((a, b) => a.time - b.time);

  const early = room.players
    .filter(p => earlyTaps[p.id])
    .map(p => ({ id: p.id, name: p.name, time: null, early: true, dnf: false }));

  const dnf = room.players
    .filter(p => taps[p.id] === 9999)
    .map(p => ({ id: p.id, name: p.name, time: null, early: false, dnf: true }));

  const results = [...valid, ...early, ...dnf];

  valid.forEach((r, i) => {
    const p = room.players.find(p => p.id === r.id);
    const pts = rankPoints(i, room.players.length);
    p.score += pts;
    r.points = pts;
    r.totalScore = p.score;
  });
  [...early, ...dnf].forEach(r => {
    const p = room.players.find(p => p.id === r.id);
    r.points = 0;
    r.totalScore = p.score;
  });

  io.to(room.code).emit('reaction_result', { results });

  setTimeout(() => {
    const finalScores = [...room.players].sort((a, b) => b.score - a.score);
    room.state = 'results';
    io.to(room.code).emit('game_over', { finalScores });
  }, 4000);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`✅ 서버 실행 중: http://localhost:${PORT}`));
