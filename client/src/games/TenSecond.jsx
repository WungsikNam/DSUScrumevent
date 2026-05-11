import { useState, useEffect, useRef } from 'react';
import socket from '../socket';

export default function TenSecond({ room, myId }) {
  const [phase, setPhase] = useState('countdown'); // countdown | playing | done | result
  const [countdown, setCountdown] = useState(3);
  const [myElapsed, setMyElapsed] = useState(null);
  const [waitCount, setWaitCount] = useState(0);
  const [results, setResults] = useState(null);
  const startTimeRef = useRef(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    socket.on('tensecond_countdown', ({ count }) => setCountdown(count));
    socket.on('tensecond_go', () => {
      startTimeRef.current = Date.now();
      setPhase('playing');
      // pulse animation tick
      const pulseInterval = setInterval(() => setPulse(p => !p), 500);
      // store for cleanup
      socket._tenPulse = pulseInterval;
    });
    socket.on('tensecond_waiting', ({ count }) => setWaitCount(count));
    socket.on('tensecond_result', ({ results }) => {
      if (socket._tenPulse) clearInterval(socket._tenPulse);
      setResults(results);
      setPhase('result');
    });

    return () => {
      if (socket._tenPulse) clearInterval(socket._tenPulse);
      socket.off('tensecond_countdown');
      socket.off('tensecond_go');
      socket.off('tensecond_waiting');
      socket.off('tensecond_result');
    };
  }, []);

  const handleStop = () => {
    if (phase !== 'playing' || myElapsed !== null) return;
    const elapsed = Date.now() - startTimeRef.current;
    setMyElapsed(elapsed);
    setPhase('done');
    socket.emit('ten_second_stop', { elapsed });
  };

  const formatMs = (ms) => {
    if (ms >= 90000) return 'DNF';
    return (ms / 1000).toFixed(2) + '초';
  };

  const getDiffLabel = (diff) => {
    if (diff < 200) return { text: '완벽해! 🤩', color: '#22c55e' };
    if (diff < 500) return { text: '아주 좋아! 😄', color: '#86efac' };
    if (diff < 1000) return { text: '괜찮아 😊', color: '#fbbf24' };
    if (diff < 2000) return { text: '조금 더! 😅', color: '#f97316' };
    return { text: '다시 해봐 😭', color: '#ef4444' };
  };

  return (
    <div
      style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '24px',
        background: phase === 'playing' ? '#0a0a14' : '#0f0f1a',
        transition: 'background 0.5s'
      }}
      onClick={phase === 'playing' ? handleStop : undefined}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem' }}>게임 2 / 3</div>
        <div style={{ fontSize: '2rem', fontWeight: 900 }}>⏱️ 10초 챌린지</div>
      </div>

      {phase === 'countdown' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '6rem', fontWeight: 900, color: '#fbbf24' }}>{countdown}</div>
          <div style={{ color: '#a78bfa' }}>정확히 10초에 멈춰요!</div>
          <div style={{ color: '#6b6b8a', fontSize: '0.85rem', marginTop: '8px' }}>
            타이머는 안 보여요 👀
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ textAlign: 'center', userSelect: 'none' }}>
          {/* 숨겨진 타이머 대신 박동하는 원 */}
          <div style={{
            width: '200px', height: '200px', borderRadius: '50%',
            background: pulse ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.1)',
            border: `8px solid ${pulse ? '#fbbf24' : '#92400e'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '4rem', transition: 'all 0.4s',
            boxShadow: pulse ? '0 0 40px rgba(251,191,36,0.4)' : 'none',
            margin: '0 auto'
          }}>
            ⏱️
          </div>
          <div style={{
            marginTop: '32px', fontSize: '1.4rem', fontWeight: 900,
            color: '#fbbf24', animation: 'blink 0.8s ease-in-out infinite'
          }}>
            화면을 탭해서 멈춰요!
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', color: '#a78bfa' }}>내 기록</div>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#fbbf24' }}>
            {formatMs(myElapsed)}
          </div>
          <div style={{ ...getDiffLabel(Math.abs(myElapsed - 10000)), fontSize: '1.1rem', fontWeight: 700 }}>
            {getDiffLabel(Math.abs(myElapsed - 10000)).text}
          </div>
          <div style={{ color: '#6b6b8a', fontSize: '0.85rem', marginTop: '8px' }}>
            10초와의 차이: {(Math.abs(myElapsed - 10000) / 1000).toFixed(2)}초
          </div>
          <div style={{ color: '#6b6b8a', marginTop: '16px', animation: 'blink 1s infinite' }}>
            다른 사람 기다리는 중... ({waitCount}/{room.players.length})
          </div>
        </div>
      )}

      {phase === 'result' && results && (
        <div style={{
          background: '#1a1a2e', borderRadius: '20px', padding: '24px',
          width: '100%', maxWidth: '400px'
        }}>
          <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '16px', textAlign: 'center', fontSize: '1.1rem' }}>
            🏆 10초 챌린지 결과!
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.map((r, i) => {
              const isMe = r.id === myId;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: isMe ? '#2d2a0e' : '#0f0f1a',
                  borderRadius: '12px', padding: '12px 16px',
                  border: isMe ? '2px solid #fbbf24' : '2px solid transparent'
                }}>
                  <span style={{ fontSize: '1.4rem', minWidth: '28px' }}>
                    {medals[i] || `${i + 1}.`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.name} {isMe ? '(나)' : ''}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a78bfa' }}>
                      {r.elapsed >= 90000 ? 'DNF' : `${(r.elapsed / 1000).toFixed(2)}초 (±${(r.diff / 1000).toFixed(2)}초)`}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: '#fbbf24' }}>+{r.points}pt</div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', color: '#6b6b8a', fontSize: '0.85rem', marginTop: '16px' }}>
            반응속도 게임으로 이동 중...
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
