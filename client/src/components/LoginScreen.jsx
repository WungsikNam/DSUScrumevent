import { useState } from 'react';

const S = {
  wrap: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#0f0f1a', color: '#fff', padding: 24, gap: 32,
  },
  title: { fontSize: 36, fontWeight: 800, letterSpacing: -1, textAlign: 'center' },
  sub: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 6, textAlign: 'center' },
  card: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 32, width: '100%', maxWidth: 360,
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  input: {
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 16, outline: 'none', width: '100%',
  },
  btn: {
    background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 10,
    padding: '14px 0', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%',
  },
  error: { color: '#ff6b6b', fontSize: 14, textAlign: 'center' },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: -8 },
};

export default function LoginScreen({ onJoin, error }) {
  const [nickname, setNickname] = useState('');
  const [hostPw, setHostPw] = useState('');
  const [showHost, setShowHost] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    onJoin(nickname.trim(), hostPw);
  };

  return (
    <div style={S.wrap}>
      <div>
        <div style={S.title}>🏃 Mini Games</div>
        <div style={S.sub}>Enter your nickname to join</div>
      </div>
      <form style={S.card} onSubmit={submit}>
        <span style={S.label}>Nickname</span>
        <input
          style={S.input}
          placeholder="Enter nickname (max 16 chars)"
          maxLength={16}
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          autoFocus
        />
        {showHost && (
          <>
            <span style={S.label}>Host Password</span>
            <input
              style={S.input}
              type="password"
              placeholder="Host password"
              value={hostPw}
              onChange={e => setHostPw(e.target.value)}
            />
          </>
        )}
        {error && <div style={S.error}>{error}</div>}
        <button style={S.btn} type="submit">Join</button>
        <button
          type="button"
          style={{ background: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', border: 'none', marginTop: -4 }}
          onClick={() => setShowHost(v => !v)}
        >
          {showHost ? '▲ Hide host login' : '▼ Join as host'}
        </button>
      </form>
    </div>
  );
}
