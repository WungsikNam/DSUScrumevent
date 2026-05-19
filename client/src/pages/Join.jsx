import { useState, useEffect } from 'react';
import { useSession } from '../SessionContext';
import { theme, cuteCard, cuteBtn } from '../theme';
import WeeklyLeaderboard from '../components/WeeklyLeaderboard';

export default function Join() {
  const { join, joinError, setJoinError } = useSession();
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);

  // ?host=PASSWORD in URL grants host access
  const hostPassword = new URLSearchParams(window.location.search).get('host') || '';

  useEffect(() => {
    setJoinError('');
  }, [nickname, setJoinError]);

  const handleJoin = () => {
    const name = nickname.trim();
    if (!name) { setJoinError('Please enter a nickname.'); return; }
    setBusy(true);
    join(name, hostPassword);
    setTimeout(() => setBusy(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px 72px',
      gap: '28px',
      fontFamily: theme.font,
    }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: '24px' }}>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.green, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Wake Your Brain!
          </div>
          <div style={{ marginTop: '12px', fontSize: 'clamp(2.4rem, 6vw, 3.6rem)', fontWeight: 800, color: theme.ink, lineHeight: 1.05 }}>
            10.0000000000 s
          </div>
          <div style={{ marginTop: '10px', fontSize: '1.05rem', color: theme.inkMuted, lineHeight: 1.6 }}>
            Watch the timer and stop it exactly at 10 seconds.<br />Closest to 10.0 wins.
          </div>
        </div>

        <div style={{ ...cuteCard, padding: '32px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.green, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Nickname
          </div>

          <input
            autoFocus
            type="text"
            placeholder="Your name"
            value={nickname}
            maxLength={20}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{
              width: '100%',
              padding: '16px 18px',
              borderRadius: theme.radiusMd,
              border: `1px solid ${joinError ? '#fca5a5' : theme.borderStrong}`,
              background: theme.white,
              color: theme.ink,
              fontSize: '1.2rem',
              fontWeight: 600,
              fontFamily: theme.font,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {joinError && (
            <div style={{ marginTop: '8px', color: '#b42318', fontSize: '0.92rem', fontWeight: 600 }}>
              {joinError}
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleJoin}
              disabled={busy}
              style={{ ...cuteBtn(!busy), cursor: busy ? 'default' : 'pointer' }}
            >
              {busy ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>

        <WeeklyLeaderboard />
      </div>
    </div>
  );
}
