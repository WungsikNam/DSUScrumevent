import { useState, useEffect, useCallback, useRef } from 'react';
import { getRoom, joinRoom, leaveRoom, startGame, sendPress, startReactionGame, sendReaction, startColorGame, sendColorTap, startEmojiGame, sendEmojiTap, resetGame } from './api';
import LoginScreen from './components/LoginScreen';
import LobbyScreen from './components/LobbyScreen';
import CountdownScreen from './components/CountdownScreen';
import GameScreen from './components/GameScreen';
import ReactionOnboarding from './components/ReactionOnboarding';
import ReactionGame from './components/ReactionGame';
import ColorGame from './components/ColorGame';
import EmojiGame from './components/EmojiGame';
import ResultsScreen from './components/ResultsScreen';

function getOrCreatePlayerId() {
  let id = sessionStorage.getItem('playerId');
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('playerId', id); }
  return id;
}

export default function App() {
  const playerId = useRef(getOrCreatePlayerId()).current;
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [room, setRoom] = useState({ state: 'lobby', players: [], target: 50 });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (!joined) return;
    const poll = async () => {
      try {
        const r = await getRoom();
        setRoom(r);
        const me = r.players?.find(p => p.id === playerId);
        if (me) setIsHost(!!me.isHost);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 200);
    return () => clearInterval(id);
  }, [joined, playerId]);

  const join = useCallback(async (nickname, hostPassword) => {
    setLoginError('');
    try {
      const res = await joinRoom(playerId, nickname, hostPassword);
      if (res.error) { setLoginError(res.error); return; }
      const me = res.room?.players?.find(p => p.id === playerId);
      setIsHost(!!me?.isHost);
      setRoom(res.room);
      setJoined(true);
    } catch { setLoginError('Connection failed. Please try again.'); }
  }, [playerId]);

  const leave = useCallback(async () => {
    await leaveRoom(playerId).catch(() => {});
    sessionStorage.removeItem('playerId');
    setJoined(false); setIsHost(false);
    setRoom({ state: 'lobby', players: [], target: 50 });
  }, [playerId]);

  const start       = useCallback(() => startGame(playerId).catch(() => {}), [playerId]);
  const startReact  = useCallback(() => startReactionGame(playerId).catch(() => {}), [playerId]);
  const startColor  = useCallback(() => startColorGame(playerId).catch(() => {}), [playerId]);
  const startEmoji  = useCallback(() => startEmojiGame(playerId).catch(() => {}), [playerId]);
  const emojiTap    = useCallback((emoji) => sendEmojiTap(playerId, emoji).catch(() => {}), [playerId]);
  const press       = useCallback((count) => sendPress(playerId, count).catch(() => {}), [playerId]);
  const react       = useCallback((rt) => sendReaction(playerId, rt).catch(() => {}), [playerId]);
  const colorTap    = useCallback((color) => sendColorTap(playerId, color).catch(() => {}), [playerId]);
  const reset       = useCallback(() => resetGame(playerId).catch(() => {}), [playerId]);

  if (!joined) return <LoginScreen onJoin={join} error={loginError} />;

  const now = Date.now();
  const effectiveState =
    room.state === 'countdown' && room.goTime && now >= room.goTime ? 'playing' :
    room.state === 'briefing' && room.briefingEndTime && now >= room.briefingEndTime ? 'playing' :
    room.state;

  if (effectiveState === 'countdown') return <CountdownScreen goTime={room.goTime} />;
  if (effectiveState === 'briefing' && room.gameType === 'reaction') return <ReactionOnboarding briefingEndTime={room.briefingEndTime} />;
  if (effectiveState === 'briefing' && room.gameType === 'color') return <ReactionOnboarding briefingEndTime={room.briefingEndTime} gameType="color" />;
  if (effectiveState === 'briefing' && room.gameType === 'emoji') return <ReactionOnboarding briefingEndTime={room.briefingEndTime} gameType="emoji" />;
  if (effectiveState === 'playing' && room.gameType === 'sprint') return <GameScreen room={room} myId={playerId} onPress={press} />;
  if (effectiveState === 'playing' && room.gameType === 'reaction') return <ReactionGame room={room} myId={playerId} onReact={react} />;
  if (effectiveState === 'playing' && room.gameType === 'color') return <ColorGame room={room} myId={playerId} onTap={colorTap} />;
  if (effectiveState === 'playing' && room.gameType === 'emoji') return <EmojiGame room={room} myId={playerId} onTap={emojiTap} />;
  if (effectiveState === 'results') return <ResultsScreen room={room} myId={playerId} isHost={isHost} onReset={reset} />;
  return <LobbyScreen room={room} isHost={isHost} myId={playerId} onStart={start} onStartReaction={startReact} onStartColor={startColor} onStartEmoji={startEmoji} onLeave={leave} />;
}
