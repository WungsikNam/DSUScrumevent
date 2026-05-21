import { useState, useEffect } from 'react';

export default function ReactionOnboarding({ briefingEndTime, gameType }) {
  if (gameType === 'color') return <ColorOnboarding briefingEndTime={briefingEndTime} />;
  if (gameType === 'emoji') return <EmojiOnboarding briefingEndTime={briefingEndTime} />;
  if (gameType === 'typing') return <TypingOnboarding briefingEndTime={briefingEndTime} />;
  if (gameType === 'quiz') return <QuizOnboarding briefingEndTime={briefingEndTime} />;
  return <ReactionOnboardingInner briefingEndTime={briefingEndTime} />;
}

function ColorOnboarding({ briefingEndTime }) {
  const [remaining, setRemaining] = useState(5);
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, Math.ceil((briefingEndTime - Date.now()) / 1000))), 100);
    return () => clearInterval(id);
  }, [briefingEndTime]);
  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>🎨</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>Color Rush</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
        <div style={{ background: 'rgba(255,204,0,0.12)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>🎯</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffd43b' }}>Tap the correct color!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>A color will appear — tap the matching button fastest!</div>
        </div>
        <div style={{ background: 'rgba(81,207,102,0.12)', border: '1px solid rgba(81,207,102,0.3)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>🏆</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#51cf66' }}>10 rounds — most points wins!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>First correct tap each round = 1 point</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 48, fontWeight: 900, color: remaining <= 2 ? '#ff6b6b' : '#ffd43b' }}>{remaining}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Starting in...</div>
      </div>
    </div>
  );
}

function EmojiOnboarding({ briefingEndTime }) {
  const [remaining, setRemaining] = useState(5);
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, Math.ceil((briefingEndTime - Date.now()) / 1000))), 100);
    return () => clearInterval(id);
  }, [briefingEndTime]);
  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>🎯</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>Emoji Rush</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
        <div style={{ background: 'rgba(255,212,59,0.12)', border: '1px solid rgba(255,212,59,0.3)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffd43b' }}>Find the matching emoji!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>A big emoji appears — tap the same one from 4 options!</div>
        </div>
        <div style={{ background: 'rgba(81,207,102,0.12)', border: '1px solid rgba(81,207,102,0.3)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>🏆</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#51cf66' }}>10 rounds — most points wins!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>First correct tap = 1 point</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 48, fontWeight: 900, color: remaining <= 2 ? '#ff6b6b' : '#ffd43b' }}>{remaining}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Starting in...</div>
      </div>
    </div>
  );
}

function QuizOnboarding({ briefingEndTime }) {
  const [remaining, setRemaining] = useState(4);
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, Math.ceil((briefingEndTime - Date.now()) / 1000))), 100);
    return () => clearInterval(id);
  }, [briefingEndTime]);
  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>📸</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>Photo Quiz</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
        <div style={{ background: 'rgba(230,73,128,0.12)', border: '1px solid rgba(230,73,128,0.3)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f783ac' }}>Look at the photo and guess!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Pick the correct answer from 4 options. First correct tap wins!</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 48, fontWeight: 900, color: remaining <= 2 ? '#ff6b6b' : '#ffd43b' }}>{remaining}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Starting in...</div>
      </div>
    </div>
  );
}

function TypingOnboarding({ briefingEndTime }) {
  const [remaining, setRemaining] = useState(5);
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, Math.ceil((briefingEndTime - Date.now()) / 1000))), 100);
    return () => clearInterval(id);
  }, [briefingEndTime]);
  return (
    <div style={{ minHeight: '100dvh', background: '#0f0f1a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>⌨️</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>Typing Rush</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
        <div style={{ background: 'rgba(51,154,240,0.12)', border: '1px solid rgba(51,154,240,0.3)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>📝</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#74c0fc' }}>Type the phrase shown!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>First correct submission wins the round. 10 seconds per round.</div>
        </div>
        <div style={{ background: 'rgba(81,207,102,0.12)', border: '1px solid rgba(81,207,102,0.3)', borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>🏆</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#51cf66' }}>5 rounds — most wins!</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Case-insensitive. Speed is everything.</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 48, fontWeight: 900, color: remaining <= 2 ? '#ff6b6b' : '#ffd43b' }}>{remaining}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Starting in...</div>
      </div>
    </div>
  );
}

function ReactionOnboardingInner({ briefingEndTime }) {
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
