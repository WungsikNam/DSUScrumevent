import { useEffect, useRef, useState } from 'react';

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const PLAYER_COLORS = ['#6c63ff', '#ff6b6b', '#51cf66', '#ffd43b', '#74c0fc', '#f783ac', '#a9e34b', '#63e6be', '#ff922b', '#cc5de8'];
const TARGET = 50;

export default function GameScreen({ room, myId, onPress }) {
  const localCount = useRef(0);
  const lastSent = useRef(0);
  const [, forceRender] = useState(0);

  // Batch send every 100ms
  useEffect(() => {
    const id = setInterval(() => {
      if (localCount.current > lastSent.current) {
        lastSent.current = localCount.current;
        onPress(localCount.current);
      }
    }, 100);
    return () => clearInterval(id);
  }, [onPress]);

  // Spacebar handler
  useEffect(() => {
    const me = room?.players?.find(p => p.id === myId);
    if (me?.rank != null) return;
    const handler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        localCount.current = Math.min(localCount.current + 1, TARGET);
        forceRender(n => n + 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [myId, room]);

  const handleTap = () => {
    const me = room?.players?.find(p => p.id === myId);
    if (me?.rank != null) return;
    localCount.current = Math.min(localCount.current + 1, TARGET);
    forceRender(n => n + 1);
  };

  // 내 진행도는 로컬 카운트 우선, 다른 플레이어는 서버 값
  const getProgress = (p) => {
    if (p.id === myId) return Math.min(100, Math.round((localCount.current / TARGET) * 100));
    return p.progress;
  };
  const getPresses = (p) => {
    if (p.id === myId) return localCount.current;
    return p.presses;
  };

  const players = [...(room?.players || [])].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    return getProgress(b) - getProgress(a);
  });

  const me = room?.players?.find(p => p.id === myId);
  const myFinished = me?.rank != null;

  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '20px 16px', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>🏁 Sprint Race</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Goal: {TARGET} presses</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {players.map((p, idx) => {
          const colorIdx = (room?.players?.findIndex(x => x.id === p.id) ?? idx) % PLAYER_COLORS.length;
          const color = PLAYER_COLORS[colorIdx];
          const isMe = p.id === myId;
          const finished = p.rank != null;
          const progress = getProgress(p);
          const presses = getPresses(p);

          return (
            <div key={p.id} style={{
              background: isMe ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)',
              border: isMe ? '1px solid rgba(108,99,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {finished && (
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 24, textAlign: 'center', color: RANK_COLORS[p.rank - 1] || 'rgba(255,255,255,0.5)' }}>
                    {p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank - 1] : `#${p.rank}`}
                  </span>
                )}
                <span style={{ fontSize: 15, fontWeight: isMe ? 700 : 500, flex: 1 }}>
                  {p.name} {isMe && <span style={{ fontSize: 12, opacity: 0.5 }}>(you)</span>}
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                  {p.timeTaken ? `${p.timeTaken}s` : `${presses}/${TARGET}`}
                </span>
              </div>
              <div style={{ position: 'relative', height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, background: `${color}33`, borderRadius: 8, transition: isMe ? 'none' : 'width 0.15s ease' }} />
                <div style={{ position: 'absolute', left: `calc(${Math.max(2, progress)}% - 18px)`, top: '50%', transform: 'translateY(-50%)', fontSize: 22, transition: isMe ? 'none' : 'left 0.15s ease' }}>
                  {finished ? '🏁' : '🏃'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 16 }}>
        {myFinished
          ? <div style={{ fontSize: 20, fontWeight: 800, color: '#ffd700' }}>
              {me.rank === 1 ? '🥇 1st Place!' : me.rank === 2 ? '🥈 2nd Place!' : me.rank === 3 ? '🥉 3rd Place!' : `#${me.rank} Finished!`}
            </div>
          : <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Press SPACE BAR to run!</div>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleTap(); }}
                style={{ background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 16, padding: '18px 48px', fontSize: 20, fontWeight: 800, cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation', boxShadow: '0 4px 20px rgba(108,99,255,0.4)' }}
              >
                TAP! 🏃
              </button>
            </>
        }
      </div>
    </div>
  );
}
