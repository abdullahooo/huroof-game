import { useState, useEffect, useRef } from 'react';
import Audio from '../audio';
import confetti from 'canvas-confetti';

const STARTER_WORDS = ['أسد','برج','تفاح','ثلج','جبل','حرية','خيل','دجاج','ذهب','رياح','زهرة','سحاب','شمس','صحراء','ضوء','طائر','ظل','عقل','غيمة','فيل','قمر','كتاب','لون','ماء','نور','هواء','وردة','يد'];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #07091a; font-family: 'Cairo', sans-serif; direction: rtl; }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pop { 0%{transform:scale(0.85)} 60%{transform:scale(1.06)} 100%{transform:scale(1)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes pulse5 { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
`;

const TIMER_PER_TURN = 20;

export default function WordChain({ onBack }) {
  const [phase, setPhase] = useState('setup');
  const [playerCount, setPlayerCount] = useState(3);
  const [players, setPlayers] = useState([
    { name: '', color: '#4ade80', lives: 3 },
    { name: '', color: '#38d9f5', lives: 3 },
    { name: '', color: '#f472b6', lives: 3 },
    { name: '', color: '#fb923c', lives: 3 },
  ]);
  const [chain, setChain] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_PER_TURN);
  const [lastLetter, setLastLetter] = useState('');
  const [error, setError] = useState('');
  const [eliminated, setEliminated] = useState([]);
  const [winner, setWinner] = useState(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const startGame = () => {
    const starter = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
    const activePlayers = players.slice(0, playerCount).map(p => ({ ...p, lives: 3 }));
    setChain([starter]);
    setLastLetter(starter[starter.length - 1]);
    setCurrentPlayer(0);
    setInput('');
    setTimeLeft(TIMER_PER_TURN);
    setError('');
    setEliminated([]);
    setWinner(null);
    setPlayers(activePlayers.concat(players.slice(playerCount)));
    setPhase('game');
    Audio.play('win');
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  useEffect(() => {
    if (phase !== 'game' || winner) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          loseLife('timeout');
          return 0;
        }
        if (p <= 6) Audio.play('heartbeat');
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentPlayer, winner]);

  const loseLife = (reason) => {
    clearInterval(timerRef.current);
    Audio.play('wrong');
    setError(reason === 'timeout' ? '⏱ انتهى وقتك!' : reason);
    setPlayers(prev => {
      const updated = [...prev];
      updated[currentPlayer] = { ...updated[currentPlayer], lives: updated[currentPlayer].lives - 1 };
      const newElim = updated[currentPlayer].lives <= 0;
      let newEliminated = eliminated;
      if (newElim) newEliminated = [...eliminated, currentPlayer];
      const active = Array.from({ length: playerCount }, (_, i) => i).filter(i => !newEliminated.includes(i) && (i !== currentPlayer || !newElim));
      if (active.length <= 1) {
        const w = active[0] ?? -1;
        setWinner(w);
        setPhase('result');
        if (w >= 0) confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
      }
      return updated;
    });
    setTimeout(() => {
      nextTurn();
    }, 1500);
  };

  const nextTurn = () => {
    setError('');
    let next = (currentPlayer + 1) % playerCount;
    let safety = 0;
    while (eliminated.includes(next) && safety < playerCount) {
      next = (next + 1) % playerCount;
      safety++;
    }
    setCurrentPlayer(next);
    setInput('');
    setTimeLeft(TIMER_PER_TURN);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitWord = () => {
    clearInterval(timerRef.current);
    const word = input.trim();
    if (!word) { loseLife('الكلمة فارغة!'); return; }
    if (word[0] !== lastLetter) { loseLife(`❌ يجب أن تبدأ الكلمة بـ "${lastLetter}"`); return; }
    if (chain.includes(word)) { loseLife('❌ هذه الكلمة استُخدمت من قبل!'); return; }
    if (word.length < 2) { loseLife('❌ الكلمة قصيرة جداً'); return; }
    Audio.play('correct');
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, startVelocity: 20 });
    const newLast = word[word.length - 1];
    setChain(c => [...c, word]);
    setLastLetter(newLast);
    setTimeout(() => nextTurn(), 400);
  };

  const updatePlayer = (i, f, v) => setPlayers(p => p.map((pl, idx) => idx === i ? { ...pl, [f]: v } : pl));

  const bgStyle = {
    minHeight: '100vh',
    background: '#08011f',
    fontFamily: 'Cairo, sans-serif', direction: 'rtl', color: '#eef2ff',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '20px 16px 60px',
  };
  const panel = {
    background: 'rgba(15,5,40,0.97)', border: '1px solid rgba(168,85,247,0.15)',
    borderRadius: '24px', padding: 'clamp(20px,4vw,36px)',
    backdropFilter: 'blur(20px)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
  };

  if (phase === 'setup') return (
    <div style={bgStyle}>
      <style>{CSS}</style>
      <div style={{ width: '100%', maxWidth: 640, animation: 'slideUp 0.5s ease-out' }}>
        <button onClick={() => { Audio.play('click'); onBack(); }}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#8895c0', padding: '9px 20px', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', marginBottom: 28 }}>
          ← المنصة الرئيسية
        </button>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>🔗</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#4ade80' }}>لعبة التسلسل</h1>
          <p style={{ color: '#4a5280', fontWeight: 700, marginTop: 6 }}>كل كلمة تبدأ بآخر حرف من الكلمة السابقة</p>
        </div>
        <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ color: '#6b7499', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>عدد اللاعبين</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[2,3,4].map(n => (
                <button key={n} onClick={() => { Audio.play('hover'); setPlayerCount(n); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontFamily: 'inherit', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', border: '1px solid', transition: 'all 0.2s',
                    background: playerCount === n ? '#4ade80' : 'rgba(255,255,255,0.04)',
                    color: playerCount === n ? '#000' : '#6b7499',
                    borderColor: playerCount === n ? '#4ade80' : 'rgba(255,255,255,0.08)' }}>
                  {n} لاعبين
                </button>
              ))}
            </div>
          </div>
          {Array.from({ length: playerCount }).map((_, i) => (
            <div key={i} style={{ background: players[i].color + '12', border: `1px solid ${players[i].color}40`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: players[i].color, fontWeight: 900, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>اللاعب {i + 1}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={players[i].name} onChange={e => updatePlayer(i, 'name', e.target.value)} placeholder={`اسم اللاعب ${i + 1}...`}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem', outline: 'none' }} />
                <input type="color" value={players[i].color} onChange={e => updatePlayer(i, 'color', e.target.value)}
                  style={{ width: 50, height: 48, border: 'none', borderRadius: 12, cursor: 'pointer', padding: 0, background: 'transparent' }} />
              </div>
            </div>
          ))}
          <button onClick={startGame}
            style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg,#4ade80,#16a34a)', color: '#000', border: 'none', borderRadius: 16, fontFamily: 'inherit', fontWeight: 900, fontSize: '1.3rem', cursor: 'pointer', boxShadow: '0 12px 30px rgba(74,222,128,0.35)' }}>
            ابدأ السلسلة 🔗
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === 'result') return (
    <div style={{ ...bgStyle, justifyContent: 'center' }}>
      <style>{CSS}</style>
      <div style={{ ...panel, maxWidth: 500, width: '100%', textAlign: 'center', animation: 'pop 0.5s ease-out', borderTop: `3px solid ${winner >= 0 ? players[winner].color : '#6b7499'}` }}>
        <div style={{ fontSize: '5rem', marginBottom: 16 }}>🏆</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: winner >= 0 ? players[winner].color : '#6b7499', marginBottom: 8 }}>
          {winner >= 0 ? `${players[winner].name || `اللاعب ${winner+1}`} يفوز!` : 'انتهت اللعبة!'}
        </div>
        <div style={{ color: '#4a5280', marginBottom: 24, fontWeight: 700 }}>طول السلسلة: {chain.length} كلمة</div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px', marginBottom: 24, maxHeight: 120, overflow: 'auto', textAlign: 'right' }}>
          <div style={{ color: '#4a5280', fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>السلسلة:</div>
          <div style={{ color: '#6b7499', fontSize: '0.9rem', lineHeight: 1.6 }}>{chain.join(' ← ')}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={startGame} style={{ flex: 1, padding: '14px', background: '#4ade80', color: '#000', border: 'none', borderRadius: 14, fontFamily: 'inherit', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}>مرة ثانية</button>
          <button onClick={() => { Audio.play('click'); onBack(); }} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.06)', color: '#8895c0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontFamily: 'inherit', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}>المنصة</button>
        </div>
      </div>
    </div>
  );

  const activePl = players[currentPlayer];
  const isCritical = timeLeft <= 6;
  const pct = (timeLeft / TIMER_PER_TURN) * 100;

  return (
    <div style={bgStyle}>
      <style>{CSS}</style>
      <div style={{ width: '100%', maxWidth: 700 }}>
        {/* Players */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {Array.from({ length: playerCount }).map((_, i) => {
            const p = players[i];
            const isElim = eliminated.includes(i);
            const isActive = i === currentPlayer && !isElim;
            return (
              <div key={i} style={{ flex: 1, minWidth: 100, background: 'rgba(15,5,40,0.9)', border: `2px solid ${p.color}${isActive ? 'dd' : isElim ? '20' : '30'}`, borderRadius: 14, padding: '10px 14px', textAlign: 'center', opacity: isElim ? 0.3 : 1, transition: '0.3s', boxShadow: isActive ? `0 0 20px ${p.color}30` : 'none' }}>
                <div style={{ color: p.color, fontWeight: 900, fontSize: '0.85rem', marginBottom: 4 }}>{p.name || `اللاعب ${i+1}`}</div>
                <div style={{ fontSize: '1.2rem' }}>{isElim ? '☠️' : '❤️'.repeat(p.lives)}</div>
              </div>
            );
          })}
          <button onClick={() => { Audio.play('click'); onBack(); }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#4a5280', padding: '10px 14px', borderRadius: 14, fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>
            ← المنصة
          </button>
        </div>

        {/* Timer bar */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 8, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: isCritical ? '#f87171' : activePl?.color, transition: 'width 1s linear, background 0.5s', borderRadius: 4 }} />
        </div>

        {/* Current player + last word */}
        <div style={{ ...panel, textAlign: 'center', marginBottom: 16, borderTop: `2px solid ${activePl?.color}80` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ color: activePl?.color, fontWeight: 900, fontSize: '1.1rem' }}>
              دور: {activePl?.name || `اللاعب ${currentPlayer + 1}`}
            </div>
            <div style={{ fontSize: isCritical ? '2.5rem' : '2rem', fontWeight: 900, color: isCritical ? '#f87171' : '#eef2ff', fontFamily: 'monospace', animation: isCritical ? 'pulse5 0.7s infinite' : 'none' }}>
              {timeLeft}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
            <div style={{ color: '#4a5280', fontSize: '0.75rem', fontWeight: 800, marginBottom: 8 }}>آخر كلمة في السلسلة:</div>
            <div style={{ fontSize: 'clamp(1.5rem,4vw,2.5rem)', fontWeight: 900, color: '#eef2ff' }}>{chain[chain.length - 1]}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: error ? 12 : 0 }}>
            <div style={{ background: activePl?.color + '25', border: `2px solid ${activePl?.color}60`, borderRadius: 12, padding: '10px 18px', fontWeight: 900, fontSize: '1.3rem', color: activePl?.color, minWidth: 60, textAlign: 'center' }}>
              {lastLetter} ←
            </div>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitWord()}
              placeholder={`كلمة تبدأ بـ "${lastLetter}"...`}
              style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: `2px solid ${activePl?.color}50`, borderRadius: 12, padding: '14px 18px', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '1.1rem', outline: 'none', transition: '0.2s' }}
              onFocus={e => e.target.style.borderColor = activePl?.color}
              onBlur={e => e.target.style.borderColor = activePl?.color + '50'} />
            <button onClick={submitWord}
              style={{ padding: '14px 20px', background: activePl?.color, border: 'none', borderRadius: 12, color: '#000', fontFamily: 'inherit', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}>
              إرسال
            </button>
          </div>
          {error && (
            <div style={{ color: '#f87171', fontWeight: 800, fontSize: '0.95rem', marginTop: 8, animation: 'fadeIn 0.3s' }}>{error}</div>
          )}
        </div>

        {/* Recent chain */}
        {chain.length > 1 && (
          <div style={{ background: 'rgba(15,5,40,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 16px', maxHeight: 80, overflow: 'auto' }}>
            <div style={{ color: '#4a5280', fontSize: '0.75rem', fontWeight: 800, marginBottom: 6 }}>السلسلة ({chain.length} كلمة):</div>
            <div style={{ color: '#6b7499', fontSize: '0.9rem', direction: 'ltr', textAlign: 'left' }}>{chain.slice(-10).join(' ← ')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
