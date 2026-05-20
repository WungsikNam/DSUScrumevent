import { useState, useEffect } from 'react';

export default function ReactionOnboarding({ briefingEndTime }) {
  const [remaining, setRemaining] = useState(5);

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, Math.ceil((briefingEndTime - Date.now()) / 1000));
      setRemaining(r);
    }, 100);
    return () => clearInterval(id);
  }, [briefingEndTime]);

  return (
    <div style={{
      minHeight: '100dvh', background: '#0f0f1a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 32, padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 64 }}>⚡</div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>Reaction Game</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 340 }}>
        <div style={{ background: 'rgba(81,207,102,0.12)', border: '1px solid rgba(81,207,102,0.3)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🟢</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#51cf66' }}>Screen turns GREEN?</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Tap or press SPACE as fast as you can!</div>
        </div>

        <div style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>❌</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ff6b6b' }}>Too early?</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Penalty! Wait for the green signal.</div>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: remaining <= 2 ? '#ff6b6b' : '#ffd43b', lineHeight: 1 }}>
          {remaining}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Starting in...</div>
      </div>
    </div>
  );
}
