import { useState, useEffect } from 'react';
import socket from '../socket';

const CHOICES = [
  { id: 'rock',     emoji: '🪨', label: '바위' },
  { id: 'scissors', emoji: '✂️', label: '가위' },
  { id: 'paper',    emoji: '📄', label: '보' },
];

export default function RPS({ room, myId }) {
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(3);
  const [myChoice, setMyChoice] = useState(null);
  const [waitCount, setWaitCount] = useState(0);
  const [result, setResult] = useState(null); // [{name, choice, wins}]

  useEffect(() => {
    socket.on('rps_waiting', ({ count, total }) => setWaitCount(count));
    socket.on('rps_result', ({ result, round }) => setResult(result));
    socket.on('rps_next_round', ({ round }) => {
      setRound(round);
      setMyChoice(null);
      setResult(null);
      setWaitCount(0);
    });

    return () => {
      socket.off('rps_waiting');
      socket.off('rps_result');
      socket.off('rps_next_round');
    };
  }, []);

  const choose = (choice) => {
    if (myChoice) return;
    setMyChoice(choice);
    socket.emit('rps_choice', { choice });
  };

  const myResult = result?.find(r => r.id === myId);

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '40px 24px', gap: '24px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem' }}>게임 1 / 3</div>
        <div style={{ fontSize: '2rem', fontWeight: 900 }}>✊ 가위바위보</div>
        <div style={{ color: '#6b6b8a', fontSize: '0.9rem', marginTop: '4px' }}>
          {round} / {maxRounds} 라운드
        </div>
      </div>

      {/* 진행 바 */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {Array.from({ length: maxRounds }).map((_, i) => (
          <div key={i} style={{
            width: '60px', height: '6px', borderRadius: '3px',
            background: i < round ? '#7c3aed' : (i === round - 1 ? '#a78bfa' : '#2d2d4e')
          }} />
        ))}
      </div>

      {!result ? (
        <>
          {/* 선택 버튼 */}
          <div style={{
            display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {CHOICES.map(c => (
              <button
                key={c.id}
                onClick={() => choose(c.id)}
                style={{
                  width: '100px', height: '100px', borderRadius: '20px', fontSize: '3rem',
                  background: myChoice === c.id ? '#7c3aed' : '#1a1a2e',
                  border: myChoice === c.id ? '3px solid #a78bfa' : '3px solid #2d2d4e',
                  transform: myChoice === c.id ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s',
                  opacity: myChoice && myChoice !== c.id ? 0.4 : 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '2px'
                }}
              >
                <span>{c.emoji}</span>
                <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700 }}>{c.label}</span>
              </button>
            ))}
          </div>

          {myChoice && (
            <div style={{ textAlign: 'center', color: '#a78bfa', animation: 'blink 1s ease-in-out infinite' }}>
              선택 완료! 다른 사람 기다리는 중... ({waitCount}/{room.players.length})
            </div>
          )}
          {!myChoice && (
            <div style={{ color: '#6b6b8a', fontSize: '0.9rem' }}>선택하세요!</div>
          )}
        </>
      ) : (
        <div style={{
          background: '#1a1a2e', borderRadius: '20px', padding: '24px',
          width: '100%', maxWidth: '400px'
        }}>
          <div style={{ fontWeight: 700, color: '#f472b6', marginBottom: '16px', textAlign: 'center', fontSize: '1.1rem' }}>
            {round === maxRounds ? '🏁 마지막 라운드 결과!' : `라운드 ${round} 결과!`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {result
              .slice()
              .sort((a, b) => b.wins - a.wins)
              .map((r) => {
                const ch = CHOICES.find(c => c.id === r.choice);
                const isMe = r.id === myId;
                return (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: isMe ? '#2d1a4e' : '#0f0f1a',
                    borderRadius: '12px', padding: '12px 16px',
                    border: isMe ? '2px solid #7c3aed' : '2px solid transparent'
                  }}>
                    <span style={{ fontSize: '1.6rem' }}>{ch?.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{r.name} {isMe ? '(나)' : ''}</div>
                      <div style={{ fontSize: '0.8rem', color: '#a78bfa' }}>
                        이번 라운드 {r.wins}승
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '1.4rem', fontWeight: 900, color: r.wins > 0 ? '#22c55e' : '#6b6b8a' }}>
                      {r.wins > 0 ? '+' + r.wins : '😢'}
                    </div>
                  </div>
                );
              })}
          </div>
          <div style={{ textAlign: 'center', color: '#6b6b8a', fontSize: '0.85rem', marginTop: '16px' }}>
            {round < maxRounds ? '다음 라운드 준비 중...' : '10초 챌린지로 이동 중...'}
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
