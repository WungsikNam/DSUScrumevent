import { useState, useEffect } from 'react';
import socket from './socket';
import Join from './pages/Join';
import Lobby from './pages/Lobby';
import RPS from './games/RPS';
import TenSecond from './games/TenSecond';
import Reaction from './games/Reaction';
import GameOver from './games/GameOver';

export default function App() {
  const [page, setPage] = useState('join');
  const [myName, setMyName] = useState('');
  const [room, setRoom] = useState({ code: '', players: [], isHost: false });

  useEffect(() => {
    socket.on('room_joined', ({ code, players, isHost }) => {
      setRoom({ code, players, isHost });
      setPage('lobby');
    });

    socket.on('room_updated', ({ players }) => {
      setRoom(prev => ({ ...prev, players }));
    });

    socket.on('game_start', ({ game }) => {
      setPage(game);
    });

    socket.on('game_over', () => {
      setPage('gameover');
    });

    socket.on('error', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('room_joined');
      socket.off('room_updated');
      socket.off('game_start');
      socket.off('game_over');
      socket.off('error');
    };
  }, []);

  const commonProps = { room, myId: socket.id };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {page === 'join'     && <Join setMyName={setMyName} />}
      {page === 'lobby'    && <Lobby {...commonProps} />}
      {page === 'rps'      && <RPS {...commonProps} />}
      {page === 'tensecond' && <TenSecond {...commonProps} />}
      {page === 'reaction'  && <Reaction {...commonProps} />}
      {page === 'gameover'  && <GameOver {...commonProps} />}
    </div>
  );
}
