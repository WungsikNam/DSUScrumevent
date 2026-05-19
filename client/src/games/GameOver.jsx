import { resetGame } from '../api';
import { theme, cuteCard, cuteBtn } from '../theme';
import BrandHeader from '../components/BrandHeader';
import WeeklyLeaderboard from '../components/WeeklyLeaderboard';

export default function GameOver({ myId, finalScores = [], isHost, playerId }) {
  const handleReset = async () => {
    await resetGame(playerId);
    // Polling detects state → 'lobby' and routes automatically
  };
  const winner = finalScores[0];

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 72px', gap: '24px', fontFamily: theme.font }}>
      <div style={{ width: '100%', maxWidth: theme.shellMax, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <BrandHeader meta="Final results" />

        {winner && (
          <div style={{ ...cuteCard, padding: '30px', border: `1px solid ${theme.green}`, textAlign: 'center' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.green, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {finalScores.length === 1 ? 'Solo complete' : 'Winner'}
            </div>
            <div style={{ marginTop: '12px', fontSize: '2.2rem', fontWeight: 800, color: theme.ink }}>
              {winner.name} {winner.id === myId ? '(you)' : ''}
            </div>
            <div style={{ marginTop: '10px', fontSize: '3.2rem', fontWeight: 800, color: theme.greenDeep }}>
              {winner.score} pt
            </div>
          </div>
        )}

        <div style={{ ...cuteCard, padding: '28px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.green, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Final ranking
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            {finalScores.map((p, i) => {
              const isMe = p.id === myId;
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', borderRadius: theme.radiusMd, background: isMe ? theme.greenPale : theme.surfaceAlt, border: `1px solid ${isMe ? theme.green : theme.border}` }}>
                  <div style={{ minWidth: '2.2rem', fontWeight: 800, fontSize: '1.2rem', color: theme.green }}>{i + 1}</div>
                  <div style={{ flex: 1, fontWeight: 700, color: theme.ink }}>{p.name} {isMe ? '(you)' : ''}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: theme.greenDeep }}>{p.score} pt</div>
                </div>
              );
            })}
          </div>
        </div>

        {isHost ? (
          <button type="button" onClick={handleReset} style={{ ...cuteBtn(true), maxWidth: 360, margin: '0 auto' }}>
            Start New Game
          </button>
        ) : (
          <div style={{ color: theme.inkMuted, fontSize: '0.96rem', textAlign: 'center' }}>
            Refresh the page to join the next session.
          </div>
        )}

        <WeeklyLeaderboard />
      </div>
    </div>
  );
}
