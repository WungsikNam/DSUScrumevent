import { theme, cuteCard } from '../theme';

export default function BrandHeader({ meta = '' }) {
  return (
    <div
      style={{
        ...cuteCard,
        width: '100%',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '18px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: '1 1 320px' }}>
        <img
          src="/ifelse-logo.png"
          alt="IFELSE"
          style={{
            width: '100%',
            maxWidth: '180px',
            height: 'auto',
            display: 'block',
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: theme.green, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Wake Your Brain!
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.96rem', color: theme.inkMuted }}>
            10-Second Challenge
          </div>
        </div>
      </div>

      {meta ? (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: theme.radiusPill,
            background: theme.surfaceMuted,
            color: theme.greenDeep,
            fontSize: '0.84rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            border: `1px solid ${theme.border}`,
          }}
        >
          {meta}
        </div>
      ) : null}
    </div>
  );
}
