import { useState } from 'react';
import Audio from '../audio';
import confetti from 'canvas-confetti';

const CATS = {
  '🎬 أفلام': {
    color: '#e11d48',
    qs: [
      { q: 'في فيلم "The Lion King" ما اسم والد سيمبا؟', a: 'موفاسا', pts: 100 },
      { q: 'من أخرج ثلاثية "The Lord of the Rings"؟', a: 'بيتر جاكسون', pts: 200 },
      { q: 'في أي دولة دارت أحداث فيلم Parasite الحائز على أوسكار 2020؟', a: 'كوريا الجنوبية', pts: 300 },
      { q: 'من جسّد دور الجوكر في فيلم "Joker" 2019؟', a: 'خواكين فينيكس', pts: 400 },
      { q: 'ما اسم الوالدة الحقيقية لاسكال (الطفل المتخلى عنه) في فيلم "Interstellar"؟', a: 'ليس في القصة — الفيلم يدور حول كوبر وابنته مورف', pts: 500 },
    ]
  },
  '🎌 أنيميشن': {
    color: '#7c3aed',
    qs: [
      { q: 'ما اسم الوحش الكبير في فيلم "My Neighbor Totoro" لاستوديو جيبلي؟', a: 'توتورو', pts: 100 },
      { q: 'ما اسم الاستوديو الياباني مؤسسه هاياو ميازاكي؟', a: 'استوديو جيبلي', pts: 200 },
      { q: 'في Dragon Ball Z ما أول شكل تحوّل Super Saiyan وصل إليه غوكو؟', a: 'Super Saiyan 1', pts: 300 },
      { q: 'من كتب قصة "حياة الحشرات" التي استوحى منها فيلم A Bug\'s Life؟', a: 'لم يكن مقتبساً بشكل مباشر — فكرة Pixar الأصلية', pts: 400 },
      { q: 'في أنيميشن "Neon Genesis Evangelion" ما اسم المنظمة المسؤولة عن الـ EVA؟', a: 'NERV', pts: 500 },
    ]
  },
  '🌍 دول وعواصم': {
    color: '#0284c7',
    qs: [
      { q: 'ما عاصمة أستراليا؟ (تنبّه — ليست سيدني)', a: 'كانبيرا', pts: 100 },
      { q: 'ما الدولة التي تمتلك أطول شاطئ في العالم؟', a: 'كندا', pts: 200 },
      { q: 'ما اسم أصغر دولة في العالم من حيث المساحة؟', a: 'الفاتيكان', pts: 300 },
      { q: 'ما عاصمة كازاخستان منذ 2022؟', a: 'أستانا (كانت نور سلطان بين 2019-2022)', pts: 400 },
      { q: 'كم دولة تعبر خط الاستواء بالضبط؟', a: '13 دولة', pts: 500 },
    ]
  },
  '⚽ رياضة': {
    color: '#16a34a',
    qs: [
      { q: 'كم مرة فاز المنتخب البرازيلي بكأس العالم حتى 2024؟', a: '5 مرات', pts: 100 },
      { q: 'من هو أكثر لاعب في التاريخ حاصل على الكرة الذهبية حتى 2024؟', a: 'ليونيل ميسي (8 مرات)', pts: 200 },
      { q: 'ما الرقم القياسي العالمي لسباق 100 متر ومن حققه؟', a: '9.58 ثانية — أوسين بولت 2009', pts: 300 },
      { q: 'في كرة السلة NBA كم مرة فاز مايكل جوردان بالبطولة مع بولز؟', a: '6 مرات (1991,92,93,96,97,98)', pts: 400 },
      { q: 'من هو الملاكم الوحيد الذي فاز ببطولة الثقيل 3 مرات في التاريخ؟', a: 'محمد علي كلاي', pts: 500 },
    ]
  },
  '🔬 علوم وتقنية': {
    color: '#0891b2',
    qs: [
      { q: 'ما الرمز الكيميائي للذهب؟', a: 'Au (من اللاتينية Aurum)', pts: 100 },
      { q: 'ما سرعة الضوء بالكيلومتر في الثانية؟', a: '299,792 كيلومتر في الثانية', pts: 200 },
      { q: 'ما أثقل عنصر يمكن أن ينتجه الاندماج النجمي في النجوم العادية؟', a: 'الحديد', pts: 300 },
      { q: 'من اخترع الطباعة بالحروف المتحركة في أوروبا؟', a: 'يوهانس غوتنبرغ (~1440)', pts: 400 },
      { q: 'ما الجسيم الذي يعطي الكتلة للجسيمات الأخرى (جسيم الله)؟', a: 'بوزون هيغز', pts: 500 },
    ]
  },
  '📖 تاريخ وحضارات': {
    color: '#b45309',
    qs: [
      { q: 'من بنى الأهرامات الكبرى في الجيزة؟', a: 'الملك خوفو (الفرعون الرابع من الأسرة الرابعة)', pts: 100 },
      { q: 'في أي عام سقطت القسطنطينية على يد العثمانيين؟', a: '857 هـ / 1453 م', pts: 200 },
      { q: 'من هو القائد المسلم الذي هزم الصليبيين في معركة حطين؟', a: 'صلاح الدين الأيوبي (583 هـ / 1187م)', pts: 300 },
      { q: 'ما أقدم لغة مكتوبة موثقة في التاريخ؟', a: 'السومرية (~3200 ق.م)', pts: 400 },
      { q: 'ما المدة التي حكم فيها الإمبراطور الروماني أغسطس؟', a: '44 سنة (27 ق.م — 14 م)', pts: 500 },
    ]
  },
  '🕌 دين وإسلاميات': {
    color: '#047857',
    qs: [
      { q: 'كم عدد أركان الإسلام؟', a: '5 أركان', pts: 100 },
      { q: 'في أي شهر بالهجري نزل أول وحي على النبي ﷺ؟', a: 'رمضان (في غار حراء)', pts: 200 },
      { q: 'ما أسماء الملائكة الأربعة المقربين المذكورة في القرآن والسنة؟', a: 'جبريل، ميكائيل، إسرافيل، عزرائيل', pts: 300 },
      { q: 'كم مرة ذُكرت كلمة "القرآن" في القرآن الكريم؟', a: '70 مرة', pts: 400 },
      { q: 'ما آخر آية نزلت من القرآن الكريم؟', a: 'آية 281 من سورة البقرة (واتقوا يوماً...)', pts: 500 },
    ]
  },
  '🎭 ثقافة عامة': {
    color: '#9333ea',
    qs: [
      { q: 'من رسم لوحة "الموناليزا"؟', a: 'ليوناردو دافنشي (~1503)', pts: 100 },
      { q: 'كم عدد جوائز Grammy الكبرى التي حصلت عليها Beyoncé حتى 2024؟', a: '32 جائزة Grammy', pts: 200 },
      { q: 'من كتب ملحمة "ألف ليلة وليلة"؟', a: 'مجهول — جُمعت على مدى قرون من مؤلفين مجهولين', pts: 300 },
      { q: 'في أي مدينة يقع متحف اللوفر؟', a: 'باريس — فرنسا', pts: 400 },
      { q: 'ما الأوبرا الأكثر تمثيلاً في العالم؟', a: 'La Traviata لفيردي', pts: 500 },
    ]
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #08011f; font-family: 'Cairo', sans-serif; direction: rtl; }
  @keyframes slideUp { from{opacity:0;transform:translateY(25px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pop { 0%{transform:scale(0.8)} 60%{transform:scale(1.08)} 100%{transform:scale(1)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 20px var(--c,#a855f7)} 50%{box-shadow:0 0 50px var(--c,#a855f7), 0 0 80px var(--c,#a855f7)44} }
  @keyframes confettiRain { to{transform:translateY(110vh) rotate(720deg); opacity:0} }
  .cell { transition: transform 0.25s ease, box-shadow 0.25s ease; }
  .cell:not(.used):hover { transform: translateY(-5px) scale(1.06); }
  .back-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); padding: 9px 20px; border-radius: 12px; font-family: inherit; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
  .back-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
`;

const LVL_LABELS = { 100: 'مبتدئ', 200: 'متوسط', 300: 'صعب', 400: 'خبير', 500: 'أسطوري' };
const LVL_COLORS = { 100: '#4ade80', 200: '#fbbf24', 300: '#fb923c', 400: '#f87171', 500: '#e879f9' };

const catKeys = Object.keys(CATS);

export default function CategoryBoard({ onBack }) {
  const [phase, setPhase] = useState('setup');
  const [teams, setTeams] = useState([
    { name: '', color: '#a855f7', score: 0 },
    { name: '', color: '#22d3ee', score: 0 },
  ]);
  const [currentTeam, setCurrentTeam] = useState(0);
  const [used, setUsed] = useState({});
  const [active, setActive] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const allUsed = catKeys.every(c => CATS[c].qs.every((_, i) => used[`${c}-${i}`]));

  const selectCell = (cat, idx) => {
    const key = `${cat}-${idx}`;
    if (used[key] || active) return;
    Audio.play('click');
    setActive({ cat, idx, key, q: CATS[cat].qs[idx], color: CATS[cat].color });
    setRevealed(false);
  };

  const handleAnswer = (teamIdx) => {
    if (!active) return;
    Audio.play('correct');
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 }, startVelocity: 30, colors: [active.color, '#fff', '#fbbf24'] });
    setTeams(t => t.map((tm, i) => i === teamIdx ? { ...tm, score: tm.score + active.q.pts } : tm));
    setUsed(u => ({ ...u, [active.key]: true }));
    setActive(null);
    setCurrentTeam(teamIdx === 0 ? 1 : 0);
  };

  const handleSkip = () => {
    Audio.play('wrong');
    setUsed(u => ({ ...u, [active.key]: true }));
    setActive(null);
    setCurrentTeam(t => t === 0 ? 1 : 0);
  };

  const winner = allUsed ? (teams[0].score > teams[1].score ? 0 : teams[1].score > teams[0].score ? 1 : -1) : null;
  const updateTeam = (i, f, v) => setTeams(t => t.map((tm, idx) => idx === i ? { ...tm, [f]: v } : tm));

  const bg = {
    minHeight: '100vh', background: '#08011f',
    fontFamily: 'Cairo, sans-serif', direction: 'rtl', color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '20px 12px 60px',
  };
  const panel = {
    background: 'rgba(15,5,40,0.95)', border: '1px solid rgba(168,85,247,0.2)',
    borderRadius: '22px', padding: 'clamp(16px,3vw,32px)',
    backdropFilter: 'blur(30px)', boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
  };

  if (phase === 'setup') return (
    <div style={bg}>
      <style>{CSS}</style>
      <div style={{ width: '100%', maxWidth: 640, animation: 'slideUp 0.5s ease-out' }}>
        <button className="back-btn" onClick={() => { Audio.play('click'); onBack(); }} style={{ marginBottom: 28 }}>← المنصة الرئيسية</button>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '4rem', marginBottom: 8 }}>🎯</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(135deg,#a855f7,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>لعبة الفئات</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginTop: 6 }}>8 فئات متنوعة — أفلام، أنيميشن، دول، رياضة وأكثر</p>
        </div>
        <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {teams.map((t, i) => (
            <div key={i} style={{ background: t.color + '15', border: `1px solid ${t.color}40`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: t.color, fontWeight: 900, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>الفريق {i + 1}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={t.name} onChange={e => updateTeam(i, 'name', e.target.value)} placeholder={`اسم الفريق ${i + 1}...`}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: `1px solid ${t.color}30`, borderRadius: 12, padding: '12px 16px', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '1rem', outline: 'none' }} />
                <input type="color" value={t.color} onChange={e => updateTeam(i, 'color', e.target.value)}
                  style={{ width: 50, height: 48, border: 'none', borderRadius: 12, cursor: 'pointer', padding: 0, background: 'transparent' }} />
              </div>
            </div>
          ))}
          <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 14, padding: '12px 18px', fontSize: '0.85rem', color: 'rgba(168,85,247,0.8)', fontWeight: 700 }}>
            🎯 8 فئات × 5 مستويات — مبتدئ (100) ← أسطوري (500)
          </div>
          <button onClick={() => { Audio.play('win'); setPhase('game'); setUsed({}); setTeams(t => t.map(tm => ({...tm, score: 0}))); setCurrentTeam(0); }}
            style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 16, fontFamily: 'inherit', fontWeight: 900, fontSize: '1.3rem', cursor: 'pointer', boxShadow: '0 12px 30px rgba(124,58,237,0.5)', letterSpacing: '1px' }}>
            ابدأ اللوحة 🎯
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={bg}>
      <style>{CSS}</style>
      <div style={{ width: '100%', maxWidth: 1100 }}>
        {/* Scores */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {teams.map((t, i) => (
            <div key={i} style={{ flex: 1, background: 'rgba(15,5,40,0.9)', border: `2px solid ${t.color}${currentTeam === i ? 'ee' : '30'}`, borderRadius: 16, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.3s', boxShadow: currentTeam === i ? `0 0 30px ${t.color}40` : 'none' }}>
              <div>
                <div style={{ color: t.color, fontWeight: 900, fontSize: '0.9rem' }}>{t.name || `الفريق ${i+1}`}</div>
                {currentTeam === i && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>▼ دورهم</div>}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: t.color }}>{t.score}</div>
            </div>
          ))}
          <button className="back-btn" onClick={() => { Audio.play('click'); onBack(); }}>← المنصة</button>
        </div>

        {/* Board */}
        <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${catKeys.length}, minmax(100px,1fr))`, gap: 8, minWidth: 650 }}>
            {/* Cat headers */}
            {catKeys.map(cat => (
              <div key={cat} style={{ background: CATS[cat].color + '25', border: `1px solid ${CATS[cat].color}50`, borderRadius: 14, padding: '12px 8px', textAlign: 'center', color: CATS[cat].color, fontWeight: 900, fontSize: '0.72rem', lineHeight: 1.4 }}>
                {cat}
              </div>
            ))}
            {/* Cells */}
            {[0,1,2,3,4].map(row =>
              catKeys.map(cat => {
                const key = `${cat}-${row}`;
                const q = CATS[cat].qs[row];
                const isUsed = used[key];
                const lvlColor = LVL_COLORS[q.pts];
                return (
                  <button key={key} className={`cell${isUsed ? ' used' : ''}`}
                    onClick={() => selectCell(cat, row)} disabled={isUsed || !!active}
                    style={{
                      background: isUsed ? 'rgba(255,255,255,0.02)' : `rgba(${hexToRgb(CATS[cat].color)},0.12)`,
                      border: `1px solid ${isUsed ? 'rgba(255,255,255,0.04)' : CATS[cat].color + '50'}`,
                      borderRadius: 12, padding: '14px 8px', cursor: isUsed ? 'default' : 'pointer',
                      fontFamily: 'inherit', fontWeight: 900, fontSize: '1.2rem',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      color: isUsed ? 'rgba(255,255,255,0.1)' : lvlColor,
                      transition: '0.2s',
                    }}>
                    {isUsed ? <span style={{ fontSize: '1rem' }}>✓</span> : (
                      <>
                        <span>{q.pts}</span>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: lvlColor + '99', letterSpacing: '1px' }}>{LVL_LABELS[q.pts]}</span>
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          {Object.entries(LVL_LABELS).map(([pts, lbl]) => (
            <div key={pts} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '4px 10px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: LVL_COLORS[pts] }} />
              <span style={{ color: LVL_COLORS[pts], fontSize: '0.7rem', fontWeight: 900 }}>{pts}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 700 }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Question Modal */}
      {active && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,0,20,0.97)', backdropFilter: 'blur(25px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ ...panel, maxWidth: 620, width: '100%', textAlign: 'center', animation: 'pop 0.4s ease-out', borderTop: `4px solid ${active.color}`, boxShadow: `0 0 80px ${active.color}30, 0 30px 80px rgba(0,0,0,0.8)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ background: active.color + '25', border: `1px solid ${active.color}50`, color: active.color, padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 900 }}>
                {active.cat.split(' ').slice(1).join(' ')}
              </span>
              <span style={{ background: LVL_COLORS[active.q.pts] + '20', border: `1px solid ${LVL_COLORS[active.q.pts]}50`, color: LVL_COLORS[active.q.pts], padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 900 }}>
                {active.q.pts} نقطة — {LVL_LABELS[active.q.pts]}
              </span>
            </div>
            <div style={{ fontSize: 'clamp(1.2rem,2.8vw,1.9rem)', fontWeight: 900, color: '#fff', lineHeight: 1.5, marginBottom: 28 }}>
              {active.q.q}
            </div>
            {!revealed ? (
              <button onClick={() => { Audio.play('click'); setRevealed(true); }}
                style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 14, fontFamily: 'inherit', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', marginBottom: 16 }}>
                👁 كشف الإجابة
              </button>
            ) : (
              <div style={{ background: 'rgba(62,207,142,0.12)', border: '1px solid rgba(62,207,142,0.4)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, animation: 'pop 0.3s ease-out' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 800, marginBottom: 6 }}>الإجابة:</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ade80' }}>{active.q.a}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              {teams.map((t, i) => (
                <button key={i} onClick={() => handleAnswer(i)}
                  style={{ flex: 1, padding: '14px', background: t.color + '25', border: `2px solid ${t.color}60`, color: t.color, borderRadius: 14, fontFamily: 'inherit', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = t.color + '40'}
                  onMouseOut={e => e.currentTarget.style.background = t.color + '25'}>
                  ✓ {t.name || `الفريق ${i+1}`}
                </button>
              ))}
              <button onClick={handleSkip}
                style={{ padding: '14px 18px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', borderRadius: 14, fontFamily: 'inherit', fontWeight: 900, cursor: 'pointer' }}>
                تخطي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {allUsed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,0,20,0.98)', backdropFilter: 'blur(25px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ ...panel, maxWidth: 520, width: '100%', textAlign: 'center', animation: 'pop 0.5s ease-out', borderTop: `4px solid ${winner >= 0 ? teams[winner].color : '#6b7499'}`, boxShadow: `0 0 80px ${winner >= 0 ? teams[winner].color + '40' : '#0'}, 0 30px 80px rgba(0,0,0,0.8)` }}>
            <div style={{ fontSize: '5rem', marginBottom: 16 }}>🏆</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: winner >= 0 ? teams[winner].color : '#6b7499', marginBottom: 24 }}>
              {winner >= 0 ? `${teams[winner].name || `الفريق ${winner+1}`} يفوز!` : 'تعادل! 🤝'}
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
              {teams.map((t, i) => (
                <div key={i} style={{ flex: 1, background: t.color + '18', border: `2px solid ${t.color}55`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: t.color, fontWeight: 900, marginBottom: 4 }}>{t.name || `الفريق ${i+1}`}</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{t.score}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>نقطة</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setUsed({}); setTeams(t => t.map(tm => ({...tm, score: 0}))); setCurrentTeam(0); setActive(null); Audio.play('win'); }}
                style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'inherit', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}>
                مرة ثانية
              </button>
              <button onClick={() => { Audio.play('click'); onBack(); }}
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontFamily: 'inherit', fontWeight: 900, fontSize: '1rem', cursor: 'pointer' }}>
                المنصة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
