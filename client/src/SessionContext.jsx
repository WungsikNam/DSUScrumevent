import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getRoom, joinRoom, leaveRoom } from './api';

const SessionContext = createContext(null);

function getOrCreatePlayerId() {
  let id = sessionStorage.getItem('playerId');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('playerId', id);
  }
  return id;
}

export function SessionProvider({ children }) {
  const [playerId] = useState(getOrCreatePlayerId);
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [room, setRoom] = useState(null);
  const pollRef = useRef(null);

  // Poll room state every 500ms once joined
  useEffect(() => {
    if (!joined) return;
    pollRef.current = setInterval(async () => {
      try {
        const r = await getRoom();
        setRoom(r);
        // Keep isHost in sync with room state
        const me = r.players?.find(p => p.id === playerId);
        if (me) setIsHost(!!me.isHost);
      } catch { /* ignore */ }
    }, 300);
    return () => clearInterval(pollRef.current);
  }, [joined, playerId]);

  // Remove player on page unload
  useEffect(() => {
    if (!joined) return;
    const handler = () => leaveRoom(playerId);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [joined, playerId]);

  const join = useCallback(async (nickname, hostPassword = '') => {
    setJoinError('');
    try {
      const res = await joinRoom({ playerId, nickname, hostPassword });
      if (res.error) { setJoinError(res.error); return; }
      const me = res.room?.players?.find(p => p.id === playerId);
      setIsHost(!!me?.isHost);
      setRoom(res.room);
      setJoined(true);
    } catch {
      setJoinError('Connection failed. Please try again.');
    }
  }, [playerId]);

  const leave = useCallback(async () => {
    await leaveRoom(playerId);
    sessionStorage.removeItem('playerId');
    setJoined(false);
    setIsHost(false);
    setRoom(null);
  }, [playerId]);

  return (
    <SessionContext.Provider value={{ playerId, joined, isHost, joinError, setJoinError, room, join, leave }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
