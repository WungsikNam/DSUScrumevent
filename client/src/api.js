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
export const startReactionGame = (playerId) => post('/api/react', { action: 'start', playerId });
export const sendReaction = (playerId, reactionTime) => post('/api/react', { action: 'press', playerId, reactionTime });
export const startTypingGame = (playerId) => post('/api/typing', { action: 'start', playerId });
export const sendTypingSubmit = (playerId, text) => post('/api/typing', { action: 'submit', playerId, text });
export const startColorGame = (playerId) => post('/api/color', { action: 'start', playerId });
export const sendColorTap = (playerId, color) => post('/api/color', { action: 'tap', playerId, color });
export const startQuizGame = (playerId) => post('/api/quiz', { action: 'start', playerId });
export const sendQuizAnswer = (playerId, answer) => post('/api/quiz', { action: 'answer', playerId, answer });
export const startEmojiGame = (playerId) => post('/api/emoji-start', { playerId });
export const sendEmojiTap = (playerId, emoji) => post('/api/emoji-tap', { playerId, emoji });
