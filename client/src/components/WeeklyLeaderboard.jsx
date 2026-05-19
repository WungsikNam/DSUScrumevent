import { useState, useEffect } from 'react';
import { theme, cuteCard } from '../theme';

export default function WeeklyLeaderboard({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setErr('');

    (async () => {
      try {
        const res = await fetch('/api/ranking/week');
        if (!res.ok) throw new Error('fail');
        const j = await res.json();
        if (!cancelled) setData(j);
      } catch {
        if (!cancelled) setErr('Could not load ranking');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <div style={{ width: '100%', maxWidth: theme.contentMax, fontFamily: theme.font }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: '100%',
          padding: '18px 24px',
          borderRadius: theme.radiusMd,
          border: `1px solid ${theme.borderStrong}`,
          background: theme.surface,
          color: theme.greenDeep,
          fontWeight: 700,
          fontSize: '1rem',
          textAlign: 'left',
          cursor: 'pointer',
          boxShadow: theme.shadowSm,
        }}
      >
        {open ? 'Hide' : 'Show'} weekly session ranking
        {data?.week ? ` · ${data.week}` : ''}
      </button>

      {open && (
        <div style={{ ...cuteCard, marginTop: '16px', padding: '22px 22px 18px' }}>
          {err && (
            <div style={{ color: '#b42318', fontSize: '0.96rem', textAlign: 'center' }}>
              {err}
            </div>
          )}

          {data && !err && (
            <>
              <div style={{ fontSize: '0.92rem', color: theme.inkMuted, marginBottom: '16px' }}>
                Weekly ranking across completed sessions. Higher total points rank first.
              </div>

              {data.leaders.length === 0 ? (
                <div style={{ color: theme.inkMuted, textAlign: 'center', fontSize: '1rem', padding: '18px 0' }}>
                  No completed sessions have been recorded this week.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.leaders.map((row) => (
                    <div
                      key={`${data.week}-${row.rank}-${row.displayName}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        borderRadius: theme.radiusMd,
                        background: theme.surfaceAlt,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <span style={{ minWidth: '2rem', fontWeight: 800, fontSize: '1.1rem', color: theme.green }}>
                        {row.rank}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontWeight: 600,
                          color: theme.ink,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.displayName}
                      </span>
                      <span style={{ fontWeight: 700, color: theme.greenDeep, fontSize: '0.98rem' }}>
                        {row.totalPoints} pt
                      </span>
                      <span style={{ fontSize: '0.8rem', color: theme.inkSoft }}>
                        {row.gamesFinished} sessions
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
