const COLORS = {
  red:    { label: 'RED',    emoji: '🔴', bg: '#ff4444', dark: '#cc2222' },
  blue:   { label: 'BLUE',   emoji: '🔵', bg: '#4488ff', dark: '#2255cc' },
  green:  { label: 'GREEN',  emoji: '🟢', bg: '#44cc44', dark: '#22aa22' },
  yellow: { label: 'YELLOW', emoji: '🟡', bg: '#ffcc00', dark: '#cc9900' },
};

export default function ColorGame({ room, myId, onTap }) {
  const cg = room?.colorGame;
  if (!cg) return null;

  const target = cg.currentColor ? COLORS[cg.currentColor] : null;
  const isWaiting = cg.nextRoundAt !== null;
  const winner = isWaiting ? room.players?.find(p => p.id === cg.roundWinner) : null;
  const iWon = cg.roundWinner === myId;
  const me = room.players?.find(p => p.id === myId);

  const sorted = [...(room.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '16px', gap: 12 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>🎨 Color Rush</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Round {cg.round} / {cg.maxRounds}</div>
      </div>

      {/* 스코어보드 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sorted.map(p => (
          <div key={p.id} style={{ background: p.id === myId ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.06)', border: p.id === myId ? '1px solid rgba(108,99,255,0.4)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 12px', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{p.name}</span>
            <span style={{ color: '#ffd43b', fontWeight: 800 }}>{p.score || 0}</span>
          </div>
        ))}
      </div>

      {/* 메인 영역 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        {isWaiting ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56 }}>{winner ? '🎉' : '⏱️'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, color: iWon ? '#ffd43b' : '#fff' }}>
              {winner ? `${winner.name} got it!` : 'No one got it!'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Next round coming...</div>
          </div>
        ) : target ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>TAP THE COLOR</div>
            <div style={{ fontSize: 72, lineHeight: 1 }}>{target.emoji}</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: target.bg, marginTop: 4 }}>{target.label}</div>
          </div>
        ) : null}
      </div>

      {/* 버튼 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 16 }}>
        {Object.entries(COLORS).map(([key, c]) => {
          const isTarget = cg.currentColor === key && !isWaiting;
          return (
            <button
              key={key}
              onPointerDown={(e) => { e.preventDefault(); if (!isWaiting) onTap(key); }}
              style={{
                background: c.bg,
                border: isTarget ? `3px solid #fff` : '3px solid transparent',
                borderRadius: 16,
                padding: '22px 0',
                fontSize: 22,
                fontWeight: 900,
                color: '#fff',
                cursor: isWaiting ? 'default' : 'pointer',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                opacity: isWaiting ? 0.6 : 1,
                touchAction: 'manipulation',
                userSelect: 'none',
                transition: 'opacity 0.15s',
              }}
            >
              {c.emoji} {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
