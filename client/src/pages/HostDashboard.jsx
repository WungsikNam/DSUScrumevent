import { useState } from 'react';
import { startGame, startSprint, nextRound, resetGame } from '../api';
import { theme, cuteCard, cuteBtn } from '../theme';

const RUNNER_EMOJIS = ['🐆','🦁','🦊','🐺','🦅','🐎','🐬','🐻','🦋','🐸'];

function Badge({ children, color = theme.green }) {
  return (
    <span style={{ padding: '3px 10px', borderRadius: 99, background: color + '22', color, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {children}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ ...cuteCard, padding: '20px 22px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: theme.green, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

export default function HostDashboard({ room, playerId }) {
  const [copied, setCopied] = useState(false);
  const { state, players = [], round, maxRounds, goTime, times = {}, results, nextRound: nextRoundNum, finalScores, sprint } = room;

  const joinUrl = window.location.origin;
  const timeLeft = goTime ? Math.max(0, Math.ceil((goTime + 10000 - Date.now()) / 1000)) : null;
  const sprintTimeLeft = sprint?.endTime ? Math.max(0, Math.ceil((sprint.endTime - Date.now()) / 1000)) : null;

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stateLabel = {
    lobby:        { text: 'Lobby',        color: theme.green },
    tensecond:    { text: 'Game On',      color: '#2563eb' },
    _resolving:   { text: 'Results',      color: theme.inkMuted },
    waiting_next: { text: 'Between Rounds', color: '#d97706' },
    sprint:       { text: 'Sprint On',    color: '#dc2626' },
    results:      { text: 'Game Over',    color: theme.inkMuted },
  }[state] || { text: state, color: theme.inkMuted };

  return (
    <div style={{ minHeight: '100dvh', fontFamily: theme.font, background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)', color: '#f8fafc', padding: '24px 20px 48px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>🧠 Wake Your Brain!</div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>Host Dashboard</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge color={stateLabel.color}>{stateLabel.text}</Badge>
            {(state === 'tensecond' && timeLeft !== null) && (
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: timeLeft <= 3 ? '#f87171' : '#4ade80' }}>{timeLeft}s</span>
            )}
            {(state === 'sprint' && sprintTimeLeft !== null) && (
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: sprintTimeLeft <= 3 ? '#f87171' : '#f472b6' }}>{sprintTimeLeft}s</span>
            )}
          </div>
        </div>

        {/* Join link + participant count */}
        <div style={{ ...cuteCard, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Join URL</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.92rem', color: '#e2e8f0', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{joinUrl}</div>
          </div>
          <button
            type="button"
            onClick={copyLink}
            style={{ padding: '8px 16px', borderRadius: 99, border: 'none', background: copied ? '#16a34a' : 'rgba(255,255,255,0.12)', color: '#f8fafc', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {copied ? '✓ Copied' : 'Copy Link'}
          </button>
          <div style={{ padding: '8px 16px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', fontWeight: 700, fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {players.length} joined
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>

          {/* Participants */}
          <div style={{ flex: '1 1 300px' }}>
            <Section title={`Participants · ${players.length}`}>
              {players.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>No one yet. Share the link above.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {players.map((p, i) => {
                    const stopped   = times[p.id] !== undefined;
                    const spPresses = sprint?.presses?.[p.id] ?? null;
                    const emoji     = RUNNER_EMOJIS[i % RUNNER_EMOJIS.length];

                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme.gradientMain, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#fff', flexShrink: 0 }}>
                          {p.name[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 1 }}>
                            {p.score > 0 ? `${p.score} pts` : 'No score yet'}
                          </div>
                        </div>
                        {state === 'tensecond' && (
                          <Badge color={stopped ? theme.green : '#d97706'}>{stopped ? 'Stopped ✓' : 'Running...'}</Badge>
                        )}
                        {state === 'sprint' && spPresses !== null && (
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#f472b6' }}>{spPresses} {emoji}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>

          {/* Controls */}
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Lobby controls */}
            {state === 'lobby' && (
              <Section title="Start a Game">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button type="button" onClick={() => startGame(playerId)} style={{ ...cuteBtn(players.length > 0), fontSize: '1rem' }}>
                    ⏱ 10-Second Challenge
                  </button>
                  <button
                    type="button"
                    onClick={() => startSprint(playerId)}
                    style={{ ...cuteBtn(players.length > 0), background: players.length > 0 ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : theme.inkSoft, fontSize: '1rem' }}
                  >
                    🏃 100m Sprint
                  </button>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                    {players.length === 0 ? 'Wait for participants to join.' : `${players.length} player${players.length > 1 ? 's' : ''} ready.`}
                  </div>
                </div>
              </Section>
            )}

            {/* TenSecond in-game */}
            {(state === 'tensecond' || state === '_resolving') && (
              <Section title="Round Progress">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
                    {Object.keys(times).length} / {players.length}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>stopped</div>
                  <div style={{ marginTop: 12, fontSize: '0.85rem', color: '#94a3b8' }}>Round {round} of {maxRounds}</div>
                </div>
              </Section>
            )}

            {/* Between rounds */}
            {state === 'waiting_next' && (
              <Section title="Next Round">
                {results && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {results.map((r, i) => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: i === 0 ? '#4ade80' : '#94a3b8' }}>
                        <span>{i + 1}. {r.name}</span>
                        <span style={{ fontFamily: 'monospace' }}>{(r.elapsed / 1000).toFixed(3)}s</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => nextRound(playerId)}
                  style={{ ...cuteBtn(true), fontSize: '1rem' }}
                >
                  Start Round {nextRoundNum}
                </button>
              </Section>
            )}

            {/* Sprint in-game */}
            {state === 'sprint' && (
              <Section title="Sprint Progress">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[...players]
                    .sort((a, b) => (sprint?.presses?.[b.id] || 0) - (sprint?.presses?.[a.id] || 0))
                    .map((p, i) => {
                      const count = sprint?.presses?.[p.id] || 0;
                      const pct   = Math.min(100, (count / 80) * 100);
                      return (
                        <div key={p.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: i === 0 && count > 0 ? '#4ade80' : '#94a3b8', marginBottom: 3 }}>
                            <span>{i === 0 && count > 0 ? '👑 ' : ''}{p.name}</span>
                            <span style={{ fontFamily: 'monospace' }}>{count}</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? '#4ade80' : '#475569', borderRadius: 99, transition: 'width 0.2s' }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Section>
            )}

            {/* Final results */}
            {state === 'results' && (
              <Section title="Final Ranking">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {(finalScores || []).map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: i === 0 ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? '#4ade8044' : 'rgba(255,255,255,0.06)'}` }}>
                      <span style={{ fontWeight: 700, color: i === 0 ? '#4ade80' : '#f1f5f9' }}>{i + 1}. {p.name}</span>
                      <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{p.score} pt</span>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => resetGame(playerId)} style={{ ...cuteBtn(true), fontSize: '1rem' }}>
                  Start New Game
                </button>
              </Section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
