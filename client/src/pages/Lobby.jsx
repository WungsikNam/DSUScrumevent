import { startGame, startSprint } from '../api';
import { theme, cuteCard, cuteBtn } from '../theme';
import BrandHeader from '../components/BrandHeader';

export default function Lobby({ players, isHost, playerId }) {
  const handleStart = () => startGame(playerId);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 72px', gap: '24px', fontFamily: theme.font }}>
      <div style={{ width: '100%', maxWidth: theme.shellMax, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <BrandHeader meta={`${players.length} waiting`} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ ...cuteCard, flex: '1 1 320px', padding: '28px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.green, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Participants</div>
            <div style={{ marginTop: '8px', fontSize: '1.8rem', fontWeight: 800, color: theme.ink }}>
              {players.length} {players.length === 1 ? 'person' : 'people'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px' }}>
              {players.length === 0 ? (
                <div style={{ color: theme.inkMuted, fontSize: '1rem', padding: '12px 0' }}>No one here yet.</div>
              ) : players.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: theme.radiusMd, background: p.id === playerId ? theme.greenPale : theme.surfaceAlt, border: `1px solid ${p.id === playerId ? theme.green : theme.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: p.isHost ? theme.gradientMain : theme.greenPale, color: p.isHost ? '#fff' : theme.greenDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: theme.ink }}>{p.name} {p.id === playerId ? '(you)' : ''}</div>
                    {p.isHost && <div style={{ fontSize: '0.76rem', color: theme.green, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>Host</div>}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: theme.inkMuted }}>#{i + 1}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cuteCard, flex: '1 1 280px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.green, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Today's game</div>
              <div style={{ marginTop: '10px', fontSize: '1.6rem', fontWeight: 800, color: theme.ink, lineHeight: 1.2 }}>Wake Your Brain!</div>
              <div style={{ marginTop: '8px', color: theme.inkMuted, fontSize: '0.96rem', lineHeight: 1.65 }}>
                Watch the timer count up and stop it as close to{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: theme.greenDeep }}>10.0000000000 s</span> as possible.
              </div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: theme.radiusMd, background: theme.surfaceMuted, border: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.green, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rounds</div>
              <div style={{ marginTop: '4px', fontSize: '1.4rem', fontWeight: 800, color: theme.ink }}>3 rounds</div>
              <div style={{ marginTop: '2px', fontSize: '0.88rem', color: theme.inkMuted }}>Cumulative score determines final ranking</div>
            </div>
            {isHost ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" onClick={handleStart} style={cuteBtn(players.length > 0)}>
                  ⏱ 10-Second Challenge
                </button>
                <button
                  type="button"
                  onClick={() => startSprint(playerId)}
                  style={{ ...cuteBtn(players.length > 0), background: players.length > 0 ? 'linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)' : theme.inkSoft }}
                >
                  🏃 100m Sprint
                </button>
                <div style={{ marginTop: '4px', fontSize: '0.88rem', color: theme.inkMuted, textAlign: 'center' }}>Start when everyone is in the room.</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: theme.greenDeep, fontWeight: 700, fontSize: '1rem', padding: '16px 0' }}>
                Waiting for the host to start the game...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
