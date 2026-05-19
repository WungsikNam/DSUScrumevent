export const theme = {
  font: "'Inter', system-ui, sans-serif",

  ink: '#123524',
  inkMuted: '#567163',
  inkSoft: '#89a394',

  green: '#198754',
  greenDeep: '#0f5132',
  greenSoft: '#dff4e8',
  greenPale: '#eef9f2',
  greenStrong: '#1e7d4f',
  mint: '#5cbf8d',
  white: '#ffffff',

  surface: 'rgba(255, 255, 255, 0.96)',
  surfaceAlt: '#f8fdf9',
  surfaceMuted: '#f2f7f3',
  border: '#d8e7dc',
  borderStrong: '#b8d7c0',

  shadow: '0 18px 44px rgba(17, 74, 48, 0.08)',
  shadowHover: '0 24px 60px rgba(17, 74, 48, 0.14)',
  shadowSm: '0 8px 24px rgba(17, 74, 48, 0.06)',

  radiusLg: 30,
  radiusMd: 22,
  radiusSm: 16,
  radiusXs: 12,
  radiusPill: 999,

  gradientMain: 'linear-gradient(135deg, #1f8f59 0%, #16734a 100%)',
  gradientSoft: 'linear-gradient(180deg, #f9fdf9 0%, #eef8f1 100%)',

  shellMax: 1180,
  contentMax: 980,
};

export const cuteCard = {
  background: theme.surface,
  borderRadius: theme.radiusLg,
  border: `1px solid ${theme.border}`,
  boxShadow: theme.shadow,
  backdropFilter: 'blur(10px)',
};

export const cuteBtn = (active = true) => ({
  width: '100%',
  padding: '18px 24px',
  borderRadius: theme.radiusPill,
  border: 'none',
  fontWeight: 700,
  fontSize: '1.05rem',
  fontFamily: theme.font,
  color: '#fff',
  cursor: active ? 'pointer' : 'default',
  background: active ? theme.gradientMain : theme.inkSoft,
  boxShadow: active ? theme.shadowSm : 'none',
  opacity: active ? 1 : 0.55,
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
});
