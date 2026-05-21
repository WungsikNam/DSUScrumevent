export default function EmojiGame({ room, myId, onTap }) {
  const eg = room?.emojiGame;
  if (!eg) return null;

  const isWaiting = eg.nextRoundAt !== null;
  const winner = isWaiting ? room.players?.find(p => p.id === eg.roundWinner) : null;
  const iWon = eg.roundWinner === myId;
  const sorted = [...(room.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>🎯 Emoji Rush</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Round {eg.round} / {eg.maxRounds}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sorted.map(p => (
          <div key={p.id} style={{ background: p.id === myId ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.06)', border: p.id === myId ? '1px solid rgba(108,99,255,0.4)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 12px', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{p.name}</span>
            <span style={{ color: '#ffd43b', fontWeight: 800 }}>{p.score || 0}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {isWaiting ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56 }}>{winner ? '🎉' : '⏱️'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, color: iWon ? '#ffd43b' : '#fff' }}>
              {winner ? `${winner.name} got it!` : 'No one got it!'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Next round...</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Find this emoji!</div>
            <div style={{ fontSize: 100, lineHeight: 1 }}>{eg.target}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 16 }}>
        {(eg.options || []).map((emoji, i) => {
          const isTarget = emoji === eg.target && !isWaiting;
          return (
            <button
              key={i}
              onPointerDown={(e) => { e.preventDefault(); if (!isWaiting) onTap(emoji); }}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: isTarget ? '3px solid rgba(255,255,255,0.4)' : '3px solid rgba(255,255,255,0.08)',
                borderRadius: 18,
                padding: '20px 0',
                fontSize: 52,
                cursor: isWaiting ? 'default' : 'pointer',
                opacity: isWaiting ? 0.5 : 1,
                touchAction: 'manipulation',
                userSelect: 'none',
                transition: 'opacity 0.15s',
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
