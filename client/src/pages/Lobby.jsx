import socket from '../socket';

export default function Lobby({ room }) {
  const isHost = room.isHost;

  const handleStart = () => {
    if (room.players.length < 2) return alert('최소 2명이 필요해요!');
    socket.emit('start_game');
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '40px 24px', gap: '28px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: '#a78bfa', fontWeight: 700 }}>방 코드</div>
        <div style={{
          fontSize: '3rem', fontWeight: 900, letterSpacing: '0.3em',
          background: 'linear-gradient(135deg, #7c3aed, #f472b6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          {room.code}
        </div>
        <div style={{ color: '#6b6b8a', fontSize: '0.85rem' }}>
          이 코드를 친구들에게 알려주세요!
        </div>
      </div>

      <div style={{
        background: '#1a1a2e', borderRadius: '20px', padding: '24px',
        width: '100%', maxWidth: '400px'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '16px', color: '#a78bfa' }}>
          참가자 {room.players.length}명
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {room.players.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: '#0f0f1a', borderRadius: '12px', padding: '12px 16px'
            }}>
              <span style={{ fontSize: '1.4rem' }}>
                {['🦁','🐯','🐻','🦊','🐧','🐙','🦄','🐲','🌟','🔥'][i % 10]}
              </span>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</span>
              {p.id === room.players[0]?.id && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.7rem', background: '#7c3aed',
                  padding: '2px 8px', borderRadius: '20px'
                }}>호스트</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <button
            onClick={handleStart}
            disabled={room.players.length < 2}
            style={{
              width: '100%', padding: '18px', borderRadius: '16px',
              background: room.players.length >= 2
                ? 'linear-gradient(135deg, #7c3aed, #f472b6)'
                : '#2d2d4e',
              color: '#fff', fontSize: '1.2rem', fontWeight: 900,
              opacity: room.players.length >= 2 ? 1 : 0.5
            }}
          >
            {room.players.length < 2 ? '최소 2명 필요' : '🎮 게임 시작!'}
          </button>
          <div style={{ textAlign: 'center', color: '#6b6b8a', fontSize: '0.8rem', marginTop: '8px' }}>
            게임 순서: 가위바위보 → 10초 챌린지 → 반응속도
          </div>
        </div>
      ) : (
        <div style={{
          color: '#a78bfa', fontSize: '1rem', textAlign: 'center',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          ⏳ 호스트가 게임을 시작할 때까지 기다려 주세요...
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
