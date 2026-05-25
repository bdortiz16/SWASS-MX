/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, RotateCcw, Volume2, VolumeX, Sparkles, Award, 
  Sword, Shield, Heart, Zap, ChevronRight, Trophy, Flame, Coins, ShieldAlert, Cpu,
  Compass, Eye, Sliders, Info
} from 'lucide-react';

interface BattleLog {
  id: string;
  text: string;
  type: 'damage-deal' | 'damage-taken' | 'heal' | 'shield' | 'system' | 'victory' | 'warning';
  time: string;
}

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  weakness: 'spei' | 'split' | 'direct';
  weaknessLabel: string;
  avatarIcon: string;
  level: number;
  introQuote: string;
  attacks: Array<{ name: string; damage: number; logText: string }>;
}

// Custom 3D Math Types
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Face3D {
  indices: number[];
  color: string;
  outlineColor?: string;
  opacity?: number;
}

interface Model3D {
  vertices: Point3D[];
  faces: Face3D[];
  lines?: number[][]; // [vertexIndex1, vertexIndex2]
}

interface RenderElement {
  type: 'polygon' | 'line' | 'particle';
  avgDepth: number;
  projectedPoints?: { x: number; y: number }[];
  p1?: { x: number; y: number };
  p2?: { x: number; y: number };
  color: string;
  outlineColor?: string;
  lineWidth?: number;
  opacity?: number;
  radius?: number;
}

interface Particle3D {
  id: string;
  pos: Point3D;
  vel: Point3D;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'green-heal' | 'blue-shield' | 'gold-spei';
}

export default function CactusAdventureGame() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // RPG Core State
  const [gameState, setGameState] = useState<'menu' | 'battle' | 'victory-screen' | 'gameover'>('menu');
  
  // Hero stats
  const [heroHp, setHeroHp] = useState<number>(100);
  const [heroMaxHp, setHeroMaxHp] = useState<number>(100);
  const [heroShield, setHeroShield] = useState<number>(0);
  const [heroEnergy, setHeroEnergy] = useState<number>(25); // Current SPEI Charge %
  const [heroMaxEnergy] = useState<number>(100);
  const [heroLevel, setHeroLevel] = useState<number>(1);
  const [heroExp, setHeroExp] = useState<number>(0);
  const [heroMaxExp] = useState<number>(100);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  // Encounter configurations
  const encounters: Enemy[] = [
    {
      name: "Comisión Fantasma",
      level: 1,
      hp: 120,
      maxHp: 120,
      shield: 30,
      maxShield: 50,
      weakness: 'direct',
      weaknessLabel: 'SPEI Directo',
      avatarIcon: "👻",
      introQuote: "¡No puedes evitarme! Cada cobro que pase por mí perderá un 4.5%...",
      attacks: [
        { name: "Cargo Oculto", damage: 12, logText: "Comisión Fantasma te sorprende con una tarifa de procesamiento de fin de semana." },
        { name: "Comisión de Apertura", damage: 16, logText: "Comisión Fantasma aplica cobro por servicios que no sabías que tenías." }
      ]
    },
    {
      name: "Monstruo de Declinación 3DS1",
      level: 2,
      hp: 180,
      maxHp: 180,
      shield: 50,
      maxShield: 80,
      weakness: 'spei',
      weaknessLabel: 'SPEI / 3DS2',
      avatarIcon: "👹",
      introQuote: "¡Rechazo un 40% de tus ventas legítimas con mi protocolo obsoleto!",
      attacks: [
        { name: "Falso Positivo", damage: 20, logText: "El Monstruo de Declinación 3DS1 bloquea un cliente AAA asumiendo fraude." },
        { name: "Falsa Alerta Financiera", damage: 24, logText: "El Monstruo congela la API alegando deudas falsas." }
      ]
    },
    {
      name: "El Máster Intermediario",
      level: 3,
      hp: 260,
      maxHp: 260,
      shield: 80,
      maxShield: 120,
      weakness: 'split',
      weaknessLabel: 'Split API / Orquestación',
      avatarIcon: "👿",
      introQuote: "¡Yo controlo las terminales de México! Juren lealtad a mi burocracia.",
      attacks: [
        { name: "Contracargo Agresivo", damage: 28, logText: "El Máster Intermediario te clava una penalización sin comprobación." },
        { name: "Retención Arbitraria", damage: 25, logText: "El Máster congela tus liquidaciones 45 días hábiles." },
        { name: "Tasa de Intercambio Oro", damage: 32, logText: "El Máster drena tus fondos con su tarifa corporativa del 5.8%." }
      ]
    }
  ];

  const [currentEnemy, setCurrentEnemy] = useState<Enemy>({ ...encounters[0] });
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [isAnimating, setIsAnimating] = useState<'idle' | 'hero-attack' | 'hero-hit' | 'enemy-attack' | 'enemy-hit'>('idle');
  const [floatingIndicator, setFloatingIndicator] = useState<{ text: string; color: string; type: 'heal' | 'damage' | 'shield' } | null>(null);

  // 3D Rendering & Animation Engine Controllers
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraMode, setCameraMode] = useState<'action' | 'free' | 'cinematic'>('action');
  const [graphicsMode, setGraphicsMode] = useState<'solid' | 'wireframe' | 'neon'>('neon');
  
  // Custom camera math variables
  const yawRef = useRef<number>(-0.4); // horizontal angle
  const pitchRef = useRef<number>(0.25); // vertical angle
  const zoomRef = useRef<number>(1);
  const targetYawRef = useRef<number>(-0.4);
  const targetPitchRef = useRef<number>(0.25);
  const targetZoomRef = useRef<number>(1);
  const mouseIsDown = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRecoilRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  
  // 3D Particles Queue
  const particlesRef = useRef<Particle3D[]>([]);
  const frameIdRef = useRef<number>(0);
  const speedScaleGridRef = useRef<number>(1); // Speed index of scanning neon grid floor

  // Web Audio Synthesizer sound generator
  const playSynthSound = (type: 'attack' | 'crit' | 'shield' | 'heal' | 'hit' | 'victory' | 'defeat') => {
    if (!soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'attack') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.17);
      } else if (type === 'crit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else if (type === 'shield') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'heal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.27);
      } else if (type === 'victory') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'defeat') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (_) {}
  };

  const addLog = (text: string, type: BattleLog['type']) => {
    const freshLog: BattleLog = {
      id: Math.random().toString(36).slice(2),
      text,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setLogs((prev) => [freshLog, ...prev]);
  };

  const handleStartGame = () => {
    setHeroHp(100);
    setHeroMaxHp(100);
    setHeroShield(0);
    setHeroEnergy(35);
    setActiveStageIndex(0);
    
    // Clear particles
    particlesRef.current = [];
    
    const encounter = { ...encounters[0] };
    setCurrentEnemy(encounter);
    
    setLogs([]);
    setGameState('battle');
    setTurn('player');
    
    // Start battle cinematic zoom
    targetZoomRef.current = 1.6;
    setTimeout(() => { targetZoomRef.current = 1.0; }, 800);
    
    addLog(`⚔️ ¡Comienza Batalla RPG 3D! CactuSPEI se enfrenta a [${encounter.name} Lvl. ${encounter.level}]!`, 'system');
    addLog(`💬 ${encounter.name} sonríe: "${encounter.introQuote}"`, 'warning');
    playSynthSound('victory');
  };

  // Turn orchestration listener hook
  useEffect(() => {
    if (gameState !== 'battle' || turn !== 'enemy') return;

    // Enemy artificial brain action delay
    const timer = setTimeout(() => {
      triggerEnemyAction();
    }, 1400);

    return () => clearTimeout(timer);
  }, [turn, gameState]);

  const triggerFloatIndicator = (text: string, color: string, type: 'heal' | 'damage' | 'shield') => {
    setFloatingIndicator({ text, color, type });
    setTimeout(() => setFloatingIndicator(null), 1200);
  };

  // 3D Particles Emitter Helpers
  const spawnParticles = (
    pos: Point3D, 
    type: 'spark' | 'green-heal' | 'blue-shield' | 'gold-spei', 
    count: number, 
    spread: number = 2.5
  ) => {
    const list: Particle3D[] = [];
    const colors = {
      spark: ['#EF4444', '#F43F5E', '#F59E0B', '#FFA500'],
      'green-heal': ['#10B981', '#34D399', '#D1FAE5', '#6EE7B7'],
      'blue-shield': ['#3B82F6', '#60A5FA', '#93C5FD', '#EFF6FF'],
      'gold-spei': ['#EAB308', '#FACC15', '#FEF08A', '#059669', '#34D399']
    };

    const targetColors = colors[type];

    for (let i = 0; i < count; i++) {
      list.push({
        id: Math.random().toString(36).slice(2),
        pos: { ...pos },
        vel: {
          x: (Math.random() - 0.5) * spread * 2,
          y: (Math.random() - 0.4) * spread * 1.5 + (type === 'green-heal' ? 1.5 : 0.5),
          z: (Math.random() - 0.5) * spread * 2
        },
        color: targetColors[Math.floor(Math.random() * targetColors.length)],
        size: Math.random() * 2 + 1,
        life: 0,
        maxLife: Math.random() * 30 + 15,
        type
      });
    }

    particlesRef.current = [...particlesRef.current, ...list];
  };

  // Turn on RPG Skill Strike action with 3D particles & Camera bounce
  const executePlayerSkill = (skillType: 'spei_strike' | '3ds2_shield' | 'split_orchest' | 'ultimate_liq') => {
    if (gameState !== 'battle' || turn !== 'player' || isAnimating !== 'idle') return;

    let dmg = 0;
    let isCrit = false;

    if (skillType === 'spei_strike') {
      isCrit = Math.random() < 0.25;
      dmg = isCrit ? 36 : 22;
      
      if (currentEnemy.weakness === 'direct' || currentEnemy.weakness === 'spei') {
        dmg = Math.floor(dmg * 1.5);
        addLog(`⚡ ¡GOLPE SUPER EFECTIVO! SPEI directo salta la red bancaria tradicional!`, 'warning');
      }

      setIsAnimating('hero-attack');
      
      // Dynamic Action Camera swoop
      if (cameraMode === 'action') {
        targetYawRef.current = -0.7;
        targetPitchRef.current = 0.15;
        targetZoomRef.current = 1.35;
      }

      // Launch golden SPEI projectiles from Hero Location (x: -16, y: 0, z: 0) to Enemy (x: 16, y: 0, z: 0)
      const emitterPos = { x: -16, y: 5, z: 0 };
      setTimeout(() => {
        playSynthSound(isCrit ? 'crit' : 'attack');
        spawnParticles(emitterPos, 'gold-spei', 20, 1.8);
      }, 150);

      setTimeout(() => {
        setIsAnimating('enemy-hit');
        
        // Push camera backward with a recoil effect
        cameraRecoilRef.current = { x: 3, y: -0.5, z: -2 };
        
        // Spawn hit points particles directly at Enemy
        spawnParticles({ x: 16, y: 5, z: 0 }, 'spark', 25, 2.8);

        setCurrentEnemy((prev) => {
          let updatedShield = prev.shield - dmg;
          let shieldDepleted = 0;
          if (updatedShield < 0) {
            shieldDepleted = Math.abs(updatedShield);
            updatedShield = 0;
          }
          const damageToHp = prev.shield > 0 && prev.shield < dmg ? shieldDepleted : (prev.shield === 0 ? dmg : 0);
          const newHp = Math.max(0, prev.hp - damageToHp);
          
          triggerFloatIndicator(`-${dmg} HP`, '#EF4444', 'damage');
          return { ...prev, shield: updatedShield, hp: newHp };
        });

        setHeroEnergy((e) => Math.min(heroMaxEnergy, e + 15));
        addLog(`🌵 CactuSPEI proyecta un [Ataque SPEI 3D] directo causando ${dmg} de daño a ${currentEnemy.name}. (+15 Energía SPEI)`, 'damage-deal');

        setTimeout(() => {
          setIsAnimating('idle');
          if (cameraMode === 'action') {
            targetYawRef.current = -0.4;
            targetPitchRef.current = 0.25;
            targetZoomRef.current = 1.0;
          }
          checkBattleState();
        }, 550);
      }, 500);

    } else if (skillType === '3ds2_shield') {
      if (heroEnergy < 20) {
        addLog(`❌ Energía SPEI insuficiente para activar el escudo 3DS2.`, 'system');
        return;
      }
      
      setIsAnimating('hero-attack');
      setHeroEnergy((e) => Math.max(0, e - 20));
      
      // Dynamic Camera focus
      if (cameraMode === 'action') {
        targetZoomRef.current = 1.4;
        targetYawRef.current = -0.1;
      }

      setTimeout(() => {
        playSynthSound('shield');
        const shieldVal = 30;
        setHeroShield((s) => Math.min(60, s + shieldVal));
        
        // Emit protective glowing blue shields at Hero center
        spawnParticles({ x: -16, y: 5, z: 0 }, 'blue-shield', 25, 1.5);
        
        triggerFloatIndicator(`+30 ESCUDO`, '#3B82F6', 'shield');
        addLog(`🛡️ CactuSPEI levanta [Cúpula de Seguridad 3DS2]. ¡Se añaden 30 de escudo! (-20 Energía SPEI)`, 'shield');
        
        setTimeout(() => {
          setIsAnimating('idle');
          if (cameraMode === 'action') {
            targetZoomRef.current = 1.0;
            targetYawRef.current = -0.4;
          }
          setTurn('enemy');
        }, 500);
      }, 350);

    } else if (skillType === 'split_orchest') {
      if (heroEnergy < 35) {
        addLog(`❌ Energía SPEI insuficiente para organizar la división de fondos.`, 'system');
        return;
      }

      setIsAnimating('hero-attack');
      setHeroEnergy((e) => Math.max(0, e - 35));

      // Dynamic cinematic swing camera
      if (cameraMode === 'action') {
        targetYawRef.current = 0.4;
        targetZoomRef.current = 1.25;
      }

      setTimeout(() => {
        playSynthSound('heal');
        const healValue = 35;
        const splashDmg = 15;

        // Emit green healing matrices surrounding Cactus
        spawnParticles({ x: -16, y: 5, z: 0 }, 'green-heal', 25, 2.0);
        // Emit minor spark particles on Enemy coordinates
        spawnParticles({ x: 16, y: 5, z: 0 }, 'spark', 10, 1.2);

        setHeroHp((h) => Math.min(heroMaxHp, h + healValue));
        
        setCurrentEnemy((prev) => {
          let updatedShield = prev.shield - splashDmg;
          let shieldDepleted = 0;
          if (updatedShield < 0) {
            shieldDepleted = Math.abs(updatedShield);
            updatedShield = 0;
          }
          const damageToHp = prev.shield > 0 && prev.shield < splashDmg ? shieldDepleted : (prev.shield === 0 ? splashDmg : 0);
          const newHp = Math.max(0, prev.hp - damageToHp);
          return { ...prev, shield: updatedShield, hp: newHp };
        });

        triggerFloatIndicator(`+35 RECOOP`, '#10B981', 'heal');
        addLog(`📈 CactuSPEI usa [Split Orquestación API] dispersando comisiones. Recupera ${healValue} HP e inflige ${splashDmg} de daño colateral. (-35 Energía SPEI)`, 'heal');

        setTimeout(() => {
          setIsAnimating('idle');
          if (cameraMode === 'action') {
            targetYawRef.current = -0.4;
            targetZoomRef.current = 1.0;
          }
          checkBattleState();
        }, 550);
      }, 350);

    } else if (skillType === 'ultimate_liq') {
      if (heroEnergy < 100) {
        addLog(`❌ Requieres 100% de Energía SPEI acumulada para la liquidación instantánea del sistema.`, 'system');
        return;
      }

      setIsAnimating('hero-attack');
      setHeroEnergy(0);

      // Fast cinematic zoom on Cactus, then tracking right to match high blow
      if (cameraMode === 'action') {
        targetYawRef.current = -0.9;
        targetPitchRef.current = 0.05;
        targetZoomRef.current = 1.6;
      }

      setTimeout(() => {
        playSynthSound('crit');
        
        // Massive beam burst across the 3D map coordinates
        for (let step = -15; step <= 15; step += 3) {
          setTimeout(() => {
            spawnParticles({ x: step, y: 6, z: 0 }, 'gold-spei', 8, 1.2);
          }, (step + 15) * 8);
        }

        setTimeout(() => {
          setIsAnimating('enemy-hit');
          playSynthSound('hit');
          
          cameraRecoilRef.current = { x: 5, y: -0.8, z: -3.5 };
          spawnParticles({ x: 16, y: 5, z: 0 }, 'spark', 40, 4.0);
          spawnParticles({ x: 16, y: 5, z: 0 }, 'gold-spei', 20, 3.0);

          const ultimateDmg = 85;

          setCurrentEnemy((prev) => {
            // SPEI Direct connects directly to core bank node (bypasses outer shield)
            const newHp = Math.max(0, prev.hp - ultimateDmg);
            triggerFloatIndicator(`¡PIERCING ${ultimateDmg}!`, '#F59E0B', 'damage');
            return { ...prev, hp: newHp };
          });

          addLog(`🔥 ¡CactuSPEI activa [CONEXIÓN DIRECTA STP BANXICO 3D]! Impacto absoluto que perfora escudos enemigos e inflige ${ultimateDmg} de daño directo al sistema.`, 'damage-deal');

          setTimeout(() => {
            setIsAnimating('idle');
            if (cameraMode === 'action') {
              targetYawRef.current = -0.4;
              targetPitchRef.current = 0.25;
              targetZoomRef.current = 1.0;
            }
            checkBattleState();
          }, 550);
        }, 150);

      }, 450);
    }
  };

  const triggerEnemyAction = () => {
    if (gameState !== 'battle') return;

    setIsAnimating('enemy-attack');
    
    // Choose dynamic camera swing focusing behind enemy
    if (cameraMode === 'action') {
      targetYawRef.current = 0.5;
      targetPitchRef.current = 0.15;
      targetZoomRef.current = 1.3;
    }
    
    const attack = currentEnemy.attacks[Math.floor(Math.random() * currentEnemy.attacks.length)];
    const dmg = attack.damage;

    setTimeout(() => {
      // Launch malicious floating visual sparks from Enemy to Cactus
      spawnParticles({ x: 16, y: 5, z: 0 }, 'spark', 15, 2.0);

      setTimeout(() => {
        setIsAnimating('hero-hit');
        playSynthSound('hit');
        
        // Counter-bounce effect on camera
        cameraRecoilRef.current = { x: -3.5, y: 0.4, z: -2 };
        spawnParticles({ x: -16, y: 5, z: 0 }, 'spark', 20, 2.4);

        setHeroShield((currentShield) => {
          let remainingDmg = dmg;
          let nextShield = currentShield - remainingDmg;
          
          if (nextShield < 0) {
            remainingDmg = Math.abs(nextShield);
            nextShield = 0;
            setHeroHp((prevHp) => {
              const nextHp = Math.max(0, prevHp - remainingDmg);
              if (nextHp === 0) {
                setTimeout(() => {
                  setGameState('gameover');
                  playSynthSound('defeat');
                  addLog(`☠️ CactuSPEI fue derrotado por los abusos de ${currentEnemy.name}. Revisa tus opciones en SWASS.`, 'warning');
                }, 400);
              }
              return nextHp;
            });
          }
          
          triggerFloatIndicator(`-${dmg} DAÑO`, '#E11D48', 'damage');
          return nextShield;
        });

        addLog(`💥 ${currentEnemy.name} usa [${attack.name}] en su turno. ${attack.logText} Te cuesta ${dmg} puntos de salud.`, 'damage-taken');

        setTimeout(() => {
          setIsAnimating('idle');
          if (cameraMode === 'action') {
            targetYawRef.current = -0.4;
            targetPitchRef.current = 0.25;
            targetZoomRef.current = 1.0;
          }
          setTurn('player');
        }, 500);
      }, 400);

    }, 350);
  };

  const checkBattleState = () => {
    setCurrentEnemy((enemy) => {
      if (enemy.hp <= 0) {
        setTimeout(() => {
          handleVictory();
        }, 300);
      } else {
        setTurn('enemy');
      }
      return enemy;
    });
  };

  const handleVictory = () => {
    playSynthSound('victory');
    addLog(`🏆 ¡Victoria! El procesador tradicional de ${currentEnemy.name} fue superado por la adquirencia de SWASS.`, 'victory');
    
    // Zoom out to cinematic triumph rotation camera
    targetZoomRef.current = 1.5;
    targetPitchRef.current = 0.4;
    
    const expGain = 50;
    setHeroExp((exp) => {
      let combined = exp + expGain;
      if (combined >= heroMaxExp) {
        combined -= heroMaxExp;
        setHeroLevel((l) => l + 1);
        setHeroMaxHp((h) => h + 15);
        setHeroHp((h) => h + 15); // Auto-heal on Lvl Up
        addLog(`🎉 ¡NIVEL OBTENIDO! Tu adquirencia sube a Lvl ${heroLevel + 1}. Estadísticas máximas incrementadas (+15 Max HP)`, 'system');
      }
      return combined;
    });

    const nextIndex = activeStageIndex + 1;
    if (nextIndex < encounters.length) {
      setActiveStageIndex(nextIndex);
      setGameState('victory-screen');
    } else {
      setGameState('victory-screen'); // Reached top limit
    }
  };

  const handleNextStage = () => {
    const nextEnemy = { ...encounters[activeStageIndex] };
    setCurrentEnemy(nextEnemy);
    setHeroShield(0);
    setGameState('battle');
    setTurn('player');
    
    // Reset camera focus values
    targetZoomRef.current = 1.0;
    targetYawRef.current = -0.4;
    targetPitchRef.current = 0.25;
    
    addLog(`⚔️ Fase ${activeStageIndex + 1}: ¡CactuSPEI avanza contra [${nextEnemy.name} Lvl. ${nextEnemy.level}]!`, 'system');
    addLog(`💬 ${nextEnemy.name} ruge: "${nextEnemy.introQuote}"`, 'warning');
  };

  // Mouse Drag Camera Rotation Handlers (Free Space orbital projection view)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseIsDown.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
    if (cameraMode !== 'free') {
      setCameraMode('free');
      addLog(`📡 Cambio a [Cámara Orbital Libre]. Haz clic y arrastra sobre la arena para rotarla.`, 'system');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseIsDown.current) return;
    const dx = e.clientX - prevMousePos.current.x;
    const dy = e.clientY - prevMousePos.current.y;
    
    // Adjust target values directly based on mouse movement
    targetYawRef.current += dx * 0.007;
    // Limit pitch boundaries to prevent upside-down renders
    targetPitchRef.current = Math.max(-0.2, Math.min(1.2, targetPitchRef.current + dy * 0.007));
    
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    mouseIsDown.current = false;
  };

  // Canvas Vector 3D Render Loop orchestrator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrameId: number;

    // Helper math functions for 3D projections
    const rotateX3D = (p: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
    };

    const rotateY3D = (p: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
    };

    const rotateZ3D = (p: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos, z: p.z };
    };

    // Main real-time projector function (Converts 3D to 2D Canvas pixels)
    const projectPoint = (
      p: Point3D, 
      width: number, 
      height: number, 
      camYaw: number, 
      camPitch: number, 
      fov: number, 
      camDist: number
    ) => {
      // Rotate by horizontal Camera tilt (Y Yaw) and elevation Angle (X Pitch)
      let r = rotateY3D(p, camYaw);
      r = rotateX3D(r, camPitch);

      // Translate by static camera depth offsets
      const zTranslate = r.z + camDist + cameraRecoilRef.current.z;
      if (zTranslate <= 1.0) return null; // Avoid division by zero clip on frustum

      // Focus scaling factor
      const scale = fov / zTranslate;
      const xPixel = (r.x + cameraRecoilRef.current.x) * scale + width / 2;
      const yPixel = -(r.y + cameraRecoilRef.current.y) * scale + height / 2;

      return { x: xPixel, y: yPixel, depth: zTranslate };
    };

    // Helper constructor to quickly create 3D Cylindrical polygon structures
    const createPrismVerts = (radius: number, heightBottom: number, heightTop: number, segments: number = 8): Point3D[] => {
      const list: Point3D[] = [];
      // Top circle vertices
      for (let i = 0; i < segments; i++) {
        const phi = (i * 2 * Math.PI) / segments;
        list.push({ x: radius * Math.cos(phi), y: heightTop, z: radius * Math.sin(phi) });
      }
      // Bottom circle vertices
      for (let i = 0; i < segments; i++) {
        const phi = (i * 2 * Math.PI) / segments;
        list.push({ x: radius * Math.cos(phi), y: heightBottom, z: radius * Math.sin(phi) });
      }
      return list;
    };

    // Loop frame step
    const renderLoop = (time: number) => {
      // Handle canvas auto resize to prevent blurry displays
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      // Smoothly interpolate Camera orientation target values to current values
      yawRef.current += (targetYawRef.current - yawRef.current) * 0.085;
      pitchRef.current += (targetPitchRef.current - pitchRef.current) * 0.085;
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.085;

      // Damp camera recoil friction smoothly back to zero post impact
      cameraRecoilRef.current.x *= 0.85;
      cameraRecoilRef.current.y *= 0.85;
      cameraRecoilRef.current.z *= 0.85;

      // Handle full ambient cinematic camera rotation during menu display or lobby
      if (gameState === 'menu') {
        yawRef.current = Math.sin(time * 0.0004) * 0.5 - 0.2;
        pitchRef.current = 0.2 + Math.cos(time * 0.0006) * 0.06;
      }

      // Set standard clean projection factors
      const fov = 320 * zoomRef.current;
      const camHeight = 35; // Default camera viewing distance

      // Wipe current display
      ctx.fillStyle = '#0a0a0c'; // Deep vector dark theme arcade screen
      ctx.fillRect(0, 0, w, h);

      // Draw aesthetic outer framing or digital grid overlays
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Create a floating array of element rendering primitives to sort via Painter's Depth Algorithm
      const renderingQueue: RenderElement[] = [];

      // 1. PROJECT GROUND NEON INTENSITY RAILS (PERSPECTIVE 3D)
      // Pulse ground speed depending on activity
      speedScaleGridRef.current = isAnimating !== 'idle' ? 1.8 : 0.6;
      const gridScrollTime = (time * 0.04 * speedScaleGridRef.current) % 40;

      // Render horizontal flow grid lines
      for (let zVal = -160 + gridScrollTime; zVal <= 160; zVal += 40) {
        const lineVerts: Point3D[] = [
          { x: -160, y: -0.5, z: zVal },
          { x: 160, y: -0.5, z: zVal }
        ];
        const p1 = projectPoint(lineVerts[0], w, h, yawRef.current, pitchRef.current, fov, camHeight);
        const p2 = projectPoint(lineVerts[1], w, h, yawRef.current, pitchRef.current, fov, camHeight);

        if (p1 && p2) {
          renderingQueue.push({
            type: 'line',
            avgDepth: (p1.depth + p2.depth) / 2,
            p1: { x: p1.x, y: p1.y },
            p2: { x: p2.x, y: p2.y },
            color: turn === 'enemy' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.18)',
            lineWidth: 1.5
          });
        }
      }

      // Render vertical flow grid rails
      for (let xVal = -160; xVal <= 160; xVal += 40) {
        const lineVerts: Point3D[] = [
          { x: xVal, y: -0.5, z: -160 },
          { x: xVal, y: -0.5, z: 160 }
        ];
        const p1 = projectPoint(lineVerts[0], w, h, yawRef.current, pitchRef.current, fov, camHeight);
        const p2 = projectPoint(lineVerts[1], w, h, yawRef.current, pitchRef.current, fov, camHeight);

        if (p1 && p2) {
          renderingQueue.push({
            type: 'line',
            avgDepth: (p1.depth + p2.depth) / 2,
            p1: { x: p1.x, y: p1.y },
            p2: { x: p2.x, y: p2.y },
            color: turn === 'enemy' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.14)',
            lineWidth: 1.0
          });
        }
      }

      // 2. CONSTRUCT HERO 3D CACTUS MODEL ON COORDINATES (x: -16)
      const heroBaseX = -16;
      let heroHeightBob = Math.sin(time * 0.0035) * 0.6;
      let heroAngleRotationX = 0;
      let heroAngleRotationY = Math.sin(time * 0.001) * 0.1; // Gentle horizontal sway in Y
      let heroScaleMultiplier = 1.0;

      // Handle specific attack sequences postures
      if (isAnimating === 'hero-attack') {
        const progress = (time % 800) / 800;
        heroHeightBob = Math.sin(progress * Math.PI) * 5; // Cactus jumps in the air!
        heroAngleRotationY = progress * Math.PI * 4; // Fun 360 spin!
      } else if (isAnimating === 'hero-hit') {
        heroHeightBob = 0;
        heroAngleRotationX = 0.4 * Math.sin(time * 0.08); // Wobbles heavily
        heroScaleMultiplier = 0.9 + 0.1 * Math.sin(time * 0.05);
      }

      // Assemble Cylinder vertices coordinates (8 facets)
      const segmentCount = 8;
      const cactusRadius = 3.6 * heroScaleMultiplier;
      const trunkVerts = createPrismVerts(cactusRadius, -3, 11, segmentCount);
      
      // Calculate geometric translations
      let transformedHeroVerts = trunkVerts.map((v) => {
        let p = { ...v };
        // Apply scales
        p.x *= heroScaleMultiplier;
        p.z *= heroScaleMultiplier;
        // Apply Y local tilts
        p = rotateY3D(p, heroAngleRotationY);
        p = rotateX3D(p, heroAngleRotationX);
        // Translate to battlefield position
        p.x += heroBaseX;
        p.y += heroHeightBob;
        return p;
      });

      // Assemble 3D faces for shading trunk
      // Color scheme adapts depending on selected graphic mode
      const getHeroSideColor = (idx: number) => {
        if (graphicsMode === 'wireframe') return 'transparent';
        if (graphicsMode === 'neon') return 'rgba(16, 185, 129, 0.1)';
        // Solid Flat shaded normals
        const lightIntensity = 0.6 + 0.4 * Math.cos((idx * 2 * Math.PI) / segmentCount - Math.PI / 4);
        const green = Math.floor(150 + 80 * lightIntensity);
        return `rgb(5, ${green}, 105)`;
      };

      for (let i = 0; i < segmentCount; i++) {
        // Quad side faces connecting top and bottom facets
        const next = (i + 1) % segmentCount;
        const faceIndices = [i, next, segmentCount + next, segmentCount + i];
        
        const faceProj = faceIndices.map(idx => transformedHeroVerts[idx]);
        // Calculate projection
        const pCoord = faceProj.map(v => projectPoint(v, w, h, yawRef.current, pitchRef.current, fov, camHeight));

        if (pCoord.every(p => p !== null)) {
          const avgDepth = pCoord.reduce((acc, curr) => acc + (curr ? curr.depth : 0), 0) / 4;
          renderingQueue.push({
            type: 'polygon',
            avgDepth,
            projectedPoints: pCoord.map(p => ({ x: p!.x, y: p!.y })),
            color: getHeroSideColor(i),
            outlineColor: graphicsMode === 'neon' ? '#10B981' : '#047857',
            lineWidth: graphicsMode === 'neon' ? 2 : 1
          });
        }
      }

      // Add cool 3D Cyber Visor (glowing blue horizontal bar in front)
      // Represented by 4 coords floating on top front faces
      const visorVerts: Point3D[] = [
        { x: -3.8, y: 7.2, z: 2.5 },
        { x: 3.8, y: 7.2, z: 2.5 },
        { x: 3.8, y: 5.6, z: 2.5 },
        { x: -3.8, y: 5.6, z: 2.5 }
      ];
      let transformedVisorVerts = visorVerts.map((v) => {
        let p = rotateY3D(v, heroAngleRotationY);
        p = rotateX3D(p, heroAngleRotationX);
        p.x += heroBaseX;
        p.y += heroHeightBob;
        return p;
      });
      const visorProj = transformedVisorVerts.map(v => projectPoint(v, w, h, yawRef.current, pitchRef.current, fov, camHeight));
      if (visorProj.every(p => p !== null)) {
        const avgDepth = visorProj.reduce((acc, curr) => acc + (curr ? curr.depth : 0), 0) / 4;
        renderingQueue.push({
          type: 'polygon',
          avgDepth: avgDepth - 0.2, // Offset to always render slightly on top of body
          projectedPoints: visorProj.map(p => ({ x: p!.x, y: p!.y })),
          color: graphicsMode === 'wireframe' ? 'transparent' : '#06B6D4',
          outlineColor: '#22D3EE',
          lineWidth: 2
        });
      }

      // Add rotating tech hat / Halo rotating elegantly on top coordinates
      const circleSegments = 10;
      const hatY = 12.5;
      const hatRadius = 5.2;
      for (let i = 0; i < circleSegments; i++) {
        const p1Local = {
          x: hatRadius * Math.cos((i * 2 * Math.PI) / circleSegments),
          y: hatY,
          z: hatRadius * Math.sin((i * 2 * Math.PI) / circleSegments)
        };
        const p2Local = {
          x: hatRadius * Math.cos(((i + 1) * 2 * Math.PI) / circleSegments),
          y: hatY,
          z: hatRadius * Math.sin(((i + 1) * 2 * Math.PI) / circleSegments)
        };

        // Render line segments representing 3D cyber-halo
        let p1Rot = rotateY3D(p1Local, heroAngleRotationY + time * 0.002);
        p1Rot = rotateX3D(p1Rot, heroAngleRotationX);
        p1Rot.x += heroBaseX; p1Rot.y += heroHeightBob;

        let p2Rot = rotateY3D(p2Local, heroAngleRotationY + time * 0.002);
        p2Rot = rotateX3D(p2Rot, heroAngleRotationX);
        p2Rot.x += heroBaseX; p2Rot.y += heroHeightBob;

        const p1Proj = projectPoint(p1Rot, w, h, yawRef.current, pitchRef.current, fov, camHeight);
        const p2Proj = projectPoint(p2Rot, w, h, yawRef.current, pitchRef.current, fov, camHeight);

        if (p1Proj && p2Proj) {
          renderingQueue.push({
            type: 'line',
            avgDepth: (p1Proj.depth + p2Proj.depth) / 2,
            p1: { x: p1Proj.x, y: p1Proj.y },
            p2: { x: p2Proj.x, y: p2Proj.y },
            color: '#FBBF24',
            lineWidth: 2.5
          });
        }
      }

      // 3. CONSTRUCT ENEMY 3D MODEL ON THE RIGHT (x: 16)
      const enemyBaseX = 16;
      let enemyHeightBob = Math.sin(time * 0.0022 + Math.PI) * 0.8;
      let enemyAngleRotationY = time * 0.0014;
      let enemyScaleMultiplier = 1.0;
      let enemyRotationX = 0;

      if (isAnimating === 'enemy-attack') {
        const progress = (time % 800) / 800;
        enemyScaleMultiplier = 1.0 + 0.35 * Math.sin(progress * Math.PI);
        enemyAngleRotationY = time * 0.005; // Spikes fast
      } else if (isAnimating === 'enemy-hit') {
        enemyHeightBob = 0;
        enemyRotationX = 0.5 * Math.sin(time * 0.09);
        enemyScaleMultiplier = 0.8;
      }

      // Generates appropriate customized shapes depending on Encounter index
      if (activeStageIndex === 0) {
        // ENEMY 1: COMISIÓN FANTASMA (Transparent wavy vector pyramid ghost)
        const ghostHeight = 12 * enemyScaleMultiplier;
        const ghostWidth = 6.5 * enemyScaleMultiplier;
        
        // Base points + Top spike + Wavy tails
        const ghostVerts: Point3D[] = [
          { x: 0, y: ghostHeight, z: 0 }, // Top vertex [0]
          { x: -ghostWidth, y: 0, z: -ghostWidth }, // bottom corner [1]
          { x: ghostWidth, y: 0, z: -ghostWidth },  // bottom corner [2]
          { x: ghostWidth, y: 0, z: ghostWidth },   // bottom corner [3]
          { x: -ghostWidth, y: 0, z: ghostWidth }    // bottom corner [4]
        ];

        // Animate wavy base ghosts lines
        const wave = Math.sin(time * 0.006) * 1.5;
        ghostVerts[1].y += wave;
        ghostVerts[3].y -= wave;

        let transformedGhostVerts = ghostVerts.map((v) => {
          let p = rotateY3D(v, enemyAngleRotationY);
          p = rotateX3D(p, enemyRotationX);
          p.x += enemyBaseX;
          p.y += enemyHeightBob;
          return p;
        });

        // Shape faces (Pyramid)
        const ghostFaces = [
          [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1]
        ];

        ghostFaces.forEach((idxList, fIdx) => {
          const mVerts = idxList.map(idx => transformedGhostVerts[idx]);
          const mProjs = mVerts.map(v => projectPoint(v, w, h, yawRef.current, pitchRef.current, fov, camHeight));

          if (mProjs.every(p => p !== null)) {
            const avgDepth = mProjs.reduce((acc, curr) => acc + (curr ? curr.depth : 0), 0) / 3;
            renderingQueue.push({
              type: 'polygon',
              avgDepth,
              projectedPoints: mProjs.map(p => ({ x: p!.x, y: p!.y })),
              color: graphicsMode === 'solid' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.1)',
              outlineColor: fIdx % 2 === 0 ? '#C084FC' : '#A855F7',
              lineWidth: 1.5
            });
          }
        });

        // Draw scary evil red eyes in 3D inside ghost
        const eyeOffset = { x: 0, y: ghostHeight * 0.5, z: ghostWidth * 0.8 };
        const leftEyeLocal = { x: eyeOffset.x - 2.0, y: eyeOffset.y, z: eyeOffset.z };
        const rightEyeLocal = { x: eyeOffset.x + 2.0, y: eyeOffset.y, z: eyeOffset.z };

        [leftEyeLocal, rightEyeLocal].forEach((eyeLoc) => {
          let eyeRot = rotateY3D(eyeLoc, enemyAngleRotationY);
          eyeRot = rotateX3D(eyeRot, enemyRotationX);
          eyeRot.x += enemyBaseX; eyeRot.y += enemyHeightBob;

          const eyeProj = projectPoint(eyeRot, w, h, yawRef.current, pitchRef.current, fov, camHeight);
          if (eyeProj) {
            renderingQueue.push({
              type: 'particle',
              avgDepth: eyeProj.depth - 0.2,
              p1: { x: eyeProj.x, y: eyeProj.y },
              color: '#EF4444',
              radius: 4.5
            });
          }
        });

      } else if (activeStageIndex === 1) {
        // ENEMY 2: MONSTRUO DE DECLINACIÓN 3DS1 (Multi-Spiked 3D Polyhedron / Angry Virus Core)
        const size = 6.2 * enemyScaleMultiplier;
        // Vertices of an octahedron with extended spikes
        const spikedVertices: Point3D[] = [
          { x: 0, y: size * 1.5, z: 0 },
          { x: 0, y: -size * 1.5, z: 0 },
          { x: size * 1.5, y: 0, z: 0 },
          { x: -size * 1.5, y: 0, z: 0 },
          { x: 0, y: 0, z: size * 1.5 },
          { x: 0, y: 0, z: -size * 1.5 }
        ];

        let transformedSpikes = spikedVertices.map((v) => {
          let p = rotateY3D(v, enemyAngleRotationY);
          p = rotateZ3D(p, time * 0.001);
          p = rotateX3D(p, enemyRotationX);
          p.x += enemyBaseX;
          p.y += enemyHeightBob + 5;
          return p;
        });

        // Connect central nodes and spikes as lines
        const centerVert = { x: enemyBaseX, y: enemyHeightBob + 5, z: 0 };
        const centerProj = projectPoint(centerVert, w, h, yawRef.current, pitchRef.current, fov, camHeight);

        transformedSpikes.forEach((spk) => {
          const spkProj = projectPoint(spk, w, h, yawRef.current, pitchRef.current, fov, camHeight);
          if (centerProj && spkProj) {
            renderingQueue.push({
              type: 'line',
              avgDepth: (centerProj.depth + spkProj.depth) / 2,
              p1: { x: centerProj.x, y: centerProj.y },
              p2: { x: spkProj.x, y: spkProj.y },
              color: '#EF4444',
              lineWidth: 3.5
            });

            // Outer floating tiny spikes
            renderingQueue.push({
              type: 'particle',
              avgDepth: spkProj.depth - 0.1,
              p1: { x: spkProj.x, y: spkProj.y },
              color: '#FFA500',
              radius: 5.0
            });
          }
        });

        // Orbiting rings of decline circling the core in 3D
        const ringSegments = 12;
        const ringRadius = 10 * enemyScaleMultiplier;
        for (let j = 0; j < ringSegments; j++) {
          const phi1 = (j * 2 * Math.PI) / ringSegments;
          const phi2 = ((j + 1) * 2 * Math.PI) / ringSegments;

          let rPoint1 = { x: ringRadius * Math.cos(phi1), y: 0, z: ringRadius * Math.sin(phi1) };
          let rPoint2 = { x: ringRadius * Math.cos(phi2), y: 0, z: ringRadius * Math.sin(phi2) };

          // Pitch the orbit ring
          rPoint1 = rotateX3D(rPoint1, 0.5);
          rPoint2 = rotateX3D(rPoint2, 0.5);
          
          rPoint1 = rotateY3D(rPoint1, -time * 0.001);
          rPoint2 = rotateY3D(rPoint2, -time * 0.001);

          rPoint1.x += enemyBaseX; rPoint1.y += enemyHeightBob + 5;
          rPoint2.x += enemyBaseX; rPoint2.y += enemyHeightBob + 5;

          const projP1 = projectPoint(rPoint1, w, h, yawRef.current, pitchRef.current, fov, camHeight);
          const projP2 = projectPoint(rPoint2, w, h, yawRef.current, pitchRef.current, fov, camHeight);

          if (projP1 && projP2) {
            renderingQueue.push({
              type: 'line',
              avgDepth: (projP1.depth + projP2.depth) / 2,
              p1: { x: projP1.x, y: projP1.y },
              p2: { x: projP2.x, y: projP2.y },
              color: 'rgba(239, 68, 68, 0.4)',
              lineWidth: 1.5
            });
          }
        }

      } else {
        // ENEMY 3: EL MÁSTER INTERMEDIARIO (Giant floating core emerald-octahedron and defensive shields)
        const coreVerts: Point3D[] = [
          { x: 0, y: 10, z: 0 }, // Top vertex
          { x: 0, y: -10, z: 0 }, // Bottom vertex
          { x: -7, y: 0, z: -7 },  // Base [2]
          { x: 7, y: 0, z: -7 },   // Base [3]
          { x: 7, y: 0, z: 7 },    // Base [4]
          { x: -7, y: 0, z: 7 }     // Base [5]
        ];

        let transformedCore = coreVerts.map((v) => {
          let p = { ...v };
          p.x *= enemyScaleMultiplier;
          p.y *= enemyScaleMultiplier;
          p.z *= enemyScaleMultiplier;
          p = rotateY3D(p, enemyAngleRotationY);
          p = rotateX3D(p, enemyRotationX);
          p.x += enemyBaseX;
          p.y += enemyHeightBob + 4;
          return p;
        });

        const coreFaces = [
          [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 2],
          [1, 3, 2], [1, 4, 3], [1, 5, 4], [1, 2, 5]
        ];

        coreFaces.forEach((idxList, fIdx) => {
          const mVerts = idxList.map(idx => transformedCore[idx]);
          const mProjs = mVerts.map(v => projectPoint(v, w, h, yawRef.current, pitchRef.current, fov, camHeight));

          if (mProjs.every(p => p !== null)) {
            const avgDepth = mProjs.reduce((acc, curr) => acc + (curr ? curr.depth : 0), 0) / 3;
            renderingQueue.push({
              type: 'polygon',
              avgDepth,
              projectedPoints: mProjs.map(p => ({ x: p!.x, y: p!.y })),
              color: graphicsMode === 'solid' ? 'rgba(30, 41, 59, 0.85)' : 'rgba(245, 158, 11, 0.08)',
              outlineColor: fIdx % 2 === 0 ? '#F59E0B' : '#D97706',
              lineWidth: 1.8
            });
          }
        });

        // Draw Orbiting satellite floating shielding boxes
        const satelliteCount = 3;
        for (let s = 0; s < satelliteCount; s++) {
          const angleOffset = (s * 2 * Math.PI) / satelliteCount + time * 0.0015;
          const dist = 14.0 * enemyScaleMultiplier;
          
          let satLoc = {
            x: dist * Math.cos(angleOffset),
            y: Math.sin(time * 0.003 + s) * 2.5,
            z: dist * Math.sin(angleOffset)
          };

          satLoc = rotateY3D(satLoc, enemyAngleRotationY * 0.55);
          satLoc.x += enemyBaseX;
          satLoc.y += enemyHeightBob + 4;

          const satProj = projectPoint(satLoc, w, h, yawRef.current, pitchRef.current, fov, camHeight);
          if (satProj) {
            renderingQueue.push({
              type: 'particle',
              avgDepth: satProj.depth - 0.4,
              p1: { x: satProj.x, y: satProj.y },
              color: '#EF4444',
              radius: 6.0
            });
          }
        }
      }

      // 4. ANIMATE & DRAW ALL ACTIVE 3D COLLISION PARTICLES
      const nextParticlesList: Particle3D[] = [];

      particlesRef.current.forEach((pt) => {
        // Apply micro motion factors
        pt.pos.x += pt.vel.x;
        pt.pos.y += pt.vel.y;
        pt.pos.z += pt.vel.z;
        pt.life++;

        // Project particle
        const ptProj = projectPoint(pt.pos, w, h, yawRef.current, pitchRef.current, fov, camHeight);
        if (ptProj && pt.life < pt.maxLife) {
          renderingQueue.push({
            type: 'particle',
            avgDepth: ptProj.depth - 0.5,
            p1: { x: ptProj.x, y: ptProj.y },
            color: pt.color,
            radius: pt.size * (1 - pt.life / pt.maxLife) * 1.5
          });
          nextParticlesList.push(pt);
        }
      });

      // Update global queue safely
      particlesRef.current = nextParticlesList;

      // 5. PAINT AND RENDER DEPTH-SORTED QUEUE ELEMENTS ON CANVAS (PAINTER'S ALGORITHM)
      renderingQueue.sort((a, b) => b.avgDepth - a.avgDepth);

      renderingQueue.forEach((el) => {
        ctx.save();
        if (el.opacity !== undefined) ctx.globalAlpha = el.opacity;

        if (el.type === 'line' && el.p1 && el.p2) {
          ctx.strokeStyle = el.color;
          ctx.lineWidth = el.lineWidth || 1;
          ctx.beginPath();
          ctx.moveTo(el.p1.x, el.p1.y);
          ctx.lineTo(el.p2.x, el.p2.y);
          ctx.stroke();

        } else if (el.type === 'polygon' && el.projectedPoints) {
          ctx.fillStyle = el.color;
          ctx.beginPath();
          ctx.moveTo(el.projectedPoints[0].x, el.projectedPoints[0].y);
          for (let p = 1; p < el.projectedPoints.length; p++) {
            ctx.lineTo(el.projectedPoints[p].x, el.projectedPoints[p].y);
          }
          ctx.closePath();
          ctx.fill();

          if (el.outlineColor) {
            ctx.strokeStyle = el.outlineColor;
            ctx.lineWidth = el.lineWidth || 1;
            ctx.stroke();
          }

        } else if (el.type === 'particle' && el.p1) {
          // Glow impact aura vectors
          ctx.beginPath();
          ctx.arc(el.p1.x, el.p1.y, el.radius || 3, 0, 2 * Math.PI);
          ctx.fillStyle = el.color;
          ctx.fill();
        }
        ctx.restore();
      });

      // Overlay nice technical stats directly inside the 3D Canvas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`CAMARA: ${cameraMode.toUpperCase()}`, 15, h - 35);
      ctx.fillText(`FPS: 60`, 15, h - 20);
      ctx.fillText(`ROT. HORIZ.: ${(yawRef.current * (180 / Math.PI)).toFixed(0)}°`, 15, h - 50);

      // Simple mouse instruction
      ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.fillText(`CLIC & ARRASTRA PARA ORBITAR LA ARENA 🌐`, w - 240, h - 20);

      localFrameId = requestAnimationFrame(renderLoop);
    };

    localFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(localFrameId);
    };
  }, [gameState, activeStageIndex, graphicsMode, cameraMode, turn, isAnimating]);

  return (
    <div id="cactus-rpg-game-v3" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-2xl overflow-hidden flex flex-col justify-between select-none">
      
      {/* RPG Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
        <div>
          <span className="font-mono text-[9px] text-emerald-500 font-extrabold tracking-wider flex items-center gap-1.5 uppercase bg-emerald-950/70 py-1 px-2.5 rounded-lg border border-emerald-900/60 max-w-max">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            ¡CÓMPUTO GRÁFICO REAL-TIME VECTORES 3D CODIFICADO!
          </span>
          <h3 className="font-display text-xl font-black text-white mt-1.5 tracking-wide">La Leyenda Colectiva de CactuSPEI 3D</h3>
          <p className="text-zinc-400 text-[11.5px] mt-0.5">Enfréntate a los procesadores bancarios tradicionales en un motor renderizado a 3 dimensiones.</p>
        </div>

        {/* Dynamic scoreboard parameters */}
        <div className="flex items-center gap-3.5 bg-zinc-950 border border-zinc-855 p-3 rounded-xl font-mono text-xs shadow-md self-stretch sm:self-auto justify-between text-zinc-300">
          <div className="text-left py-0.5">
            <span className="text-zinc-500 block uppercase tracking-widest text-[8px] font-bold">NIVEL RPG</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
              <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse fill-current" />
              LVL {heroLevel}
            </span>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-left w-20 leading-none">
            <span className="text-zinc-500 block uppercase tracking-widest text-[8px] font-bold">EXP STAGE</span>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${(heroExp / heroMaxExp) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-right">
            <span className="text-zinc-500 block uppercase tracking-widest text-[8px] font-bold">FASE ENTRADA</span>
            <span className="font-black text-rose-450 text-[11px] block text-center">{activeStageIndex + 1} / {encounters.length}</span>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 px-1.5 rounded border border-zinc-750 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:shadow-sm transition-all cursor-pointer"
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div 
            key="rpg-menu-3d"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-8 text-center shadow-lg my-2 flex flex-col items-center justify-center min-h-[350px] overflow-hidden"
          >
            {/* Interactive demo render floating in background */}
            <div className="absolute inset-0 opacity-20 z-0">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            <div className="relative z-10 space-y-4 max-w-lg">
              <div className="text-6xl mb-2 animate-bounce">🌵🕶️</div>
              <span className="font-mono text-[9px] text-emerald-400 tracking-wider uppercase font-black bg-emerald-950/70 border border-emerald-900 px-3 py-1.5 rounded-full shadow-md inline-block">
                MICRO 3D VECTOR GRAPHICS SYSTEM
              </span>
              <h4 className="font-display text-2xl md:text-3xl font-extrabold text-white leading-tight">CACTUS ADVENTURE 3D</h4>
              <p className="text-zinc-300 text-xs mt-2 leading-relaxed font-sans">
                Entra a una arena de batalla en tres dimensiones programada en vectores matemáticos. Combate contra las tarifas ocultas y contracargos usando el poder local directo de <span className="text-emerald-400 font-bold">SWASS SPEI Direct⚡</span>.
              </p>

              <button
                type="button"
                onClick={handleStartGame}
                className="mt-6 mx-auto py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 rounded-xl font-display text-xs font-black uppercase tracking-wider hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Sword className="w-4 h-4 text-emerald-100 animate-pulse fill-emerald-100" />
                Iniciar Motor 3D y Batallar
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'battle' && (
          <motion.div 
            key="rpg-battle-3d"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* REAL-TIME 3D CANVAS VIEWPORT GLASS CABINET */}
            <div className="relative bg-zinc-950 border-2 border-zinc-800 rounded-xl overflow-hidden shadow-2xl h-[280px] md:h-[340px]">
              
              <canvas
                id="rpg-render-core-3d"
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className="w-full h-full block cursor-grab active:cursor-grabbing"
              />

              {/* Dynamic floating combat indicator message */}
              <AnimatePresence>
                {floatingIndicator && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{ opacity: 1, y: -25, scale: 1.25 }}
                    exit={{ opacity: 0 }}
                    style={{ 
                      color: floatingIndicator.color,
                      left: floatingIndicator.type === 'heal' || floatingIndicator.type === 'shield' ? '25%' : '75%'
                    }}
                    className="absolute top-1/3 -translate-x-1/2 z-20 font-mono font-black text-base drop-shadow-[0_4px_6px_rgba(0,0,0,0.95)] tracking-widest uppercase"
                  >
                    {floatingIndicator.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Left Plate: Hero Real-Time Data (Floating vector style) */}
              <div className="absolute top-4 left-4 bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg w-40 backdrop-blur-2xs">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold text-zinc-400">
                  <span>CACTUSPEI (HERO)</span>
                  <span className="text-emerald-400">lvl {heroLevel}</span>
                </div>
                {/* HP Line */}
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mt-1 text-[8px] flex items-center relative">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(heroHp / heroMaxHp) * 100}%` }}
                  />
                  <span className="absolute inset-x-0 text-center font-bold text-white leading-none">
                    {heroHp} / {heroMaxHp} HP
                  </span>
                </div>
                {/* Shield tag */}
                {heroShield > 0 ? (
                  <div className="mt-1 flex items-center gap-1 bg-blue-950/80 border border-blue-800 p-0.5 px-1.5 rounded text-[8px] font-mono text-blue-300">
                    <Shield className="w-2.5 h-2.5 fill-blue-500/30" />
                    ESCUDO PROTECTOR: {heroShield}
                  </div>
                ) : (
                  <div className="text-[7.5px] font-mono text-zinc-500 mt-1">Sin protección activa</div>
                )}
              </div>

              {/* Right Plate: Enemy Real-Time Data (Floating vector style) */}
              <div className="absolute top-4 right-4 bg-zinc-950/80 border border-zinc-800 p-3 rounded-lg w-40 backdrop-blur-2xs text-right">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold text-zinc-400">
                  <span className="text-rose-400">LVL {currentEnemy.level}</span>
                  <span className="truncate leading-none">{currentEnemy.name.toUpperCase()}</span>
                </div>
                {/* HP Line */}
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mt-1 text-[8px] flex items-center relative">
                  <div 
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${(currentEnemy.hp / currentEnemy.maxHp) * 100}%` }}
                    />
                  <span className="absolute inset-x-0 text-center font-bold text-white leading-none">
                    {currentEnemy.hp} / {currentEnemy.maxHp} HP
                  </span>
                </div>
                {/* Enemy Shield tag */}
                {currentEnemy.shield > 0 ? (
                  <div className="mt-1 flex items-center justify-end gap-1 bg-amber-950/80 border border-amber-800 p-0.5 px-1.5 rounded text-[8px] font-mono text-amber-300">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    BARRERA ACTIVA: {currentEnemy.shield}
                  </div>
                ) : (
                  <div className="text-[7.5px] font-mono text-zinc-500 mt-1">Defensas abiertas</div>
                )}
              </div>

              {/* Overlay graphics engine switches */}
              <div className="absolute bottom-4 right-4 flex gap-1.5 bg-zinc-950/80 border border-zinc-800 p-1.5 rounded-lg backdrop-blur-2xs">
                {/* Wireframe solid toggle */}
                <span className="text-[8px] font-mono text-zinc-500 flex items-center justify-center font-bold px-1.5">MODO RENDER:</span>
                {(['solid', 'wireframe', 'neon'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setGraphicsMode(mode)}
                    className={`py-1 px-2 rounded font-mono text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      graphicsMode === mode 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Camera mode selector */}
              <div className="absolute bottom-4 left-4 flex gap-1.5 bg-zinc-950/80 border border-zinc-800 p-1.5 rounded-lg backdrop-blur-2xs">
                <span className="text-[8px] font-mono text-zinc-500 flex items-center justify-center font-bold px-1.5">CÁMARA:</span>
                {([
                  { id: 'action', label: 'ACCIÓN 🎥' },
                  { id: 'free', label: 'LIBRE 🌐' }
                ] as const).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      setCameraMode(cam.id);
                      if (cam.id === 'action') {
                        targetYawRef.current = -0.4;
                        targetPitchRef.current = 0.25;
                        targetZoomRef.current = 1.0;
                      }
                    }}
                    className={`py-1 px-2 rounded font-mono text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      cameraMode === cam.id 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Controller Console */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tactical Skills Selection Board */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4.5 space-y-3.5">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold flex items-center justify-between">
                  <span>🎮 PANEL SISTEMA SPEI 3D</span>
                  <span className="text-zinc-400 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-0.5">
                    {turn === 'player' ? '🟢 TU TURNO (ESPERA COMANDO)' : '⏳ CALCULANDO PROCESO BANCO'}
                  </span>
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={turn !== 'player' || isAnimating !== 'idle'}
                    onClick={() => executePlayerSkill('spei_strike')}
                    className="py-3 px-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-emerald-950 hover:border-emerald-500 disabled:opacity-30 text-left transition-all group cursor-pointer text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-400 fill-emerald-950 group-hover:animate-pulse" />
                      <span className="font-display font-extrabold text-[11px] text-zinc-200">Direct SPEI ⚡</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400 mt-1 leading-normal">
                      Ataque instantáneo en 3D. Inflige de 22 a 36 DMG. Genera +15 Energía.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={turn !== 'player' || isAnimating !== 'idle' || heroEnergy < 20}
                    onClick={() => executePlayerSkill('3ds2_shield')}
                    className="py-3 px-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-blue-950 hover:border-blue-500 disabled:opacity-30 text-left transition-all group cursor-pointer text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="font-display font-extrabold text-[11px] text-zinc-200">Visor 3DS2 🛡️</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400 mt-1 leading-normal">
                      Agrega 30 de escudo antiparasitario contra comisiones. Costo: 20 Energ.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={turn !== 'player' || isAnimating !== 'idle' || heroEnergy < 35}
                    onClick={() => executePlayerSkill('split_orchest')}
                    className="py-3 px-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-amber-950 hover:border-amber-500 disabled:opacity-30 text-left transition-all group cursor-pointer text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="font-display font-extrabold text-[11px] text-zinc-200">Split API 💸</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400 mt-1 leading-normal">
                      Recupera 35 HP y causa 15 DMG reorganizando splits. Costo: 35 Energ.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={turn !== 'player' || isAnimating !== 'idle' || heroEnergy < 100}
                    onClick={() => executePlayerSkill('ultimate_liq')}
                    className="py-3 px-2.5 rounded-xl border-dashed border-2 border-emerald-800 bg-zinc-900 hover:bg-emerald-900/60 hover:border-emerald-400 disabled:opacity-30 text-left transition-all group cursor-pointer text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-emerald-400 animate-bounce" />
                      <span className="font-display font-black text-[11px] text-emerald-200">STP Ultimate 🔥</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400 mt-1 leading-normal">
                      85 DMG total. Traspasa defensas directas al HP enemigo. Requiere 100% Energ.
                    </p>
                  </button>
                </div>

                {/* Energy Indicator bar */}
                <div className="space-y-1.5 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-zinc-200">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-400 font-bold uppercase tracking-wider">⚡ ENERGÍA DE ORQUESTACIÓN SPEI:</span>
                    <span className="text-emerald-400 font-black">{heroEnergy} / {heroMaxEnergy} %</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-full transition-all duration-300 ${heroEnergy === 100 ? 'bg-gradient-to-r from-emerald-500 to-amber-500 animate-pulse' : 'bg-emerald-500'}`}
                      style={{ width: `${(heroEnergy / heroMaxEnergy) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-[10px] font-mono text-zinc-400">
                  <span>Debilidad de Rival actual:</span>
                  <span className="bg-red-950/80 text-rose-350 px-2.5 py-0.5 rounded border border-rose-900 uppercase font-black tracking-widest text-[9px]">
                    {currentEnemy.weaknessLabel}
                  </span>
                </div>
              </div>

              {/* RPG Shell Terminal Logger Feed */}
              <div className="bg-zinc-950 text-zinc-200 rounded-xl p-4 border border-zinc-800 font-mono text-[10px] flex flex-col justify-between h-full min-h-[190px] md:min-h-0">
                <div className="border-b border-zinc-800 pb-1.5 text-zinc-400 font-bold uppercase tracking-wider flex justify-between">
                  <span>📡 LOG DE PROCESAMIENTO BANCO 3D</span>
                  <span className="text-zinc-600">LIVE CORESYNC</span>
                </div>
                
                <div className="flex-1 mt-2 space-y-2 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-zinc-800 pr-1 select-text">
                  {logs.length === 0 ? (
                    <p className="text-zinc-600 italic">Esperando transacciones de cobro en el backend...</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="leading-relaxed border-b border-zinc-900/60 pb-1">
                        <span className="text-zinc-600">[{log.time}] </span>
                        <span 
                          className={
                            log.type === 'damage-deal' ? 'text-emerald-400 font-bold' :
                            log.type === 'damage-taken' ? 'text-red-400 font-bold animate-pulse' :
                            log.type === 'heal' ? 'text-green-400' :
                            log.type === 'shield' ? 'text-blue-400' :
                            log.type === 'system' ? 'text-zinc-450 font-extrabold' :
                            log.type === 'victory' ? 'text-yellow-400 font-bold' :
                            'text-amber-400'
                          }
                        >
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {gameState === 'victory-screen' && (
          <motion.div 
            key="rpg-victory-3d"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-center shadow-lg my-2 flex flex-col items-center justify-center min-h-[350px]"
          >
            <div className="w-14 h-14 bg-yellow-950/80 text-yellow-500 rounded-full border border-yellow-800 shadow-md flex items-center justify-center mb-4 text-3xl animate-bounce">
              🏆
            </div>

            <span className="font-mono text-[9px] text-yellow-405 tracking-wider uppercase font-extrabold bg-yellow-950/60 border border-yellow-905 px-3.5 py-1.5 rounded-full">
              FASE {activeStageIndex} DEBARRADA - COBRO AUTORIZADO
            </span>
            <h4 className="font-display text-2xl font-extrabold text-white mt-3">¡Transacción Exitosa con SWASS!</h4>
            <p className="text-zinc-400 text-xs max-w-sm mt-2 leading-relaxed">
              Has derrotado a <span className="font-extrabold text-zinc-250">{currentEnemy.name}</span>. Tus transacciones fluyen sin intermediarios e incrementas el rendimiento.
            </p>

            <div className="flex gap-4 mt-6">
              {activeStageIndex < encounters.length ? (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white rounded-xl font-display text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                >
                  Siguiente Capitán Bancario
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="py-3 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl font-display text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                >
                  ¡Comenzar de nuevo!
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div 
            key="rpg-gameover-3d"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-center shadow-lg my-2 flex flex-col items-center justify-center min-h-[350px]"
          >
            <div className="w-14 h-14 bg-red-950 text-red-500 rounded-full border border-red-800 flex items-center justify-center mb-4 text-3xl shadow-lg">
              💀
            </div>

            <span className="font-mono text-[9px] text-red-400 tracking-wider uppercase font-extrabold bg-red-950/60 px-3.5 py-1.5 rounded border border-red-900">
              LIQUIDACIÓN DECLINADA (API BLOCKED)
            </span>
            <h4 className="font-display text-2xl font-extrabold text-white mt-3">¡El procesador te dejó en la quiebra!</h4>
            <p className="text-zinc-400 text-xs max-w-sm mt-2 leading-relaxed">
              No dejes que los agregadores internacionales congelen tu dinero. <span className="font-bold text-emerald-400">SPEI directo de SWASS</span> te protege contra estos monstruos.
            </p>

            <div className="flex gap-3.5 mt-6">
              <button
                type="button"
                onClick={handleStartGame}
                className="py-3 px-5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl font-display text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                Reintentar Cobro SPEI 3D
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer controls instructions bar */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px] text-zinc-500 font-semibold border-t border-zinc-800 pt-3">
        <span className="flex items-center gap-1.5 text-zinc-400 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          ESTRATEGIA TURNO POR TURNO: GIRA LA CÁMARA LIBREMENTE PARA APRECIAR LOS VECTORES DE LA ARENA DIGITAL.
        </span>
        <span className="text-emerald-400 font-extrabold bg-emerald-950 border border-emerald-900 px-2 py-0.5 rounded tracking-wide uppercase">
          🔋 SPEI DIRECT +15 ENERGÍA
        </span>
      </div>
    </div>
  );
}
