import { useState, useEffect, useRef } from 'react';
import socket from '../socket';

export default function Reaction({ room, myId }) {
  const [phase, setPhase] = useState('waiting'); // waiting | ready | go | tapped | early | result
  const [myTime, setMyTime] = useState(null);
  const [tapCount, setTapCount] = useState(0);
  const [results, setResults] = useState(null);
  const goTimeRef = useRef(null);

  useEffect(() => {
    // 'ready' 페이즈: 곧 시작됨
    setPhase('ready');

    socket.on('reaction_go', () => {
      goTimeRef.current = Date.now();
      setPhase('go');
    });

    socket.on('reaction_early', () => {
      setPhase('early');
    });

    socket.on('reaction_someone_tapped', ({ count }) => {
      setTapCount(count);
    });

    socket.on('reaction_result', ({ results }) => {
      setResults(results);
      setPhase('result');
    });

    return () => {
      socket.off('reaction_go');
      socket.off('reaction_early');
      socket.off('reaction_someone_tapped');
      socket.off('reaction_result');
    };
  }, []);

  const handleTap = () => {
    if (phase === 'tapped' || phase === 'early' || phase === 'result') return;

    if (phase === 'go') {
      const elapsed = Date.now() - goTimeRef.current;
      setMyTime(elapsed);
      setPhase('tapped');
      socket.emit('reaction_tap');
    } else if (phase === 'ready' || phase === 'waiting') {
      // 너무 일찍
      socket.emit('reaction_tap');
    }
  };

  const bgColor = {
    waiting: '#0f0f1a',
    ready: '#1a0a2e',
    go: '#052e16',
    tapped: '#052e16',
    early: '#2d0000',
    result: '#0f0f1a',
  }[phase] || '#0f0f1a';

  return (
    <div
      onClick={handleTap}
      style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '24px',
        background: bgColor, transition: 'background 0.15s', userSelect: 'none',
        cursor: phase === 'go' ? 'pointer' : 'default'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#f472b6', fontWeight: 700, fontSize: '0.9rem' }}>게임 3 / 3</div>
        <div style={{ fontSize: '2rem', fontWeight: 900 }}>⚡ 반응속도</div>
      </div>

      {(phase === 'waiting' || phase === 'ready') && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '5rem', marginBottom: '16px',
            animation: 'float 2s ease-in-out infinite'
          }}>👁️</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a78bfa' }}>
            초록색으로 바뀌면
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a78bfa' }}>
            바로 화면을 탭!
          </div>
          <div style={{ color: '#6b6b8a', marginTop: '12px', animation: 'blink 1s infinite' }}>
            기다리는 중...
          </div>
        </div>
      )}

      {phase === 'go' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '6rem', fontWeight: 900, color: '#22c55e', animation: 'pop 0.15s ease-out' }}>
            지금!!!
          </div>
          <div style={{ fontSize: '1.2rem', color: '#86efac' }}>화면을 탭하세요!</div>
        </div>
      )}

      {phase === 'tapped' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', color: '#86efac' }}>내 반응속도</div>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: '#22c55e' }}>
            {myTime}ms
          </div>
          <div style={{ fontSize: '1.1rem', color: '#86efac' }}>
            {myTime < 200 ? '🐆 번개같은 반응!' :
             myTime < 350 ? '⚡ 엄청 빠르다!' :
             myTime < 500 ? '😄 좋아!' :
             myTime < 700 ? '😊 괜찮아~' : '🐢 조금 느린 편...'}
          </div>
          <div style={{ color: '#6b6b8a', marginTop: '16px', animation: 'blink 1s infinite' }}>
            다른 사람 기다리는 중... ({tapCount}/{room.players.length})
          </div>
        </div>
      )}

      {phase === 'early' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem' }}>⚡</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444' }}>
            너무 빨랐어요!
          </div>
          <div style={{ color: '#fca5a5', marginTop: '8px' }}>
            이번 라운드는 0점...
          </div>
          <div style={{ color: '#6b6b8a', marginTop: '16px', animation: 'blink 1s infinite' }}>
            결과 기다리는 중...
          </div>
        </div>
      )}

      {phase === 'result' && results && (
        <div style={{
          background: '#1a1a2e', borderRadius: '20px', padding: '24px',
          width: '100%', maxWidth: '400px'
        }}>
          <div style={{ fontWeight: 700, color: '#f472b6', marginBottom: '16px', textAlign: 'center', fontSize: '1.1rem' }}>
            ⚡ 반응속도 결과!
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.map((r, i) => {
              const isMe = r.id === myId;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: isMe ? '#1a0a2e' : '#0f0f1a',
                  borderRadius: '12px', padding: '12px 16px',
                  border: isMe ? '2px solid #f472b6' : '2px solid transparent'
                }}>
                  <span style={{ fontSize: '1.4rem', minWidth: '28px' }}>
                    {r.early || r.dnf ? '💀' : medals[i] || `${i + 1}.`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.name} {isMe ? '(나)' : ''}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a78bfa' }}>
                      {r.early ? '너무 일찍 탭함!' : r.dnf ? 'DNF' : `${r.time}ms`}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: r.points > 0 ? '#f472b6' : '#6b6b8a' }}>
                    +{r.points || 0}pt
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', color: '#6b6b8a', fontSize: '0.85rem', marginTop: '16px' }}>
            최종 결과로 이동 중...
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
