import { useState } from 'react';
import socket from '../socket';

const s = {
  wrap: {
    minHeight: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '32px'
  },
  title: { fontSize: '2.4rem', fontWeight: 900, textAlign: 'center', lineHeight: 1.2 },
  sub: { color: '#a78bfa', fontSize: '1rem', textAlign: 'center', marginTop: '8px' },
  card: {
    background: '#1a1a2e', borderRadius: '20px', padding: '28px',
    width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px'
  },
  label: { fontSize: '0.85rem', color: '#a78bfa', fontWeight: 700, marginBottom: '4px' },
  input: {
    width: '100%', padding: '14px 16px', borderRadius: '12px',
    background: '#0f0f1a', border: '2px solid #2d2d4e', color: '#fff',
    fontSize: '1.1rem', outline: 'none'
  },
  btn: (color) => ({
    width: '100%', padding: '16px', borderRadius: '14px',
    background: color, color: '#fff', fontSize: '1.1rem', fontWeight: 700,
    transition: 'opacity 0.15s'
  }),
  divider: {
    display: 'flex', alignItems: 'center', gap: '10px', color: '#4a4a6a'
  },
  line: { flex: 1, height: '1px', background: '#2d2d4e' }
};

export default function Join() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tab, setTab] = useState('create'); // 'create' | 'join'

  const handleCreate = () => {
    if (!name.trim()) return alert('이름을 입력해 주세요!');
    socket.emit('create_room', { name: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim()) return alert('이름을 입력해 주세요!');
    if (!code.trim()) return alert('방 코드를 입력해 주세요!');
    socket.emit('join_room', { name: name.trim(), code: code.trim().toUpperCase() });
  };

  return (
    <div style={s.wrap}>
      <div>
        <div style={s.title}>🎮 스크럼 파티</div>
        <div style={s.sub}>이름만 입력하면 바로 시작!</div>
      </div>

      <div style={s.card}>
        <div>
          <div style={s.label}>내 이름</div>
          <input
            style={s.input}
            placeholder="홍길동"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={10}
            onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
          />
        </div>

        <div style={s.divider}>
          <div style={s.line} />
          <span style={{ fontSize: '0.8rem' }}>어떻게 할까요?</span>
          <div style={s.line} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setTab('create')}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
              background: tab === 'create' ? '#7c3aed' : '#2d2d4e', color: '#fff'
            }}
          >방 만들기</button>
          <button
            onClick={() => setTab('join')}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
              background: tab === 'join' ? '#7c3aed' : '#2d2d4e', color: '#fff'
            }}
          >방 입장하기</button>
        </div>

        {tab === 'join' && (
          <div>
            <div style={s.label}>방 코드</div>
            <input
              style={{ ...s.input, textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.4rem' }}
              placeholder="ABCDE"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={5}
            />
          </div>
        )}

        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          style={s.btn('#7c3aed')}
        >
          {tab === 'create' ? '🚀 방 만들기' : '🎯 입장하기'}
        </button>
      </div>
    </div>
  );
}
