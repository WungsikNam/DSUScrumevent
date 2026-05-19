// All server communication via HTTP

export async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getRoom() {
  const res = await fetch('/api/room');
  return res.json();
}

export async function joinRoom({ playerId, nickname, hostPassword }) {
  return apiPost('/api/join', { playerId, nickname, hostPassword });
}

export async function leaveRoom(playerId) {
  return apiPost('/api/leave', { playerId });
}

export async function startGame(playerId) {
  return apiPost('/api/start', { playerId });
}

export async function stopTimer(playerId, elapsed) {
  return apiPost('/api/stop', { playerId, elapsed });
}

export async function nextRound(playerId) {
  return apiPost('/api/next-round', { playerId });
}

export async function resetGame(playerId) {
  return apiPost('/api/reset', { playerId });
}

export async function startSprint(playerId) {
  return apiPost('/api/sprint-start', { playerId });
}

export async function sendSprintPress(playerId, count) {
  return apiPost('/api/sprint-press', { playerId, count });
}

export async function endSprint(playerId) {
  return apiPost('/api/sprint-press', { playerId, count: 0, end: true });
}
