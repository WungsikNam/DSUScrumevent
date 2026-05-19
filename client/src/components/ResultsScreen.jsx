import { useEffect, useState } from 'react';

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

export default function ResultsScreen({ room, myId, isHost, onReset }) {
  const [timer, setTimer] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const players = [...(room?.players || [])].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  return (
    <div style={{
      minHeight: '100dvh', background: '#0f0f1a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 16px', gap: 24,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🏆</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>Final Results</div>
      </div>

      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {players.map((p) => {
          const isMe = p.id === myId;
          const rankColor = RANK_COLORS[p.rank - 1];
          return (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: isMe ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.05)',
                border: isMe ? '1px solid rgba(108,99,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '14px 18px',
              }}
            >
              <div style={{
                fontSize: p.rank <= 3 ? 28 : 18,
                fontWeight: 900,
                color: rankColor || 'rgba(255,255,255,0.4)',
                minWidth: 36, textAlign: 'center',
              }}>
                {p.rank <= 3 ? MEDALS[p.rank - 1] : `#${p.rank}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: isMe ? 700 : 500 }}>
                  {p.name} {isMe && <span style={{ fontSize: 12, opacity: 0.5 }}>(you)</span>}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {p.timeTaken ? `${p.timeTaken}s` : `${p.presses} / ${room?.target || 150} presses`}
                </div>
              </div>
              {p.rank === 1 && <div style={{ fontSize: 22 }}>🎉</div>}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
        {timer > 0 ? `Returning to lobby in ${timer}s...` : 'Returning to lobby...'}
      </div>
      {isHost && (
        <button onClick={onReset} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
          Back to Lobby Now
        </button>
      )}
    </div>
  );
}
