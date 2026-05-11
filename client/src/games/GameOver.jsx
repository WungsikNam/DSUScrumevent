import { useState, useEffect } from 'react';
import socket from '../socket';

const EMOJIS = ['🦁', '🐯', '🐻', '🦊', '🐧', '🐙', '🦄', '🐲', '🌟', '🔥'];

export default function GameOver({ room, myId }) {
  const [finalScores, setFinalScores] = useState([]);

  useEffect(() => {
    socket.on('game_over', ({ finalScores }) => {
      setFinalScores(finalScores);
    });
    return () => socket.off('game_over');
  }, []);

  // room.players에서 점수 가져오기 (game_over 이벤트 도달 전 혹은 after)
  const scores = finalScores.length > 0 ? finalScores : room.players;

  const winner = scores[0];
  const isIWinner = winner?.id === myId;

  const rankLabel = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `${i + 1}위`;
  };

  const messages = [
    '신이 내린 반응속도... 🤯',
    '역시 스크럼 마스터급 실력! 💜',
    '정확한 감각의 소유자 👏',
    '절대 감각의 챔피언 🏆',
  ];

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '40px 24px', gap: '28px',
      background: '#0f0f1a'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>🏆</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px' }}>최종 결과!</div>
        {isIWinner && (
          <div style={{
            marginTop: '8px', fontSize: '1.1rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #fbbf24, #f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shine 1.5s ease-in-out infinite'
          }}>
            축하해요! 당신이 1등! 🎉
          </div>
        )}
      </div>

      {/* 1등 카드 */}
      {winner && (
        <div style={{
          background: 'linear-gradient(135deg, #3b1f6e, #1f1f4e)',
          border: '2px solid #a78bfa',
          borderRadius: '24px', padding: '28px', textAlign: 'center',
          width: '100%', maxWidth: '400px',
          boxShadow: '0 0 40px rgba(167,139,250,0.2)'
        }}>
          <div style={{ fontSize: '3rem' }}>
            {EMOJIS[scores.findIndex(p => p.id === winner.id) % EMOJIS.length]}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '8px' }}>
            {winner.name} {winner.id === myId ? '(나)' : ''}
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24', marginTop: '4px' }}>
            {winner.score}점
          </div>
          <div style={{ color: '#a78bfa', fontSize: '0.9rem', marginTop: '8px' }}>
            {messages[Math.floor(Math.random() * messages.length)]}
          </div>
        </div>
      )}

      {/* 전체 순위 */}
      <div style={{
        background: '#1a1a2e', borderRadius: '20px', padding: '20px',
        width: '100%', maxWidth: '400px'
      }}>
        <div style={{ fontWeight: 700, color: '#a78bfa', marginBottom: '14px' }}>전체 순위</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scores.map((p, i) => {
            const isMe = p.id === myId;
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: isMe ? '#2d1a4e' : '#0f0f1a',
                borderRadius: '12px', padding: '12px 16px',
                border: isMe ? '2px solid #7c3aed' : '2px solid transparent'
              }}>
                <span style={{ fontSize: '1.2rem', minWidth: '32px' }}>{rankLabel(i)}</span>
                <span style={{ fontSize: '1.2rem' }}>{EMOJIS[i % EMOJIS.length]}</span>
                <div style={{ flex: 1, fontWeight: 700 }}>
                  {p.name} {isMe ? '(나)' : ''}
                </div>
                <div style={{ fontWeight: 900, color: i === 0 ? '#fbbf24' : '#a78bfa' }}>
                  {p.score}점
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ color: '#6b6b8a', fontSize: '0.85rem', textAlign: 'center' }}>
        새 게임은 페이지 새로고침 후 다시 입장해 주세요 😄
      </div>

      <style>{`
        @keyframes shine {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
