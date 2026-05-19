async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const getRoom = () => fetch('/api/room').then(r => r.json());
export const joinRoom = (playerId, nickname, hostPassword) => post('/api/join', { playerId, nickname, hostPassword });
export const leaveRoom = (playerId) => post('/api/leave', { playerId });
export const startGame = (playerId) => post('/api/start', { playerId });
export const sendPress = (playerId, count) => post('/api/sprint-press', { playerId, count });
export const resetGame = (playerId) => post('/api/reset', { playerId });
