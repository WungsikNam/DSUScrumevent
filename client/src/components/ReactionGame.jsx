import { useState, useEffect, useRef } from 'react';

export default function ReactionGame({ room, myId, onReact }) {
  const [phase, setPhase] = useState('waiting'); // waiting | signal | pressed | too_early
  const pressedAt = useRef(null);
  const signalTime = room?.signalTime;
  const me = room?.players?.find(p => p.id === myId);

  useEffect(() => {
    if (!signalTime || phase !== 'waiting') return;
    const id = setInterval(() => {
      if (Date.now() >= signalTime) {
        setPhase('signal');
        clearInterval(id);
      }
    }, 10);
    return () => clearInterval(id);
  }, [signalTime, phase]);

  // 게임 결과 왔을때 처리
  useEffect(() => {
    if (room?.state === 'results') return;
    if (me?.reactionTime !== null && me?.reactionTime !== undefined && phase === 'waiting') {
      setPhase('pressed');
    }
  }, [me, phase, room]);

  const handlePress = () => {
    if (phase === 'waiting') {
      setPhase('too_early');
      onReact(-1);
    } else if (phase === 'signal') {
      const rt = Date.now() - signalTime;
      pressedAt.current = rt;
      setPhase('pressed');
      onReact(rt);
    }
  };

  const players = [...(room?.players || [])].sort((a, b) => {
    const done = p => p.reactionTime !== null;
    if (done(a) && done(b)) return a.reactionTime - b.reactionTime;
    if (done(a)) return -1;
    if (done(b)) return 1;
    return 0;
  });

  const waiting = !['pressed', 'too_early'].includes(phase);
  const isSignal = phase === 'signal';
  const isTooEarly = phase === 'too_early';

  const bg = isTooEarly ? '#2a0a0a' : isSignal ? '#0a2a0a' : '#0f0f1a';
  const mainColor = isTooEarly ? '#ff4444' : isSignal ? '#51cf66' : 'rgba(255,255,255,0.15)';

  return (
    <div
      style={{ minHeight: '100dvh', background: bg, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 24, transition: 'background 0.1s', cursor: waiting ? 'pointer' : 'default', userSelect: 'none' }}
      onPointerDown={waiting ? (e) => { e.preventDefault(); handlePress(); } : undefined}
    >
      {phase === 'waiting' && (
        <>
          <div style={{ fontSize: 80, opacity: 0.15 }}>⏳</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>WAIT...</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>Tap / press SPACE when it turns green!</div>
        </>
      )}
      {phase === 'signal' && (
        <>
          <div style={{ fontSize: 80 }}>👆</div>
          <div style={{ fontSize: 60, fontWeight: 900, color: '#51cf66' }}>NOW!!!</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>TAP / SPACE!</div>
        </>
      )}
      {phase === 'too_early' && (
        <>
          <div style={{ fontSize: 80 }}>❌</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#ff4444' }}>TOO EARLY!</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Waiting for others...</div>
        </>
      )}
      {phase === 'pressed' && (
        <>
          <div style={{ fontSize: 80 }}>✅</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#51cf66' }}>
            {pressedAt.current !== null ? `${pressedAt.current}ms` : '...'}
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Waiting for others...</div>
        </>
      )}

      {/* 실시간 플레이어 현황 */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {players.map(p => {
          const done = p.reactionTime !== null;
          const isMe = p.id === myId;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isMe ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)', border: isMe ? '1px solid rgba(108,99,255,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px' }}>
              <span style={{ fontSize: 14, flex: 1, fontWeight: isMe ? 700 : 400 }}>
                {p.name} {isMe && <span style={{ opacity: 0.5, fontSize: 12 }}>(you)</span>}
              </span>
              <span style={{ fontSize: 13, color: done ? (p.tooEarly ? '#ff4444' : '#51cf66') : 'rgba(255,255,255,0.25)' }}>
                {done ? (p.tooEarly ? 'TOO EARLY' : `${p.reactionTime}ms`) : '⏳'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
