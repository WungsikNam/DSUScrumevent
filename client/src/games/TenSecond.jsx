import { useState, useEffect, useRef, useCallback } from 'react';
import { stopTimer, nextRound } from '../api';
import { theme, cuteCard } from '../theme';
import BrandHeader from '../components/BrandHeader';

const TARGET = 10000;
const DIGITS = 10;
const GAME_TIMEOUT_MS = 20000;

function fmt(ms) {
  if (ms == null) return '0.' + '0'.repeat(DIGITS);
  return (ms / 1000).toFixed(DIGITS);
}

function diffLabel(diff) {
  if (diff < 50)   return { text: 'Perfect',    color: '#0f5132' };
  if (diff < 150)  return { text: 'Excellent',  color: theme.greenDeep };
  if (diff < 400)  return { text: 'Very close', color: theme.green };
  if (diff < 900)  return { text: 'Solid',      color: theme.mint };
  if (diff < 2000) return { text: 'Almost',     color: theme.inkMuted };
  return             { text: 'Keep going',  color: '#b42318' };
}

export default function TenSecond({ myId, isHost, playerId, room, round, maxRounds, goTime, times, results, waitingNext, nextRound: nextRoundNum }) {
  const players = room?.players || [];
  const isSpectator = room?.activePlayerIds ? !room.activePlayerIds.includes(myId) : false;
  const stoppedRef = useRef(false);
  const localStartRef = useRef(null);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  const [display, setDisplay] = useState('0.' + '0'.repeat(DIGITS));
  const [myElapsed, setMyElapsed] = useState(null);
  const [phase, setPhase] = useState('countdown'); // countdown | playing | done

  const stopRaf = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  // Determine phase from goTime
  useEffect(() => {
    if (!goTime) return;
    const now = Date.now();
    const msUntilGo = goTime - now;

    if (msUntilGo > 0) {
      setPhase('countdown');
      const t = setTimeout(() => {
        if (stoppedRef.current) return;
        localStartRef.current = performance.now();
        stoppedRef.current = false;
        setPhase('playing');
        setDisplay('0.' + '0'.repeat(DIGITS));

        const tick = () => {
          if (stoppedRef.current) return;
          setDisplay(fmt(performance.now() - localStartRef.current));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        // Auto-submit after 20s
        timeoutRef.current = setTimeout(() => {
          if (!stoppedRef.current) handleStop(GAME_TIMEOUT_MS);
        }, GAME_TIMEOUT_MS + 500);
      }, msUntilGo);
      return () => clearTimeout(t);
    } else {
      if (!stoppedRef.current && phase !== 'playing' && phase !== 'done') {
        localStartRef.current = performance.now() + msUntilGo; // adjust for elapsed
        stoppedRef.current = false;
        setPhase('playing');
        const tick = () => {
          if (stoppedRef.current) return;
          setDisplay(fmt(performance.now() - localStartRef.current));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goTime]);

  // Reset when round changes
  useEffect(() => {
    stopRaf();
    stoppedRef.current = false;
    setMyElapsed(null);
    setDisplay('0.' + '0'.repeat(DIGITS));
    setPhase('countdown');
  }, [round, stopRaf]);

  // If results arrive, stop timer
  useEffect(() => {
    if (results) { stopRaf(); }
  }, [results, stopRaf]);

  const handleStop = useCallback((forceElapsed) => {
    if (stoppedRef.current || isSpectator) return;
    const elapsed = forceElapsed ?? (performance.now() - localStartRef.current);
    stoppedRef.current = true;
    stopRaf();
    setDisplay(fmt(elapsed));
    setMyElapsed(elapsed);
    setPhase('done');
    stopTimer(playerId, elapsed);
  }, [playerId, stopRaf, isSpectator]);

  const stoppedIds = times ? Object.keys(times) : [];
  const stoppedCount = stoppedIds.length;
  const isLastRound = round === maxRounds;

  const countdown = goTime ? Math.max(0, Math.ceil((goTime - Date.now()) / 1000)) : 3;

  return (
    <div
      style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 60px', gap: '20px', fontFamily: theme.font, userSelect: 'none' }}
      onClick={phase === 'playing' ? () => handleStop() : undefined}
    >
      <div style={{ width: '100%', maxWidth: theme.shellMax, display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ width: '100%' }}>
          <BrandHeader meta={`Round ${round} / ${maxRounds}`} />
        </div>

        {/* Countdown */}
        {phase === 'countdown' && !results && (
          <div style={{ ...cuteCard, width: '100%', padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: theme.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>
              Round {round} of {maxRounds}
            </div>
            <div style={{ fontSize: '8rem', fontWeight: 800, color: theme.greenDeep, lineHeight: 1, fontFamily: 'monospace' }}>
              {countdown}
            </div>
            <div style={{ marginTop: '20px', fontSize: '1.1rem', color: theme.inkMuted }}>
              Watch the timer — stop it exactly on{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: theme.greenDeep }}>10.0000000000</span>
            </div>
          </div>
        )}

        {/* Timer */}
        {(phase === 'playing' || phase === 'done') && !results && (
          <div style={{ ...cuteCard, width: '100%', padding: '40px 32px', textAlign: 'center', cursor: phase === 'playing' ? 'pointer' : 'default', border: phase === 'done' ? `2px solid ${theme.green}` : `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 'clamp(2.4rem, 7vw, 4.4rem)', fontWeight: 800, fontFamily: 'monospace', color: phase === 'done' ? (Math.abs(myElapsed - TARGET) < 500 ? theme.greenDeep : theme.ink) : theme.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {display} s
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.9rem', fontWeight: 600, color: theme.inkMuted, fontFamily: 'monospace' }}>
              target: 10.0000000000 s
            </div>

            {phase === 'playing' && !isSpectator && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleStop(); }}
                style={{ marginTop: '28px', width: '100%', maxWidth: '320px', padding: '22px 0', borderRadius: theme.radiusPill, border: 'none', background: '#dc2626', color: '#fff', fontSize: '1.5rem', fontWeight: 800, fontFamily: theme.font, cursor: 'pointer', boxShadow: '0 8px 24px rgba(220,38,38,0.35)', letterSpacing: '0.04em' }}
              >
                ■ STOP
              </button>
            )}
            {phase === 'playing' && isSpectator && (
              <div style={{ marginTop: '24px', padding: '14px 24px', borderRadius: theme.radiusPill, background: theme.surfaceMuted, color: theme.inkMuted, fontWeight: 700, fontSize: '1rem', display: 'inline-block' }}>
                👀 Watching — join the next round!
              </div>
            )}

            {phase === 'done' && myElapsed != null && (
              <>
                <div style={{ marginTop: '20px', fontSize: '1.3rem', fontWeight: 800, color: diffLabel(Math.abs(myElapsed - TARGET)).color }}>
                  {diffLabel(Math.abs(myElapsed - TARGET)).text}
                </div>
                <div style={{ marginTop: '6px', fontSize: '1rem', color: theme.inkMuted, fontFamily: 'monospace' }}>
                  ±{(Math.abs(myElapsed - TARGET) / 1000).toFixed(DIGITS)} s
                </div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ color: theme.inkSoft, fontSize: '0.88rem', marginBottom: '10px' }}>
                    Stopped: {stoppedCount} / {players.length}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                    {players.map(p => {
                      const stopped = stoppedIds.includes(p.id);
                      return (
                        <span key={p.id} style={{ padding: '4px 10px', borderRadius: theme.radiusPill, fontSize: '0.82rem', fontWeight: 700, background: stopped ? theme.greenPale : theme.surfaceMuted, color: stopped ? theme.greenDeep : theme.inkSoft, border: `1px solid ${stopped ? theme.green : theme.border}` }}>
                          {stopped ? '✓ ' : ''}{p.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {phase === 'playing' && (
              <div style={{ marginTop: '12px', fontSize: '0.9rem', color: theme.inkMuted }}>or tap anywhere on this page</div>
            )}
          </div>
        )}

        {/* Results */}
        {results && (
          <div style={{ ...cuteCard, padding: '28px', width: '100%' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.green, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Round {round} results
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {results.map((entry, index) => {
                const isMe = entry.id === myId;
                const dnf = entry.elapsed >= 90000;
                return (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: theme.radiusMd, background: isMe ? theme.greenPale : theme.surfaceAlt, border: `1px solid ${isMe ? theme.green : theme.border}` }}>
                    <div style={{ minWidth: '2rem', fontWeight: 800, fontSize: '1.1rem', color: theme.green }}>{index + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: theme.ink }}>{entry.name} {isMe ? '(you)' : ''}</div>
                      <div style={{ marginTop: '3px', fontSize: '0.85rem', color: theme.inkMuted, fontFamily: 'monospace' }}>
                        {dnf ? 'No stop recorded' : `${fmt(entry.elapsed)} s  ±${fmt(entry.diff)}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, color: theme.greenDeep }}>+{entry.points} pt</div>
                      <div style={{ fontSize: '0.8rem', color: theme.inkMuted }}>{entry.totalScore} total</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '20px' }}>
              {isLastRound ? (
                <div style={{ textAlign: 'center', color: theme.inkMuted, fontSize: '0.94rem' }}>All rounds complete. Showing final results...</div>
              ) : waitingNext ? (
                isHost ? (
                  <button
                    type="button"
                    onClick={() => nextRound(playerId)}
                    style={{ width: '100%', padding: '18px 0', borderRadius: theme.radiusPill, border: 'none', background: theme.gradientMain, color: '#fff', fontSize: '1.1rem', fontWeight: 800, fontFamily: theme.font, cursor: 'pointer', boxShadow: theme.shadowSm }}
                  >
                    Start Round {nextRoundNum}
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', color: theme.inkMuted, fontSize: '0.94rem' }}>
                    Waiting for host to start Round {nextRoundNum}...
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center', color: theme.inkMuted, fontSize: '0.94rem' }}>Round {round + 1} starting...</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
