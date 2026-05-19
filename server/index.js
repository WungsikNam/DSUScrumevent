require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const TARGET = 150;
const PRESS_INTERVAL_MS = 60;

let room = {
  players: [],
  state: 'lobby',
  rankCounter: 0,
  gameTimer: null,
};

function publicState() {
  return {
    state: room.state,
    target: TARGET,
    players: room.players.map(({ id, name, isHost, presses, rank, finishedAt }) => ({
      id, name, isHost,
      presses: Math.min(presses, TARGET),
      rank,
      progress: Math.min(100, Math.round((presses / TARGET) * 100)),
      timeTaken: (rank != null && finishedAt && room.startedAt)
        ? ((finishedAt - room.startedAt) / 1000).toFixed(2)
        : null,
    })),
  };
}

io.on('connection', (socket) => {
  socket.on('join', ({ nickname, hostPassword }) => {
    const name = String(nickname || '').trim().slice(0, 16);
    if (!name) return socket.emit('join_error', 'Please enter a nickname.');
    if (room.state !== 'lobby') return socket.emit('join_error', 'Game in progress. Please wait and try again.');
    if (room.players.find(p => p.name === name)) return socket.emit('join_error', 'Nickname already taken.');

    if (hostPassword && hostPassword !== ADMIN_PASSWORD) {
      return socket.emit('join_error', 'Incorrect host password.');
    }
    const isHost = !!(ADMIN_PASSWORD && hostPassword === ADMIN_PASSWORD);
    room.players.push({ id: socket.id, name, isHost, presses: 0, rank: null, lastPress: 0 });
    socket.emit('joined', { isHost });
    io.emit('room_update', publicState());
  });

  socket.on('start_game', () => {
    const player = room.players.find(p => p.id === socket.id);
    if (!player?.isHost || room.state !== 'lobby') return;
    if (room.players.length < 1) return;

    room.state = 'countdown';
    io.emit('room_update', publicState());

    let count = 3;
    io.emit('countdown', { count });
    const tick = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(tick);
        room.players.forEach(p => { p.presses = 0; p.rank = null; p.lastPress = 0; p.finishedAt = null; });
        room.rankCounter = 0;
        room.startedAt = Date.now();
        room.state = 'playing';
        io.emit('game_start', {});
        io.emit('room_update', publicState());
        room.gameTimer = setTimeout(endGame, 30000);
      } else {
        io.emit('countdown', { count });
      }
    }, 1000);
  });

  socket.on('press', () => {
    if (room.state !== 'playing') return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.rank !== null) return;

    const now = Date.now();
    if (now - player.lastPress < PRESS_INTERVAL_MS) return;
    player.lastPress = now;
    player.presses++;

    if (player.presses >= TARGET) {
      player.presses = TARGET;
      player.rank = ++room.rankCounter;
      player.finishedAt = Date.now();
      io.emit('room_update', publicState());
      if (room.players.every(p => p.rank !== null)) endGame();
    } else {
      io.emit('room_update', publicState());
    }
  });

  socket.on('leave', () => {
    room.players = room.players.filter(p => p.id !== socket.id);
    io.emit('room_update', publicState());
  });

  socket.on('disconnect', () => {
    room.players = room.players.filter(p => p.id !== socket.id);
    io.emit('room_update', publicState());
    if (room.state === 'playing' && room.players.length > 0 && room.players.every(p => p.rank !== null)) {
      endGame();
    }
  });
});

function endGame() {
  if (room.state === 'results') return;
  if (room.gameTimer) { clearTimeout(room.gameTimer); room.gameTimer = null; }
  room.players
    .filter(p => p.rank === null)
    .sort((a, b) => b.presses - a.presses)
    .forEach(p => { p.rank = ++room.rankCounter; });
  room.state = 'results';
  io.emit('room_update', publicState());
  setTimeout(() => {
    room.state = 'lobby';
    room.players.forEach(p => { p.presses = 0; p.rank = null; });
    io.emit('room_update', publicState());
  }, 15000);
}

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
httpServer.listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));
