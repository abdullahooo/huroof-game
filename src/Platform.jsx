import { useState, useEffect, useRef } from 'react';
import Audio from './audio';

/* ─────────────────── DATA ─────────────────── */
const GAMES = [
  {
    id: 'huroof',
    name: 'حروف ZONE',
    tag: 'FLAGSHIP',
    tagColor: '#f59e0b',
    headline: 'لعبة المعلومات الاستراتيجية',
    sub: 'شبكة سداسية تنافسية — كل حرف بوابة معركة',
    desc: 'فريقان يتنافسان على رقعة سداسية ذكية. اختر الخلية، أجب عن السؤال، واحكم الرقعة. مع دعم اتصال الجوال، اللعب الإلكتروني عن بُعد، وأوضاع اللعب المتعددة.',
    features: ['🎮 محلي + أون لاين', '📱 تحكم جوال', '💡 مساعدات ذكية', '⚡ مؤثرات صوتية'],
    color1: '#7c3aed',
    color2: '#4f46e5',
    glow: '#7c3aed',
    size: 'hero',
  },
  {
    id: 'category',
    name: 'لعبة الفئات',
    tag: 'JEOPARDY',
    tagColor: '#0ea5e9',
    headline: 'اختر فئتك ومستواك',
    sub: '8 فئات × 5 مستويات — أفلام، رياضة، علوم وأكثر',
    desc: 'لوحة فئات متنوعة تجمع بين الاستراتيجية والمعرفة. اختر الصعوبة وتحدَّ خصمك نقطةً نقطةً.',
    features: ['🎬 أفلام وأنيميشن', '⚽ رياضة', '🔬 علوم', '🌍 دول وحضارات'],
    color1: '#0284c7',
    color2: '#0369a1',
    glow: '#0ea5e9',
    size: 'normal',
  },
  {
    id: 'chain',
    name: 'لعبة التسلسل',
    tag: 'SOCIAL',
    tagColor: '#22c55e',
    headline: 'سلسلة كلمات لا تنتهي',
    sub: 'كل كلمة تبدأ بآخر حرف — من يتوقف يخسر',
    desc: 'لعبة اجتماعية مثيرة تختبر قاموسك وسرعة بديهتك. مع نظام الحياة والمؤقت الضاغط.',
    features: ['👥 2-4 لاعبين', '❤️ نظام حياة', '⏱ مؤقت ضغط', '🔗 سلسلة لا نهاية'],
    color1: '#16a34a',
    color2: '#15803d',
    glow: '#22c55e',
    size: 'normal',
  },
];

/* ─────────────────── CSS ─────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body, html {
  background: #07001a;
  font-family: 'Cairo', sans-serif;
  direction: rtl;
  overflow-x: hidden;
  color: #fff;
}
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.5); border-radius: 2px; }

/* ── Animations ── */
@keyframes bgPulse {
  0%,100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
  50%      { opacity: 1;   transform: scale(1.08) rotate(3deg); }
}
@keyframes float {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  33%     { transform: translateY(-18px) rotate(1deg); }
  66%     { transform: translateY(8px) rotate(-1deg); }
}
@keyframes starTwinkle {
  0%,100% { opacity: 0.15; transform: scale(1); }
  50%     { opacity: 1; transform: scale(1.5); }
}
@keyframes scanline {
  0%   { transform: translateY(-100vh); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}
@keyframes ticker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes heroEntrance {
  from { opacity: 0; transform: translateY(60px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes cardEntrance {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes logoPulse {
  0%,100% { text-shadow: 0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.2); }
  50%     { text-shadow: 0 0 80px rgba(124,58,237,1), 0 0 160px rgba(124,58,237,0.4), 0 0 240px rgba(124,58,237,0.15); }
}
@keyframes borderFlow {
  0%   { border-image-source: linear-gradient(0deg, #7c3aed, #e879f9, #06b6d4, #7c3aed); }
  100% { border-image-source: linear-gradient(360deg, #7c3aed, #e879f9, #06b6d4, #7c3aed); }
}
@keyframes hexFloat {
  0%,100% { transform: translateY(0) rotate(0deg) scale(1); opacity:0.12; }
  50%     { transform: translateY(-30px) rotate(180deg) scale(1.1); opacity:0.2; }
}
@keyframes countUp { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }

/* ── Root ── */
.plat {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Bg blobs ── */
.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
}

/* ── Stars ── */
.star {
  position: fixed;
  border-radius: 50%;
  animation: starTwinkle var(--d) var(--del) ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

/* ── Scanline ── */
.scanline {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 30%, rgba(232,121,249,0.8) 50%, rgba(124,58,237,0.6) 70%, transparent);
  animation: scanline 10s linear infinite;
  pointer-events: none;
  z-index: 2;
}

/* ── Floating hex bg ── */
.hex-bg {
  position: fixed;
  font-size: var(--sz);
  color: rgba(124,58,237,0.1);
  pointer-events: none;
  z-index: 0;
  animation: hexFloat var(--d) var(--del) ease-in-out infinite;
}

/* ── Nav ── */
.nav {
  position: relative; z-index: 20;
  width: 100%; max-width: 1400px;
  display: flex; justify-content: space-between; align-items: center;
  padding: clamp(20px,3vw,36px) clamp(20px,4vw,60px);
}
.nav-logo {
  font-size: clamp(1.4rem,3vw,2rem);
  font-weight: 900;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #e879f9, #a855f7, #6366f1);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: logoPulse 3s ease-in-out infinite;
}
.nav-badge {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #000;
  font-size: 0.55rem; font-weight: 900;
  padding: 3px 8px; border-radius: 5px;
  letter-spacing: 2px; text-transform: uppercase;
  vertical-align: super; margin-right: 6px;
  box-shadow: 0 4px 12px rgba(245,158,11,0.5);
}
.nav-stats {
  display: flex; gap: clamp(16px,2.5vw,30px);
}
.nav-stat { text-align: center; }
.nav-stat-n { font-size: clamp(1.1rem,2vw,1.5rem); font-weight: 900; }
.nav-stat-l { font-size: 0.62rem; color: rgba(255,255,255,0.35); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }

/* ── Hero section ── */
.hero {
  position: relative; z-index: 10;
  width: 100%; max-width: 1400px;
  padding: 20px clamp(20px,4vw,60px) 60px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  animation: heroEntrance 0.9s cubic-bezier(0.16,1,0.3,1) both;
}
@media(max-width:900px) { .hero { grid-template-columns: 1fr; } }

.hero-left { display: flex; flex-direction: column; gap: 24px; }
.hero-overline {
  display: inline-flex; align-items: center; gap: 10px;
  background: rgba(124,58,237,0.15);
  border: 1px solid rgba(124,58,237,0.4);
  border-radius: 30px;
  padding: 6px 18px;
  font-size: 0.72rem; font-weight: 900; letter-spacing: 3px;
  text-transform: uppercase; color: #c084fc;
  width: fit-content;
}
.hero-title {
  font-size: clamp(2.8rem,6vw,5.5rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -2px;
}
.hero-title-glow {
  background: linear-gradient(135deg, #fff 0%, #c084fc 50%, #818cf8 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hero-desc {
  font-size: clamp(0.95rem,1.8vw,1.1rem);
  color: rgba(255,255,255,0.5);
  line-height: 1.8;
  font-weight: 600;
  max-width: 500px;
}
.hero-features {
  display: flex; gap: 10px; flex-wrap: wrap;
}
.hero-feature {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.78rem; font-weight: 700;
  color: rgba(255,255,255,0.5);
}
.hero-cta {
  display: inline-flex; align-items: center; gap: 12px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: #fff;
  border: none; border-radius: 18px;
  padding: 18px 36px;
  font-family: 'Cairo', sans-serif;
  font-size: 1.15rem; font-weight: 900;
  cursor: pointer;
  box-shadow: 0 20px 50px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
  transition: all 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
  width: fit-content;
}
.hero-cta:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 30px 70px rgba(124,58,237,0.7), inset 0 1px 0 rgba(255,255,255,0.2);
}
.hero-cta-arrow { font-size: 1.2rem; transition: transform 0.3s; }
.hero-cta:hover .hero-cta-arrow { transform: translateX(-6px); }

/* ── Hero visual (right) ── */
.hero-visual {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  height: clamp(280px,40vw,480px);
}
.hex-showcase {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  transform: rotate(-15deg);
  animation: float 6s ease-in-out infinite;
}
.hex-cell-demo {
  width: clamp(40px,6vw,70px);
  height: clamp(46px,7vw,80px);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex; align-items: center; justify-content: center;
  font-weight: 900;
  font-size: clamp(0.8rem,1.5vw,1.3rem);
  transition: all 0.4s;
  cursor: default;
}
.hex-glow-ring {
  position: absolute;
  inset: -40px;
  background: radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: bgPulse 4s ease-in-out infinite;
}

/* ── Side games ── */
.side-games {
  position: relative; z-index: 10;
  width: 100%; max-width: 1400px;
  padding: 0 clamp(20px,4vw,60px) 80px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
@media(max-width:700px) { .side-games { grid-template-columns: 1fr; } }

.side-card {
  position: relative; overflow: hidden;
  background: rgba(10, 2, 28, 0.9);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 24px;
  padding: clamp(24px,3vw,36px);
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.3s;
  animation: cardEntrance 0.7s cubic-bezier(0.16,1,0.3,1) both;
  backdrop-filter: blur(20px);
}
.side-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: var(--card-gradient);
  border-radius: 24px 24px 0 0;
}
.side-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 30px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12);
}
.side-card-glow {
  position: absolute; top: -60px; right: -60px;
  width: 200px; height: 200px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.12;
  transition: opacity 0.3s;
  pointer-events: none;
}
.side-card:hover .side-card-glow { opacity: 0.25; }
.side-card-tag {
  display: inline-block;
  font-size: 0.58rem; font-weight: 900; letter-spacing: 2px;
  padding: 4px 12px; border-radius: 20px;
  text-transform: uppercase; margin-bottom: 16px;
  border: 1px solid;
}
.side-card-name { font-size: clamp(1.5rem,3vw,2rem); font-weight: 900; margin-bottom: 6px; }
.side-card-sub { font-size: 0.82rem; color: rgba(255,255,255,0.35); font-weight: 700; margin-bottom: 14px; }
.side-card-desc { font-size: 0.9rem; color: rgba(255,255,255,0.45); line-height: 1.7; font-weight: 600; margin-bottom: 20px; }
.side-card-features { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.side-card-feature {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px; padding: 4px 12px;
  font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.4);
}
.side-card-btn {
  width: 100%; padding: 14px;
  background: var(--card-gradient);
  color: #fff; border: none; border-radius: 14px;
  font-family: 'Cairo', sans-serif; font-weight: 900; font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 8px 25px var(--card-glow);
  transition: all 0.25s;
}
.side-card-btn:hover { filter: brightness(1.15); transform: translateY(-2px); }

/* ── Ticker ── */
.ticker-wrap {
  position: relative; z-index: 10;
  width: 100%; overflow: hidden;
  border-top: 1px solid rgba(124,58,237,0.2);
  border-bottom: 1px solid rgba(124,58,237,0.2);
  background: rgba(124,58,237,0.06);
  padding: 12px 0; margin-top: auto;
}
.ticker-inner {
  display: flex; white-space: nowrap;
  animation: ticker 30s linear infinite;
  width: max-content;
}
.ticker-item {
  font-size: 0.78rem; font-weight: 800;
  padding: 0 32px;
  color: rgba(124,58,237,0.6);
  letter-spacing: 2px; text-transform: uppercase;
}

/* ── Footer ── */
.plat-footer {
  position: relative; z-index: 10;
  text-align: center;
  padding: 24px;
  color: rgba(255,255,255,0.1);
  font-size: 0.75rem; font-weight: 700; letter-spacing: 2px;
}
`;

/* ─────────────────── HEX DEMO DATA ─────────────────── */
const HEX_CELLS = [
  { letter: 'أ', color: '#7c3aed', owned: 1 },
  { letter: 'ب', color: '#0', owned: 0 },
  { letter: 'ت', color: '#6366f1', owned: 1 },
  { letter: 'ث', color: '#0', owned: 0 },
  { letter: 'ج', color: '#0ea5e9', owned: 2 },
  { letter: 'ح', color: '#0', owned: 0 },
  { letter: 'خ', color: '#7c3aed', owned: 1 },
  { letter: 'د', color: '#0ea5e9', owned: 2 },
  { letter: 'ذ', color: '#0', owned: 0 },
  { letter: 'ر', color: '#7c3aed', owned: 1 },
  { letter: 'ز', color: '#0', owned: 0 },
  { letter: 'س', color: '#6366f1', owned: 1 },
  { letter: 'ش', color: '#0ea5e9', owned: 2 },
  { letter: 'ص', color: '#0', owned: 0 },
  { letter: 'ض', color: '#0ea5e9', owned: 2 },
  { letter: 'ط', color: '#0', owned: 0 },
  { letter: 'ظ', color: '#0', owned: 0 },
  { letter: 'ع', color: '#6366f1', owned: 1 },
  { letter: 'غ', color: '#0ea5e9', owned: 2 },
  { letter: 'ف', color: '#0', owned: 0 },
];

/* ─────────────────── COMPONENT ─────────────────── */
export default function Platform({ onSelect }) {
  const [hover, setHover] = useState(null);

  useEffect(() => { document.title = 'حروف ZONE — منصة الألعاب'; }, []);

  const blobs = [
    { w: 700, h: 700, top: '-15%', right: '-15%', bg: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)', dur: '20s' },
    { w: 600, h: 600, bottom: '-15%', left: '-15%', bg: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)', dur: '25s' },
    { w: 400, h: 400, top: '45%', left: '45%', bg: 'radial-gradient(circle, rgba(232,121,249,0.2) 0%, transparent 70%)', dur: '18s' },
  ];

  const stars = Array.from({ length: 100 }, (_, i) => ({
    x: `${(i * 43 + 7) % 100}%`, y: `${(i * 71 + 11) % 100}%`,
    sz: 1 + (i % 3) * 0.8,
    d: `${3 + (i % 5)}s`, del: `${(i * 0.18) % 5}s`,
    c: ['rgba(124,58,237,0.9)', 'rgba(232,121,249,0.7)', 'rgba(6,182,212,0.7)', 'rgba(255,255,255,0.6)'][i % 4],
  }));

  const hexBgs = Array.from({ length: 8 }, (_, i) => ({
    x: `${(i * 67 + 10) % 100}%`, y: `${(i * 53 + 15) % 100}%`,
    sz: `${5 + (i % 4) * 3}vw`,
    d: `${8 + (i % 4) * 2}s`, del: `${i * 0.6}s`,
  }));

  const tickers = ['حروف ZONE','★','أفلام وأنيميشن','★','دول وعواصم','★','رياضة','★','علوم وتكنولوجيا','★','تاريخ وحضارات','★','دين وإسلاميات','★','ثقافة عامة','★'];

  const handleSelect = (id) => { Audio.play('win'); onSelect(id); };

  return (
    <div className="plat">
      <style>{CSS}</style>

      {/* Background */}
      {blobs.map((b, i) => (
        <div key={i} className="blob" style={{ width: b.w, height: b.h, top: b.top, right: b.right, bottom: b.bottom, left: b.left, background: b.bg, animation: `bgPulse ${b.dur} ease-in-out ${i * 3}s infinite` }} />
      ))}
      {stars.map((s, i) => (
        <div key={i} className="star" style={{ left: s.x, top: s.y, width: s.sz, height: s.sz, background: s.c, '--d': s.d, '--del': s.del, boxShadow: `0 0 ${s.sz * 3}px ${s.c}` }} />
      ))}
      {hexBgs.map((h, i) => (
        <div key={i} className="hex-bg" style={{ left: h.x, top: h.y, '--sz': h.sz, '--d': h.d, '--del': h.del }}>⬡</div>
      ))}
      <div className="scanline" />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo">
          <span className="nav-badge">PRO</span>حروف ZONE
        </div>
        <div className="nav-stats">
          {[
            { n: '3', l: 'ألعاب', c: '#a855f7' },
            { n: '450+', l: 'سؤال', c: '#f59e0b' },
            { n: '∞', l: 'لاعبون', c: '#22c55e' },
          ].map((s, i) => (
            <div key={i} className="nav-stat">
              <div className="nav-stat-n" style={{ color: s.c }}>{s.n}</div>
              <div className="nav-stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </nav>

      {/* HERO — حروف ZONE */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-overline">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 12px #a855f7', display: 'inline-block' }} />
            اللعبة الأصلية الرائدة
          </div>
          <h1 className="hero-title">
            <span className="hero-title-glow">حروف ZONE</span>
          </h1>
          <p className="hero-desc">
            لعبة معلومات استراتيجية على رقعة سداسية — فريقان يتنافسان، كل حرف بوابة سؤال، وكل إجابة تمنحك السيطرة على الرقعة. الأقوى في العالم.
          </p>
          <div className="hero-features">
            {['🎮 محلي + أون لاين', '📱 تحكم بالجوال', '💡 مساعدات ذكية', '⚡ مؤثرات صوتية', '🏆 نظام جولات'].map(f => (
              <span key={f} className="hero-feature">{f}</span>
            ))}
          </div>
          <button className="hero-cta" onClick={() => handleSelect('huroof')}
            onMouseEnter={() => Audio.play('hover')}>
            العب الآن
            <span className="hero-cta-arrow">←</span>
          </button>
        </div>

        <div className="hero-visual">
          <div className="hex-glow-ring" />
          <div className="hex-showcase">
            {HEX_CELLS.map((c, i) => (
              <div key={i} className="hex-cell-demo"
                style={{
                  background: c.owned === 1
                    ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                    : c.owned === 2
                    ? 'linear-gradient(135deg, #0ea5e9, #0369a1)'
                    : 'rgba(255,255,255,0.04)',
                  color: c.owned ? '#fff' : 'rgba(255,255,255,0.2)',
                  boxShadow: c.owned === 1
                    ? '0 0 20px rgba(124,58,237,0.5)'
                    : c.owned === 2
                    ? '0 0 20px rgba(14,165,233,0.5)'
                    : 'none',
                  border: `1px solid ${c.owned ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                  animationDelay: `${i * 0.15}s`,
                  animation: `float ${4 + (i % 3)}s ${i * 0.2}s ease-in-out infinite`,
                }}>
                {c.letter}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Side Games */}
      <section className="side-games">
        {GAMES.slice(1).map((g, idx) => (
          <div key={g.id} className="side-card"
            style={{
              '--card-gradient': `linear-gradient(135deg, ${g.color1}, ${g.color2})`,
              '--card-glow': `${g.glow}55`,
              animationDelay: `${0.2 + idx * 0.1}s`,
              boxShadow: hover === g.id ? `0 30px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12)` : '0 10px 30px rgba(0,0,0,0.4)',
            }}
            onMouseEnter={() => { setHover(g.id); Audio.play('hover'); }}
            onMouseLeave={() => setHover(null)}
            onClick={() => handleSelect(g.id)}
          >
            <div className="side-card-glow" style={{ background: `radial-gradient(circle, ${g.glow}, transparent)` }} />
            <div className="side-card-tag" style={{ background: g.tagColor + '20', color: g.tagColor, borderColor: g.tagColor + '50' }}>{g.tag}</div>
            <div className="side-card-name">{g.name}</div>
            <div className="side-card-sub">{g.sub}</div>
            <div className="side-card-desc">{g.desc}</div>
            <div className="side-card-features">
              {g.features.map(f => <span key={f} className="side-card-feature">{f}</span>)}
            </div>
            <button className="side-card-btn" onClick={e => { e.stopPropagation(); handleSelect(g.id); }}>
              ▶ العب الآن
            </button>
          </div>
        ))}
      </section>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...tickers, ...tickers].map((t, i) => <span key={i} className="ticker-item">{t}</span>)}
        </div>
      </div>

      <div className="plat-footer">HUROOF ZONE PRO — جميع الحقوق محفوظة</div>
    </div>
  );
}
