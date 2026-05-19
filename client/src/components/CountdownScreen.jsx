import { useState, useEffect } from 'react';

export default function CountdownScreen({ goTime }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.ceil((goTime - Date.now()) / 1000));
      setCount(remaining);
    };
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [goTime]);

  return (
    <div style={{
      minHeight: '100dvh', background: '#0f0f1a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase' }}>Get Ready!</div>
      <div style={{
        fontSize: 160, fontWeight: 900, lineHeight: 1,
        color: count === 1 ? '#ff6b6b' : count === 2 ? '#ffd43b' : '#51cf66',
        transition: 'color 0.3s',
      }}>
        {count || 'GO!'}
      </div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>Get your spacebar ready!</div>
    </div>
  );
}
