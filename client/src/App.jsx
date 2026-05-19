import { useState, useEffect, useCallback } from 'react';
import { socket } from './socket';
import LoginScreen from './components/LoginScreen';
import LobbyScreen from './components/LobbyScreen';
import CountdownScreen from './components/CountdownScreen';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';

export default function App() {
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [myId, setMyId] = useState('');
  const [room, setRoom] = useState({ state: 'lobby', players: [], target: 100 });
  const [countdown, setCountdown] = useState(3);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const onConnect = () => setMyId(socket.id);
    const onJoined = ({ isHost }) => { setIsHost(isHost); setJoined(true); setLoginError(''); };
    const onJoinError = (msg) => setLoginError(msg);
    const onRoomUpdate = (state) => setRoom(state);
    const onCountdown = ({ count }) => setCountdown(count);

    socket.on('connect', onConnect);
    socket.on('joined', onJoined);
    socket.on('join_error', onJoinError);
    socket.on('room_update', onRoomUpdate);
    socket.on('countdown', onCountdown);

    return () => {
      socket.off('connect', onConnect);
      socket.off('joined', onJoined);
      socket.off('join_error', onJoinError);
      socket.off('room_update', onRoomUpdate);
      socket.off('countdown', onCountdown);
    };
  }, []);

  const join = useCallback((nickname, hostPassword) => {
    setLoginError('');
    socket.emit('join', { nickname, hostPassword });
  }, []);

  const startGame = useCallback(() => socket.emit('start_game'), []);
  const press = useCallback(() => socket.emit('press'), []);
  const leave = useCallback(() => {
    socket.emit('leave');
    setJoined(false);
    setIsHost(false);
    setRoom({ state: 'lobby', players: [], target: 150 });
  }, []);

  if (!joined) return <LoginScreen onJoin={join} error={loginError} />;
  if (room.state === 'countdown') return <CountdownScreen count={countdown} />;
  if (room.state === 'playing') return <GameScreen room={room} myId={myId} onPress={press} />;
  if (room.state === 'results') return <ResultsScreen room={room} myId={myId} />;
  return <LobbyScreen room={room} isHost={isHost} myId={myId} onStart={startGame} onLeave={leave} />;
}
