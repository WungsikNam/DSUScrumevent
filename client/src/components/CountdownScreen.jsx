export default function CountdownScreen({ count }) {
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
        {count}
      </div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>Get your spacebar ready!</div>
    </div>
  );
}
