import { useState, useEffect, useRef } from 'react';

export default function TypingGame({ room, myId, onSubmit }) {
  const tg = room?.typingGame;
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);
  const prevRound = useRef(0);
  const mySubmitTime = useRef(null); // 내가 제출한 시간 (ms from round start)

  useEffect(() => {
    if (!tg) return;
    if (tg.round !== prevRound.current) {
      prevRound.current = tg.round;
      setInput('');
      setSubmitted(false);
      mySubmitTime.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [tg?.round]);

  if (!tg) return null;

  const isWaiting = tg.nextRoundAt !== null;
  const winner = isWaiting ? room.players?.find(p => p.id === tg.roundWinner) : null;
  const iWon = tg.roundWinner === myId;
  const sorted = [...(room.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  const timeLeft = tg.roundStartTime ? Math.max(0, Math.ceil((tg.roundStartTime + 10000 - Date.now()) / 1000)) : 10;

  // 차이 계산
  const winnerTime = tg.winnerTime;
  const myTime = mySubmitTime.current;
  const diff = isWaiting && winnerTime != null && myTime != null && !iWon
    ? ((myTime - winnerTime) / 1000).toFixed(3)
    : null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (submitted || isWaiting || !input.trim()) return;
    // 제출 시점 기록
    mySubmitTime.current = tg.roundStartTime ? Date.now() - tg.roundStartTime : null;
    setSubmitted(true);
    onSubmit(input.trim());
  };

  const isCorrect = input.trim().toLowerCase() === (tg.phrase || '').toLowerCase();

  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>⌨️ Typing Rush</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Round {tg.round} / {tg.maxRounds}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sorted.map(p => (
          <div key={p.id} style={{ background: p.id === myId ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.06)', border: p.id === myId ? '1px solid rgba(108,99,255,0.4)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 12px', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{p.name}</span>
            <span style={{ color: '#ffd43b', fontWeight: 800 }}>{p.score || 0}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isWaiting ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 52 }}>{winner ? '🎉' : '⏱️'}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: iWon ? '#ffd43b' : '#fff' }}>
              {winner ? `${winner.name} got it!` : "Time's up!"}
            </div>
            {winnerTime != null && (
              <div style={{ fontSize: 15, color: '#74c0fc', fontWeight: 600 }}>
                {iWon ? `✅ You won in ${(winnerTime / 1000).toFixed(3)}s!` : `⏱ ${(winnerTime / 1000).toFixed(3)}s`}
              </div>
            )}
            {diff != null && (
              <div style={{ fontSize: 14, color: '#ff9a9a', fontWeight: 600 }}>
                You were <span style={{ fontWeight: 900, fontSize: 17 }}>{diff}s</span> behind 😤
              </div>
            )}
            {!iWon && myTime == null && winnerTime != null && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Winner finished in {(winnerTime / 1000).toFixed(3)}s
              </div>
            )}
            <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
              "{tg.phrase}"
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Next round...</div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Type this!</div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 1, color: '#fff', background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 28px' }}>
                  {tg.phrase}
                </div>
                <div style={{ marginTop: 10, fontSize: 13, color: timeLeft <= 3 ? '#ff6b6b' : 'rgba(255,255,255,0.35)' }}>
                  ⏱ {timeLeft}s
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={submitted}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  placeholder="Start typing..."
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: `2px solid ${isCorrect ? '#51cf66' : input.length > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12, padding: '14px 16px',
                    color: '#fff', fontSize: 20, outline: 'none', width: '100%',
                    fontFamily: 'monospace',
                    transition: 'border-color 0.1s',
                  }}
                />
                <button
                  type="submit"
                  disabled={submitted || !input.trim()}
                  style={{
                    background: isCorrect ? '#51cf66' : '#6c63ff',
                    color: '#fff', border: 'none', borderRadius: 12,
                    padding: '14px 0', fontSize: 16, fontWeight: 800,
                    cursor: submitted ? 'default' : 'pointer',
                    opacity: (!input.trim() || submitted) ? 0.5 : 1,
                    transition: 'background 0.1s',
                  }}
                >
                  {submitted ? 'Submitted!' : 'Submit ↵'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
