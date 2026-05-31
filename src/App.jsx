import React, { useState, useEffect, useCallback, useRef } from 'react';
import mqtt from 'mqtt';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Zap, Crosshair, Users, Globe, Settings, Play, Volume2, VolumeX, Shield, ShieldAlert, Sparkles, Rocket, Ghost, Bomb, CheckCircle2, XOctagon, Star, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
const sanitizeHtml = (str) => {
  if (!str) return '';
  return str.toString().replace(/[<>&"']/g, (match) => {
    switch (match) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return match;
    }
  });
};

const ALPHABET = ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','هـ','و','ي'];

const getNeighbors = (index, size) => {
  const r = Math.floor(index / size);
  const c = index % size;
  const neighbors = [];
  if (c > 0) neighbors.push(r * size + c - 1);
  if (c < size - 1) neighbors.push(r * size + c + 1);
  if (r % 2 === 0) { 
    if (r > 0) { neighbors.push((r - 1) * size + c); if (c < size - 1) neighbors.push((r - 1) * size + c + 1); }
    if (r < size - 1) { neighbors.push((r + 1) * size + c); if (c < size - 1) neighbors.push((r + 1) * size + c + 1); }
  } else { 
    if (r > 0) { if (c > 0) neighbors.push((r - 1) * size + c - 1); neighbors.push((r - 1) * size + c); }
    if (r < size - 1) { if (c > 0) neighbors.push((r + 1) * size + c - 1); neighbors.push((r + 1) * size + c); }
  }
  return neighbors;
};

// ================== المحرك الصوتي ==================
const AudioEngine = (() => {
    let ctx = null;
    let ambientOsc = null;
    let ambientGain = null;
    let isAmbientPlaying = false;

    const init = () => {
        if (!ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            ctx = new AudioContext();
        }
    };

    return {
        play: (type) => {
            init();
            if(ctx.state === 'suspended') ctx.resume();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            const now = ctx.currentTime;

            if (type === 'hover') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(350, now);
                gain.gain.setValueAtTime(0.03, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(); osc.stop(now + 0.05);
            } else if (type === 'click') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(450, now); osc.frequency.exponentialRampToValueAtTime(750, now + 0.1);
                gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(); osc.stop(now + 0.1);
            } else if (type === 'correct') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(659.25, now + 0.15);
                gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(); osc.stop(now + 0.4);
            } else if (type === 'wrong') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
                gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(); osc.stop(now + 0.3);
            } else if (type === 'bomb') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
                gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.start(); osc.stop(now + 0.6);
            } else if (type === 'win') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(783.99, now + 0.4);
                gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 1.5);
                osc.start(); osc.stop(now + 1.5);
            } else if (type === 'heartbeat') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(50, now);
                gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(); osc.stop(now + 0.2);
            }
        },
        toggleAmbient: () => {
            init();
            if (isAmbientPlaying) {
                ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
                setTimeout(() => { if(ambientOsc) ambientOsc.stop(); isAmbientPlaying = false; }, 1000);
            } else {
                ambientOsc = ctx.createOscillator();
                ambientGain = ctx.createGain();
                ambientOsc.type = 'sine';
                ambientOsc.frequency.setValueAtTime(45, ctx.currentTime);
                const lfo = ctx.createOscillator();
                lfo.type = 'sine'; lfo.frequency.value = 0.1;
                const lfoGain = ctx.createGain(); lfoGain.gain.value = 2;
                lfo.connect(lfoGain); lfoGain.connect(ambientOsc.frequency);
                lfo.start();
                ambientOsc.connect(ambientGain); ambientGain.connect(ctx.destination);
                ambientGain.gain.setValueAtTime(0, ctx.currentTime);
                ambientGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2); 
                ambientOsc.start();
                isAmbientPlaying = true;
            }
            return !isAmbientPlaying;
        }
    };
})();

// ================== محرك الإعلانات ==================
const AdSenseWidget = ({ adSlot }) => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense Error:", e);
        }
    }, []);
    return (
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '160px', height: '600px' }}
             data-ad-client="ca-pub-0000000000000000"
             data-ad-slot={adSlot} 
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
    );
};

function App({ onBack = () => {} }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic hex cell sizing via ResizeObserver
  const hexWrapRef = useRef(null);
  const [cellPx, setCellPx] = useState(60);

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gridSize, setGridSize] = useState(6); 
  const [maxRounds, setMaxRounds] = useState(1); 
  const [timerDuration, setTimerDuration] = useState(30);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [victoryCondition, setVictoryCondition] = useState('path'); 
  const [hostMode, setHostMode] = useState('smart'); 
  const [modes, setModes] = useState({ gold: false, mines: false, virus: false, blind: false });

  // === Online PvP State ===
  const initialPvpId = new URLSearchParams(window.location.search).get('pvp');
  const isOnlineGuest = !!initialPvpId;
  const [showLobby, setShowLobby] = useState(!initialPvpId && !new URLSearchParams(window.location.search).get('remote'));
  const [gameMode, setGameMode] = useState('local'); // 'local' | 'online'
  const [onlineRole, setOnlineRole] = useState(isOnlineGuest ? 'guest' : null);
  const [pvpRoomId, setPvpRoomId] = useState('');
  const [pvpGuestConnected, setPvpGuestConnected] = useState(false);
  const [pvpJoinInput, setPvpJoinInput] = useState(initialPvpId || '');
  const [pvpSyncData, setPvpSyncData] = useState(null);
  const [pvpConnectionError, setPvpConnectionError] = useState(initialPvpId ? 'جاري الاتصال بالغرفة...' : '');
  const [pvpActionTrigger, setPvpActionTrigger] = useState(null);
  const [onlineSubScreen, setOnlineSubScreen] = useState('choose'); // 'choose' | 'host_wait' | 'join'
  const pvpMqttRef = useRef(null);

  // === PeerJS Remote Control State ===
  const initialRemoteId = new URLSearchParams(window.location.search).get('remote');
  
  const [peerId, setPeerId] = useState('');
  const [remoteConnection, setRemoteConnection] = useState(null);
  const [connectionError, setConnectionError] = useState('');
  

  const [isRemoteClient, setIsRemoteClient] = useState(!!initialRemoteId);
  const [remoteData, setRemoteData] = useState(null);
  const [remoteActionTrigger, setRemoteActionTrigger] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [team1Color, setTeam1Color] = useState('#00D2FF'); 
  const [team2Color, setTeam2Color] = useState('#FF2A54');
  const [letters, setLetters] = useState([]);
  const [cells, setCells] = useState([]);
  const [usedQuestionIds, setUsedQuestionIds] = useState([]); 

  const [goldenCells, setGoldenCells] = useState([]);
  const [mineCells, setMineCells] = useState([]); 
  const [virusCells, setVirusCells] = useState([]); 
  
  const [team1Wins, setTeam1Wins] = useState(0);
  const [team2Wins, setTeam2Wins] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  
  const [roundWinner, setRoundWinner] = useState(null);
  const [matchWinner, setMatchWinner] = useState(null);

  const [activeCell, setActiveCell] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  
  const [explodedMine, setExplodedMine] = useState(false); 
  const [showConfetti, setShowConfetti] = useState(false);
  const [isAmbientOn, setIsAmbientOn] = useState(false);

  const [team1Lifelines, setTeam1Lifelines] = useState({ ai_assist: true, silence: true, changeQ: true });
  const [team2Lifelines, setTeam2Lifelines] = useState({ ai_assist: true, silence: true, changeQ: true });

  const [silencedTimer, setSilencedTimer] = useState(0);
  const [silencedTeam, setSilencedTeam] = useState(null);
  const [aiAssistState, setAiAssistState] = useState({ isProcessing: false, active: false, hint: '', log: '' });
  const [isQuestionHidden, setIsQuestionHidden] = useState(false); // هل السؤال مخفي عن الجمهور؟

  // === إعدادات اتصال الجوال (MQTT Broker عبر WebSockets) ===
  const mqttClientRef = useRef(null);

  useEffect(() => {
    const remote = initialRemoteId;
    const clientId = 'huroof_' + Math.random().toString(16).substr(2, 8);
    
    const BROKER = 'wss://broker.emqx.io:8084/mqtt';
    
    const client = mqtt.connect(BROKER, {
      clientId,
      keepalive: 60,
      reconnectPeriod: 2000,
      connectTimeout: 15000,
      clean: true
    });
    mqttClientRef.current = client;

    if (remote) {
      // --- الجوال (Remote Client) ---
      client.on('connect', () => {
         setConnectionError(''); // clear any previous error
         setRemoteConnection(client);
         client.subscribe(`huroof/room/${remote}/to_remote`);
         // إخبار الشاشة باتصال الجوال
         client.publish(`huroof/room/${remote}/to_host`, JSON.stringify({ type: 'CONNECTED' }));
      });
      
      client.on('message', (topic, message) => {
         try {
             const data = JSON.parse(message.toString());
             if (data.type === 'STATE_UPDATE') {
                 setRemoteData(data);
             }
         } catch(e) {}
      });
      
      // Show reconnecting state but DON'T permanently block — mqtt will auto-retry
      client.on('error', (err) => {
        console.warn('MQTT error:', err.message);
        setConnectionError('جاري إعادة الاتصال...');
      });
      client.on('offline', () => {
        setConnectionError('جاري الاتصال بالسيرفر...');
        setRemoteConnection(null);
      });
      client.on('reconnect', () => {
        setConnectionError('غير متصل — جاري إعادة المحاولة...');
      });
    } else {
      // --- الشاشة الرئيسية (Host Screen) ---
      const generatedId = 'huroof-' + Math.random().toString(36).substr(2, 6);
      setPeerId(generatedId);
      
      client.on('connect', () => {
         setRemoteConnection(client);
         client.subscribe(`huroof/room/${generatedId}/to_host`);
      });
      
      client.on('message', (topic, message) => {
         try {
             const data = JSON.parse(message.toString());
             setRemoteActionTrigger(data);
         } catch(e) {}
      });

      client.on('offline', () => setRemoteConnection(null));
      client.on('connect', () => {
        // Re-subscribe after reconnect
        client.subscribe(`huroof/room/${generatedId}/to_host`);
      });
    }

    return () => {
       if (client) client.end(true);
    };
  }, [initialRemoteId]);

  // === Online PvP MQTT ===
  useEffect(() => {
    const guestId = initialPvpId;
    const hostRoomId = pvpRoomId;
    if (!guestId && !hostRoomId) return;
    const roomId = guestId || hostRoomId;
    const clientId = 'huroof_pvp_' + Math.random().toString(16).substr(2, 8);
    const pvpClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
      clientId, keepalive: 15, reconnectPeriod: 2000, connectTimeout: 10000, clean: true
    });
    pvpMqttRef.current = pvpClient;
    if (guestId) {
      const doConnect = () => {
        pvpClient.subscribe(`huroof/pvp/${guestId}/h2g`);
        pvpClient.publish(`huroof/pvp/${guestId}/g2h`, JSON.stringify({ type: 'GUEST_CONNECTED' }));
      };
      pvpClient.on('connect', () => { setPvpConnectionError(''); doConnect(); });
      pvpClient.on('reconnect', () => { setPvpConnectionError('جاري إعادة الاتصال...'); });
      pvpClient.on('offline', () => setPvpConnectionError('جاري الاتصال بالغرفة...'));
      pvpClient.on('message', (_, msg) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type === 'GAME_STATE') setPvpSyncData(data);
        } catch(e) {}
      });
    } else {
      pvpClient.on('connect', () => pvpClient.subscribe(`huroof/pvp/${hostRoomId}/g2h`));
      pvpClient.on('reconnect', () => pvpClient.subscribe(`huroof/pvp/${hostRoomId}/g2h`));
      pvpClient.on('message', (_, msg) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type === 'GUEST_CONNECTED') setPvpGuestConnected(true);
          else setPvpActionTrigger(data);
        } catch(e) {}
      });
    }
    return () => { pvpClient.end(true); pvpMqttRef.current = null; };
  }, [pvpRoomId, initialPvpId]);

  const handleRemoteAction = useCallback((data) => {
      setRemoteActionTrigger(data);
  }, []);

  // إرسال تحديثات حالة الشاشة للجوال بشكل دوري عند أي تغيير للـ State
  useEffect(() => {
      if (!isRemoteClient && remoteConnection && peerId) {
          const payload = {
              type: 'STATE_UPDATE',
              hostMode,
              activeCell, currentQuestion, currentAnswer, timeLeft, isAnswerRevealed, isQuestionHidden,
              team1Name: team1Name || 'الفريق الأول', team2Name: team2Name || 'الفريق الثاني',
              t1Color: team1Color, t2Color: team2Color, isTimerRunning,
              team1Lifelines, team2Lifelines, aiAssistState
          };
          mqttClientRef.current?.publish(`huroof/room/${peerId}/to_remote`, JSON.stringify(payload));
      }
  }, [remoteConnection, peerId, hostMode, activeCell, currentQuestion, currentAnswer, timeLeft, isAnswerRevealed, team1Name, team2Name, team1Color, team2Color, isTimerRunning, team1Lifelines, team2Lifelines, aiAssistState, isRemoteClient, isQuestionHidden]);

  // Host → Guest: sync full game state إلى لاعب الأون لاين
  useEffect(() => {
    if (gameMode !== 'online' || onlineRole !== 'host' || !pvpMqttRef.current || !pvpRoomId || !isGameStarted) return;
    const payload = {
      type: 'GAME_STATE', cells, letters: [...letters], activeCell, currentQuestion, currentAnswer,
      isAnswerRevealed, timeLeft, isTimerRunning, team1Score, team2Score, team1Wins, team2Wins,
      currentRound, maxRounds, roundWinner, matchWinner, explodedMine, goldenCells, mineCells, virusCells,
      gridSize, victoryCondition, team1Name: team1Name || 'الفريق الأول', team2Name: team2Name || 'الفريق الثاني',
      team1Color, team2Color, team1Lifelines, team2Lifelines
    };
    pvpMqttRef.current?.publish(`huroof/pvp/${pvpRoomId}/h2g`, JSON.stringify(payload));
  }, [gameMode, onlineRole, pvpRoomId, isGameStarted, cells, activeCell, currentQuestion, currentAnswer,
      isAnswerRevealed, timeLeft, isTimerRunning, team1Score, team2Score, team1Wins, team2Wins,
      currentRound, roundWinner, matchWinner, explodedMine]);

  // Guest: تطبيق الـ state المستلم من الـ host
  useEffect(() => {
    if (!pvpSyncData || !isOnlineGuest) return;
    const d = pvpSyncData;
    if (d.cells) setCells(d.cells);
    if (d.letters) setLetters(d.letters);
    setActiveCell(d.activeCell ?? null);
    if (d.currentQuestion !== undefined) setCurrentQuestion(d.currentQuestion);
    if (d.currentAnswer !== undefined) setCurrentAnswer(d.currentAnswer);
    if (d.isAnswerRevealed !== undefined) setIsAnswerRevealed(d.isAnswerRevealed);
    if (d.timeLeft !== undefined) setTimeLeft(d.timeLeft);
    if (d.isTimerRunning !== undefined) setIsTimerRunning(d.isTimerRunning);
    if (d.team1Score !== undefined) setTeam1Score(d.team1Score);
    if (d.team2Score !== undefined) setTeam2Score(d.team2Score);
    if (d.team1Wins !== undefined) setTeam1Wins(d.team1Wins);
    if (d.team2Wins !== undefined) setTeam2Wins(d.team2Wins);
    if (d.currentRound !== undefined) setCurrentRound(d.currentRound);
    if (d.maxRounds !== undefined) setMaxRounds(d.maxRounds);
    if (d.roundWinner !== undefined) setRoundWinner(d.roundWinner);
    if (d.matchWinner !== undefined) setMatchWinner(d.matchWinner);
    if (d.explodedMine !== undefined) setExplodedMine(d.explodedMine);
    if (d.goldenCells) setGoldenCells(d.goldenCells);
    if (d.mineCells) setMineCells(d.mineCells);
    if (d.virusCells) setVirusCells(d.virusCells);
    if (d.gridSize) setGridSize(d.gridSize);
    if (d.victoryCondition) setVictoryCondition(d.victoryCondition);
    if (d.team1Name) setTeam1Name(d.team1Name);
    if (d.team2Name) setTeam2Name(d.team2Name);
    if (d.team1Color) setTeam1Color(d.team1Color);
    if (d.team2Color) setTeam2Color(d.team2Color);
    if (d.team1Lifelines) setTeam1Lifelines(d.team1Lifelines);
    if (d.team2Lifelines) setTeam2Lifelines(d.team2Lifelines);
    if (!isGameStarted) setIsGameStarted(true);
  }, [pvpSyncData]);

  // دالة مخصصة لإرسال الأوامر تعمل من الجوال للشاشة
  const sendRemoteEvent = (data) => {
      if (initialRemoteId) {
          mqttClientRef.current?.publish(`huroof/room/${initialRemoteId}/to_host`, JSON.stringify(data));
      }
  };

  const sendGuestAction = (data) => {
    if (isOnlineGuest && initialPvpId) {
      pvpMqttRef.current?.publish(`huroof/pvp/${initialPvpId}/g2h`, JSON.stringify(data));
    }
  };

  const toggleMode = (mode) => { AudioEngine.play('click'); setModes(prev => ({...prev, [mode]: !prev[mode]})); };

  // ================== تهيئة الساحة ==================
  useEffect(() => {
    let generated = [];
    while (generated.length < gridSize * gridSize) {
        generated = generated.concat([...ALPHABET].sort(() => 0.5 - Math.random()));
    }
    setLetters(generated.slice(0, gridSize * gridSize));
    setCells(Array(gridSize * gridSize).fill(0));
    
    let goldens = [], mines = [], viruses = [];
    const totalCells = gridSize * gridSize;
    
    if(modes.gold) while(goldens.length < 3) { let r = Math.floor(Math.random() * totalCells); if(!goldens.includes(r)) goldens.push(r); }
    if(modes.mines) while(mines.length < 3) { let r = Math.floor(Math.random() * totalCells); if(!goldens.includes(r) && !mines.includes(r)) mines.push(r); }
    if(modes.virus) while(viruses.length < 2) { let r = Math.floor(Math.random() * totalCells); if(!goldens.includes(r) && !mines.includes(r) && !viruses.includes(r)) viruses.push(r); }
    
    setGoldenCells(goldens); setMineCells(mines); setVirusCells(viruses);
  }, [gridSize, isGameStarted, currentRound, modes]);

  // ================== نظام التوقيت وتوقيت التسكيت ==================
  useEffect(() => {
    let timer;
    if (activeCell !== null && timeLeft > 0 && !explodedMine && isTimerRunning) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 11 && prev > 1) AudioEngine.play('heartbeat');
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCell, timeLeft, explodedMine, isTimerRunning]);

  useEffect(() => {
      let t;
      if (silencedTimer > 0) {
          t = setInterval(() => setSilencedTimer(prev => prev - 1), 1000);
      } else {
          setSilencedTeam(null);
      }
      return () => clearInterval(t);
  }, [silencedTimer]);

  // ================== نظام فحص الانتصار ==================
  const checkWin = useCallback((teamStatus, currentCells) => {
    const emptyCells = currentCells.filter(c => c === 0).length;

    if (victoryCondition === 'domination') {
       if (emptyCells === 0) {
           let s1 = 0, s2 = 0;
           currentCells.forEach((c, idx) => {
               const points = goldenCells.includes(idx) ? 2 : 1;
               if (c === 1) s1 += points;
               if (c === 2) s2 += points;
           });
           if (s1 > s2) return 1;
           if (s2 > s1) return 2;
           return 'tie';
       }
       return false;
    }

    const visited = new Set();
    const queue = [];
    if (teamStatus === 1) { 
      for (let i = 0; i < gridSize; i++) if (currentCells[i] === teamStatus) { queue.push(i); visited.add(i); }
    } else if (teamStatus === 2) { 
      for (let r = 0; r < gridSize; r++) { const idx = r * gridSize; if (currentCells[idx] === teamStatus) { queue.push(idx); visited.add(idx); } }
    }
    while (queue.length > 0) {
      const current = queue.shift();
      if (teamStatus === 1 && current >= gridSize * (gridSize - 1)) return 1;
      if (teamStatus === 2 && current % gridSize === gridSize - 1) return 2; 
      const neighbors = getNeighbors(current, gridSize);
      for (const n of neighbors) {
        if (currentCells[n] === teamStatus && !visited.has(n)) { visited.add(n); queue.push(n); }
      }
    }
    
    if (emptyCells === 0) return 'tie';
    return false;
  }, [gridSize, victoryCondition, goldenCells]);

  const fetchQuestion = async (letter) => {
    try {
      const url = '/questions.csv';
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('فشل الاتصال بالرابط');
      
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);
      const lines = text.split(/\r?\n/);
      let allQuestions = [];
      lines.forEach(line => {
          if (!line.trim()) return;
          const parts = line.split(',');
          if (parts.length >= 4) {
              allQuestions.push({
                  letter: sanitizeHtml(parts[0].trim().replace(/^\uFEFF/, '')), 
                  question: sanitizeHtml(parts[1].trim()),
                  answer: sanitizeHtml(parts[2].trim()),
                  difficulty: sanitizeHtml(parts[3].trim()),
                  id: sanitizeHtml(parts[1].trim()) 
              });
          }
      });

      const diffMap = { 'easy': 'سهل', 'medium': 'متوسط', 'hard': 'صعب', 'mixed': 'mixed' };
      const targetDiff = diffMap[difficulty] || 'متوسط';
      const searchLetter = letter.trim();
      let available = allQuestions.filter(q => 
          q.letter === searchLetter && 
          (difficulty === 'mixed' || q.difficulty === targetDiff) && 
          !usedQuestionIds.includes(q.id)
      );

      if (available.length === 0) {
          setCurrentQuestion(`لا توجد أسئلة لحرف (${letter}) بهذا المستوى`);
          setCurrentAnswer("تخطي");
          return;
      }

      const selected = available[Math.floor(Math.random() * available.length)];
      setCurrentQuestion(selected.question);
      setCurrentAnswer(selected.answer);
      setUsedQuestionIds(prev => [...prev, selected.id]);

    } catch (error) {
        console.error("Fetch Error:", error);
        setCurrentQuestion('حدث خطأ في جلب الأسئلة من الرابط.');
        setCurrentAnswer('خطأ');
    }
  };

  const handleCellClick = async (index) => {
    if (isOnlineGuest) return;
    if (roundWinner || matchWinner) return;
    if (cells[index] === 0) {
      AudioEngine.play('click');
      setActiveCell(index);
      
      setAiAssistState({ isProcessing: false, active: false, hint: '', log: '' });
        setSilencedTimer(0);
        setSilencedTeam(null);

        if (mineCells.includes(index)) {
            AudioEngine.play('bomb'); setExplodedMine(true);
            setTimeout(() => {
                const newCells = [...cells]; newCells[index] = 3; 
                setCells(newCells); setExplodedMine(false); setActiveCell(null);
            }, 2500);
            return;
        }
        setTimeLeft(timerDuration);
        setIsAnswerRevealed(false);

        setIsTimerRunning(hostMode === 'smart');
        setCurrentQuestion('جاري تشفير البيانات واستخراج السؤال...');
        setCurrentAnswer('');
        fetchQuestion(letters[index]);
    }
  };

  const handleAnswer = useCallback((teamStatus) => {
    if(teamStatus === 1 || teamStatus === 2) AudioEngine.play('correct');
    else AudioEngine.play('wrong');

    setCells(prevCells => {
      let newCells = [...prevCells];
      newCells[activeCell] = teamStatus;
      const pointsToAdd = goldenCells.includes(activeCell) ? 2 : 1;
      if (teamStatus === 1) setTeam1Score(s => s + pointsToAdd);
      if (teamStatus === 2) setTeam2Score(s => s + pointsToAdd);

      if ((teamStatus === 1 || teamStatus === 2) && virusCells.includes(activeCell)) {
        const neighbors = getNeighbors(activeCell, gridSize);
        neighbors.forEach(n => {
          if(newCells[n] === (teamStatus === 1 ? 2 : 1)) {
             newCells[n] = teamStatus; 
             if(teamStatus === 1) { setTeam1Score(s=>s+1); setTeam2Score(s=>s-1); }
             else { setTeam2Score(s=>s+1); setTeam1Score(s=>s-1); }
          }
        });
      }

      const winner = checkWin(teamStatus, newCells);
      if (winner) {
        if (winner === 'tie') {
            AudioEngine.play('win');
            setRoundWinner('tie');
        } else {
            AudioEngine.play('win');
            const winnerColor = winner === 1 ? team1Color : team2Color;
            confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.6 },
                colors: [winnerColor, '#ffffff', '#facc15', '#050508'],
                startVelocity: 45,
                gravity: 0.8,
                ticks: 300
            });
            setShowConfetti(true);
            setRoundWinner(winner);
            if (winner === 1) {
              if (team1Wins + 1 >= Math.ceil(maxRounds / 2) && maxRounds !== 999) setMatchWinner(1);
              else setTeam1Wins(w => w + 1);
            } else {
              if (team2Wins + 1 >= Math.ceil(maxRounds / 2) && maxRounds !== 999) setMatchWinner(2);
              else setTeam2Wins(w => w + 1);
            }
        }
      }
      return newCells;
    });
    setActiveCell(null);
  }, [activeCell, goldenCells, virusCells, checkWin, team1Wins, team2Wins, maxRounds, gridSize]);

  const useLifeline = useCallback((team, type) => {
    AudioEngine.play('click');
    if (team === 1) setTeam1Lifelines(prev => ({...prev, [type]: false}));
    if (team === 2) setTeam2Lifelines(prev => ({...prev, [type]: false}));
    
    if (type === 'ai_assist') {
        const fullAnswer = currentAnswer || 'لا توجد بيانات';
        const hintLen = Math.ceil(fullAnswer.length / 2);
        const hintText = fullAnswer.split('').map((char, i) => (i < hintLen || char === ' ') ? char : '█').join('');
        
        setAiAssistState({ isProcessing: true, active: false, hint: hintText, log: '' });
        
        let ms = 0;
        const interval = setInterval(() => {
           ms += 400;
           if (ms === 400) setAiAssistState(s => ({ ...s, log: '> Huroof_AI: Matrix analysis initiated...' }));
           else if (ms === 800) setAiAssistState(s => ({ ...s, log: '> Huroof_AI: Decrypting node encryption codes...' }));
           else if (ms === 1200) setAiAssistState(s => ({ ...s, log: '> Huroof_AI: Extracting semantic partials...' }));
           else if (ms === 1600) setAiAssistState(s => ({ ...s, log: '> Huroof_AI: Data recovered successfully.' }));
           else if (ms >= 2000) {
               clearInterval(interval);
               setAiAssistState({ isProcessing: false, active: true, hint: hintText, log: '' });
               AudioEngine.play('win'); 
           }
        }, 400);
    }
    if (type === 'silence') {
        setSilencedTeam(team === 1 ? 2 : 1);
        setSilencedTimer(15);
    }
    if (type === 'changeQ') {
        setCurrentQuestion('جاري الاتصال بالخادم لاستبدال السؤال...');
        setCurrentAnswer('');
        setAiAssistState({ isProcessing: false, active: false, hint: '', log: '' });
        fetchQuestion(letters[activeCell]);
    }
  }, [currentAnswer, letters, activeCell]);

  useEffect(() => {
      if (remoteActionTrigger) {
          const data = remoteActionTrigger;
          AudioEngine.play('click');
          if (data.type === 'CONNECTED') {
              setRemoteConnection(true);
          } else if (data.type === 'CORRECT') {
              handleAnswer(data.team);
          } else if (data.type === 'WRONG') {
              AudioEngine.play('wrong');
              setActiveCell(null);
          } else if (data.type === 'SKIP') {
              AudioEngine.play('click');
              setActiveCell(null);
          } else if (data.type === 'SET_QUESTION') {
              // Human host is broadcasting a custom question from their phone
              setCurrentQuestion(sanitizeHtml(data.question || ''));
              setCurrentAnswer(sanitizeHtml(data.answer || ''));
              setIsAnswerRevealed(false);
              setIsTimerRunning(false);
          } else if (data.type === 'REVEAL') {
              setIsAnswerRevealed(true);
          } else if (data.type === 'TOGGLE_TIMER') {
              setIsTimerRunning(prev => !prev);
          } else if (data.type === 'TOGGLE_Q_VISIBILITY') {
              setIsQuestionHidden(prev => !prev);
          } else if (data.type === 'LIFELINE') {
              useLifeline(data.team, data.lifeline);
          }
          setRemoteActionTrigger(null);
      }
  }, [remoteActionTrigger, handleAnswer, useLifeline]);

  // Online Guest → Host actions
  useEffect(() => {
    if (!pvpActionTrigger) return;
    const data = pvpActionTrigger;
    AudioEngine.play('click');
    if (data.type === 'ONLINE_CORRECT') handleAnswer(2);
    else if (data.type === 'ONLINE_WRONG') { AudioEngine.play('wrong'); setActiveCell(null); }
    else if (data.type === 'ONLINE_SKIP') setActiveCell(null);
    setPvpActionTrigger(null);
  }, [pvpActionTrigger, handleAnswer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeCell === null || roundWinner || matchWinner) return;
      if (e.code === 'Space' && !isAnswerRevealed) {
        e.preventDefault(); AudioEngine.play('click'); setIsAnswerRevealed(true);
      } else if (e.key === '1') { handleAnswer(1); }
      else if (e.key === '2') { handleAnswer(2); }
      else if (e.key === 'x' || e.key === 'X') { AudioEngine.play('wrong'); setActiveCell(null); }
      else if (e.key === 'ArrowRight') { AudioEngine.play('click'); setActiveCell(null); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, isAnswerRevealed, handleAnswer, roundWinner, matchWinner]);
  // === Screen Wake Lock API (التقنية المتطورة لمنع إطفاء الشاشة) ===
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isGameStarted) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {}
    };
    if (isGameStarted) requestWakeLock();
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible' && isGameStarted) requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (wakeLock !== null) wakeLock.release().then(() => { wakeLock = null; });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isGameStarted]);

  // Hex grid responsive sizing
  useEffect(() => {
    if (!isGameStarted) return;
    const el = hexWrapRef.current;
    if (!el) return;
    const calc = () => {
      const W = el.clientWidth  - 24;
      const H = el.clientHeight - 24;
      if (W <= 0 || H <= 0) return;
      const fromW = W / (gridSize + 0.5);
      const fromH = (H / (gridSize * 0.75 + 0.25)) / 1.1547;
      const sz = Math.max(24, Math.min(110, Math.floor(Math.min(fromW, fromH))));
      setCellPx(sz);
    };
    const t = setTimeout(calc, 30);
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [gridSize, isGameStarted, isMobile]);

  const nextRound = () => {
      AudioEngine.play('click'); setShowConfetti(false);
      setCells(Array(gridSize * gridSize).fill(0)); 
      setTeam1Score(0); setTeam2Score(0); setRoundWinner(null); setCurrentRound(r => r + 1); 
  };

  const resetFullGame = () => {
    AudioEngine.play('click'); setIsGameStarted(false); setShowConfetti(false); setCells(Array(gridSize * gridSize).fill(0));
    setTeam1Score(0); setTeam2Score(0); setTeam1Wins(0); setTeam2Wins(0); setUsedQuestionIds([]);
    setTeam1Lifelines({ ai_assist: true, silence: true, changeQ: true }); setTeam2Lifelines({ ai_assist: true, silence: true, changeQ: true });
    setRoundWinner(null); setMatchWinner(null); setCurrentRound(1);
    if(isAmbientOn) { AudioEngine.toggleAmbient(); setIsAmbientOn(false); }
  };

  const getHexStyle = (status, index) => {
    const isGold = goldenCells.includes(index) && status === 0;
    const isVirus = virusCells.includes(index) && status === 0;
    
    // Level 5000 Premium Styles
    const neutralBg = 'rgba(20, 20, 30, 0.5)';
    const neutralBorder = 'rgba(255, 255, 255, 0.08)';
    
    if (status === 1) return { bg: `linear-gradient(135deg, ${team1Color}, #000)`, color: '#fff', border: team1Color, shadow: `0 0 45px ${team1Color}aa, inset 0 0 20px rgba(0,0,0,0.5)`, zIndex: 5, glowText: `0 0 10px ${team1Color}` };
    if (status === 2) return { bg: `linear-gradient(135deg, ${team2Color}, #000)`, color: '#fff', border: team2Color, shadow: `0 0 45px ${team2Color}aa, inset 0 0 20px rgba(0,0,0,0.5)`, zIndex: 5, glowText: `0 0 10px ${team2Color}` };
    if (status === 3) return { bg: 'radial-gradient(circle, #ff0000, #4a0000)', color: '#fff', border: '#ff0000', shadow: '0 0 50px rgba(255,0,0,0.8), inset 0 0 40px #ff0000', zIndex: 4, glowText: '0 0 10px #ff0000' };
    if (isGold) return { bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(200, 150, 0, 0.05))', color: '#ffd700', border: '#ffd700', shadow: 'inset 0 0 30px rgba(255,215,0,0.4), 0 0 15px rgba(255,215,0,0.2)', zIndex: 2, glowText: '0 0 15px rgba(255,215,0,0.8)' };
    if (isVirus) return { bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(120, 40, 200, 0.05))', color: '#d8b4fe', border: '#a855f7', shadow: 'inset 0 0 30px rgba(168,85,247,0.4), 0 0 15px rgba(168,85,247,0.2)', zIndex: 2, glowText: '0 0 15px rgba(168,85,247,0.8)' };
    return { bg: neutralBg, color: '#8a8a9d', border: neutralBorder, shadow: 'inset 0 0 15px rgba(0,0,0,0.5)', zIndex: 1, glowText: 'none' }; 
  };

  const gridRows = [];
  for (let i = 0; i < gridSize; i++) {
    const row = [];
    for (let j = 0; j < gridSize; j++) row.push(i * gridSize + j);
    gridRows.push(row);
  }

  const totalCellsCount = gridSize * gridSize;
  const t1CellsCount = cells.filter(c => c === 1).length;
  const t2CellsCount = cells.filter(c => c === 2).length;
  const emptyCellsCount = cells.filter(c => c === 0).length;
  const t1ControlPercent = totalCellsCount === 0 ? 0 : Math.round((t1CellsCount / totalCellsCount) * 100);
  const t2ControlPercent = totalCellsCount === 0 ? 0 : Math.round((t2CellsCount / totalCellsCount) * 100);

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #07001a;
      --surface:   rgba(14, 3, 36, 0.96);
      --border:    rgba(124, 58, 237, 0.18);
      --border-hi: rgba(124, 58, 237, 0.5);
      --purple:    #7c3aed;
      --purple-lt: #a855f7;
      --gold:      #f59e0b;
      --gold-lt:   #fbbf24;
      --text:      #f1f5f9;
      --muted:     rgba(255,255,255,0.35);
      --t1:        ${team1Color};
      --t2:        ${team2Color};
    }

    body, html {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: 'Cairo', sans-serif;
      direction: rtl;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 3px; }

    /* ── Layout ── */
    .main-layout { display: flex; width: 100vw; height: 100dvh; overflow: hidden; background: var(--bg); }
    .ad-sidebar { display: none !important; }
    .game-area { flex: 1; position: relative; height: 100%; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; -webkit-overflow-scrolling: touch; }

    /* ── App container with ambient blobs ── */
    .app-container {
      flex: 1;
      background: radial-gradient(ellipse at 20% 0%, rgba(124,58,237,0.15) 0%, transparent 60%),
                  radial-gradient(ellipse at 80% 100%, rgba(99,102,241,0.1) 0%, transparent 60%),
                  var(--bg);
      display: flex; flex-direction: column; position: relative; z-index: 1;
    }
    .app-container::before {
      content: ''; position: fixed; top: -20%; right: -20%;
      width: 55vw; height: 55vw; border-radius: 50%;
      filter: blur(120px); z-index: -1; opacity: 0.15;
      background: var(--t1);
      animation: blobDrift 25s ease-in-out infinite alternate;
    }
    .app-container::after {
      content: ''; position: fixed; bottom: -20%; left: -20%;
      width: 55vw; height: 55vw; border-radius: 50%;
      filter: blur(120px); z-index: -1; opacity: 0.12;
      background: var(--t2);
      animation: blobDrift 30s ease-in-out -15s infinite alternate;
    }

    /* ── Panels ── */
    .glass-panel {
      background: var(--surface) !important;
      border: 1px solid var(--border) !important;
      border-radius: 20px !important;
      backdrop-filter: blur(40px);
    }
    .esport-panel {
      position: relative;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: clamp(20px,3vw,32px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
      transition: transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.35s, border-color 0.3s;
    }
    .esport-panel:hover {
      transform: translateY(-4px);
      border-color: var(--border-hi);
      box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.06);
    }

    .panel-title {
      font-size: 1.1rem; font-weight: 900; color: var(--text);
      margin: 0 0 20px 0;
      display: flex; align-items: center; gap: 10px;
      text-transform: uppercase; letter-spacing: 1px;
    }

    /* ── Inputs ── */
    .pro-input {
      width: 100%; padding: 16px 20px; border-radius: 12px;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.07);
      color: var(--text); font-family: inherit; font-size: 1rem; font-weight: 700;
      outline: none; transition: border-color 0.3s, box-shadow 0.3s; box-sizing: border-box;
    }
    .pro-input:focus { border-color: var(--purple-lt); box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }

    .color-picker { width: 100%; height: 48px; border: none; border-radius: 12px; cursor: pointer; padding: 0; background: transparent; }
    .color-picker::-webkit-color-swatch-wrapper { padding: 0; }
    .color-picker::-webkit-color-swatch { border: 2px solid rgba(255,255,255,0.12); border-radius: 12px; }

    /* ── Buttons ── */
    .pulse-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      color: var(--muted);
      padding: 12px 24px; border-radius: 12px;
      cursor: pointer; font-family: inherit; font-weight: 800; font-size: 0.95rem;
      transition: all 0.2s ease;
    }
    .pulse-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: var(--text); transform: translateY(-2px); border-color: rgba(255,255,255,0.15); }
    .pulse-btn.active { background: var(--purple); color: #fff; border-color: var(--purple); box-shadow: 0 6px 20px rgba(124,58,237,0.45); }
    .pulse-btn:disabled { opacity: 0.2; cursor: not-allowed; }

    .btn-easy.active   { background: #22c55e; border-color: #22c55e; color: #000; box-shadow: 0 5px 18px rgba(34,197,94,0.4); }
    .btn-medium.active { background: #f59e0b; border-color: #f59e0b; color: #000; box-shadow: 0 5px 18px rgba(245,158,11,0.4); }
    .btn-hard.active   { background: #ef4444; border-color: #ef4444; color: #fff; box-shadow: 0 5px 18px rgba(239,68,68,0.4); }

    .launch-btn {
      width: 100%; padding: 22px;
      background: linear-gradient(135deg, var(--purple), #4f46e5);
      color: #fff; border: none; border-radius: 16px;
      font-size: 1.4rem; font-weight: 900; cursor: pointer; font-family: inherit;
      transition: all 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
      box-shadow: 0 15px 40px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.12);
      letter-spacing: 0.5px;
    }
    .launch-btn:hover { transform: translateY(-4px); box-shadow: 0 25px 55px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.15); }

    .control-btn {
      padding: 18px 30px; border-radius: 14px; font-family: inherit; font-weight: 900;
      font-size: 1.1rem; cursor: pointer; transition: all 0.2s ease; border: none;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .control-btn:hover { transform: translateY(-3px); filter: brightness(1.15); box-shadow: 0 12px 30px rgba(0,0,0,0.4); }

    /* ── Hex grid ── */
    .hex-container { position: relative; padding: clamp(20px,4vw,50px); margin: auto; }
    .hex-cell { transition: all 0.35s cubic-bezier(0.175,0.885,0.32,1.275); cursor: pointer; }
    .hex-cell:hover { transform: scale(1.2) translateY(-5px) !important; z-index: 100; filter: brightness(1.4) saturate(1.2); }
    .hex-cell-owned { animation: hexOwned 0.45s cubic-bezier(0.175,0.885,0.32,1.275); }

    /* ── Scoreboard HUD ── */
    .score-hud {
      display: flex; align-items: center; gap: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px; padding: 14px 22px;
      backdrop-filter: blur(30px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }

    /* ── Live stats bar ── */
    .live-stats {
      position: sticky; bottom: 16px; left: 50%; transform: translateX(-50%);
      width: 92%; max-width: 1300px;
      display: flex; justify-content: space-between; align-items: center;
      gap: 20px; z-index: 9000;
      background: rgba(7,0,26,0.92);
      border: 1px solid var(--border);
      border-radius: 16px; padding: 12px 24px;
      backdrop-filter: blur(40px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }

    /* ── Command center ── */
    .command-center {
      width: 100%; background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 22px; padding: clamp(16px,3vw,28px);
      display: flex; align-items: center; gap: 24px;
      box-shadow: inset 0 4px 20px rgba(0,0,0,0.4);
    }

    /* ── Animations ── */
    @keyframes blobDrift  { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(5%,5%) scale(1.1); } }
    @keyframes cinematicFade { from { opacity:0; transform:translateY(28px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes slideUp    { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
    @keyframes popIn      { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
    @keyframes hexOwned   { 0% { transform:scale(1.4); filter:brightness(2.5); } 100% { transform:scale(1); filter:brightness(1); } }
    @keyframes alertPulse { 0%,100% { color:#ef4444; transform:scale(1); text-shadow:0 0 20px rgba(239,68,68,0.5); } 50% { color:#fff; transform:scale(1.08); text-shadow:0 0 40px rgba(239,68,68,1); } }
    @keyframes timerRingPulse { 0%,100% { filter:drop-shadow(0 0 8px currentColor); } 50% { filter:drop-shadow(0 0 28px currentColor) drop-shadow(0 0 55px currentColor); } }
    @keyframes screenShake { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-8px,8px)} 40%{transform:translate(8px,-8px)} 60%{transform:translate(-6px,-6px)} 80%{transform:translate(6px,6px)} }
    @keyframes logoGlow   { 0%,100%{text-shadow:0 0 30px rgba(124,58,237,0.5),0 0 60px rgba(124,58,237,0.2)} 50%{text-shadow:0 0 60px rgba(124,58,237,1),0 0 120px rgba(124,58,237,0.4)} }
    @keyframes titleFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes remotePulse{ 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.4)} 50%{box-shadow:0 0 0 14px rgba(245,158,11,0)} }
    @keyframes scanBorder { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
    @keyframes confettiFall { 0%{transform:translateY(-10vh) rotate(0deg);opacity:0.9} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
    @keyframes onlinePulse{ 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.4)} 50%{box-shadow:0 0 0 18px rgba(124,58,237,0)} }
    @keyframes marqueeRtl { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

    .anim-cinematic  { animation: cinematicFade 0.75s cubic-bezier(0.16,1,0.3,1) forwards; }
    .anim-glitch     { animation: popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
    .anim-pop-in     { animation: popIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
    .anim-slide-up   { animation: slideUp 0.45s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }

    .timer-ring-critical { animation: timerRingPulse 0.65s ease-in-out infinite; color: #ef4444; }
    .logo-title  { animation: logoGlow 3s ease-in-out infinite, titleFloat 4s ease-in-out infinite; display: inline-block; }
    .remote-header { animation: remotePulse 2s infinite; }
    .scan-line { position:relative; overflow:hidden; }
    .scan-line::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent); animation:scanBorder 3s linear infinite; }
    .confetti { position:absolute; width:10px; height:10px; animation:confettiFall 3.5s linear forwards; opacity:0.9; border-radius:2px; box-shadow:0 0 8px currentColor; pointer-events:none; }

    .letter-ticker-wrap { width:100%; overflow:hidden; position:relative; padding:10px 0; }
    .letter-ticker-wrap::before, .letter-ticker-wrap::after { content:''; position:absolute; top:0; bottom:0; width:60px; z-index:2; pointer-events:none; }
    .letter-ticker-wrap::before { left:0; background:linear-gradient(to right, var(--bg), transparent); }
    .letter-ticker-wrap::after  { right:0; background:linear-gradient(to left, var(--bg), transparent); }
    .letter-ticker-inner { display:flex; gap:0; white-space:nowrap; animation:marqueeRtl 22s linear infinite; width:max-content; }
    .letter-ticker-inner span { font-size:1rem; font-weight:900; padding:0 16px; color:rgba(255,255,255,0.07); letter-spacing:2px; transition:color 0.3s; }
    .letter-ticker-inner span:hover { color:rgba(124,58,237,0.5); }

    /* ── Lobby styles ── */
    .lobby-bg {
      min-height:100vh; display:flex; flex-direction:column; align-items:center;
      padding:clamp(30px,5vw,60px) clamp(16px,4vw,50px) 80px;
      position:relative;
    }
    .lobby-card {
      background: var(--surface); border:1px solid var(--border); border-radius:24px;
      padding:clamp(24px,4vw,44px); max-width:680px; width:100%;
      box-shadow:0 40px 100px rgba(0,0,0,0.6); backdrop-filter:blur(40px);
    }
    .mode-card {
      background: var(--surface); border:1px solid var(--border); border-radius:20px;
      padding:clamp(24px,3vw,36px); cursor:pointer;
      transition:all 0.35s cubic-bezier(0.175,0.885,0.32,1.275);
      display:flex; flex-direction:column; align-items:center; gap:16px;
      flex:1; min-width:200px; max-width:320px; text-align:center;
      position:relative; overflow:hidden;
    }
    .mode-card:hover { transform:translateY(-10px) scale(1.03); border-color:var(--border-hi); box-shadow:0 35px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.25); }
    .mode-card-local  { border-top:3px solid rgba(255,255,255,0.3); }
    .mode-card-online { border-top:3px solid var(--gold); }
    .online-sub-btn {
      background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
      border-radius:16px; padding:20px 24px; cursor:pointer;
      transition:all 0.25s; display:flex; align-items:center; gap:16px;
      font-family:'Cairo',sans-serif; color:var(--text); width:100%; text-align:right;
    }
    .online-sub-btn:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); transform:translateX(-4px); }

    /* ── Responsive ── */
    @media(max-width:1024px) {
      .app-container { padding:12px !important; }
      .esport-panel { padding:18px !important; }
      .command-center { flex-direction:column !important; gap:14px !important; }
      .hex-container { padding:16px !important; }
      .live-stats { flex-direction:column !important; gap:14px !important; }
    }
    @media(max-width:768px) {
      .esport-panel { width:100% !important; min-width:unset !important; }
      .pulse-btn { padding:10px !important; font-size:0.9rem !important; }
      .launch-btn { font-size:1.2rem !important; padding:18px !important; }
      .settings-grid { grid-template-columns:1fr !important; }
      .settings-flex { flex-direction:column !important; width:100%; }
      .grid-options { display:grid !important; grid-template-columns:repeat(2,1fr) !important; gap:8px !important; }
      .team-inputs { flex-direction:column !important; gap:10px; }
      .hex-container { padding:8px !important; }
      .live-stats { position:relative !important; bottom:0 !important; margin-top:16px; }
      .command-center { flex-direction:column !important; gap:14px !important; }
    }
  `;

  // ====== Remote Client State for Human Host Mode ======
  const [spyQuestion, setSpyQuestion] = useState('');
  const [spyAnswer, setSpyAnswer] = useState('');
  const [spyTab, setSpyTab] = useState('control'); // 'control' | 'compose'

  if (isRemoteClient) {
      // Show a nice reconnecting screen instead of blocking error
      if (!remoteConnection) return (
          <>
          <style>{globalStyles}</style>
          <div style={{ background: '#050508', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif', color: 'white', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '20px', animation: 'titleFloat 2s ease-in-out infinite' }}>
                  {connectionError ? '🔄' : '⚡'}
              </div>
              <h2 className="logo-title" style={{ fontSize: '2rem', margin: '0 0 10px 0' }}>حروف ZONE</h2>
              <p style={{ color: connectionError ? '#f59e0b' : '#475569', margin: '0 0 10px 0', fontSize: '1rem', maxWidth: '300px', lineHeight: 1.6 }}>
                  {connectionError || 'جاري الاتصال بالشاشة...'}
              </p>
              {connectionError && (
                  <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0 0 30px 0' }}>
                      يتم إعادة المحاولة تلقائياً...
                  </p>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: connectionError ? '#f59e0b' : '#facc15', animation: `fall 1.2s ease-in-out ${i * 0.2}s infinite alternate`, opacity: 0.7 }}></div>)}
              </div>
          </div>
          </>
      );

      const isHumanMode = remoteData?.hostMode === 'human';
      const cellActive = remoteData && remoteData.activeCell !== null;

      // Shared spy-master send helpers
      const sendQ = () => {
          if (!spyQuestion.trim()) return;
          sendRemoteEvent({ type: 'SET_QUESTION', question: spyQuestion, answer: spyAnswer });
      };

      const TabBtn = ({ id, label }) => (
          <button id={id} onClick={() => { AudioEngine.play('click'); setSpyTab(id); }}
              style={{
                  flex: 1, padding: '14px', border: 'none', borderRadius: '12px', fontFamily: 'inherit',
                  fontWeight: '900', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.25s',
                  background: spyTab === id ? '#facc15' : 'rgba(255,255,255,0.06)',
                  color: spyTab === id ? '#000' : '#94a3b8',
                  boxShadow: spyTab === id ? '0 6px 20px rgba(250,204,21,0.35)' : 'none'
              }}>{label}</button>
      );

      // ── Spy Master Panel render ──
      return (
          <>
          <style>{globalStyles}</style>
          <style>{`
              .spy-panel { background: rgba(15,15,22,0.98); min-height: 100vh; padding: 0 0 40px 0; display: flex; flex-direction: column; color: white; font-family: 'Cairo', sans-serif; }
              .spy-header { background: linear-gradient(135deg, rgba(250,204,21,0.18), rgba(245,158,11,0.06)); border-bottom: 1px solid rgba(250,204,21,0.25); padding: 18px 20px; text-align: center; }
              .spy-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; }
              .spy-card-title { font-size: 0.75rem; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; font-weight: 700; }
              .spy-big-timer { text-align: center; font-size: 5.5rem; font-weight: 900; font-family: monospace; line-height: 1; transition: color 0.4s; }
              .spy-action-btn { width: 100%; padding: 18px; border: none; border-radius: 14px; font-family: inherit; font-weight: 900; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; }
              .spy-action-btn:active { transform: scale(0.97); }
              .spy-outline-btn { background: transparent; border-radius: 14px; font-family: inherit; font-weight: 900; cursor: pointer; padding: 15px; transition: all 0.2s; }
              .spy-outline-btn:active { transform: scale(0.97); }
              .spy-input { width: 100%; padding: 16px 18px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: #fff; font-family: inherit; font-size: 1rem; font-weight: 700; outline: none; box-sizing: border-box; transition: border-color 0.2s; resize: vertical; }
              .spy-input:focus { border-color: #facc15; }
              .spy-lifeline-btn { padding: 12px 8px; border-radius: 12px; font-family: inherit; font-weight: 900; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; border: none; width: 100%; }
              .spy-lifeline-btn:disabled { opacity: 0.25; cursor: not-allowed; }
              .spy-lifeline-btn:not(:disabled):active { transform: scale(0.96); }
          `}</style>
          <div className="spy-panel">

              {/* Header */}
              <div className="spy-header">
                  <div style={{ fontSize: '0.7rem', color: '#facc15', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>HUROOF ZONE — SPY MASTER</div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '900' }}>🎙️ لوحة تحكم المُقدم السرية</h2>
                  {remoteData && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                          <span style={{ background: remoteData.t1Color + '33', color: remoteData.t1Color, border: `1px solid ${remoteData.t1Color}55`, padding: '3px 12px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: '800' }}>{remoteData.team1Name || 'الفريق 1'}</span>
                          <span style={{ color: '#475569', fontSize: '0.8rem', alignSelf: 'center' }}>vs</span>
                          <span style={{ background: remoteData.t2Color + '33', color: remoteData.t2Color, border: `1px solid ${remoteData.t2Color}55`, padding: '3px 12px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: '800' }}>{remoteData.team2Name || 'الفريق 2'}</span>
                      </div>
                  )}
              </div>

              {/* Tab Bar */}
              <div style={{ display: 'flex', gap: '10px', padding: '16px 16px 0 16px' }}>
                  <TabBtn id="control" label="🕹️ تحكم" />
                  {isHumanMode && <TabBtn id="compose" label="✏️ سؤال جديد" />}
                  <TabBtn id="lifelines" label="⚡ مساعدة" />
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>

              {/* ===== TAB: CONTROL ===== */}
              {spyTab === 'control' && (
                  <>
                  {/* === بطاقة السؤال الحالي — مع زر الإخفاء والكشف === */}
                  {/* Timer */}
                  <div className="spy-card">
                      <div className="spy-card-title">⏱️ المؤقت</div>
                      <div className="spy-big-timer" style={{ color: remoteData?.timeLeft <= 10 ? '#ef4444' : '#ffffff' }}>
                          {remoteData ? `00:${remoteData.timeLeft < 10 ? '0' : ''}${remoteData.timeLeft}` : '--:--'}
                      </div>
                      <button id="spy-toggle-timer" className="spy-action-btn" onClick={() => { AudioEngine.play('click'); sendRemoteEvent({ type: 'TOGGLE_TIMER' }); }}
                          style={{ background: remoteData?.isTimerRunning ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)', color: remoteData?.isTimerRunning ? '#f59e0b' : '#10b981', border: `1px solid ${remoteData?.isTimerRunning ? '#f59e0b44' : '#10b98144'}`, marginTop: '14px' }}>
                          {remoteData?.isTimerRunning ? '⏸️ إيقاف المؤقت' : '▶️ تشغيل المؤقت'}
                      </button>
                  </div>

                  {/* Question Card — مع ميزة الإخفاء/الإظهار */}
                  {remoteData?.currentQuestion && (
                      <div className="spy-card" style={{ borderColor: remoteData?.isQuestionHidden ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)', background: remoteData?.isQuestionHidden ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)', transition: 'all 0.3s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <div className="spy-card-title" style={{ margin: 0 }}>❓ السؤال الحالي</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '0.7rem', color: remoteData?.isQuestionHidden ? '#ef4444' : '#10b981', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                      {remoteData?.isQuestionHidden ? '🙈 مخفي' : '👁️ ظاهر'}
                                  </span>
                                  <button onClick={() => { AudioEngine.play('click'); sendRemoteEvent({ type: 'TOGGLE_Q_VISIBILITY' }); }}
                                      style={{
                                          background: remoteData?.isQuestionHidden ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)',
                                          border: `1px solid ${remoteData?.isQuestionHidden ? '#ef4444' : '#10b981'}`,
                                          color: remoteData?.isQuestionHidden ? '#ef4444' : '#10b981',
                                          borderRadius: '10px', padding: '6px 14px', cursor: 'pointer',
                                          fontFamily: 'inherit', fontWeight: '900', fontSize: '0.85rem', transition: 'all 0.2s'
                                      }}>
                                      {remoteData?.isQuestionHidden ? '👁️ أظهر للجمهور' : '🙈 أخفِ عن الجمهور'}
                                  </button>
                              </div>
                          </div>
                          <div style={{ fontSize: '1.2rem', lineHeight: 1.7, color: '#e2e8f0', fontWeight: '700' }}>{remoteData.currentQuestion}</div>
                          {remoteData?.isQuestionHidden && (
                              <div style={{ marginTop: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '1.1rem' }}>🚫</span>
                                  <span style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: '700' }}>مخفي عن الجمهور — الشاشة تعرض نقاط بدل السؤال</span>
                              </div>
                          )}
                      </div>
                  )}

                  {/* Answer — always visible to spy master (secret from audience) */}
                  {remoteData?.currentAnswer && (
                      <div className="spy-card" style={{ borderColor: 'rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.08)' }}>
                          <div className="spy-card-title" style={{ color: '#60a5fa' }}>💡 الإجابة (سرية – للمُقدم فقط)</div>
                          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#93c5fd', lineHeight: 1.2 }}>{remoteData.currentAnswer}</div>
                      </div>
                  )}

                  {/* Human mode – prepared question preview (before broadcasting) */}
                  {isHumanMode && spyQuestion && (
                      <div className="spy-card" style={{ borderColor: 'rgba(250,204,21,0.3)', background: 'rgba(250,204,21,0.05)' }}>
                          <div className="spy-card-title" style={{ color: '#fbbf24' }}>📋 السؤال المُعدّ – اضغط بث للإرسال</div>
                          <div style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#fef3c7' }}>{spyQuestion}</div>
                          {spyAnswer && <div style={{ marginTop: '8px', color: '#fbbf24', fontSize: '0.9rem', fontWeight: '700' }}>الإجابة: {spyAnswer}</div>}
                          <button id="spy-send-q" className="spy-action-btn" onClick={() => { AudioEngine.play('click'); sendQ(); }}
                              style={{ background: '#facc15', color: '#000', marginTop: '12px' }}>📡 بث السؤال على الشاشة</button>
                      </div>
                  )}

                  {/* Reveal Answer Button */}
                  <button id="spy-reveal" className="spy-action-btn" onClick={() => { AudioEngine.play('click'); sendRemoteEvent({ type: 'REVEAL' }); }}
                      style={{ background: remoteData?.isAnswerRevealed ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: remoteData?.isAnswerRevealed ? '#10b981' : '#fff', border: `1.5px solid ${remoteData?.isAnswerRevealed ? '#10b981' : 'rgba(255,255,255,0.15)'}` }}>
                      {remoteData?.isAnswerRevealed ? '✅ الإجابة معروضة للجمهور' : '👁️ إظهار الإجابة للجمهور'}
                  </button>

                  {/* Score Buttons */}
                  {cellActive && remoteData && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                          <button id="spy-correct-t1" className="spy-action-btn" onClick={() => { AudioEngine.play('correct'); sendRemoteEvent({ type: 'CORRECT', team: 1 }); }}
                              style={{ flex: 1, background: remoteData.t1Color, color: '#fff', boxShadow: `0 8px 25px ${remoteData.t1Color}55` }}>
                              ✔️ {remoteData.team1Name || 'الفريق 1'}
                          </button>
                          <button id="spy-correct-t2" className="spy-action-btn" onClick={() => { AudioEngine.play('correct'); sendRemoteEvent({ type: 'CORRECT', team: 2 }); }}
                              style={{ flex: 1, background: remoteData.t2Color, color: '#fff', boxShadow: `0 8px 25px ${remoteData.t2Color}55` }}>
                              ✔️ {remoteData.team2Name || 'الفريق 2'}
                          </button>
                      </div>
                  )}

                  {cellActive && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                          <button id="spy-wrong" className="spy-outline-btn" onClick={() => { AudioEngine.play('wrong'); sendRemoteEvent({ type: 'WRONG' }); }}
                              style={{ flex: 1, color: '#ef4444', border: '2px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)' }}>❌ خاطئة</button>
                          <button id="spy-skip" className="spy-outline-btn" onClick={() => { AudioEngine.play('click'); sendRemoteEvent({ type: 'SKIP' }); }}
                              style={{ flex: 1, color: '#64748b', border: '2px solid rgba(100,116,139,0.3)', background: 'rgba(100,116,139,0.06)' }}>⏭️ تخطي</button>
                      </div>
                  )}

                  {!cellActive && (
                      <div style={{ textAlign: 'center', padding: '50px 20px', color: '#334155' }}>
                          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎯</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>في انتظار اختيار خلية من الشاشة الرئيسية...</div>
                      </div>
                  )}
                  </>
              )}

              {/* ===== TAB: COMPOSE (Human mode only) ===== */}
              {spyTab === 'compose' && isHumanMode && (
                  <>
                  <div className="spy-card">
                      <div className="spy-card-title">✏️ أدخل السؤال الخارجي</div>
                      <textarea id="spy-question-input" className="spy-input" rows={4} placeholder="اكتب السؤال هنا..." value={spyQuestion} onChange={e => setSpyQuestion(e.target.value)} />
                  </div>
                  <div className="spy-card">
                      <div className="spy-card-title">💡 الإجابة (اختياري – سرية)</div>
                      <input id="spy-answer-input" className="spy-input" type="text" placeholder="الإجابة الصحيحة..." value={spyAnswer} onChange={e => setSpyAnswer(e.target.value)} />
                  </div>
                  <button id="spy-broadcast" className="spy-action-btn" onClick={() => { AudioEngine.play('click'); sendQ(); setSpyTab('control'); }}
                      style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#000', fontSize: '1.2rem', boxShadow: '0 8px 25px rgba(250,204,21,0.35)' }}>
                      📡 بث السؤال على الشاشة الكبيرة
                  </button>
                  <button className="spy-outline-btn" onClick={() => { setSpyQuestion(''); setSpyAnswer(''); AudioEngine.play('click'); }}
                      style={{ color: '#64748b', border: '1px solid rgba(100,116,139,0.3)' }}>🗑️ مسح</button>
                  </>
              )}

              {/* ===== TAB: LIFELINES ===== */}
              {spyTab === 'lifelines' && remoteData?.team1Lifelines && remoteData?.team2Lifelines && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                      {/* Team 1 */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ textAlign: 'center', color: remoteData.t1Color, fontWeight: '900', padding: '10px', background: remoteData.t1Color + '22', borderRadius: '12px', fontSize: '1rem' }}>{remoteData.team1Name || 'الفريق 1'}</div>
                          <button id="spy-ll-t1-ai" className="spy-lifeline-btn" disabled={!remoteData.team1Lifelines.ai_assist}
                              onClick={() => { AudioEngine.play('click'); sendRemoteEvent({type:'LIFELINE', team:1, lifeline:'ai_assist'}); }}
                              style={{ background: remoteData.team1Lifelines.ai_assist ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(255,255,255,0.05)', color: remoteData.team1Lifelines.ai_assist ? '#fff' : '#475569', border: remoteData.team1Lifelines.ai_assist ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>🧠 ذكاء حروف</button>
                          <button id="spy-ll-t1-sil" className="spy-lifeline-btn" disabled={!remoteData.team1Lifelines.silence}
                              onClick={() => { AudioEngine.play('click'); sendRemoteEvent({type:'LIFELINE', team:1, lifeline:'silence'}); }}
                              style={{ background: remoteData.team1Lifelines.silence ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(255,255,255,0.05)', color: remoteData.team1Lifelines.silence ? '#fff' : '#475569', border: remoteData.team1Lifelines.silence ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>🔇 تسكيت</button>
                          <button id="spy-ll-t1-chq" className="spy-lifeline-btn" disabled={!remoteData.team1Lifelines.changeQ}
                              onClick={() => { AudioEngine.play('click'); sendRemoteEvent({type:'LIFELINE', team:1, lifeline:'changeQ'}); }}
                              style={{ background: remoteData.team1Lifelines.changeQ ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.05)', color: remoteData.team1Lifelines.changeQ ? '#fff' : '#475569', border: remoteData.team1Lifelines.changeQ ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>🔄 استبدال</button>
                      </div>
                      {/* Team 2 */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ textAlign: 'center', color: remoteData.t2Color, fontWeight: '900', padding: '10px', background: remoteData.t2Color + '22', borderRadius: '12px', fontSize: '1rem' }}>{remoteData.team2Name || 'الفريق 2'}</div>
                          <button id="spy-ll-t2-ai" className="spy-lifeline-btn" disabled={!remoteData.team2Lifelines.ai_assist}
                              onClick={() => { AudioEngine.play('click'); sendRemoteEvent({type:'LIFELINE', team:2, lifeline:'ai_assist'}); }}
                              style={{ background: remoteData.team2Lifelines.ai_assist ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(255,255,255,0.05)', color: remoteData.team2Lifelines.ai_assist ? '#fff' : '#475569', border: remoteData.team2Lifelines.ai_assist ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>🧠 ذكاء حروف</button>
                          <button id="spy-ll-t2-sil" className="spy-lifeline-btn" disabled={!remoteData.team2Lifelines.silence}
                              onClick={() => { AudioEngine.play('click'); sendRemoteEvent({type:'LIFELINE', team:2, lifeline:'silence'}); }}
                              style={{ background: remoteData.team2Lifelines.silence ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(255,255,255,0.05)', color: remoteData.team2Lifelines.silence ? '#fff' : '#475569', border: remoteData.team2Lifelines.silence ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>🔇 تسكيت</button>
                          <button id="spy-ll-t2-chq" className="spy-lifeline-btn" disabled={!remoteData.team2Lifelines.changeQ}
                              onClick={() => { AudioEngine.play('click'); sendRemoteEvent({type:'LIFELINE', team:2, lifeline:'changeQ'}); }}
                              style={{ background: remoteData.team2Lifelines.changeQ ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.05)', color: remoteData.team2Lifelines.changeQ ? '#fff' : '#475569', border: remoteData.team2Lifelines.changeQ ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>🔄 استبدال</button>
                      </div>
                  </div>
              )}

              </div>
          </div>
          </>
      );
  }

  // ====== شاشة الاتصال للضيف (أون لاين) ======
  if (isOnlineGuest && !isGameStarted) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{ background: '#050508', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif', color: 'white', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px', animation: 'titleFloat 2s ease-in-out infinite' }}>
            {pvpConnectionError ? '🔄' : '⚡'}
          </div>
          <h2 className="logo-title" style={{ fontSize: '2.2rem', margin: '0 0 8px 0' }}>حروف ZONE</h2>
          <div style={{ color: '#facc15', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '20px' }}>ONLINE VERSUS</div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '30px 40px', marginBottom: '20px' }}>
            <p style={{ color: pvpConnectionError ? '#f59e0b' : '#10b981', margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '800' }}>
              {pvpConnectionError || '✅ متصل — في انتظار بدء اللعبة...'}
            </p>
            <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
              {pvpConnectionError ? 'يتم إعادة المحاولة تلقائياً...' : 'انتظر بدء اللعبة من المضيف'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: pvpConnectionError ? '#f59e0b' : '#facc15', animation: `fall 1.2s ease-in-out ${i * 0.2}s infinite alternate`, opacity: 0.7 }}/>)}
          </div>
        </div>
      </>
    );
  }

  // ====== شاشة اللوبي الرئيسية ======
  if (showLobby) {
    // شاشة انتظار المضيف (بعد إنشاء الغرفة)
    if (onlineSubScreen === 'host_wait') {
      const pvpUrl = `${window.location.origin}${window.location.pathname}?pvp=${pvpRoomId}`;
      return (
        <>
          <style>{globalStyles}</style>
          <style>{`
            .lobby-bg { min-height: 100vh; background: radial-gradient(ellipse at top, #11111a 0%, #050508 80%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 20px; font-family: 'Cairo', sans-serif; color: white; }
            .lobby-card { background: rgba(10,10,20,0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; padding: 40px; max-width: 600px; width: 100%; box-shadow: 0 40px 80px rgba(0,0,0,0.6); backdrop-filter: blur(30px); }
            @keyframes onlinePulse { 0%,100%{box-shadow: 0 0 0 0 rgba(250,204,21,0.4);} 50%{box-shadow: 0 0 0 20px rgba(250,204,21,0);} }
            .pvp-copy-link { background: rgba(0,0,0,0.5); border: 1px solid rgba(250,204,21,0.3); border-radius: 14px; padding: 14px 18px; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: 0.2s; margin-top: 16px; }
            .pvp-copy-link:hover { border-color: #facc15; }
          `}</style>
          <div className="lobby-bg">
            {/* Particles */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              {Array.from({length: 20}).map((_, i) => (
                <div key={i} style={{ position: 'absolute', width: `${1.5+(i%3)*0.7}px`, height: `${1.5+(i%3)*0.7}px`, background: i%2===0 ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.15)', borderRadius: '50%', left: `${(i*41+7)%100}%`, top: `${(i*57+13)%100}%`, animation: `titleFloat ${5+(i%5)}s ease-in-out ${i*0.3}s infinite alternate` }}/>
              ))}
            </div>

            <div className="lobby-card anim-cinematic" style={{ position: 'relative', zIndex: 10, borderTop: '4px solid #facc15' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: '900' }}>🌐 غرفة أون لاين</h2>
                <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '700' }}>شارك الرمز أو الرابط مع صديقك</div>
              </div>

              {/* Room Code */}
              <div style={{ textAlign: 'center', background: 'rgba(250,204,21,0.06)', border: '2px dashed rgba(250,204,21,0.3)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>رمز الغرفة</div>
                <div style={{ fontSize: '3rem', fontWeight: '900', color: '#facc15', letterSpacing: '6px', fontFamily: 'monospace', textShadow: '0 0 30px rgba(250,204,21,0.5)' }}>
                  {pvpRoomId.replace('huroof-pvp-', '')}
                </div>
              </div>

              {/* QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '18px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', animation: 'onlinePulse 2s infinite' }}>
                  <QRCode value={pvpUrl} size={180} />
                </div>
                <div style={{ fontSize: '0.8rem', color: pvpGuestConnected ? '#10b981' : '#64748b', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {pvpGuestConnected ? '✅ صديقك متصل!' : '⏳ في انتظار صديقك...'}
                </div>
              </div>

              {/* Copy Link */}
              <div className="pvp-copy-link" onClick={() => { navigator.clipboard.writeText(pvpUrl); AudioEngine.play('win'); }} title="انقر للنسخ">
                <span style={{ fontSize: '1.2rem' }}>📋</span>
                <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'left' }}>{pvpUrl}</span>
                <span style={{ color: '#facc15', fontSize: '0.8rem', fontWeight: '900', flexShrink: 0 }}>نسخ</span>
              </div>

              <div style={{ display: 'flex', gap: '14px', marginTop: '24px' }}>
                <button className="pulse-btn" onClick={() => { AudioEngine.play('click'); setOnlineSubScreen('choose'); setPvpRoomId(''); setOnlineRole(null); setGameMode('local'); }} style={{ flex: 1 }}>← رجوع</button>
                <button className="launch-btn" style={{ flex: 2, padding: '18px', fontSize: '1.2rem' }} onClick={() => { AudioEngine.play('win'); setShowLobby(false); }}>
                  {pvpGuestConnected ? '🎮 ابدأ اللعبة!' : '🚀 ابدأ بدون انتظار'}
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }

    // شاشة الانضمام لغرفة
    if (onlineSubScreen === 'join') {
      return (
        <>
          <style>{globalStyles}</style>
          <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #11111a 0%, #050508 80%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', fontFamily: 'Cairo, sans-serif', color: 'white' }}>
            <div style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', padding: '40px', maxWidth: '480px', width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', backdropFilter: 'blur(30px)', borderTop: '4px solid #3b82f6', textAlign: 'center' }} className="anim-cinematic">
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔗</div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: '900' }}>انضم لغرفة</h2>
              <p style={{ color: '#475569', margin: '0 0 28px 0', fontWeight: '600' }}>أدخل رمز الغرفة أو الرابط</p>
              <input
                className="pro-input"
                placeholder="أدخل رمز الغرفة..."
                value={pvpJoinInput}
                onChange={e => setPvpJoinInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && pvpJoinInput.trim()) { const code = pvpJoinInput.trim(); window.location.href = `${window.location.origin}${window.location.pathname}?pvp=${code}`; }}}
                style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '4px', marginBottom: '16px', direction: 'ltr' }}
              />
              <button className="launch-btn" style={{ fontSize: '1.2rem', padding: '18px', marginBottom: '12px' }}
                onClick={() => { if (pvpJoinInput.trim()) { const code = pvpJoinInput.trim(); window.location.href = `${window.location.origin}${window.location.pathname}?pvp=${code}`; }}}>
                🚀 انضم الآن
              </button>
              <button className="pulse-btn" style={{ width: '100%' }} onClick={() => { AudioEngine.play('click'); setOnlineSubScreen('choose'); }}>← رجوع</button>
            </div>
          </div>
        </>
      );
    }

    // ====== شاشة اللوبي الرئيسية (الاختيار بين محلي وأون لاين) ======
    return (
      <>
        <style>{globalStyles}</style>
        <style>{`
          .lobby-root { min-height: 100vh; background: radial-gradient(ellipse at 60% 20%, #0d0d1a 0%, #050508 70%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; font-family: 'Cairo', sans-serif; color: white; position: relative; overflow: hidden; }
          .mode-card { background: rgba(10,10,20,0.85); border: 1px solid rgba(255,255,255,0.07); border-radius: 28px; padding: 40px 36px; cursor: pointer; transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center; gap: 18px; flex: 1; min-width: 220px; max-width: 360px; backdrop-filter: blur(20px); position: relative; overflow: hidden; }
          .mode-card::before { content: ''; position: absolute; inset: 0; opacity: 0; transition: opacity 0.4s; border-radius: 28px; }
          .mode-card:hover { transform: translateY(-10px) scale(1.03); border-color: rgba(255,255,255,0.2); box-shadow: 0 40px 80px rgba(0,0,0,0.5); }
          .mode-card-local:hover { border-color: rgba(255,255,255,0.3); box-shadow: 0 30px 60px rgba(255,255,255,0.08); }
          .mode-card-online:hover { border-color: rgba(250,204,21,0.5); box-shadow: 0 30px 60px rgba(250,204,21,0.15); }
          .mode-card-online { border-top: 4px solid #facc15; }
          .mode-card-local { border-top: 4px solid rgba(255,255,255,0.5); }
          .mode-icon { font-size: 3.5rem; line-height: 1; filter: drop-shadow(0 0 20px rgba(255,255,255,0.3)); }
          .mode-title { font-size: 1.6rem; font-weight: 900; color: #fff; }
          .mode-desc { font-size: 0.95rem; color: #64748b; text-align: center; font-weight: 600; line-height: 1.6; }
          .mode-badge { font-size: 0.7rem; font-weight: 900; letter-spacing: 2px; padding: 4px 14px; border-radius: 30px; text-transform: uppercase; }
          @keyframes scanLine { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
          .scan-beam { position: fixed; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(250,204,21,0.3), transparent); animation: scanLine 6s linear infinite; pointer-events: none; z-index: 0; }
          .online-sub-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 22px 30px; cursor: pointer; transition: all 0.25s; display: flex; align-items: center; gap: 16px; font-family: 'Cairo', sans-serif; color: white; width: 100%; text-align: right; }
          .online-sub-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); transform: translateX(-4px); }
        `}</style>

        <div className="lobby-root">
          <div className="scan-beam"/>
          {/* Particles */}
          <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {Array.from({length: 28}).map((_, i) => (
              <div key={i} style={{ position: 'absolute', width: `${1.5+(i%4)*0.8}px`, height: `${1.5+(i%4)*0.8}px`, background: i%4===0?'rgba(250,204,21,0.5)':i%4===1?'rgba(255,255,255,0.18)':'rgba(96,165,250,0.2)', borderRadius: '50%', left: `${(i*37+5)%100}%`, top: `${(i*53+10)%100}%`, animation: `titleFloat ${5+(i%6)}s ease-in-out ${i*0.25}s infinite alternate`, boxShadow: i%4===0?'0 0 8px rgba(250,204,21,0.6)':'none' }}/>
            ))}
          </div>

          {/* Watermark */}
          <div style={{ position: 'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize: '15vw', fontWeight: '900', color: 'rgba(255,255,255,0.015)', whiteSpace:'nowrap', userSelect:'none', pointerEvents:'none', lineHeight:1 }}>
            حروف ZONE
          </div>

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', maxWidth: '860px', width: '100%' }} className="anim-cinematic">

            {/* Logo */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-block', position: 'relative' }}>
                <h1 className="logo-title" style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', fontWeight: '900', margin: '0', color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
                  حروف <span style={{color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,0.4)', letterSpacing: '4px'}}>ZONE</span>
                </h1>
                <div style={{ position: 'absolute', top: '-8px', left: '-5px', background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#000', fontSize: '0.6rem', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', letterSpacing: '2px', transform: 'rotate(-12deg)', boxShadow: '0 4px 15px rgba(250,204,21,0.5)' }}>PRO</div>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: '12px 0 0 0', fontWeight: '700', letterSpacing: '5px', textTransform: 'uppercase' }}>اختر طريقة اللعب</p>
              <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', margin: '14px auto 0', borderRadius: '2px' }}/>
            </div>

            {/* Mode Cards */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>

              {/* Local Mode */}
              <div className="mode-card mode-card-local" onClick={() => { AudioEngine.play('win'); setGameMode('local'); setShowLobby(false); }}>
                <div className="mode-icon">📺</div>
                <div>
                  <div className="mode-title">محلي</div>
                  <div className="mode-desc">العب على نفس الجهاز<br/>مع أصدقائك في نفس المكان</div>
                </div>
                <div className="mode-badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>LOCAL PLAY</div>
              </div>

              {/* Online Mode */}
              <div className="mode-card mode-card-online" onClick={() => { AudioEngine.play('win'); setGameMode('online'); }}>
                <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                  <div style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(250,204,21,0.3)', letterSpacing: '1px' }}>⚡ جديد</div>
                </div>
                <div className="mode-icon" style={{ filter: 'drop-shadow(0 0 20px rgba(250,204,21,0.5))' }}>🌐</div>
                <div>
                  <div className="mode-title" style={{ color: '#facc15' }}>أون لاين</div>
                  <div className="mode-desc">العب مع صديقك عن بعد<br/>من أي مكان في العالم</div>
                </div>
                <div className="mode-badge" style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)' }}>ONLINE VERSUS</div>
              </div>
            </div>

            {/* Online sub-options (shown when online is selected) */}
            {gameMode === 'online' && (
              <div style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '14px', backdropFilter: 'blur(20px)' }} className="anim-slide-up">
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                  <div style={{ color: '#facc15', fontWeight: '900', fontSize: '1.1rem' }}>🌐 اختر دورك</div>
                </div>

                {/* Create Room */}
                <div className="online-sub-btn" onClick={() => {
                  AudioEngine.play('click');
                  const roomId = 'huroof-pvp-' + Math.random().toString(36).substr(2, 6).toUpperCase();
                  setPvpRoomId(roomId);
                  setOnlineRole('host');
                  setOnlineSubScreen('host_wait');
                }} style={{ borderColor: 'rgba(250,204,21,0.25)', background: 'rgba(250,204,21,0.05)' }}>
                  <div style={{ fontSize: '2rem' }}>🏠</div>
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#facc15' }}>أنشئ غرفة</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>الفريق الأول — أنت تتحكم في اللوحة</div>
                  </div>
                  <div style={{ marginRight: 'auto', fontSize: '1.3rem', color: '#facc15' }}>←</div>
                </div>

                {/* Join Room */}
                <div className="online-sub-btn" onClick={() => { AudioEngine.play('click'); setOnlineSubScreen('join'); }} style={{ borderColor: 'rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.05)' }}>
                  <div style={{ fontSize: '2rem' }}>🙋</div>
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#93c5fd' }}>انضم لغرفة</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>الفريق الثاني — أدخل رمز صديقك</div>
                  </div>
                  <div style={{ marginRight: 'auto', fontSize: '1.3rem', color: '#60a5fa' }}>←</div>
                </div>

                <button className="pulse-btn" style={{ alignSelf: 'center', marginTop: '4px' }} onClick={() => { AudioEngine.play('click'); setGameMode('local'); }}>← إلغاء</button>
              </div>
            )}
          </div>

          {/* Back to Platform */}
          <button onClick={() => { AudioEngine.play('click'); onBack(); }} style={{ position: 'fixed', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 20px', borderRadius: '30px', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', zIndex: 100, fontFamily: 'inherit', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🏠 المنصة الرئيسية
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="main-layout">
        <style>{globalStyles}</style>

        <div className="ad-sidebar">
            <AdSenseWidget adSlot="1111111111" />
        </div>

        <div className="game-area">

            {isGameStarted && hostMode === 'human' && (
                <div style={{
                    position: 'fixed', top: '15px', right: '50%', transform: 'translateX(50%)',
                    zIndex: 9990, display: 'flex', alignItems: 'center', gap: '12px',
                    background: remoteConnection ? 'rgba(16,185,129,0.15)' : 'rgba(250,204,21,0.12)',
                    border: `1px solid ${remoteConnection ? 'rgba(16,185,129,0.4)' : 'rgba(250,204,21,0.4)'}`,
                    borderRadius: '30px', padding: '10px 22px', backdropFilter: 'blur(20px)',
                    boxShadow: `0 4px 20px ${remoteConnection ? 'rgba(16,185,129,0.2)' : 'rgba(250,204,21,0.2)'}`,
                    transition: 'all 0.5s ease', cursor: remoteConnection ? 'default' : 'pointer'
                }}
                    onClick={() => {
                        if (!remoteConnection) {
                            const url = `${window.location.origin}${window.location.pathname}?remote=${peerId}`;
                            navigator.clipboard.writeText(url).then(() => AudioEngine.play('win'));
                        }
                    }}
                    title={remoteConnection ? '' : 'انقر لنسخ رابط المُقدم'}
                >
                    <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: remoteConnection ? '#10b981' : '#facc15',
                        boxShadow: `0 0 10px ${remoteConnection ? '#10b981' : '#facc15'}`,
                        animation: remoteConnection ? 'none' : 'alertPulse 1.5s infinite'
                    }} />
                    <span style={{ color: remoteConnection ? '#34d399' : '#facc15', fontWeight: '900', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        {remoteConnection ? '✅ المُقدم متصل' : '🎙️ انقر لنسخ رابط المُقدم'}
                    </span>
                </div>
            )}

            {!isGameStarted ? (
                <div className="app-container" style={{ 
                    justifyContent: 'flex-start', 
                    alignItems: 'center', 
                    padding: isMobile ? '60px 10px 50px 10px' : '80px 20px 50px 20px', 
                    minHeight: '100vh', 
                    display: 'flex' 
                }}>
                    {/* 🌟 Floating Particle System 🌟 */}
                    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} style={{
                                position: 'absolute',
                                width: `${1.5 + (i % 4) * 0.8}px`,
                                height: `${1.5 + (i % 4) * 0.8}px`,
                                background: i % 4 === 0 ? 'rgba(250,204,21,0.5)' : i % 4 === 1 ? 'rgba(255,255,255,0.2)' : i % 4 === 2 ? `${team1Color}44` : `${team2Color}44`,
                                borderRadius: '50%',
                                left: `${(i * 37 + 5) % 100}%`,
                                top: `${(i * 53 + 10) % 100}%`,
                                animation: `titleFloat ${5 + (i % 6)}s ease-in-out ${i * 0.25}s infinite alternate`,
                                boxShadow: i % 4 === 0 ? '0 0 8px rgba(250,204,21,0.7)' : '0 0 4px rgba(255,255,255,0.2)'
                            }} />
                        ))}
                    </div>
                    {/* 🌟 العبارة المائية في الخلفية (تختفي مع بدء اللعب) 🌟 */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: isMobile ? '12vw' : '8vw',
                        fontWeight: '900',
                        color: 'rgba(255,255,255,0.02)',
                        whiteSpace: 'nowrap',
                        zIndex: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        textAlign: 'center',
                        lineHeight: '1'
                    }}>
                       حروف<br/>ZONE
                    </div>

                    <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '24px', position: 'relative', zIndex: 10 }} className="anim-cinematic">
                        
                        {/* 🔙 العودة لاختيار الطور */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '10px' : '20px' }}>
                            <button 
                                onClick={() => { AudioEngine.play('click'); setShowLobby(true); }}
                                style={{ 
                                    background: 'rgba(255,255,255,0.05)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    color: '#fff', 
                                    padding: '10px 20px', 
                                    borderRadius: '12px', 
                                    fontWeight: '900', 
                                    cursor: 'pointer', 
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: '0.3s',
                                    backdropFilter: 'blur(10px)',
                                    fontFamily: 'inherit'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                <span>🔙</span> تغيير طور اللعب
                            </button>

                            <div style={{ 
                                background: gameMode === 'online' ? 'rgba(250,204,21,0.12)' : 'rgba(59,130,246,0.12)', 
                                color: gameMode === 'online' ? '#facc15' : '#60a5fa',
                                border: `1px solid ${gameMode === 'online' ? 'rgba(250,204,21,0.3)' : 'rgba(59,130,246,0.3)'}`,
                                padding: '8px 18px',
                                borderRadius: '30px',
                                fontSize: '0.8rem',
                                fontWeight: '900',
                                letterSpacing: '1px'
                            }}>
                                {gameMode === 'online' ? '🌐 طور أون لاين' : '📺 طور محلي'}
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? '10px' : '30px', position: 'relative' }}>
                            <div style={{ display: 'inline-block', position: 'relative' }}>
                                <h1 className="logo-title" style={{ fontSize: isMobile ? '2.5rem' : '5.5rem', fontWeight: '900', margin: '0', color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
                                   حروف <span style={{color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,0.4)', letterSpacing: '4px'}}>ZONE</span>
                                </h1>
                                <div style={{ position: 'absolute', top: '-8px', left: '-5px', background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#000', fontSize: '0.6rem', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', letterSpacing: '2px', transform: 'rotate(-12deg)', boxShadow: '0 4px 15px rgba(250,204,21,0.5)' }}>PRO</div>
                            </div>
                            <p style={{ fontSize: isMobile ? '0.85rem' : '1rem', color: '#475569', margin: '10px 0 0 0', fontWeight: '700', letterSpacing: '4px', textTransform: 'uppercase' }}>محطة الإعداد التكتيكي</p>
                            <div style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', margin: '15px auto 0', borderRadius: '2px' }}></div>
                        </div>
                         
                        {/* ── Scrolling Arabic Letters Ticker ── */}
                        {(() => {
                            const letters = 'أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن هـ و ي'.split(' ');
                            const doubled = [...letters, ...letters]; // duplicate for seamless loop
                            return (
                                <div className="letter-ticker-wrap" style={{ marginBottom: isMobile ? '10px' : '20px' }}>
                                    <div className="letter-ticker-inner" dir="ltr">
                                        {doubled.map((l, i) => (
                                            <span key={i}>{l}</span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}


                        <div className="esport-panel">
                            <h3 className="panel-title"><Trophy className="mb-1" size={26} fill="currentColor" /> نظام التنافس والانتصار</h3>
                            <div className="settings-flex" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <button className={`pulse-btn ${victoryCondition === 'path' ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setVictoryCondition('path')}}><Swords className="inline-block" style={{marginLeft: '8px'}} size={20} /> الربط الاستراتيجي (كلاسيكي)</button>
                                <button className={`pulse-btn ${victoryCondition === 'domination' ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setVictoryCondition('domination')}}><Globe className="inline-block" style={{marginLeft: '8px'}} size={20} /> الهيمنة الميدانية (تجميع نقاط)</button>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px 20px', borderRadius: '12px', marginTop: '20px', borderRight: '4px solid #3b82f6' }}>
                                <p style={{color: '#a1a1aa', fontSize: '1rem', margin: 0, fontWeight: '600'}}>
                                    {victoryCondition === 'path' ? 'الهدف: قم ببناء مسار متصل من الإطار المضيء الخاص بفريقك إلى الإطار المقابل لتحقيق ضربة قاضية وانتصار فوري.' : 'الهدف: تستمر المعركة التكتيكية حتى تتم الإجابة على جميع الخلايا، والفريق صاحب الاستحواذ الأكبر والنقاط الأعلى يتوج بطلاً.'}
                                </p>
                            </div>
                        </div>

                        <div className="esport-panel">
                            <h3 className="panel-title"><Users className="mb-1" size={26} /> إدارة المواجهة والمُقدم</h3>
                            <div className="settings-flex" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <button className={`pulse-btn ${hostMode === 'smart' ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setHostMode('smart')}}><Zap className="inline-block" style={{marginLeft: '8px'}} size={20} fill="currentColor" /> مُقدم ذكي (أسئلة مدمجة)</button>
                                <button className={`pulse-btn ${hostMode === 'human' ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setHostMode('human')}}><Users className="inline-block" style={{marginLeft: '8px'}} size={20} /> مُقدم إنسان (أسئلة خارجية)</button>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px 20px', borderRadius: '12px', marginTop: '20px', borderRight: '4px solid #3b82f6' }}>
                                <p style={{color: '#a1a1aa', fontSize: '1rem', margin: 0, fontWeight: '600'}}>
                                    {hostMode === 'smart' ? 'يقوم النظام تلقائياً بسحب وطرح الأسئلة وتوفير التلميحات والأجوبة.' : '👤 المُقدم يتحكم بكل شيء من جواله: الأسئلة، الأجوبة، المؤقت، وتوزيع النقاط. امسح QR Code لربط جهاز المُقدم.'}
                                </p>
                            </div>
                        </div>

                        <div className="esport-panel">
                            <h3 className="panel-title"><Sparkles className="mb-1" size={26} /> خصائص الساحة المتقدمة</h3>
                            <div className="settings-flex" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                {victoryCondition === 'domination' && (
                                    <button className={`pulse-btn ${modes.gold ? 'active' : ''}`} onClick={() => toggleMode('gold')}><Star className="inline-block" style={{marginLeft: '8px'}} size={20} fill={modes.gold ? "currentColor" : "none"} /> الخلايا الذهبية (+2 نقطة)</button>
                                )}
                                <button className={`pulse-btn ${modes.mines ? 'active' : ''}`} onClick={() => toggleMode('mines')}><Bomb className="inline-block" style={{marginLeft: '8px'}} size={20} /> حقل الألغام (تدمير خلية)</button>
                                <button className={`pulse-btn ${modes.virus ? 'active' : ''}`} onClick={() => toggleMode('virus')}><ShieldAlert className="inline-block" style={{marginLeft: '8px'}} size={20} /> فيروس العدوى (احتلال جيران)</button>
                                <button className={`pulse-btn ${modes.blind ? 'active' : ''}`} onClick={() => toggleMode('blind')}><Ghost className="inline-block" style={{marginLeft: '8px'}} size={20} /> الإخفاء التام (مستوى الرواد)</button>
                            </div>
                        </div>

                        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                            <div className="esport-panel">
                                <h3 className="panel-title"><Crosshair className="mb-1" size={26} /> مساحة المعركة</h3>
                                <div className="grid-options" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {[5, 6, 7, 8].map(size => (<button key={size} className={`pulse-btn ${gridSize === size ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setGridSize(size)}} style={{ flex: 1, padding: '16px' }}>{size}x{size}</button>))}
                                </div>
                            </div>
                            
                            <div className="esport-panel">
                                <h3 className="panel-title"><Settings className="mb-1" size={26} /> قوانين الوقت والجولات</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="grid-options" style={{ display: 'flex', gap: '12px' }}>
                                        {[1, 3, 5, 999].map(r => (<button key={r} className={`pulse-btn ${maxRounds === r ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setMaxRounds(r)}} style={{ flex: 1, padding: '12px' }}>{r === 999 ? 'مفتوح' : `${r} جولات`}</button>))}
                                    </div>
                                    <div className="grid-options" style={{ display: 'flex', gap: '12px' }}>
                                        {[15, 30, 45, 60].map(t => (<button key={t} className={`pulse-btn ${timerDuration === t ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setTimerDuration(t)}} style={{ flex: 1, padding: '12px' }}>{t} ثانية</button>))}
                                    </div>
                                </div>
                            </div>

                            <div className="esport-panel" style={{ borderTop: `4px solid ${team1Color}`, boxShadow: `0 15px 40px ${team1Color}15` }}>
                                <h3 className="panel-title" style={{ color: team1Color }}>هوية الفريق الأول</h3>
                                <div className="team-inputs" style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" className="pro-input" placeholder="اسم الفريق..." value={team1Name} onChange={e => setTeam1Name(sanitizeHtml(e.target.value))} style={{ flex: 1 }} />
                                    <input type="color" className="color-picker" value={team1Color} onChange={e => setTeam1Color(e.target.value)} style={{ width: '60px' }} />
                                </div>
                            </div>

                            <div className="esport-panel" style={{ borderTop: `4px solid ${team2Color}`, boxShadow: `0 15px 40px ${team2Color}15` }}>
                                <h3 className="panel-title" style={{ color: team2Color }}>هوية الفريق الثاني</h3>
                                <div className="team-inputs" style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" className="pro-input" placeholder="اسم الفريق..." value={team2Name} onChange={e => setTeam2Name(sanitizeHtml(e.target.value))} style={{ flex: 1 }} />
                                    <input type="color" className="color-picker" value={team2Color} onChange={e => setTeam2Color(e.target.value)} style={{ width: '60px' }} />
                                </div>
                            </div>
                        </div>

                        <div className="esport-panel" style={{ borderTop: '4px solid #fff', marginTop: isMobile ? '0' : '10px' }}>
                            <h3 className="panel-title"><Activity className="mb-1" size={26} /> مستوى الصعوبة</h3>
                            <div className="grid-options" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <button className={`pulse-btn btn-easy ${difficulty === 'easy' ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setDifficulty('easy')}}><div style={{display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', marginLeft: '8px'}} /> سهل</button>
                                <button className={`pulse-btn btn-medium ${difficulty === 'medium' ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setDifficulty('medium')}}><div style={{display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#facc15', marginLeft: '8px'}} /> متوسط</button>
                                <button className={`pulse-btn btn-hard ${difficulty === 'hard' ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setDifficulty('hard')}}><div style={{display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', marginLeft: '8px'}} /> صعب</button>
                                <button className={`pulse-btn btn-mixed ${difficulty === 'mixed' ? 'active' : ''}`} onClick={() => {AudioEngine.play('hover'); setDifficulty('mixed')}} style={{ background: difficulty === 'mixed' ? 'linear-gradient(90deg, #10b981, #facc15, #ef4444)' : '', color: difficulty === 'mixed' ? '#000' : '' }}><Sparkles className="inline-block" style={{marginLeft: '8px'}} size={16} /> متوازن</button>
                            </div>
                        </div>

                        {/* === بانر QR للمُقدم الإنسان (يظهر قبل بدء اللعبة) === */}
                        {hostMode === 'human' && peerId && (
                            <div className="esport-panel" style={{
                                borderTop: '4px solid #facc15',
                                background: 'linear-gradient(135deg, rgba(250,204,21,0.08), rgba(245,158,11,0.03))',
                                boxShadow: '0 0 40px rgba(250,204,21,0.12)',
                                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                                gap: '30px', alignItems: 'center'
                            }}>
                                {/* QR Code */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                    <div style={{ background: '#fff', padding: '18px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'inline-block' }}>
                                        <QRCode value={`${window.location.origin}${window.location.pathname}?remote=${peerId}`} size={isMobile ? 160 : 200} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700' }}>
                                        {remoteConnection ? '✅ متصل' : '⏳ في انتظار اتصال المُقدم...'}
                                    </div>
                                </div>

                                {/* Instructions + Copy Link */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#facc15', fontSize: '1.4rem', fontWeight: '900' }}>
                                            🎙️ ربط جهاز المُقدم
                                        </h3>
                                        <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.7, fontSize: '1rem', fontWeight: '600' }}>
                                            قبل بدء اللعبة، امسح الـ QR Code بجوال المُقدم أو انسخ الرابط وأرسله له.
                                            بعد الاتصال، ابدأ اللعبة وتحكم في كل شيء من الجوال.
                                        </p>
                                    </div>

                                    {/* نسخ الرابط */}
                                    <div
                                        onClick={() => {
                                            const url = `${window.location.origin}${window.location.pathname}?remote=${peerId}`;
                                            navigator.clipboard.writeText(url).then(() => AudioEngine.play('win'));
                                        }}
                                        style={{
                                            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(250,204,21,0.3)',
                                            borderRadius: '12px', padding: '14px 18px', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                        title="انقر للنسخ"
                                        onMouseOver={e => e.currentTarget.style.borderColor = '#facc15'}
                                        onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(250,204,21,0.3)'}
                                    >
                                        <span style={{ fontSize: '1.3rem' }}>📋</span>
                                        <span style={{
                                            color: '#e2e8f0', fontSize: '0.85rem', fontFamily: 'monospace',
                                            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            direction: 'ltr', textAlign: 'left'
                                        }}>
                                            {`${window.location.origin}${window.location.pathname}?remote=${peerId}`}
                                        </span>
                                        <span style={{ color: '#facc15', fontSize: '0.8rem', fontWeight: '900', flexShrink: 0 }}>نسخ</span>
                                    </div>

                                    {remoteConnection && (
                                        <div style={{
                                            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                                            borderRadius: '12px', padding: '12px 18px', color: '#34d399',
                                            fontWeight: '900', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px'
                                        }}>
                                            <span style={{ fontSize: '1.3rem' }}>✅</span>
                                            المُقدم متصل! يمكنك الآن بدء اللعبة.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <button className="launch-btn" style={{marginTop: '10px'}} onClick={() => {AudioEngine.play('win'); setIsGameStarted(true)}}>
                            تهيئة الساحة وبدء المواجهة
                        </button>
                    </div>
                </div>
            ) : (
                <div className="app-container" style={{
                  height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  animation: explodedMine ? 'screenShake 0.5s ease-in-out' : 'none'
                }}>

                    {/* ── Header Scoreboard ── */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(7,0,26,0.95)', borderBottom: '1px solid rgba(124,58,237,0.15)', zIndex: 20 }}>

                        {/* Team 1 */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: team1Color + '12', border: `1px solid ${team1Color}40`, borderRadius: 12, padding: '8px 14px', minWidth: 0 }}>
                            <div style={{ flexShrink: 0 }}>
                                <div style={{ fontSize: 'clamp(1.6rem,4vw,2.8rem)', fontWeight: 900, color: team1Color, lineHeight: 1, textShadow: `0 0 20px ${team1Color}` }}>{team1Score}</div>
                                <div style={{ fontSize: '0.55rem', color: team1Color, opacity: 0.6, letterSpacing: '1.5px', textTransform: 'uppercase' }}>نقطة</div>
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 'clamp(0.8rem,2.5vw,1.1rem)', fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team1Name || 'الفريق الأول'}</div>
                                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                    {Array.from({ length: Math.max(maxRounds === 999 ? 1 : maxRounds, 1) }).map((_, i) => (
                                        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < team1Wins ? team1Color : 'rgba(255,255,255,0.1)', boxShadow: i < team1Wins ? `0 0 6px ${team1Color}` : 'none', transition: '0.3s' }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Center — Round info */}
                        <div style={{ flexShrink: 0, textAlign: 'center', padding: '0 8px' }}>
                            <div style={{ fontSize: 'clamp(0.75rem,2vw,0.95rem)', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                                الجولة {maxRounds === 999 ? currentRound : `${currentRound}/${maxRounds}`}
                            </div>
                            {victoryCondition === 'domination' && (
                                <div style={{ fontSize: '0.6rem', color: '#fbbf24', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginTop: 2 }}>هيمنة</div>
                            )}
                        </div>

                        {/* Team 2 */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse', background: team2Color + '12', border: `1px solid ${team2Color}40`, borderRadius: 12, padding: '8px 14px', minWidth: 0 }}>
                            <div style={{ flexShrink: 0, textAlign: 'left' }}>
                                <div style={{ fontSize: 'clamp(1.6rem,4vw,2.8rem)', fontWeight: 900, color: team2Color, lineHeight: 1, textShadow: `0 0 20px ${team2Color}` }}>{team2Score}</div>
                                <div style={{ fontSize: '0.55rem', color: team2Color, opacity: 0.6, letterSpacing: '1.5px', textTransform: 'uppercase' }}>نقطة</div>
                            </div>
                            <div style={{ minWidth: 0, textAlign: 'right' }}>
                                <div style={{ fontSize: 'clamp(0.8rem,2.5vw,1.1rem)', fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team2Name || 'الفريق الثاني'}</div>
                                <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'flex-end' }}>
                                    {Array.from({ length: Math.max(maxRounds === 999 ? 1 : maxRounds, 1) }).map((_, i) => (
                                        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < team2Wins ? team2Color : 'rgba(255,255,255,0.1)', boxShadow: i < team2Wins ? `0 0 6px ${team2Color}` : 'none', transition: '0.3s' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid Area — fills remaining space, ResizeObserver calculates cellPx */}
                    <div ref={hexWrapRef} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 10, overflow: 'hidden', minHeight: 0, padding: '8px' }}>
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

                        {/* Target line indicators */}
                        {victoryCondition === 'path' && (<>
                          <div style={{position:'absolute',top:-10,left:'5%',right:'5%',height:4,background:team1Color,borderRadius:4,boxShadow:`0 0 16px ${team1Color}`,opacity:0.85}}/>
                          <div style={{position:'absolute',bottom:-10,left:'5%',right:'5%',height:4,background:team1Color,borderRadius:4,boxShadow:`0 0 16px ${team1Color}`,opacity:0.85}}/>
                          <div style={{position:'absolute',left:-10,top:'5%',bottom:'5%',width:4,background:team2Color,borderRadius:4,boxShadow:`0 0 16px ${team2Color}`,opacity:0.85}}/>
                          <div style={{position:'absolute',right:-10,top:'5%',bottom:'5%',width:4,background:team2Color,borderRadius:4,boxShadow:`0 0 16px ${team2Color}`,opacity:0.85}}/>
                        </>)}

                        {gridRows.map((row, rowIndex) => {
                          const gap = Math.max(2, Math.round(cellPx * 0.06));
                          const hexH = Math.round(cellPx * 1.1547);
                          const offset = (cellPx + gap) / 2;
                          const marginTop = rowIndex > 0 ? -(hexH * 0.25) : 0;
                          const translateX = rowIndex % 2 === 0 ? -offset / 2 : offset / 2;
                          return (
                            <div key={rowIndex} style={{ display: 'flex', gap, marginTop, transform: `translateX(${translateX}px)` }}>
                            {row.map((cellIndex) => {
                                const style = getHexStyle(cells[cellIndex], cellIndex);
                                const isBomb = cells[cellIndex] === 3;
                                const displayLetter = (modes.blind && cells[cellIndex] === 0) ? '' : (isBomb ? <Bomb size={cellPx * 0.4} color="#ff0000" strokeWidth={2.5} style={{filter:'drop-shadow(0 0 8px red)'}} /> : letters[cellIndex]);
                                const border = Math.max(2, Math.round(cellPx * 0.04));
                                return (
                                <motion.div key={cellIndex} className="hex-cell" onClick={() => handleCellClick(cellIndex)} onMouseEnter={() => AudioEngine.play('hover')}
                                    initial={{ opacity: 0, scale: 0.3 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.35, type: 'spring', bounce: 0.35, delay: (Math.floor(cellIndex / gridSize) + (cellIndex % gridSize)) * 0.03 }}
                                    style={{
                                        width: cellPx, height: hexH,
                                        background: style.border,
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        boxShadow: style.shadow, zIndex: style.zIndex, flexShrink: 0
                                    }}>
                                    <div style={{
                                        width: cellPx - border * 2, height: hexH - border * 2,
                                        background: style.bg,
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontSize: cellPx * 0.42, color: style.color,
                                        fontWeight: '900', userSelect: 'none', textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                                        lineHeight: 1
                                    }}>
                                    {displayLetter}
                                    </div>
                                </motion.div>
                                );
                            })}
                            </div>
                          );
                        })}
                        </div>
                    </div>

                    {/* ── Footer Controls Bar ── */}
                    <div style={{ flexShrink: 0, padding: '8px 12px 10px', background: 'rgba(7,0,26,0.95)', borderTop: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 9000 }}>
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => { AudioEngine.play('click'); setCells(Array(gridSize*gridSize).fill(0)); setTeam1Score(0); setTeam2Score(0); }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '8px 14px', borderRadius: 10, fontFamily: 'inherit', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap' }}>تصفير</button>
                            <button onClick={resetFullGame} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '8px 14px', borderRadius: 10, fontFamily: 'inherit', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: '0.2s', whiteSpace: 'nowrap' }}>العودة</button>
                        </div>

                        {/* Control bar */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{ color: team1Color, fontWeight: 900, fontSize: '0.85rem', flexShrink: 0 }}>{t1ControlPercent}%</span>
                            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', display: 'flex', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                                <div style={{ width: `${t1ControlPercent}%`, background: team1Color, transition: 'width 0.6s ease', boxShadow: `0 0 8px ${team1Color}` }} />
                                <div style={{ width: `${t2ControlPercent}%`, background: team2Color, transition: 'width 0.6s ease', marginLeft: 'auto', boxShadow: `0 0 8px ${team2Color}` }} />
                            </div>
                            <span style={{ color: team2Color, fontWeight: 900, fontSize: '0.85rem', flexShrink: 0 }}>{t2ControlPercent}%</span>
                        </div>

                        {/* Remaining */}
                        <div style={{ flexShrink: 0, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '6px 12px', textAlign: 'center', minWidth: 56 }}>
                            <div style={{ color: '#c084fc', fontSize: '1.2rem', fontWeight: 900, lineHeight: 1 }}>{emptyCellsCount}</div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.58rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>متبقية</div>
                        </div>
                    </div>

                    {/* Question Modal — compact & fully responsive */}
                    {activeCell !== null && !roundWinner && !matchWinner && !explodedMine && (() => {
                        const _crit = timeLeft <= 10;
                        const _r = 42, _circ = 2 * Math.PI * _r;
                        const _clr = _crit ? '#ef4444' : '#7c3aed';
                        const _pct = timeLeft / timerDuration;
                        return (
                        <div style={{ position:'fixed', inset:0, background:'rgba(4,0,16,0.97)', backdropFilter:'blur(24px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:10, overflowY:'auto' }}>
                            <div style={{ background:'rgba(10,2,28,0.99)', border:'1px solid rgba(124,58,237,0.32)', borderRadius:18, width:'100%', maxWidth:600, padding:'clamp(14px,4vw,24px)', display:'flex', flexDirection:'column', gap:11, boxShadow:'0 0 70px rgba(124,58,237,0.2),0 25px 70px rgba(0,0,0,0.9)', animation:'popIn 0.32s cubic-bezier(0.175,0.885,0.32,1.275)', maxHeight:'94dvh', overflowY:'auto' }}>

                                {/* Row 1: Letter + badges + timer */}
                                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                                    <div style={{ background:'rgba(124,58,237,0.16)', border:'1px solid rgba(124,58,237,0.42)', borderRadius:11, padding:'8px 16px', fontSize:'clamp(1.4rem,5vw,2.2rem)', fontWeight:900, color:'#c084fc', letterSpacing:3, textShadow:'0 0 18px rgba(124,58,237,0.8)', flexShrink:0 }}>
                                        {letters[activeCell]}
                                    </div>
                                    {goldenCells.includes(activeCell) && <span style={{ background:'rgba(234,179,8,0.14)', border:'1px solid rgba(234,179,8,0.48)', color:'#fef08a', padding:'4px 11px', borderRadius:18, fontSize:'0.78rem', fontWeight:900 }}>✨ ذهبية ×2</span>}
                                    {virusCells.includes(activeCell) && <span style={{ background:'rgba(168,85,247,0.14)', border:'1px solid rgba(168,85,247,0.48)', color:'#e9d5ff', padding:'4px 11px', borderRadius:18, fontSize:'0.78rem', fontWeight:900 }}>🦠 فيروس</span>}
                                    {silencedTeam !== null && <span style={{ background:'rgba(239,68,68,0.14)', border:'1px solid #ef4444', color:'#f87171', padding:'4px 11px', borderRadius:18, fontSize:'0.75rem', fontWeight:900, animation:'alertPulse 1s infinite' }}>🤫 تسكيت {silencedTimer}ث</span>}
                                    {/* Timer ring */}
                                    <div style={{ marginRight:'auto', cursor:'pointer', flexShrink:0 }} onClick={() => { AudioEngine.play('click'); setIsTimerRunning(p => !p); }} className={_crit ? 'timer-ring-critical' : ''}>
                                        <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                                            <svg width={84} height={84} style={{ transform:'rotate(-90deg)' }}>
                                                <circle cx={42} cy={42} r={_r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5}/>
                                                <circle cx={42} cy={42} r={_r} fill="none" stroke={_clr} strokeWidth={5}
                                                    strokeDasharray={_circ.toFixed(1)}
                                                    strokeDashoffset={(_circ*(1-_pct)).toFixed(1)}
                                                    strokeLinecap="round"
                                                    style={{ transition:'stroke-dashoffset 1s linear,stroke 0.4s', filter:'drop-shadow(0 0 7px '+_clr+')' }}/>
                                            </svg>
                                            <div style={{ position:'absolute', textAlign:'center' }}>
                                                <div style={{ fontSize:'1.15rem', fontWeight:900, fontFamily:'monospace', color:_clr, lineHeight:1 }}>{String(timeLeft).padStart(2,'0')}</div>
                                                <div style={{ fontSize:'0.45rem', color:'rgba(255,255,255,0.28)', letterSpacing:'1px', textTransform:'uppercase' }}>{isTimerRunning?'إيقاف':'تشغيل'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Question text */}
                                {currentQuestion && (
                                    isQuestionHidden ? (
                                        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:11, padding:'13px 16px', textAlign:'center' }}>
                                            <div style={{ fontSize:'1.5rem', letterSpacing:7, color:'rgba(255,255,255,0.1)', filter:'blur(3px)', userSelect:'none' }}>{'█'.repeat(Math.min(currentQuestion.length,22))}</div>
                                            <div style={{ fontSize:'0.64rem', color:'rgba(255,255,255,0.2)', marginTop:7, letterSpacing:'2px', textTransform:'uppercase' }}>السؤال مخفي</div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize:'clamp(1rem,3vw,1.55rem)', color:'#f1f5f9', lineHeight:1.58, fontWeight:800, textAlign:'center' }}>
                                            {currentQuestion}
                                        </div>
                                    )
                                )}

                                {/* Answer */}
                                {currentAnswer && (
                                    !isAnswerRevealed ? (
                                        <button onClick={() => { AudioEngine.play('click'); setIsAnswerRevealed(true); }}
                                            style={{ width:'100%', padding:'11px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.11)', color:'rgba(255,255,255,0.6)', borderRadius:11, fontFamily:'inherit', fontWeight:900, fontSize:'0.9rem', cursor:'pointer', transition:'0.2s' }}
                                            onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                                            onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                                            👁 {hostMode==='smart'?'كشف الإجابة (Space)':'كشف الإجابة للجمهور'}
                                        </button>
                                    ) : (
                                        <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(99,102,241,0.14))', border:'1px solid rgba(124,58,237,0.38)', borderRadius:11, padding:'11px 16px', textAlign:'center', fontSize:'clamp(1.1rem,4vw,1.85rem)', fontWeight:900, color:'#c084fc', letterSpacing:1, animation:'slideUp 0.28s ease-out', boxShadow:'0 0 22px rgba(124,58,237,0.14)' }}>
                                            {currentAnswer}
                                        </div>
                                    )
                                )}

                                {/* AI assist panel */}
                                {(aiAssistState.isProcessing || aiAssistState.active) && (
                                    <div style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.33)', borderRadius:11, padding:'11px 14px' }}>
                                        <div style={{ color:'#60a5fa', fontWeight:900, fontSize:'0.7rem', letterSpacing:'2px', marginBottom:5 }}>HUROOF AI</div>
                                        {aiAssistState.isProcessing && <div style={{ color:'#34d399', fontFamily:'monospace', fontSize:'0.82rem' }}>{aiAssistState.log}<span style={{ animation:'alertPulse 0.8s infinite' }}>_</span></div>}
                                        {aiAssistState.active && <div style={{ color:'#fbbf24', fontSize:'clamp(0.95rem,3vw,1.65rem)', fontWeight:900, letterSpacing:5, textAlign:'center' }}>{aiAssistState.hint}</div>}
                                    </div>
                                )}

                                {/* Action buttons */}
                                {isOnlineGuest ? (
                                    <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                                        <button onClick={() => { AudioEngine.play('correct'); sendGuestAction({type:'ONLINE_CORRECT'}); }} style={{ flex:1, minWidth:100, padding:'12px', background:team2Color, color:'#fff', border:'none', borderRadius:11, fontFamily:'inherit', fontWeight:900, fontSize:'0.9rem', cursor:'pointer' }}>✔ صحيحة</button>
                                        <button onClick={() => { AudioEngine.play('wrong'); sendGuestAction({type:'ONLINE_WRONG'}); }} style={{ flex:1, minWidth:85, padding:'12px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.38)', color:'#f87171', borderRadius:11, fontFamily:'inherit', fontWeight:900, fontSize:'0.9rem', cursor:'pointer' }}>✗ خاطئة</button>
                                        <button onClick={() => { AudioEngine.play('click'); sendGuestAction({type:'ONLINE_SKIP'}); }} style={{ flex:1, minWidth:72, padding:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(255,255,255,0.33)', borderRadius:11, fontFamily:'inherit', fontWeight:900, fontSize:'0.9rem', cursor:'pointer' }}>⏭</button>
                                    </div>
                                ) : hostMode === 'smart' ? (
                                    <>
                                        {/* Lifelines */}
                                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                                            {[[1,team1Color,'ai_assist','🧠 ذكاء',team1Lifelines.ai_assist],[1,team1Color,'silence','🔇 تسكيت',team1Lifelines.silence],[1,team1Color,'changeQ','🔄 استبدال',team1Lifelines.changeQ],[2,team2Color,'changeQ','🔄 استبدال',team2Lifelines.changeQ],[2,team2Color,'silence','🔇 تسكيت',team2Lifelines.silence],[2,team2Color,'ai_assist','🧠 ذكاء',team2Lifelines.ai_assist]].map(([team,color,type,label,avail],i) => (
                                                <button key={i} disabled={!avail} onClick={() => useLifeline(team,type)}
                                                    style={{ flex:'1 1 auto', minWidth:62, padding:'6px 7px', borderRadius:8, fontFamily:'inherit', fontWeight:800, fontSize:'0.68rem', cursor:avail?'pointer':'not-allowed', border:'1px solid '+(avail?color+'48':'rgba(255,255,255,0.06)'), background:avail?color+'10':'rgba(255,255,255,0.02)', color:avail?color:'rgba(255,255,255,0.16)', opacity:avail?1:0.4, transition:'0.2s', textAlign:'center', lineHeight:1.3 }}>
                                                    {label}<br/><span style={{ fontSize:'0.56rem', opacity:0.65 }}>{team===1?(team1Name||'ف1'):(team2Name||'ف2')}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {/* Score buttons */}
                                        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                                            <button onClick={() => handleAnswer(1)} style={{ flex:'1 1 110px', padding:'12px', background:team1Color, color:'#fff', border:'none', borderRadius:11, fontFamily:'inherit', fontWeight:900, fontSize:'clamp(0.8rem,2.5vw,0.95rem)', cursor:'pointer', boxShadow:'0 5px 16px '+team1Color+'55' }}>✔ {team1Name||'الفريق الأول'}</button>
                                            <button onClick={() => handleAnswer(2)} style={{ flex:'1 1 110px', padding:'12px', background:team2Color, color:'#fff', border:'none', borderRadius:11, fontFamily:'inherit', fontWeight:900, fontSize:'clamp(0.8rem,2.5vw,0.95rem)', cursor:'pointer', boxShadow:'0 5px 16px '+team2Color+'55' }}>✔ {team2Name||'الفريق الثاني'}</button>
                                            <button onClick={() => { AudioEngine.play('wrong'); setActiveCell(null); }} style={{ flex:'1 1 74px', padding:'12px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.34)', color:'#f87171', borderRadius:11, fontFamily:'inherit', fontWeight:900, fontSize:'0.88rem', cursor:'pointer' }}>✗ خاطئة</button>
                                            <button onClick={() => { AudioEngine.play('click'); setActiveCell(null); }} style={{ flex:'1 1 64px', padding:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.3)', borderRadius:11, fontFamily:'inherit', fontWeight:900, fontSize:'0.88rem', cursor:'pointer' }}>⏭</button>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign:'center', cursor:'pointer' }} onClick={() => { AudioEngine.play('click'); setIsTimerRunning(p=>!p); }}>
                                        <div style={{ fontSize:'clamp(2.6rem,10vw,5rem)', fontWeight:900, color:_crit?'#ef4444':'#fff', fontFamily:'monospace', animation:_crit?'alertPulse 0.8s infinite':'none' }}>
                                            {String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}
                                        </div>
                                        <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, marginTop:10, overflow:'hidden' }}>
                                            <div style={{ height:'100%', width:(_pct*100)+'%', background:_crit?'#ef4444':'#7c3aed', transition:'width 1s linear', borderRadius:3 }}/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })()}

                                        {/* Explosions */}
                    {explodedMine && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(239,68,68,0.9) 0%, rgba(10,0,0,1) 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(40px)' }}>
                        <div style={{ fontSize: '12rem', textShadow: '0 0 150px red', fontWeight: '900', color: 'white', animation: 'alertPulse 0.2s infinite' }}>💥 كـارثـة! 💥</div>
                        </div>
                    )}

                    {/* Winner Modals */}
                    {roundWinner && !matchWinner && (
                        <div className="anim-cinematic" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, flexDirection: 'column', backdropFilter: 'blur(20px)' }}>
                        {showConfetti && Array.from({ length: 80 }).map((_, i) => (
                            <div key={i} className="confetti" style={{ left: `${Math.random() * 100}vw`, backgroundColor: [team1Color, team2Color, '#fff'][Math.floor(Math.random() * 3)], animationDelay: `${Math.random() * 1}s` }} />
                        ))}
                        <div className="glass-panel anim-pop-in" style={{ textAlign: 'center', padding: '80px 140px', borderTop: `10px solid ${roundWinner === 'tie' ? '#a1a1aa' : (roundWinner === 1 ? team1Color : team2Color)}`, boxShadow: `0 40px 100px ${roundWinner === 'tie' ? '#a1a1aa' : (roundWinner === 1 ? team1Color : team2Color)}44` }}>
                            {roundWinner === 'tie' ? (
                                <>
                                    <h2 style={{ fontSize: '2.5rem', margin: '0 0 20px 0', fontWeight: '800', color: 'var(--text-secondary)' }}>نهاية الجولة</h2>
                                    <div style={{ fontSize: '6rem', fontWeight: '900', color: '#fff', marginBottom: '50px' }}>تعادل! 🤝</div>
                                    <p style={{ color: '#a1a1aa', fontSize: '1.2rem', marginBottom: '30px' }}>لم يتمكن أي فريق من حسم المعركة أو التفوق بالنقاط.</p>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ fontSize: '2.5rem', margin: '0 0 20px 0', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '2px' }}>تم حسم الجولة</h2>
                                    <div style={{ fontSize: '6rem', fontWeight: '900', color: roundWinner === 1 ? team1Color : team2Color, marginBottom: '50px', textShadow: `0 0 40px ${roundWinner === 1 ? team1Color : team2Color}aa` }}>
                                        {roundWinner === 1 ? (team1Name || 'الفريق الأول') : (team2Name || 'الفريق الثاني')}
                                    </div>
                                </>
                            )}
                            <button className="hero-btn" onClick={nextRound} style={{ width: 'auto', padding: '20px 80px', fontSize: '1.8rem' }}>
                                {currentRound < maxRounds || roundWinner === 'tie' ? 'بدء الجولة التالية' : 'عرض النتيجة النهائية'}
                            </button>
                        </div>
                        </div>
                    )}

                    {matchWinner && (
                        <div className="anim-cinematic" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, flexDirection: 'column' }}>
                        {showConfetti && Array.from({ length: 200 }).map((_, i) => (
                        <div key={i} className="confetti" style={{ left: `${Math.random() * 100}vw`, backgroundColor: ['#ffd700', '#ffea00', '#fff'][Math.floor(Math.random() * 3)], animationDuration: `${Math.random() * 2 + 2}s`, animationDelay: `${Math.random() * 1.5}s` }} />
                        ))}
                        <div className="glass-panel anim-pop-in" style={{ textAlign: 'center', padding: '100px 160px', border: '2px solid rgba(250, 204, 21, 0.5)', background: 'radial-gradient(circle at center, rgba(250, 204, 21, 0.15) 0%, transparent 80%)', boxShadow: '0 0 120px rgba(250, 204, 21, 0.25)' }}>
                            <div style={{ fontSize: '7rem', marginBottom: '25px', filter: 'drop-shadow(0 0 30px rgba(250,204,21,0.6))' }}>🏆</div>
                            <h1 style={{ fontSize: '3rem', margin: '0 0 15px 0', color: 'var(--text-secondary)', letterSpacing: '3px' }}>بطل التحدي</h1>
                            <div style={{ fontSize: '8rem', fontWeight: '900', color: '#facc15', marginBottom: '50px', textShadow: '0 0 60px rgba(250, 204, 21, 0.8)' }}>
                                {matchWinner === 1 ? (team1Name || 'الفريق الأول') : (team2Name || 'الفريق الثاني')}
                            </div>
                            <button className="pulse-btn" onClick={resetFullGame} style={{ fontSize: '1.5rem', padding: '20px 60px' }}>العودة للمحطة الرئيسية</button>
                        </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* إعلان اليسار (AdSense) */}
        <div className="ad-sidebar">
            <AdSenseWidget adSlot="2222222222" />
        </div>

    </div>
  );
};

export default App;