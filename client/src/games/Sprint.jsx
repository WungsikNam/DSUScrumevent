import { useState, useEffect, useRef, useCallback } from 'react';
import { sendSprintPress, endSprint } from '../api';
import { theme, cuteCard } from '../theme';
import BrandHeader from '../components/BrandHeader';

const DURATION_MS = 10000;
const VISUAL_MAX = 90; // presses to reach end of track visually
const RUNNER_EMOJIS = ['🐆','🦁','🦊','🐺','🦅','🐎','🐬','🐻','🦋','🐸'];
const COUNTDOWN_STEPS = ['3','2','1','HIT IT!'];

const css = `
@keyframes runBounce {
  0%,100% { transform: translateY(0px) scaleX(1); }
  30%      { transform: translateY(-7px) scaleX(0.95); }
  60%      { transform: translateY(-3px) scaleX(1.05); }
}
@keyframes idleBob {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-3px); }
}
@keyframes flashHitIt {
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes tapPulse {
  0%   { transform: scale(1); box-shadow: 0 6px 20px rgba(220,38,38,0.35); }
  50%  { transform: scale(0.94); box-shadow: 0 2px 8px rgba(220,38,38,0.2); }
  100% { transform: scale(1); box-shadow: 0 6px 20px rgba(220,38,38,0.35); }
}
`;

export default function Sprint({ myId, playerId, room }) {
  const isSpectator = room?.activePlayerIds ? !room.activePlayerIds.includes(myId) : false;
  const players = room?.players || [];
  const sprint = room?.sprint || {};
  const startTime = sprint.startTime || 0;
  const endTime   = sprint.endTime || 0;
  const serverPresses = sprint.presses || {};
  const results = sprint.results || null;

  const localCount   = useRef(0);
  const lastSent     = useRef(0);
  const endSentRef   = useRef(false);
  const tapAnim      = useRef(false);

  const [display, setDisplay]     = useState(0);
  const [phase, setPhase]         = useState('countdown');
  const [cdStep, setCdStep]       = useState(0); // 0=3,1=2,2=1,3=HIT IT
  const [timeLeft, setTimeLeft]   = useState(10);
  const [tapFlash, setTapFlash]   = useState(false);

  // Countdown stepper
  useEffect(() => {
    if (!startTime) return;
    const steps = [
      { label: '3',       delay: startTime - 3000 },
      { label: '2',       delay: startTime - 2000 },
      { label: '1',       delay: startTime - 1000 },
      { label: 'HIT IT!', delay: startTime },
    ];
    const timers = steps.map((s, i) => {
      const ms = s.delay - Date.now();
      if (ms < 0) return null;
      return setTimeout(() => setCdStep(i), ms);
    });
    return () => timers.forEach(t => t && clearTimeout(t));
  }, [startTime]);

  // Phase + timer
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now < startTime) {
        setPhase('countdown');
      } else if (now < endTime) {
        setPhase('racing');
        setTimeLeft(Math.ceil((endTime - now) / 1000));
      } else {
        setPhase('done');
        setTimeLeft(0);
      }
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  // Send presses to server every 150ms
  useEffect(() => {
    const id = setInterval(() => {
      if (localCount.current > lastSent.current && phase === 'racing') {
        lastSent.current = localCount.current;
        sendSprintPress(playerId, localCount.current);
      }
    }, 150);
    return () => clearInterval(id);
  }, [playerId, phase]);

  // Auto-end after 10s
  useEffect(() => {
    if (!endTime) return;
    const ms = endTime - Date.now();
    if (ms < 0) return;
    const t = setTimeout(() => {
      if (!endSentRef.current) {
        endSentRef.current = true;
        sendSprintPress(playerId, localCount.current);
        endSprint(playerId);
      }
    }, ms + 400);
    return () => clearTimeout(t);
  }, [endTime, playerId]);

  const press = useCallback(() => {
    if (phase !== 'racing' || isSpectator) return;
    localCount.current++;
    setDisplay(localCount.current);
    setTapFlash(f => !f);
  }, [phase]);

  useEffect(() => {
    const handler = (e) => {
      if (['Space','Enter','ArrowUp','ArrowRight'].includes(e.code)) {
        e.preventDefault();
        press();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [press]);

  // Build sorted player list for race track
  const combinedPresses = { ...serverPresses, [myId]: Math.max(serverPresses[myId] || 0, localCount.current) };
  const maxPresses = Math.max(1, ...players.map(p => combinedPresses[p.id] || 0));
  const sorted = [...players].sort((a, b) => (combinedPresses[b.id] || 0) - (combinedPresses[a.id] || 0));

  const getTrackPct = (id) => {
    const count = combinedPresses[id] || 0;
    // Normalize: leader at max 88%, others proportional
    return Math.min(88, (count / Math.max(VISUAL_MAX, maxPresses)) * 88);
  };

  const isRunning = phase === 'racing';

  return (
    <div
      style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 40px', gap: '14px', fontFamily: theme.font, background: 'linear-gradient(180deg,#f0fdf4 0%,#dcfce7 100%)' }}
      onClick={press}
    >
      <style>{css}</style>
      <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <BrandHeader meta={
          phase === 'countdown' ? COUNTDOWN_STEPS[cdStep] :
          phase === 'racing'    ? `${timeLeft}s` :
          'Finished!'
        } />

        {/* Countdown overlay */}
        {phase === 'countdown' && (
          <div style={{ ...cuteCard, padding: '48px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.95)' }}>
            <div key={cdStep} style={{
              fontSize: cdStep === 3 ? 'clamp(3rem,10vw,5rem)' : '8rem',
              fontWeight: 800,
              color: cdStep === 3 ? '#dc2626' : theme.greenDeep,
              lineHeight: 1,
              fontFamily: 'monospace',
              animation: 'flashHitIt 0.4s ease',
            }}>
              {COUNTDOWN_STEPS[cdStep]}
            </div>
            {cdStep < 3 && (
              <div style={{ marginTop: 14, fontSize: '1rem', color: theme.inkMuted }}>
                Press <strong>SPACE</strong> or tap — 10 seconds, most presses wins!
              </div>
            )}
          </div>
        )}

        {/* Race track */}
        {(phase === 'racing' || phase === 'done') && !results && (
          <>
            {/* Track lanes */}
            <div style={{ ...cuteCard, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  🏁 Race Track
                </span>
                {phase === 'racing' && (
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.3rem', color: timeLeft <= 3 ? '#dc2626' : theme.greenDeep }}>
                    {timeLeft}s
                  </span>
                )}
              </div>

              {sorted.map((p, idx) => {
                const count = combinedPresses[p.id] || 0;
                const pct   = getTrackPct(p.id);
                const isMe  = p.id === myId;
                const emoji = RUNNER_EMOJIS[players.findIndex(x => x.id === p.id) % RUNNER_EMOJIS.length];
                const leading = idx === 0 && count > 0;

                return (
                  <div key={p.id}>
                    {/* Name row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isMe ? theme.greenDeep : theme.ink }}>
                        {leading ? '👑 ' : ''}{p.name}{isMe ? ' (you)' : ''}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: theme.inkMuted, fontWeight: 600 }}>
                        {count}
                      </span>
                    </div>

                    {/* Track */}
                    <div style={{ position: 'relative', height: 36, background: isMe ? '#f0fdf4' : '#f8fafc', borderRadius: 18, border: `1.5px solid ${isMe ? theme.green : theme.border}`, overflow: 'hidden' }}>
                      {/* Progress fill */}
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct + 4}%`, background: isMe ? 'linear-gradient(90deg,#bbf7d0,#4ade80)' : 'linear-gradient(90deg,#e2e8f0,#94a3b8)', borderRadius: 18, transition: 'width 0.15s ease' }} />

                      {/* Finish line */}
                      <div style={{ position: 'absolute', right: '8%', top: 0, bottom: 0, width: 2, background: '#dc2626', opacity: 0.4 }} />

                      {/* Runner emoji */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${Math.max(2, pct)}%`,
                        transform: 'translateY(-50%)',
                        fontSize: 22,
                        transition: 'left 0.15s ease',
                        animation: isRunning && count > 0
                          ? `runBounce ${isMe ? 0.25 : 0.35}s ease infinite`
                          : 'idleBob 1.5s ease infinite',
                        filter: leading ? 'drop-shadow(0 0 4px gold)' : 'none',
                        zIndex: 2,
                        userSelect: 'none',
                      }}>
                        {emoji}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* My press button */}
            <div
              style={{ ...cuteCard, padding: '20px 24px', textAlign: 'center', cursor: isSpectator ? 'default' : 'pointer', userSelect: 'none', border: `1px solid ${theme.border}` }}
              onClick={e => { e.stopPropagation(); press(); }}
            >
              {isSpectator ? (
                <div style={{ padding: '14px 0', color: theme.inkMuted, fontWeight: 700, fontSize: '1rem' }}>
                  👀 Watching — join the next game!
                </div>
              ) : (
              <div style={{ fontSize: 'clamp(2.8rem,9vw,4rem)', fontWeight: 800, color: theme.greenDeep, fontFamily: 'monospace', lineHeight: 1 }}>
                {display}
              </div>)}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); press(); }}
                style={{
                  marginTop: 14,
                  width: '100%',
                  maxWidth: 360,
                  padding: '20px 0',
                  borderRadius: theme.radiusPill,
                  border: 'none',
                  background: phase === 'racing' ? '#dc2626' : '#9ca3af',
                  color: '#fff',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  fontFamily: theme.font,
                  cursor: phase === 'racing' ? 'pointer' : 'default',
                  animation: phase === 'racing' && tapFlash ? 'tapPulse 0.15s ease' : 'none',
                  boxShadow: '0 6px 20px rgba(220,38,38,0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                {phase === 'racing' ? 'TAP / SPACE' : '⏱ Time\'s up!'}
              </button>
            )}
            </div>
          </>
        )}

        {/* Sprint results */}
        {results && (
          <div style={{ ...cuteCard, padding: '24px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.green, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 14 }}>
              Sprint results
            </div>
            {results.map((entry, i) => {
              const isMe = entry.id === myId;
              const emoji = RUNNER_EMOJIS[players.findIndex(x => x.id === entry.id) % RUNNER_EMOJIS.length];
              return (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', marginBottom: 8, borderRadius: theme.radiusMd, background: isMe ? theme.greenPale : theme.surfaceAlt, border: `1px solid ${isMe ? theme.green : theme.border}` }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: theme.green, minWidth: '1.8rem' }}>{i + 1}</div>
                  <span style={{ fontSize: 22 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: theme.ink }}>{entry.name}{isMe ? ' (you)' : ''}</div>
                    <div style={{ fontSize: '0.84rem', color: theme.inkMuted }}>{entry.presses} presses</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: theme.greenDeep }}>+{entry.points} pt</div>
                    <div style={{ fontSize: '0.78rem', color: theme.inkMuted }}>{entry.totalScore} total</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
