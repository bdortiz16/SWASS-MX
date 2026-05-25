/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, RotateCcw, Volume2, VolumeX, Sparkles, Award, 
  Flame, Trophy, Heart, Shield, Sparkle, Zap, Target, ArrowRight,
  Tv, Eye, Check, HelpCircle
} from 'lucide-react';

// Game Configurations
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 420;
const GRAVITY = 0.5;
const GROUND_Y = 360;

// Types
interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isParryable?: boolean; // Magenta/Pink objects in Cuphead
  type: 'cactus-needle' | 'boss-coin' | 'boss-invoices' | 'boss-spike' | 'ex-pea';
  isBoss: boolean;
  angle?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'smoke' | 'sparkle' | 'parry-burst' | 'hit-puff';
}

interface BossPhase {
  name: string;
  maxHp: number;
  color: string;
  spriteEmoji: string;
  subtitle: string;
  quoteOnDeath: string;
}

export default function CactusAdventureGame() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover' | 'victory'>('intro');
  const [playScore, setPlayScore] = useState<number>(0);
  const [currentHp, setCurrentHp] = useState<number>(3); // 3 HP Cuphead limit
  const [superMeter, setSuperMeter] = useState<number>(0); // 0 to 5 cards (100 total)
  const [bossHp, setBossHp] = useState<number>(1000);
  const [bossMaxHp] = useState<number>(1000);
  const [bossPhaseIndex, setBossPhaseIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'regular' | 'expert'>('regular');
  
  // Game Feedback Text (e.g. "KNOCKOUT!", "READY? WALLOP!")
  const [announcerText, setAnnouncerText] = useState<string>('');
  const [animatingAnnouncer, setAnimatingAnnouncer] = useState<boolean>(false);
  const [floatingIndicator, setFloatingIndicator] = useState<{ text: string; color: string } | null>(null);

  const triggerFloatIndicator = (text: string, color: string) => {
    setFloatingIndicator({ text, color });
    setTimeout(() => setFloatingIndicator(null), 1200);
  };

  // Keyboard references for game loop keys
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Cuphead vintage film vintage filter configuration
  const [sepiaTone, setSepiaTone] = useState<number>(20);
  const [jitterActive, setJitterActive] = useState<boolean>(true);

  // Boss Phase settings matching Spanish FinTech villains
  const bossPhases: BossPhase[] = [
    {
      name: "Barón del Contracargo",
      maxHp: 350,
      color: "#EA580C",
      spriteEmoji: "📥",
      subtitle: "Fase 1: El Fraude Tradicional",
      quoteOnDeath: "¡Tus disputas bancarias morirán antes de llegar a la conciliación!"
    },
    {
      name: "Don Comisión Tarjeta",
      maxHp: 350,
      color: "#9333EA",
      spriteEmoji: "💳",
      subtitle: "Fase 2: El Pulpo del 4.5% Intermediario",
      quoteOnDeath: "¡Un porcentaje por aquí, una comisión mensual por allá, y tu dinero desaparecerá jajaja!"
    },
    {
      name: "Gran Dragón SPEI Obsoleto",
      maxHp: 300,
      color: "#DC2626",
      spriteEmoji: "🐉",
      subtitle: "Fase Final: El Servidor SPEI Caído",
      quoteOnDeath: "¡Sistemas caídos permanentemente y SPEIs en standby! ¡No tienes adquirencia local de SWASS!"
    }
  ];

  // Game variable references optimized for high frame-rate canvas loops
  const playerRef = useRef({
    x: 150,
    y: GROUND_Y - 40,
    vX: 0,
    vY: 0,
    width: 38,
    height: 52,
    isGrounded: true,
    facingRight: true,
    invulnerableFrames: 0,
    parryCooldown: 0,
    dashCooldown: 0,
    isDashing: 0, // frame counter
    shootCooldown: 0,
    bouncyState: 0 // animation cycle
  });

  const bossRef = useRef({
    x: 620,
    y: GROUND_Y - 140,
    width: 110,
    height: 140,
    actionTimer: 0,
    actionState: 'idle' as 'idle' | 'charging' | 'jumping' | 'spitting',
    spriteSlide: 0,
    floatDir: 1,
    floatY: 0
  });

  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);
  const superMeterRef = useRef<number>(0);

  // Handle Play vintage sounds via synthesizers
  const initAudio = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      }
    } catch (e) {
      console.warn("AudioContext initialization bypassed:", e);
    }
  };

  const playRetroSound = (type: 'shoot' | 'ex-fire' | 'parry' | 'jump' | 'hit' | 'knockout' | 'jazz-loop' | 'dash' | 'boss-shoot') => {
    if (!soundEnabled || isMuted) return;
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'shoot') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      } else if (type === 'ex-fire') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.18);
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      } else if (type === 'parry') {
        // High pitched ring + classic retro ping chord
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.42);
      } else if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'dash') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'hit') {
        // Harsh industrial buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.28);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'boss-shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.21);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.21);
      } else if (type === 'knockout') {
        // Grand brass fanfare simulated via layered wave synthesis (Cuphead Knockout brass vibe)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.35); // C6
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.82);
      } else if (type === 'jazz-loop') {
        // Ambient background jazz syncopation simulation
        const playRagtimeBar = (beats: number) => {
          if (!isPlayingRef.current) return;
          const rootFreq = 261.63; // C4
          const notes = [1, 1.25, 1.5, 1.66, 1.87, 2]; // Major scale multiples
          
          for (let i = 0; i < beats; i++) {
            const timeOffset = i * 0.22;
            const oscBeat = ctx.createOscillator();
            const gainBeat = ctx.createGain();
            oscBeat.type = 'triangle';
            oscBeat.frequency.setValueAtTime(rootFreq * notes[Math.floor(Math.random() * notes.length)], ctx.currentTime + timeOffset);
            gainBeat.gain.setValueAtTime(0.015, ctx.currentTime + timeOffset);
            gainBeat.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + timeOffset + 0.18);
            
            oscBeat.connect(gainBeat);
            gainBeat.connect(ctx.destination);
            oscBeat.start(ctx.currentTime + timeOffset);
            oscBeat.stop(ctx.currentTime + timeOffset + 0.2);
          }
        };
        playRagtimeBar(16);
      }
    } catch (_) {}
  };

  // Set up game announcements with vintage rubber hose presentation styles
  const triggerAnnouncer = (text: string, durationMs: number = 2000) => {
    setAnnouncerText(text);
    setAnimatingAnnouncer(true);
    setTimeout(() => {
      setAnimatingAnnouncer(false);
    }, durationMs);
  };

  // Start continuous backing Jazz bass theme simulation
  useEffect(() => {
    const jazzThemeTimer = setInterval(() => {
      if (gameState === 'playing') {
        playRetroSound('jazz-loop');
      }
    }, 4000);

    return () => clearInterval(jazzThemeTimer);
  }, [gameState, soundEnabled, isMuted]);

  // Handle keyboard listener bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const lockKeys = [
        'space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
        'w', 's', 'a', 'd', 'x', 'k', 'v', 'j', ' ', 'shift'
      ];
      const keyLower = e.key ? e.key.toLowerCase() : '';
      const codeLower = e.code ? e.code.toLowerCase() : '';

      if (gameState === 'playing') {
        if (
          lockKeys.includes(keyLower) || 
          lockKeys.includes(codeLower) || 
          e.key === ' '
        ) {
          e.preventDefault();
        }
      }

      // Register multiple key forms for bulletproof cross-browser compatibility
      if (e.code) {
        keysPressed.current[e.code] = true;
        keysPressed.current[e.code.toLowerCase()] = true;
      }
      if (e.key) {
        keysPressed.current[e.key] = true;
        keysPressed.current[keyLower] = true;
      }

      // Quick key shortcuts
      if (keyLower === 'v' || codeLower === 'keyv') {
        // EX Ultimate Special trigger
        executeSpecialEx();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyLower = e.key ? e.key.toLowerCase() : '';
      if (e.code) {
        keysPressed.current[e.code] = false;
        keysPressed.current[e.code.toLowerCase()] = false;
      }
      if (e.key) {
        keysPressed.current[e.key] = false;
        keysPressed.current[keyLower] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Spawn visual particle clouds
  const spawnExplosionParticles = (x: number, y: number, color: string, count: number, type: Particle['type'] = 'sparkle') => {
    const fresh: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      fresh.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'smoke' ? 1.5 : 0),
        radius: Math.random() * 4.5 + (type === 'smoke' ? 4 : 1.5),
        color,
        life: 0,
        maxLife: Math.random() * 20 + 15,
        type
      });
    }
    particlesRef.current = [...particlesRef.current, ...fresh];
  };

  // Super/EX Meter Charging Helper
  const chargeSuper = (amount: number) => {
    superMeterRef.current = Math.min(100, superMeterRef.current + amount);
    setSuperMeter(superMeterRef.current);
  };

  // Cuphead EX Special logic (Big piercing golden thistle explosion)
  const executeSpecialEx = () => {
    if (gameState !== 'playing' || superMeterRef.current < 20) return;
    
    // Spend 1 tier card of meter
    superMeterRef.current = Math.max(0, superMeterRef.current - 20);
    setSuperMeter(superMeterRef.current);
    playRetroSound('ex-fire');

    const py = playerRef.current.y + playerRef.current.height / 2;
    const px = playerRef.current.facingRight 
      ? playerRef.current.x + playerRef.current.width + 10 
      : playerRef.current.x - 10;
    
    const vx = playerRef.current.facingRight ? 11 : -11;

    // Launch heavy special piercing projectile
    projectilesRef.current.push({
      x: px,
      y: py,
      vx,
      vy: 0,
      radius: 18,
      color: "#FACC15",
      type: 'ex-pea',
      isBoss: false
    });

    spawnExplosionParticles(px, py, '#FACC15', 12, 'sparkle');
    triggerAnnouncer("🌟 ¡EX SUPER DISPARO! 🌟", 800);
  };

  // Bullet spitting triggers
  const executeNormalShoot = () => {
    const py = playerRef.current.y + playerRef.current.height / 3 + 4;
    const px = playerRef.current.facingRight 
      ? playerRef.current.x + playerRef.current.width 
      : playerRef.current.x;
    
    const vx = playerRef.current.facingRight ? 9.5 : -9.5;

    projectilesRef.current.push({
      x: px,
      y: py,
      vx,
      vy: (Math.random() - 0.5) * 0.5, // Tiny vintage jitter
      radius: 5,
      color: '#10B981', // Emerald thistle spit
      type: 'cactus-needle',
      isBoss: false
    });

    playRetroSound('shoot');
    // Spawn tiny muzzle flash sparkles
    spawnExplosionParticles(px, py, '#34D399', 3, 'sparkle');
  };

  // Retro collision math helper (Circular checks)
  const checkCollidesCircle = (cx1: number, cy1: number, r1: number, cx2: number, cy2: number, r2: number) => {
    const distSq = (cx1 - cx2) * (cx1 - cx2) + (cy1 - cy2) * (cy1 - cy2);
    return distSq < (r1 + r2) * (r1 + r2);
  };

  // Rect vs Circular hitbox overlap check
  const checkCollidesRectCircle = (rx: number, ry: number, rw: number, rh: number, cx: number, cy: number, cr: number) => {
    // Temp variables to hold nearest rect point coordinates
    let testX = cx;
    let testY = cy;

    if (cx < rx) testX = rx;      // test left edge
    else if (cx > rx + rw) testX = rx + rw; // right edge
    
    if (cy < ry) testY = ry;      // top edge
    else if (cy > ry + rh) testY = ry + rh; // bottom edge

    const distX = cx - testX;
    const distY = cy - testY;
    const distanceSq = (distX * distX) + (distY * distY);

    return distanceSq <= (cr * cr);
  };

  // Robust, cross-browser safe rounded rectangle drawing function (prevents Canvas roundRect crashes)
  const drawRoundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  };

  // Player hit logic
  const damagePlayer = () => {
    if (playerRef.current.invulnerableFrames > 0 || playerRef.current.isDashing > 0) return;

    setCurrentHp((prev) => {
      const next = prev - 1;
      playRetroSound('hit');
      spawnExplosionParticles(playerRef.current.x + 20, playerRef.current.y + 25, '#EF4444', 20, 'hit-puff');
      
      // Flash / Recoil
      playerRef.current.invulnerableFrames = 75; // ~1.2 seconds invulnerability
      playerRef.current.vX = playerRef.current.facingRight ? -7 : 7;
      playerRef.current.vY = -4;

      if (next <= 0) {
        setGameState('gameover');
        isPlayingRef.current = false;
        playRetroSound('hit');
        triggerAnnouncer("YOU DIED!", 3000);
      } else {
        triggerAnnouncer("¡Cuidado!", 600);
      }
      return next;
    });
  };

  // Execute gameplay start Wallop sequence
  const startMatch = () => {
    initAudio();
    // Warm reset coordinates
    playerRef.current = {
      x: 150,
      y: GROUND_Y - 52,
      vX: 0,
      vY: 0,
      width: 38,
      height: 52,
      isGrounded: true,
      facingRight: true,
      invulnerableFrames: 0,
      parryCooldown: 0,
      dashCooldown: 0,
      isDashing: 0,
      shootCooldown: 0,
      bouncyState: 0
    };

    bossRef.current = {
      x: 620,
      y: GROUND_Y - 140,
      width: 115,
      height: 140,
      actionTimer: 0,
      actionState: 'idle',
      spriteSlide: 0,
      floatDir: 1,
      floatY: 0
    };

    projectilesRef.current = [];
    particlesRef.current = [];
    keysPressed.current = {};
    scoreRef.current = 0;
    setPlayScore(0);
    setBossHp(1000);
    setBossPhaseIndex(0);
    setCurrentHp(3);
    superMeterRef.current = 15; // Give initial super credit booster
    setSuperMeter(15);
    
    setGameState('playing');
    isPlayingRef.current = true;
    
    playRetroSound('knockout');
    triggerAnnouncer("A ¡W A L L O P!", 2200);

    // Initial cinematic jitter
    setJitterActive(true);

    // Grab focus immediately inside sandboxed iframes
    setTimeout(() => {
      try {
        window.focus();
        const canvas = document.getElementById('cuphead-cactus-canvas');
        if (canvas) {
          (canvas as HTMLCanvasElement).focus();
        }
      } catch (e) {
        console.warn("Could not focus canvas automatically:", e);
      }
    }, 80);
  };

  // Main high speed animation loop inside canvas
  useEffect(() => {
    let animationFrameId: number;
    let localFrameCounter = 0;

    const gameLoop = () => {
      if (!isPlayingRef.current) return;
      localFrameCounter++;
      const time = localFrameCounter;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // Calculate boss difficulty configurations in real time
      const difficultyFactor = selectedDifficulty === 'expert' ? 1.4 : 1.0;

      // 1. UPDATE PLAYER PHYSICS
      const p = playerRef.current;
      p.bouncyState += 0.15; // animated rubber hose legs factor

      // Reduce invulnerabilities & cooldowns
      if (p.invulnerableFrames > 0) p.invulnerableFrames--;
      if (p.parryCooldown > 0) p.parryCooldown--;
      if (p.dashCooldown > 0) p.dashCooldown--;
      if (p.isDashing > 0) p.isDashing--;
      if (p.shootCooldown > 0) p.shootCooldown--;

      // Handle running side velocities
      let appliedSpeed = 4.2;
      if (p.isDashing > 0) {
        appliedSpeed = 11.5; // High speed dash burst
      }

      const isLeft = 
        keysPressed.current['ArrowLeft'] || 
        keysPressed.current['arrowleft'] || 
        keysPressed.current['a'] || 
        keysPressed.current['keya'];
        
      const isRight = 
        keysPressed.current['ArrowRight'] || 
        keysPressed.current['arrowright'] || 
        keysPressed.current['d'] || 
        keysPressed.current['keyd'];

      if (isLeft) {
        p.vX = -appliedSpeed;
        p.facingRight = false;
      } else if (isRight) {
        p.vX = appliedSpeed;
        p.facingRight = true;
      } else {
        // Apply heavy friction deceleration
        p.vX *= 0.72;
      }

      // Handle jumping actions
      const requestJump = 
        keysPressed.current['Space'] || 
        keysPressed.current['space'] || 
        keysPressed.current[' '] || 
        keysPressed.current['w'] || 
        keysPressed.current['keyw'] || 
        keysPressed.current['ArrowUp'] || 
        keysPressed.current['arrowup'];
      if (requestJump && p.isGrounded && p.isDashing === 0) {
        p.vY = -12.5;
        p.isGrounded = false;
        playRetroSound('jump');
        spawnExplosionParticles(p.x + p.width/2, GROUND_Y, 'rgba(255, 255, 255, 0.45)', 6, 'smoke');
      }

      // Mid-Air PARRY check (Slapping magenta items in Cuphead style!)
      const requestParry = 
        (keysPressed.current['Space'] || keysPressed.current['space'] || keysPressed.current[' ']) && 
        !p.isGrounded && 
        p.parryCooldown === 0;
      
      // Apply gravity physics
      if (!p.isGrounded) {
        p.vY += GRAVITY;
      }

      // Apply horizontal position updates
      p.x += p.vX;
      p.y += p.vY;

      // Limit ground boundaries
      if (p.y >= GROUND_Y - p.height) {
        p.y = GROUND_Y - p.height;
        p.vY = 0;
        p.isGrounded = true;
        // reset parry cooldowns upon landing safely
        p.parryCooldown = 0;
      }

      // Out of horizontal boundary controls
      if (p.x < 10) p.x = 10;
      if (p.x > CANVAS_WIDTH - p.width - 10) p.x = CANVAS_WIDTH - p.width - 10;

      // Dash button check (Shift key)
      const requestDash = 
        keysPressed.current['Shift'] || 
        keysPressed.current['shift'] || 
        keysPressed.current['shiftleft'] || 
        keysPressed.current['j'] || 
        keysPressed.current['keyj'];
      if (requestDash && p.dashCooldown === 0 && p.isDashing === 0) {
        p.isDashing = 14; // lasts 14 frames
        p.dashCooldown = 50; // cooldown
        p.vY = 0; // stop gravity temporarily at dash
        p.vX = p.facingRight ? 12 : -12;
        playRetroSound('dash');
        spawnExplosionParticles(p.x + p.width / 2, p.y + p.height / 2, '#93C5FD', 8, 'smoke');
      }

      // Auto-Shooting button check (Keep clicked/pressed key X)
      const requestShoot = 
        keysPressed.current['x'] || 
        keysPressed.current['keyx'] || 
        keysPressed.current['k'] || 
        keysPressed.current['keyk'] || 
        keysPressed.current['mouse-is-down'];
      if (requestShoot && p.shootCooldown === 0) {
        executeNormalShoot();
        p.shootCooldown = 6.5; // Fire rate control
      }

      // 2. BOSS INTUITIVE AI STATES & ACTIONS CALCULATION
      const boss = bossRef.current;
      boss.actionTimer++;
      
      // Hover floating motion matching vintage cartoon rhythm
      boss.floatY += 0.04 * boss.floatDir;
      if (Math.abs(boss.floatY) > 1.5) boss.floatDir *= -1;

      // Determine active phase config specs
      const phase = bossPhases[bossPhaseIndex];

      // Boss action sequence cycle
      if (boss.actionTimer > 180 / difficultyFactor) {
        boss.actionTimer = 0;
        // Shift boss battle state
        const diceIdx = Math.random();
        if (diceIdx < 0.3) {
          boss.actionState = 'charging';
        } else if (diceIdx < 0.65) {
          boss.actionState = 'spitting';
        } else {
          boss.actionState = 'jumping';
        }
      }

      // Implement specific behavior depending on State
      if (boss.actionState === 'charging') {
        // Dash aggressively towards player position
        const targetX = p.x;
        const diff = targetX - boss.x;
        if (Math.abs(diff) > 20) {
          boss.x += Math.sign(diff) * 4.2 * difficultyFactor;
        } else {
          boss.actionState = 'idle'; // reset
        }
        
        // Spawn dirt smoke while charging
        if (localFrameCounter % 6 === 0) {
          spawnExplosionParticles(boss.x + boss.width / 2, GROUND_Y, 'rgba(239, 68, 68, 0.15)', 3, 'smoke');
        }
      } else if (boss.actionState === 'spitting') {
        // Spit projectiles towards player periodically
        boss.x += (600 - boss.x) * 0.05; // Return to right-side nest
        if (boss.actionTimer % 22 === 0) {
          // Spit a classic boss coin bullet or magenta parryable bill!
          const isParryable = Math.random() < 0.28; // ~28% chance of magenta pink collectibles
          
          // Projectile vectors pointing to player
          const dx = p.x - (boss.x + 20);
          const dy = p.y - (boss.y + 40);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const speed = (selectedDifficulty === 'expert' ? 7.2 : 5.2);
          const vx = (dx / dist) * speed;
          const vy = (dy / dist) * speed;

          projectilesRef.current.push({
            x: boss.x + 10,
            y: boss.y + 50,
            vx,
            vy,
            radius: isParryable ? 14 : 9.5,
            color: isParryable ? '#F472B6' : phase.color, // pink magenta vs threat color
            isParryable,
            type: isParryable ? 'boss-invoices' : 'boss-coin',
            isBoss: true
          });

          playRetroSound('boss-shoot');
          spawnExplosionParticles(boss.x + 10, boss.y + 50, isParryable ? '#F472B6' : phase.color, 4, 'sparkle');
        }
      } else if (boss.actionState === 'jumping') {
        // Giant parabolic bounce across the floor coordinates!
        const apexFactor = 88;
        const bounceCycle = (boss.actionTimer % 90) / 90;
        boss.y = GROUND_Y - boss.height - 100 - Math.sin(bounceCycle * Math.PI) * 110;
        
        // Move horizontal bounds back and forth
        if (bounceCycle < 0.5) {
          boss.x -= 2.2 * difficultyFactor;
        } else {
          boss.x += 2.2 * difficultyFactor;
        }

        // Spawn ground impact shockwaves
        if (Math.abs(boss.y - (GROUND_Y - boss.height)) < 15 && boss.actionTimer % 35 === 0) {
          // Fire ground horizontal spikes or shockwaves
          projectilesRef.current.push({ x: boss.x, y: GROUND_Y - 14, vx: -5.5, vy: 0, radius: 10, color: '#EF4444', type: 'boss-spike', isBoss: true });
          projectilesRef.current.push({ x: boss.x + boss.width, y: GROUND_Y - 14, vx: 5.5, vy: 0, radius: 10, color: '#EF4444', type: 'boss-spike', isBoss: true });
          playRetroSound('boss-shoot');
          spawnExplosionParticles(boss.x + boss.width/2, GROUND_Y, 'rgba(255, 255, 255, 0.3)', 10, 'smoke');
        }
      } else {
        // IDLE hovering state
        boss.x += (610 - boss.x) * 0.08;
        boss.y += (GROUND_Y - boss.height - 25 - boss.y) * 0.08;
      }

      // Restrict boss boundaries
      if (boss.x < 150) boss.x = 150;
      if (boss.x > CANVAS_WIDTH - boss.width - 15) boss.x = CANVAS_WIDTH - boss.width - 15;

      // 3. UPDATE ACTIVE PROJECTILES & COLLISION CHECKS
      const validProjectiles: Projectile[] = [];

      projectilesRef.current.forEach((proj) => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        // Face angle estimation
        if (proj.angle !== undefined) {
          proj.angle += 0.08;
        } else {
          proj.angle = 0;
        }

        // Out of screen clip filter index
        if (proj.x < -40 || proj.x > CANVAS_WIDTH + 40 || proj.y < -40 || proj.y > CANVAS_HEIGHT + 40) {
          return;
        }

        let hasHit = false;

        if (proj.isBoss) {
          // BOSS PROJECTILES HITS PLAYER hitbox check!
          const collides = checkCollidesRectCircle(p.x, p.y, p.width, p.height, proj.x, proj.y, proj.radius);
          
          if (collides) {
            // Check for midair PARRY maneuver slap against magenta assets!
            if (proj.isParryable && requestParry && !p.isGrounded && p.vY > -0.5) {
              // Classic pink parry success! Slaps upwards
              p.vY = -10.5; // bounce up
              p.parryCooldown = 22; // frame cooldown
              hasHit = true;
              
              playRetroSound('parry');
              chargeSuper(20); // Add 1 full card point (20 credit)
              scoreRef.current += 150;
              setPlayScore(scoreRef.current);

              // Burst magnificent neon pink sparkles representing the retro energy slap
              spawnExplosionParticles(proj.x, proj.y, '#EC4899', 24, 'parry-burst');
              triggerAnnouncer("💖 ¡PARRY EXCELENTE! 💖", 600);
            } else {
              // Standard damage
              if (p.invulnerableFrames === 0 && p.isDashing === 0) {
                damagePlayer();
                hasHit = true;
              }
            }
          }
        } else {
          // HERO BULLETS HITS BOSS hitbox check
          const collides = checkCollidesRectCircle(boss.x, boss.y, boss.width, boss.height, proj.x, proj.y, proj.radius);
          if (collides) {
            hasHit = true;
            // Deduct boss hp appropriately based on projectile type
            const isEx = proj.type === 'ex-pea';
            const damageVal = isEx ? 68 : 8;
            
            setBossHp((prev) => {
              const currentTotal = prev - damageVal;
              scoreRef.current += isEx ? 120 : 15;
              setPlayScore(scoreRef.current);

              // Spark effect
              spawnExplosionParticles(proj.x, proj.y, isEx ? '#FBBF24' : '#10B981', 4, 'sparkle');

              if (currentTotal <= 0) {
                // Check if stages index remains to progress
                if (bossPhaseIndex < bossPhases.length - 1) {
                  const nextIdx = bossPhaseIndex + 1;
                  setBossPhaseIndex(nextIdx);
                  const nextHpTotal = bossPhases[nextIdx].maxHp;
                  
                  // Big cinematic frame freeze overlay warning
                  playRetroSound('knockout');
                  triggerAnnouncer(`🚨 Siguiente Fase: ${bossPhases[nextIdx].name} 🚨`, 1800);
                  spawnExplosionParticles(boss.x + boss.width/2, boss.y + boss.height/2, '#F43F5E', 35, 'parry-burst');
                  
                  return nextHpTotal;
                } else {
                  // ALL BOSS PHASES LIQUIDATED! TOTAL KNOCKOUT!
                  setGameState('victory');
                  isPlayingRef.current = false;
                  playRetroSound('knockout');
                  triggerAnnouncer("💥 ¡K N O C K O U T! 💥", 4000);
                }
              }
              return currentTotal;
            });
          }
        }

        if (!hasHit) {
          validProjectiles.push(proj);
        }
      });

      projectilesRef.current = validProjectiles;

      // 4. CORE COLLISION: Direct player vs Boss body impact check
      const playerCollidesBoss = checkCollidesRectCircle(boss.x, boss.y, boss.width, boss.height, p.x + p.width/2, p.y + p.height/2, p.width/2);
      if (playerCollidesBoss && p.invulnerableFrames === 0 && p.isDashing === 0) {
        damagePlayer();
      }

      // 5. UPDATE GRAPHICS RENDER STEPS ON VINTAGE CANVAS STYLE
      // Clear previous frames
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // AESTHETIC CARDBOARD/WATERCOLOR BACKGROUND FOR VINTAGE 1930S MOOD
      ctx.fillStyle = '#fbf6eb'; // Tea-stained watercolor paper background
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw aesthetic heavy shadow vignettes
      const vignetteGrad = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 220, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 420);
      vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vignetteGrad.addColorStop(1, 'rgba(40,32,15,0.42)'); // vintage brown sepia vignette
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw beautiful stylized hand-drawn vector desert mountain backdrops
      ctx.fillStyle = '#efe2cc'; // distant warm cardboard hills
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.quadraticCurveTo(150, 180, 320, GROUND_Y);
      ctx.quadraticCurveTo(450, 220, 600, GROUND_Y);
      ctx.quadraticCurveTo(700, 260, 800, GROUND_Y);
      ctx.fill();
      
      // Draw midground hills
      ctx.fillStyle = '#e4d2b5'; 
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.quadraticCurveTo(100, 240, 240, GROUND_Y);
      ctx.quadraticCurveTo(480, 200, 700, GROUND_Y);
      ctx.quadraticCurveTo(750, 280, 800, GROUND_Y);
      ctx.fill();

      // DRAW NEON RETRO FLOOR GRID BARS FOR THE MODERN "SWASS" COMIC FLAVOR
      ctx.fillStyle = '#3f3521'; // Solid floor
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      
      // Draw cross ink hatchings on the floor
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < CANVAS_WIDTH; i += 25) {
        ctx.beginPath();
        ctx.moveTo(i, GROUND_Y);
        ctx.lineTo(i - 40, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Heavy hand-inked line dividing land and sky
      ctx.strokeStyle = '#2c2211';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.stroke();

      // 6. DRAW ALL PARTICLES
      particlesRef.current.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;

        const lifeRatio = pt.life / pt.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - lifeRatio);
        ctx.fillStyle = pt.color;

        ctx.beginPath();
        if (pt.type === 'parry-burst') {
          // Render fancy heart bursts or spikes representing the parry action
          ctx.arc(pt.x, pt.y, pt.radius * 2.2, 0, Math.PI * 2);
          ctx.strokeStyle = '#EC4899';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else {
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Filter out stale particles
      particlesRef.current = particlesRef.current.filter(pt => pt.life < pt.maxLife);

      // 7. DRAW CACTUSHEAD (PLAYER HERO - 1930s Retro Cartoon presentation!)
      ctx.save();
      
      // Flash player opacity if invulnerable (classic retro blinking)
      if (p.invulnerableFrames > 0 && Math.floor(p.invulnerableFrames / 4) % 2 === 0) {
        ctx.globalAlpha = 0.25;
      }
      
      // Spin/squash translation factors depending on state
      const bobbingY = Math.sin(p.bouncyState) * 2;
      const stretchX = Math.cos(p.bouncyState) * 0.05 + 1.0;
      const stretchY = -Math.cos(p.bouncyState) * 0.05 + 1.0;

      ctx.translate(p.x + p.width / 2, p.y + p.height);
      ctx.scale(p.facingRight ? 1 : -1, 1); // Face appropriate direction
      
      // SQUASH/STRETCH for rubbery feel!
      ctx.scale(stretchX, stretchY);

      // Draw cute 1930s rubber hose legs with shoes
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      
      // Left leg
      ctx.beginPath();
      ctx.moveTo(-7, -15);
      ctx.quadraticCurveTo(-12 + Math.sin(p.bouncyState) * 6, -6, -8 + Math.sin(p.bouncyState) * 4, 0);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(7, -15);
      ctx.quadraticCurveTo(12 - Math.sin(p.bouncyState) * 6, -6, 8 - Math.sin(p.bouncyState) * 4, 0);
      ctx.stroke();

      // Big classic cartoon pie-shoes (Yellow/Orange)
      ctx.fillStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#18181b';
      
      // Left Shoe
      ctx.beginPath();
      ctx.ellipse(-11 + Math.sin(p.bouncyState) * 4, 0, 7.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right Shoe
      ctx.beginPath();
      ctx.ellipse(11 - Math.sin(p.bouncyState) * 4, 0, 7.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // RETRO CACTUS BODY: Heavy outer comic stroke
      ctx.fillStyle = '#10B981'; // Emerald Green body back
      drawRoundRectPath(ctx, -p.width / 2, -p.height, p.width, p.height - 12, 16);
      ctx.fill();
      ctx.stroke();

      // Cute pot/cup head hat (Representing SWASS cups!)
      ctx.fillStyle = '#ef4444'; // Red terracotta pot
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-15, -p.height - 6);
      ctx.lineTo(15, -p.height - 6);
      ctx.lineTo(11, -p.height + 6);
      ctx.lineTo(-11, -p.height + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw pot upper rim oval
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.ellipse(0, -p.height - 6, 15, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Drawn classic Pie-Eyes (1930s Pacman slits looking slightly right)
      ctx.fillStyle = '#18181b';
      
      // Left Eye
      ctx.beginPath();
      ctx.ellipse(3, -p.height + 25, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Right Eye
      ctx.beginPath();
      ctx.ellipse(12, -p.height + 25, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pie-Eye White reflections dots/wedges
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(3, -p.height + 23, 1.5, 0, Math.PI * 2);
      ctx.arc(12, -p.height + 23, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Elastic wide smile showing off-teeth (vintage style!)
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(7, -p.height + 34, 5.5, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw tiny needle prickles pointing outwards
      ctx.strokeStyle = '#065f46';
      ctx.lineWidth = 2.5;

      // Needle 1 (Left shoulder)
      ctx.beginPath(); ctx.moveTo(-p.width/2, -p.height + 20); ctx.lineTo(-p.width/2 - 6, -p.height + 17); ctx.stroke();
      // Needle 2 (Right shoulder)
      ctx.beginPath(); ctx.moveTo(p.width/2, -p.height + 20); ctx.lineTo(p.width/2 + 6, -p.height + 17); ctx.stroke();
      // Needle 3 (Teacup edge)
      ctx.beginPath(); ctx.moveTo(0, -p.height + 12); ctx.lineTo(0, -p.height + 4); ctx.stroke();

      ctx.restore();

      // 8. RENDER THE PHENOMENAL VINTAGE BOSS (Don Comisión / Barón Contracargo)
      ctx.save();
      const bFloatAmt = Math.sin(time * 0.004) * 8;
      
      ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2 + bFloatAmt);
      
      // Boss squashes down depending on actionState
      let bStretchX = 1.0;
      let bStretchY = 1.0;
      
      if (boss.actionState === 'charging') {
        bStretchX = 1.15;
        bStretchY = 0.85;
      } else if (boss.actionState === 'jumping') {
        bStretchX = 0.9;
        bStretchY = 1.15;
      }
      ctx.scale(bStretchX, bStretchY);

      // Huge cartoon body representing greedy merchant safe / credit card monster
      ctx.fillStyle = phase.color;
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 4.5;
      drawRoundRectPath(ctx, -boss.width / 2, -boss.height / 2, boss.width, boss.height, 22);
      ctx.fill();
      ctx.stroke();

      // Draw high contrasted safe dial combo wheel (The center of their black-market business!)
      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.arc(-26, -10, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Draw notch marks inside wheel
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 2;
      for (let markAng = 0; markAng < Math.PI * 2; markAng += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(-26 + Math.cos(markAng) * 14, -10 + Math.sin(markAng) * 14);
        ctx.lineTo(-26 + Math.cos(markAng) * 22, -10 + Math.sin(markAng) * 22);
        ctx.stroke();
      }

      // Classic large round yellow coin eye
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(28, -25, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mean angry pie eyelid wedge
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(32, -25, 7, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyebrow furrow
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(12, -44);
      ctx.lineTo(44, -36);
      ctx.stroke();

      // Giant teeth grinding mouth matching angry 1930s villain boss
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(15, 15, 30, 14, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sharp grid tooth dividers lines
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-15, 15); ctx.lineTo(45, 15);
      ctx.stroke();
      for (let tx = -5; tx <= 35; tx += 10) {
        ctx.beginPath();
        ctx.moveTo(tx, 5);
        ctx.lineTo(tx, 25);
        ctx.stroke();
      }

      // Cute tiny horns on the Safe corner shoulders (representing corporate red-tape devils)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-boss.width / 2 + 8, -boss.height / 2);
      ctx.quadraticCurveTo(-boss.width / 2 - 8, -boss.height / 2 - 22, -boss.width / 2 - 14, -boss.height / 2 - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boss.width / 2 - 8, -boss.height / 2);
      ctx.quadraticCurveTo(boss.width / 2 + 8, -boss.height / 2 - 22, boss.width / 2 + 14, -boss.height / 2 - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dynamic floating state emoji on top of head indicating its threat level
      ctx.font = '36px Helvetica';
      ctx.fillText(phase.spriteEmoji, -18, -boss.height/2 - 15);

      ctx.restore();

      // 9. DRAW ALL BALLISTIC PROJECTILES (Needles & Bills & Coins)
      projectilesRef.current.forEach((proj) => {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.angle || 0);

        if (proj.isBoss) {
          if (proj.isParryable) {
            // MAGENTA/PINK PARRYABLE TARGET object (Huge neon glow sticker)
            ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
            ctx.beginPath();
            ctx.arc(0, 0, proj.radius + 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#EC4899'; // Magenta pink core
            ctx.beginPath();
            ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw visual parry prompt star inside
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Courier';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("PARRY", 0, 0);

          } else {
            // Standard gold villain coins/threats
            ctx.fillStyle = proj.color;
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 2.5;
            
            ctx.beginPath();
            if (proj.type === 'boss-spike') {
              // Draw pointy triangular gears
              ctx.moveTo(0, -proj.radius);
              ctx.lineTo(proj.radius, proj.radius);
              ctx.lineTo(-proj.radius, proj.radius);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              
              // Inner coin dollar ($) text mark
              ctx.fillStyle = '#1e1b4b';
              ctx.font = 'bold 9px Helvetica';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText("$", 0, 0);
            }
          }
        } else {
          // Play classic sharp spear cactus needle spits
          ctx.beginPath();
          if (proj.type === 'ex-pea') {
            // Giant golden flaming projectile
            const radialGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, proj.radius);
            radialGrad.addColorStop(0, '#fef08a');
            radialGrad.addColorStop(0.5, '#f59e0b');
            radialGrad.addColorStop(1, '#ef4444');
            ctx.fillStyle = radialGrad;
            
            ctx.ellipse(0, 0, proj.radius + 4, proj.radius - 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1c1917';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else {
            // Standard small green needle arrow
            ctx.fillStyle = '#34D399';
            ctx.ellipse(0, 0, proj.radius + 3, proj.radius - 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#064e3b';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
        ctx.restore();
      });

      // 10. VINTAGE NOISE & CINEMATIC FILM GRAIN GRAVEL OVERLAYS
      if (jitterActive) {
        // Random film hairs or dust specs simulated directly on the viewport!
        ctx.strokeStyle = 'rgba(28, 25, 20, 0.45)';
        ctx.lineWidth = Math.random() * 1.5;
        
        if (Math.random() < 0.35) {
          // Film hair scratch
          ctx.beginPath();
          const lineX = Math.random() * CANVAS_WIDTH;
          ctx.moveTo(lineX, Math.random() * 50);
          ctx.lineTo(lineX + (Math.random() - 0.5) * 14, Math.random() * 120 + 50);
          ctx.stroke();
        }

        if (Math.random() < 0.28) {
          // Tiny dirt specks
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.beginPath();
          ctx.arc(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, Math.random() * 2 + 1, 0, Math.PI*2);
          ctx.fill();
        }

        // Project jitter shaker on frames (vibration offset effect)
        const jitterX = (Math.random() - 0.5) * 1.3;
        const jitterY = (Math.random() - 0.5) * 1.3;
        ctx.translate(jitterX, jitterY);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    if (gameState === 'playing') {
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, bossPhaseIndex, selectedDifficulty, jitterActive]);

  return (
    <div id="cuphead-cactus-game" className="bg-amber-50/15 border border-zinc-250 rounded-2xl p-4 md:p-6 shadow-xs overflow-hidden flex flex-col justify-between">
      
      {/* Dynamic Filter Controls & Settings Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4 mb-4">
        <div>
          <span className="font-mono text-[9px] text-amber-700 font-extrabold tracking-wider flex items-center gap-1.5 uppercase">
            <Tv className="w-4 h-4 text-amber-700 animate-pulse" />
            ¡EDICIÓN RETRO RETUMBANTE DE LOS 1930s!
          </span>
          <h3 className="font-display text-lg md:text-xl font-extrabold text-zinc-900 mt-0.5">Cactushead: El Duelo FinTech</h3>
          <p className="text-zinc-500 text-[11px] mt-0.5">Una batalla boss-rush al estilo de Cuphead contra la usura y los intermediarios.</p>
        </div>

        {/* Dynamic options console */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10px] self-stretch sm:self-auto justify-between">
          
          {/* Difficulty selector widget */}
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1 border border-zinc-200 shadow-3xs">
            <button
              type="button"
              onClick={() => setSelectedDifficulty('regular')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${selectedDifficulty === 'regular' ? 'bg-amber-200 text-amber-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              REGULAR
            </button>
            <button
              type="button"
              onClick={() => setSelectedDifficulty('expert')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${selectedDifficulty === 'expert' ? 'bg-red-600 text-white shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              <span>EXPERTO</span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
            </button>
          </div>

          <div className="w-px h-6 bg-zinc-200 hidden sm:block" />

          {/* Noise/jitter vintage switch buttons */}
          <button
            type="button"
            onClick={() => setJitterActive(!jitterActive)}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${jitterActive ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}
            title="Efecto de Cinta Antigua y Polvo"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>GRAIN</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 px-2.5 rounded-lg border border-zinc-250 bg-white text-zinc-650 hover:text-zinc-950 hover:bg-zinc-50 hover:shadow-3xs transition-all cursor-pointer"
            title={soundEnabled ? "Silenciar audio" : "Activar audio"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* State 1: Cartoon lobby screen */}
        {gameState === 'intro' && (
          <motion.div 
            key="retro-intro"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative bg-amber-50/40 border-2 border-zinc-300/80 rounded-xl p-8 text-center shadow-xs my-2 flex flex-col items-center justify-center min-h-[360px] overflow-hidden"
            style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(239,228,211,0.6) 0%, rgba(210,192,165,0.7) 100%)' }}
          >
            {/* Retro 1930s Film Scratch Noise styling overlay */}
            <div className="absolute inset-0 bg-[#f8f1df] opacity-15 pointer-events-none mix-blend-color-burn" />

            <div className="text-7xl mb-4 animate-[bounce_1.4s_infinite] drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
              🌵🥤
            </div>

            <span className="font-mono text-[9px] text-amber-900 tracking-widest uppercase font-extrabold bg-amber-200/90 border border-amber-300 py-1 px-4.5 rounded-full shadow-3xs mb-3">
              DUELO DE ADQUIRENCIA MÉXICO EN 2D
            </span>
            
            <h4 className="font-serif text-3xl md:text-4xl font-extrabold text-amber-950 leading-tight tracking-tight drop-shadow-[0_1.5px_0px_#ffffff]">
              CACTUSHEAD: THE CUPHEAD CHALLENGE
            </h4>
            
            <p className="text-zinc-700 text-xs max-w-lg mt-3.5 font-serif leading-relaxed italic border-t border-b border-amber-200 py-3">
              "¡Don Comisión y sus secuaces del 4.5% han tomado rehenes en el procesador de tarjetas de México! Esquiva las facturas magentas que te lanzan, ¡hazles un PARRY saltando sobre ellas para cargar tu Super Meter, y dispara espinas a la central STP!"
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center">
              <button
                type="button"
                onClick={startMatch}
                className="py-3.5 px-9 bg-red-650 hover:bg-red-750 text-white border-2 border-red-950 rounded-xl font-serif text-sm font-black uppercase tracking-wider scale-[1.03] transition-all hover:scale-[1.08] active:scale-[0.98] flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Flame className="w-4 h-4 fill-amber-200 text-amber-200 animate-pulse" />
                ¡Ready? WALLOP!
              </button>

              <a
                href="#controls-helper"
                className="text-[11px] font-mono font-bold text-amber-900/80 hover:text-amber-950 underline"
              >
                Ver Controles de Teclado
              </a>
            </div>
          </motion.div>
        )}

        {/* State 2: High power active vintage gameplay */}
        {gameState === 'playing' && (
          <motion.div 
            key="retro-gameplay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* The main action box rendering canvas */}
            <div className="relative border-4 border-zinc-900 rounded-xl overflow-hidden bg-zinc-950 shadow-md">
              
              {/* Retro HUD overlay */}
              <div className="relative md:absolute top-0 md:top-3 md:left-4 md:right-4 z-10 flex flex-row items-center justify-between gap-1.5 px-3 py-2.5 bg-zinc-900 md:bg-transparent border-b border-zinc-800 md:border-none select-none pointer-events-none">
                
                {/* Hearts / HP Display (Classic Cuphead design) */}
                <div className="flex items-center gap-1.5 bg-black/55 border border-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs font-mono">
                  <span className="text-[9px] md:text-[10px] text-white font-black tracking-wider uppercase">HP:</span>
                  <div className="flex gap-0.5 md:gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Heart 
                        key={i} 
                        className={`w-3.5 h-3.5 md:w-5 md:h-5 transition-all ${
                          i < currentHp 
                            ? 'text-red-500 fill-red-500 scale-110 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]' 
                            : 'text-zinc-700 scale-90'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Score display */}
                <div className="text-right bg-black/55 border border-white/10 px-2 px-1.5 py-1 rounded-lg backdrop-blur-xs font-mono">
                  <span className="text-[8px] md:text-[9px] text-zinc-400 block font-extrabold uppercase leading-none">SCORE</span>
                  <span className="text-xs md:text-sm font-black text-yellow-300 font-mono tracking-widest">{playScore}</span>
                </div>

                {/* Super Meter (Stacked playing Cards) */}
                <div className="bg-black/55 border border-white/10 px-2 px-1.5 py-1 rounded-lg backdrop-blur-xs font-mono flex items-center gap-1 md:gap-2">
                  <div className="text-left">
                    <span className="text-[7.5px] md:text-[8px] text-zinc-400 block font-extrabold leading-none uppercase">METER</span>
                    <span className="text-[9px] md:text-[10.5px] font-black text-cyan-400 font-mono">{superMeter}%</span>
                  </div>
                  
                  {/* Cards stacking visually */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const threshold = (idx + 1) * 20;
                      const isLoaded = superMeter >= threshold;
                      return (
                        <div 
                          key={idx}
                          className={`w-2.5 h-4.5 md:w-3.5 md:h-6 rounded border transition-all ${
                            isLoaded 
                              ? 'bg-cyan-500 border-white font-extrabold scroll-py-0 text-white text-[8px] flex items-center justify-center scale-103 shadow-2xs rotate-2' 
                              : 'bg-zinc-800 border-zinc-650 opacity-40'
                          }`}
                        >
                          {isLoaded ? "🃏" : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Animated Screen Announcer overlays (Ready, Hit, Knockout!) */}
              <AnimatePresence>
                {animatingAnnouncer && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1.4, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.8, y: -40 }}
                    transition={{ type: "spring", damping: 12, stiffness: 220 }}
                    className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none select-none"
                  >
                    <div className="bg-amber-950/95 border-4 border-yellow-400 p-4 md:p-6 rounded-2xl shadow-2xl skew-y-3 font-serif text-center max-w-xs md:max-w-md">
                      <span className="text-yellow-405 font-bold uppercase tracking-widest text-[10px] block font-mono">CUPHEAD ANNOUNCER</span>
                      <h2 className="text-2xl md:text-3xl font-black text-red-500 drop-shadow-[0_2px_4px_rgba(255,255,255,0.15)] uppercase italic mt-1 leading-none tracking-tight">
                        {announcerText}
                      </h2>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Float pop-ups internally within canvas bounds */}
              {floatingIndicator && (
                <div 
                  className="absolute top-1/2 left-1/3 -translate-y-1/2 z-20 pointer-events-none animate-[ping_1.1s_1_normal] font-serif font-black text-xl tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] select-none text-pink-500"
                  style={{ color: floatingIndicator.color }}
                >
                  {floatingIndicator.text}
                </div>
              )}

              {/* The high power fast rendering context Canvas element */}
              <canvas
                id="cuphead-cactus-canvas"
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                tabIndex={0}
                className="w-full h-auto block select-none bg-[#fdf6e2] cursor-crosshair outline-none focus:ring-4 focus:ring-amber-200/40 rounded-t-none md:rounded-xl transition-all shadow-md"
                onMouseDown={() => { 
                  keysPressed.current['mouse-is-down'] = true; 
                  try { window.focus(); canvasRef.current?.focus(); } catch(e) {}
                }}
                onMouseUp={() => { keysPressed.current['mouse-is-down'] = false; }}
                onMouseLeave={() => { keysPressed.current['mouse-is-down'] = false; }}
                onTouchStart={() => {
                  keysPressed.current['mouse-is-down'] = true;
                  try { window.focus(); canvasRef.current?.focus(); } catch(e) {}
                }}
                onTouchEnd={() => { keysPressed.current['mouse-is-down'] = false; }}
                onClick={() => {
                  try { window.focus(); canvasRef.current?.focus(); } catch(e) {}
                }}
              />

              {/* Boss Stage HP Bar display at bottom center */}
              <div className="relative md:absolute bottom-0 md:bottom-4 md:left-1/2 md:-translate-x-1/2 z-10 w-full md:max-w-sm px-3.5 py-2.5 bg-zinc-900 md:bg-black/60 border-t border-zinc-800 md:border md:border-white/10 md:rounded-xl text-center pointer-events-none select-none">
                <div>
                  <div className="flex items-center justify-between text-[9px] md:text-[10px] font-mono text-zinc-300 font-extrabold uppercase mb-1">
                    <span>😈 {bossPhases[bossPhaseIndex].name}</span>
                    <span className="text-red-400">{bossHp} HP</span>
                  </div>
                  
                  {/* Big healthy block meter */}
                  <div className="w-full bg-zinc-800 h-2 md:h-3 rounded-md overflow-hidden relative border border-zinc-700">
                    <motion.div 
                      className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 h-full"
                      animate={{ width: `${(bossHp / bossPhases[bossPhaseIndex].maxHp) * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  
                  <span className="text-[8px] md:text-[9px] text-zinc-400 italic font-mono block mt-1">{bossPhases[bossPhaseIndex].subtitle}</span>
                </div>
              </div>

            </div>

            {/* Tactical Control Instructions Cheat Sheet */}
            <div id="controls-helper" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Custom interactive dashboard actions clickable with tap/touch */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4.5 space-y-3">
                <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold flex items-center justify-between">
                  <span>🕹️ PANEL DE CONTROLES TÁCTILES RÁPIDOS</span>
                  <span className="text-amber-800 bg-amber-100 border border-amber-200 rounded px-1.5 py-0.2">
                    PLAYING LIVE
                  </span>
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onMouseDown={() => { keysPressed.current['mouse-is-down'] = true; }}
                    onMouseUp={() => { keysPressed.current['mouse-is-down'] = false; }}
                    onTouchStart={(e) => { e.preventDefault(); keysPressed.current['mouse-is-down'] = true; }}
                    onTouchEnd={(e) => { e.preventDefault(); keysPressed.current['mouse-is-down'] = false; }}
                    className="py-2.5 px-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-emerald-50 hover:border-emerald-500 text-center transition-all cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Zap className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                      <span className="font-display font-extrabold text-[10px] text-zinc-900 leading-none">Auto Disparo</span>
                      <span className="text-[8px] text-zinc-400 font-mono">[Mantener]</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Trigger artificial jump trigger safely
                      const p = playerRef.current;
                      if (p.isGrounded) {
                        p.vY = -12.5;
                        p.isGrounded = false;
                        playRetroSound('jump');
                        spawnExplosionParticles(p.x + p.width/2, GROUND_Y, 'rgba(255, 255, 255, 0.45)', 6, 'smoke');
                      }
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      const p = playerRef.current;
                      if (p.isGrounded) {
                        p.vY = -12.5;
                        p.isGrounded = false;
                        playRetroSound('jump');
                        spawnExplosionParticles(p.x + p.width/2, GROUND_Y, 'rgba(255, 255, 255, 0.45)', 6, 'smoke');
                      }
                    }}
                    className="py-2.5 px-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-amber-50 hover:border-amber-500 text-center transition-all cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <ArrowRight className="w-4 h-4 -rotate-90 text-amber-500" />
                      <span className="font-display font-extrabold text-[10px] text-zinc-900 leading-none">Saltar</span>
                      <span className="text-[8px] text-zinc-400 font-mono">[Espacio / W]</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={superMeter < 20}
                    onClick={executeSpecialEx}
                    onTouchStart={(e) => {
                      if (superMeter >= 20) {
                        e.preventDefault();
                        executeSpecialEx();
                      }
                    }}
                    className="py-2.5 px-1.5 rounded-xl border border-dashed border-cyan-400 bg-white hover:bg-cyan-50 disabled:opacity-50 text-center transition-all cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Trophy className="w-4 h-4 text-cyan-500" />
                      <span className="font-display font-extrabold text-[10px] text-zinc-900 leading-none">EX Especial</span>
                      <span className="text-[8px] text-zinc-400 font-mono">Teclas [V]</span>
                    </div>
                  </button>
                </div>

                <div className="bg-amber-50/50 border border-amber-205/60 p-3 rounded-lg text-amber-970 text-[10.5px] leading-relaxed">
                  <p className="font-bold flex items-center gap-1">
                    <span className="text-pink-500">💗 TRUCO CLAVE:</span> 
                    ¡Hazle "Parry" saltando de nuevo sobre los proyectiles Magenta/Rosas! 
                  </p>
                  <p className="text-[9.5px] text-zinc-500 mt-0.5">Esto incrementará tu Super Meter 20% instantáneamente sin recibir daño.</p>
                </div>
              </div>

              {/* Hand Drawn Retro controller layout explanation */}
              <div className="bg-[#fbf7f0] border border-amber-200 rounded-xl p-4.5 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[9px] text-amber-800 uppercase tracking-widest font-extrabold block mb-2">
                    🎮 MAPA DE TECLAS DEL JUEGO
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono text-zinc-650">
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-zinc-200 border border-zinc-300 rounded font-black text-[9px]">A / D</kbd>
                      <span>Correr izquierda / derecha</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-zinc-200 border border-zinc-300 rounded font-black text-[9px]">W / Espacio</kbd>
                      <span>Saltar en el aire</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-zinc-200 border border-zinc-305 rounded font-black text-[9px]">Shift / J</kbd>
                      <span>Guillotina / Dash rápido</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-zinc-200 border border-zinc-300 rounded font-black text-[9px]">X / K</kbd>
                      <span>Disparar Espinas Espi</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-zinc-100 p-2 rounded border border-zinc-200 text-[9px] text-zinc-500 text-center font-mono uppercase">
                  Regulado bajo código de honor 1930 • SWASS ADQUIRENCIA GLOBAL
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* State 3: Game Over Vintage Screen with Death Quote and gauge bar */}
        {gameState === 'gameover' && (
          <motion.div 
            key="retro-gameover"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="border-4 border-zinc-950 p-8 text-center my-2 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden"
            style={{ 
              backgroundImage: 'radial-gradient(ellipse at center, rgba(62,29,29,0.92) 0%, rgba(13,5,5,0.98) 100%)',
              color: '#fbf6eb'
            }}
          >
            {/* Dark blood red vignette screen overlay */}
            <div className="absolute inset-0 bg-red-950/20 mix-blend-color-burn" />

            <div className="w-16 h-16 bg-red-900/60 text-red-500 rounded-full border-2 border-red-500 flex items-center justify-center mb-4 text-4xl animate-bounce">
              💀
            </div>

            <span className="font-mono text-[9px] text-red-400 tracking-wider uppercase font-extrabold bg-red-950 px-3.5 py-1 rounded border border-red-800">
              YOU DIED! / LA USURA TRIUNFÓ
            </span>

            <h4 className="font-serif text-3xl md:text-4xl font-extrabold text-red-100 mt-4 leading-tight tracking-tight drop-shadow-[0_2px_3px_#000000]">
              Derrota en la Fase {bossPhaseIndex + 1}
            </h4>

            {/* Vintage comedic Quote Plate from the Boss that defeated you */}
            <div className="mt-5 max-w-md bg-zinc-900/65 border-2 border-amber-900/40 p-4 rounded-xl leading-relaxed italic text-amber-100 text-xs font-serif shadow-xl">
              <span className="text-[10px] text-red-400 font-bold block uppercase not-italic mb-1">
                💬 {bossPhases[bossPhaseIndex].name} ríe:
              </span>
              "{bossPhases[bossPhaseIndex].quoteOnDeath}"
            </div>

            <p className="text-zinc-400 text-[11px] max-w-sm mt-3 font-mono">
              ¡No te rindas! Con la adquirencia instantánea de SWASS SPEI Directo no sufrirás contracargos ni comisiones ocultas.
            </p>

            <div className="flex gap-4 mt-6 z-10">
              <button
                type="button"
                onClick={startMatch}
                className="py-3.5 px-7 bg-amber-500 hover:bg-amber-600 border-2 border-amber-950 text-zinc-950 rounded-xl font-serif text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-[1.04]"
              >
                <RotateCcw className="w-4 h-4 text-zinc-950 animate-spin" />
                Intentar de Nuevo (Back to Wallop)
              </button>

              <button
                type="button"
                onClick={() => setGameState('intro')}
                className="py-3.5 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl font-mono text-[11px] font-bold"
              >
                Menú de Inicio
              </button>
            </div>
          </motion.div>
        )}

        {/* State 4: Victory Celebration screen */}
        {gameState === 'victory' && (
          <motion.div 
            key="retro-victory"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="border-4 border-amber-900/80 p-8 text-center my-2 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden"
            style={{ 
              backgroundImage: 'radial-gradient(ellipse at center, rgba(239,228,211,0.9) 0%, rgba(193,165,127,0.95) 100%)',
              color: '#27272a'
            }}
          >
            {/* Visual background confetti or flashes */}
            <div className="text-6xl mb-4 animate-[bounce_1.2s_infinite]">
              🏆🎊
            </div>

            <span className="font-mono text-[9px] text-emerald-950 tracking-wider uppercase font-extrabold bg-emerald-100 border-2 border-emerald-300 px-4 py-1.5 rounded-full">
              🏆 ¡TOTAL KNOCKOUT VICTORIOSO! 🏆
            </span>

            <h4 className="font-serif text-3xl md:text-4xl font-extrabold text-emerald-950 mt-4 tracking-tight">
              ¡Cactushead Salvó la Adquirencia!
            </h4>

            <p className="text-zinc-700 text-xs max-w-md mt-4 font-serif leading-relaxed italic border-t border-b border-emerald-800/20 py-3">
              Has fulminado al "Barón del Contracargo", asfixiado las comisiones innecesarias de "Don Comisión Tarjeta" y revivido los servidores SPEI caídos. ¡SWASS es coronado campeón de la liquidación instantánea STP!
            </p>

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={startMatch}
                className="py-3.5 px-7 bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-950 text-white rounded-xl font-serif text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-[1.04]"
              >
                ¡Re-Luchar contra Don Comisión!
              </button>

              <button
                type="button"
                onClick={() => setGameState('intro')}
                className="py-3.5 px-7 bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-950 text-white rounded-xl font-mono text-xs font-bold"
              >
                Volver al Lobby
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Retro instructions bar footer with cute prompt labels */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px] text-zinc-500 font-semibold border-t border-zinc-200 pt-3">
        <span className="flex items-center gap-1.5 text-zinc-650 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          MOP-UP: USA EL RATÓN O EL TECLADO PARA DESTRONAR AL MONSTRUO DEL INTERMEDIARIO NACIONAL.
        </span>
        <span className="text-amber-800 font-extrabold bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded tracking-wide uppercase">
          🔋 DISPARO EXCEPCIONAL CON [V]
        </span>
      </div>
    </div>
  );
}
