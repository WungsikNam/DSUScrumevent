import { nextRound } from '../api';
import { theme } from '../theme';

export default function HostBar({ room, playerId }) {
  const { state, round, maxRounds, nextRound: nextRoundNum, times = {}, players = [], sprint } = room;

  const stoppedCount  = Object.keys(times).length;
  const sprintLeader  = state === 'sprint' && sprint?.presses
    ? [...players].sort((a, b) => (sprint.presses[b.id] || 0) - (sprint.presses[a.id] || 0))[0]
    : null;

  const barStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    background: 'rgba(15,23,42,0.95)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontFamily: theme.font,
    flexWrap: 'wrap',
  };

  return (
    <div style={barStyle}>
      {/* Label */}
      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        HOST
      </div>

      {/* Tensecond info */}
      {(state === 'tensecond' || state === '_resolving') && (
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
          Round {round}/{maxRounds} &nbsp;·&nbsp;
          <span style={{ color: stoppedCount === players.length ? '#4ade80' : '#f8fafc', fontWeight: 700 }}>
            {stoppedCount}/{players.length} stopped
          </span>
        </div>
      )}

      {/* Sprint info */}
      {state === 'sprint' && sprintLeader && (
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
          Leading: <span style={{ color: '#f472b6', fontWeight: 700 }}>{sprintLeader.name} ({sprint.presses[sprintLeader.id] || 0})</span>
          &nbsp;·&nbsp;{players.length} players
        </div>
      )}

      {/* Waiting next round */}
      {state === 'waiting_next' && (
        <>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Round {round} done</div>
          <button
            type="button"
            onClick={() => nextRound(playerId)}
            style={{ padding: '6px 18px', borderRadius: 99, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ▶ Start Round {nextRoundNum}
          </button>
        </>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ fontSize: '0.72rem', color: '#475569', whiteSpace: 'nowrap' }}>
        {players.length} in room
      </div>
    </div>
  );
}
