import { useState, useEffect, useRef } from 'react';

export default function QuizGame({ room, myId, onAnswer }) {
  const qg = room?.quizGame;
  const [answered, setAnswered] = useState(false);
  const [myAnswer, setMyAnswer] = useState(null);
  const prevRound = useRef(0);
  const [timeLeft, setTimeLeft] = useState(8);

  useEffect(() => {
    if (!qg) return;
    if (qg.round !== prevRound.current) {
      prevRound.current = qg.round;
      setAnswered(false);
      setMyAnswer(null);
    }
  }, [qg?.round]);

  useEffect(() => {
    if (!qg?.roundStartTime || qg.nextRoundAt !== null) return;
    const id = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((qg.roundStartTime + 8000 - Date.now()) / 1000)));
    }, 100);
    return () => clearInterval(id);
  }, [qg?.roundStartTime, qg?.nextRoundAt]);

  if (!qg) return null;

  const isWaiting = qg.nextRoundAt !== null;
  const winner = isWaiting ? room.players?.find(p => p.id === qg.roundWinner) : null;
  const iWon = qg.roundWinner === myId;
  const sorted = [...(room.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

  const handleTap = (option) => {
    if (answered || isWaiting) return;
    setAnswered(true);
    setMyAnswer(option);
    onAnswer(option);
  };

  const getOptionStyle = (option) => {
    const base = {
      background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.12)',
      borderRadius: 14, padding: '16px 0', fontSize: 16, fontWeight: 700,
      color: '#fff', cursor: answered || isWaiting ? 'default' : 'pointer',
      touchAction: 'manipulation', userSelect: 'none', transition: 'all 0.15s',
    };
    if (!isWaiting && !answered) return base;
    if (isWaiting && option === qg.correctAnswer) return { ...base, background: 'rgba(81,207,102,0.25)', border: '2px solid #51cf66', color: '#51cf66' };
    if (isWaiting && option !== qg.correctAnswer) return { ...base, opacity: 0.4 };
    if (option === myAnswer && !isWaiting) return { ...base, background: 'rgba(108,99,255,0.3)', border: '2px solid #6c63ff' };
    return base;
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>📸 Photo Quiz</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Round {qg.round} / {qg.maxRounds}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sorted.map(p => (
          <div key={p.id} style={{ background: p.id === myId ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.06)', border: p.id === myId ? '1px solid rgba(108,99,255,0.4)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 12px', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{p.name}</span>
            <span style={{ color: '#ffd43b', fontWeight: 800 }}>{p.score || 0}</span>
          </div>
        ))}
      </div>

      {isWaiting ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 52 }}>{winner ? '🎉' : '⏱️'}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: iWon ? '#ffd43b' : '#fff' }}>
            {winner ? `${winner.name} got it!` : "Time's up!"}
          </div>
          <div style={{ fontSize: 18, color: '#51cf66', fontWeight: 700 }}>✅ {qg.correctAnswer}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Next question...</div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
            <img src={qg.image} alt="Who is this?" style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
            <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 10px', fontSize: 14, fontWeight: 700, color: timeLeft <= 3 ? '#ff6b6b' : '#fff' }}>
              ⏱ {timeLeft}s
            </div>
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Who is this?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(qg.options || []).map((option, i) => (
              <button key={i} onPointerDown={(e) => { e.preventDefault(); handleTap(option); }} style={getOptionStyle(option)}>
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
