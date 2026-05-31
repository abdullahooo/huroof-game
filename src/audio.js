let ctx = null;

const init = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
};

const play = (type) => {
  init();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  const t = ctx.currentTime;
  switch (type) {
    case 'hover':
      osc.type = 'sine'; osc.frequency.setValueAtTime(380, t);
      gain.gain.setValueAtTime(0.04, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.start(); osc.stop(t + 0.06); break;
    case 'click':
      osc.type = 'triangle'; osc.frequency.setValueAtTime(500, t); osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
      gain.gain.setValueAtTime(0.12, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.start(); osc.stop(t + 0.08); break;
    case 'correct':
      osc.type = 'square'; osc.frequency.setValueAtTime(440, t); osc.frequency.setValueAtTime(660, t + 0.12); osc.frequency.setValueAtTime(880, t + 0.25);
      gain.gain.setValueAtTime(0.12, t); gain.gain.linearRampToValueAtTime(0, t + 0.5);
      osc.start(); osc.stop(t + 0.5); break;
    case 'wrong':
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(160, t); osc.frequency.exponentialRampToValueAtTime(80, t + 0.35);
      gain.gain.setValueAtTime(0.18, t); gain.gain.linearRampToValueAtTime(0, t + 0.35);
      osc.start(); osc.stop(t + 0.35); break;
    case 'win':
      osc.type = 'sine'; osc.frequency.setValueAtTime(523, t); osc.frequency.setValueAtTime(659, t + 0.2); osc.frequency.setValueAtTime(784, t + 0.4);
      gain.gain.setValueAtTime(0.22, t); gain.gain.linearRampToValueAtTime(0, t + 1.5);
      osc.start(); osc.stop(t + 1.5); break;
    case 'heartbeat':
      osc.type = 'sine'; osc.frequency.setValueAtTime(55, t);
      gain.gain.setValueAtTime(0.45, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      osc.start(); osc.stop(t + 0.22); break;
    case 'tick':
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.06, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.start(); osc.stop(t + 0.04); break;
    default: break;
  }
};

export default { play };
