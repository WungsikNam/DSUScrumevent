const S = {
  wrap: {
    minHeight: '100dvh', background: '#0f0f1a', color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: 24, gap: 24,
  },
  title: { fontSize: 28, fontWeight: 800, marginTop: 32, letterSpacing: -1 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.45)' },
  card: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 24, width: '100%', maxWidth: 440,
  },
  cardTitle: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' },
  playerRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#51cf66', flexShrink: 0 },
  playerName: { fontSize: 15, fontWeight: 500, flex: 1 },
  hostBadge: {
    fontSize: 11, background: '#6c63ff33', color: '#a89cff',
    border: '1px solid #6c63ff55', borderRadius: 6, padding: '2px 8px', fontWeight: 600,
  },
  startBtn: {
    background: '#51cf66', color: '#0f0f1a', border: 'none', borderRadius: 12,
    padding: '16px 0', fontSize: 18, fontWeight: 800, cursor: 'pointer',
    width: '100%', maxWidth: 440, marginTop: 8,
  },
  waiting: { fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 8 },
};

export default function LobbyScreen({ room, isHost, myId, onStart, onLeave }) {
  const players = room?.players || [];

  return (
    <div style={S.wrap}>
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', alignItems: 'center', marginTop: 16 }}>
        <button onClick={onLeave} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', padding: '4px 0' }}>
          ← Leave
        </button>
      </div>
      <div style={{ textAlign: 'center' }}>
        <img src="/ifelse-logo.png" alt="ifelse" style={{ height: 40, marginBottom: 10, objectFit: 'contain' }} />
        <div style={S.title}>🏃 Sprint Race</div>
        <div style={S.sub}>Waiting · {players.length} player{players.length !== 1 ? 's' : ''} connected</div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Players</div>
        {players.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No players yet</div>
        )}
        {players.map((p, i) => (
          <div key={p.id} style={{ ...S.playerRow, borderBottom: i === players.length - 1 ? 'none' : S.playerRow.borderBottom }}>
            <div style={S.dot} />
            <div style={{ ...S.playerName, color: p.id === myId ? '#6c63ff' : '#fff' }}>
              {p.name} {p.id === myId && <span style={{ fontSize: 12, opacity: 0.6 }}>(you)</span>}
            </div>
            {p.isHost && <span style={S.hostBadge}>HOST</span>}
          </div>
        ))}
      </div>

      {isHost
        ? <button style={S.startBtn} onClick={onStart}>Start Game</button>
        : <div style={S.waiting}>Waiting for host to start the game...</div>
      }
    </div>
  );
}
