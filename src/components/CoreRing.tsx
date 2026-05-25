/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRightLeft, Radio, Shield, Layers, Code, Zap } from 'lucide-react';

interface CoreRingProps {
  activeOp?: 'idle' | 'liq' | 'fraud' | 'split' | 'webhook';
  onTriggerOp?: (op: 'liq' | 'fraud' | 'split' | 'webhook') => void;
}

export default function CoreRing({ activeOp = 'idle', onTriggerOp }: CoreRingProps) {
  const [isSparkling, setIsSparkling] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  
  // Spring settings for buttery smooth mouse tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 140, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, -20]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-20, 20]), springConfig);
  const scale = useSpring(1, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ringRef.current) return;
    const rect = ringRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates to -0.5 and 0.5
    const relativeX = (e.clientX - rect.left) / width - 0.5;
    const relativeY = (e.clientY - rect.top) / height - 0.5;
    
    mouseX.set(relativeX);
    mouseY.set(relativeY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
  };

  const handleMouseDown = () => {
    scale.set(0.96);
  };

  const handleMouseUp = () => {
    scale.set(1.02);
    triggerSparkleAndAudio();
  };

  // Synthesizes progressive electronic tech chime
  const triggerSparkleAndAudio = () => {
    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 800);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(587.33, ctx.currentTime);
      carrier.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15);
      
      const sub = ctx.createOscillator();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(293.66, ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.3);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(8, ctx.currentTime);
      filter.frequency.setValueAtTime(1800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.35);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      carrier.connect(filter);
      sub.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      carrier.start();
      sub.start();
      carrier.stop(ctx.currentTime + 0.4);
      sub.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  };

  // Custom audio feedback based on active operation triggering
  useEffect(() => {
    if (activeOp === 'idle') return;
    
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (activeOp === 'liq') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      } else if (activeOp === 'fraud') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      } else if (activeOp === 'split') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.setValueAtTime(261, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(523, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      } else if (activeOp === 'webhook') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(300, ctx.currentTime + 0.05);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.012, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      }

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1000, ctx.currentTime);

      osc.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) {}
  }, [activeOp]);

  // Map dynamic colors based on core active state
  const getStyleTheme = () => {
    switch(activeOp) {
      case 'liq': 
        return {
          glow: 'from-emerald-400/20 to-teal-400/25 shadow-[0_20px_50px_rgba(16,185,129,0.25)]',
          border: 'border-emerald-500/60',
          text: 'text-emerald-600',
          label: 'LIQUIDACIÓN INSTANTÁNEA',
          icon: <Zap className="w-10 h-10 text-emerald-600" />
        };
      case 'fraud': 
        return {
          glow: 'from-amber-400/25 to-orange-400/20 shadow-[0_20px_50px_rgba(245,158,11,0.25)]',
          border: 'border-amber-500/60',
          text: 'text-amber-600',
          label: 'MÓDULO ANTIFRAUDE 3DS2',
          icon: <Shield className="w-10 h-10 text-amber-600" />
        };
      case 'split': 
        return {
          glow: 'from-cyan-400/25 to-blue-400/20 shadow-[0_20px_50px_rgba(6,182,212,0.25)]',
          border: 'border-cyan-500/60',
          text: 'text-cyan-600',
          label: 'ORQUESTADOR SPLITS API',
          icon: <Layers className="w-10 h-10 text-cyan-600" />
        };
      case 'webhook': 
        return {
          glow: 'from-fuchsia-400/25 to-rose-400/20 shadow-[0_20px_50px_rgba(217,70,239,0.25)]',
          border: 'border-fuchsia-500/60',
          text: 'text-fuchsia-600',
          label: 'WEBHOOK TRIGGER DE RIFLE',
          icon: <Code className="w-10 h-10 text-fuchsia-600" />
        };
      case 'idle':
      default:
        return {
          glow: 'from-emerald-400/10 to-emerald-600/10 shadow-[0_20px_45px_rgba(16,185,129,0.12)]',
          border: 'border-zinc-200/90',
          text: 'text-emerald-600',
          label: 'SISTEMA PSP ACTIVO',
          icon: <ArrowRightLeft className="w-10 h-10 text-emerald-600" />
        };
    }
  };

  const theme = getStyleTheme();

  return (
    <div className="relative flex items-center justify-center w-full h-[380px] md:h-[480px]">
      {/* Background luxury radial smooth blur highlight */}
      <div className="absolute w-[320px] h-[320px] md:w-[500px] md:h-[500px] rounded-full bg-emerald-500/5 blur-[100px]" />
      
      {/* Immersive Rotating Ambient Orbit Lines */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Orbit A */}
        <div className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full border border-dashed border-zinc-200/90 animate-[spin_50s_linear_infinite]" />
        {/* Orbit B */}
        <div className="absolute w-[310px] h-[310px] md:w-[410px] md:h-[410px] rounded-full border border-zinc-150 animate-[spin_75s_linear_infinite_reverse]" />
        {/* Interactive glow ring path dot */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-80 h-80 md:w-[380px] md:h-[380px]"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]" />
        </motion.div>
      </div>

      {/* Dynamic Tilt Card Wrapper */}
      <motion.div
        ref={ringRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: "preserve-3d"
        }}
        className="relative w-72 h-72 md:w-92 md:h-92 cursor-pointer flex items-center justify-center select-none animate-fade-in"
      >
        {/* Metallic Ring outer aura */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${theme.glow} blur-2xl transition-all duration-700`} />
        
        {/* Ring Chassis Stage 1: Premium Beveled White edge like Glassdoor card panels */}
        <div 
          className="absolute inset-[4px] rounded-full bg-gradient-to-br from-zinc-200/80 via-white to-zinc-100 p-[1.5px] shadow-[0_15px_40px_rgba(0,0,0,0.06)]"
          style={{ transform: "translateZ(25px)" }}
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-3">
            {/* Dashed micro-tech alignment grid */}
            <div className="w-full h-full rounded-full border border-zinc-100 border-dashed animate-[spin_120s_linear_infinite]" />
          </div>
        </div>

        {/* Ring Chassis Stage 2: Heavy floating pure porcelain white slab with clean borders */}
        <div 
          className={`absolute inset-10 rounded-full border-2 ${theme.border} bg-gradient-to-tr from-white via-zinc-50 to-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_10px_25px_rgba(0,0,0,0.05)] flex items-center justify-center transition-all duration-700`}
          style={{ transform: "translateZ(55px)" }}
        >
          {/* Internal holographic feedback rings */}
          <div className="absolute inset-4 rounded-full border-2 border-dashed border-zinc-200/60 animate-[spin_45s_linear_infinite_reverse]" />
          <div className="absolute inset-8 rounded-full border border-emerald-500/10 animate-[spin_15s_linear_infinite]" />
          
          {/* Compass layout styling ticks */}
          <div className="absolute inset-0 flex items-center justify-between px-3 text-[7.5px] font-mono text-zinc-400 select-none">
            <span>CORE-N-010</span>
            <span>CORE-S-848</span>
          </div>
        </div>

        {/* Ring Chassis Stage 3: Dynamic centered slate glass bubble */}
        <motion.div 
          animate={{
            boxShadow: isSparkling 
              ? ["0 0 10px rgba(16,185,129,0.1)", "0 0 30px rgba(16,185,129,0.35)", "0 0 10px rgba(16,185,129,0.1)"]
              : "0 0 15px rgba(0,0,0,0.03)"
          }}
          transition={{ duration: 0.5 }}
          className="absolute inset-18 rounded-full bg-white border border-zinc-200/80 flex flex-col items-center justify-center text-center p-4 shadow-xl overflow-hidden"
          style={{ transform: "translateZ(85px)" }}
        >
          {/* Glass glare effect reflecting on mouse moves */}
          <div className="absolute -inset-10 bg-gradient-to-b from-black/[0.01] to-transparent skew-y-12 pointer-events-none" />

          {/* Dynamic state icon */}
          <motion.div 
            key={activeOp}
            initial={{ scale: 0.6, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 15 }}
            className={`${theme.text} mb-1.5`}
          >
            {theme.icon}
          </motion.div>
          
          <span className="font-display text-[14px] md:text-[15px] font-extrabold text-zinc-900 tracking-wider leading-none">SWASS</span>
          <span className="font-mono text-[8px] md:text-[9px] text-zinc-400 font-bold tracking-wider mt-1 uppercase">{theme.label}</span>

          {/* Connection heartbeat line pulse */}
          <div className="mt-2 flex items-center justify-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeOp === 'idle' ? 'bg-emerald-400' : 'bg-current'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${activeOp === 'idle' ? 'bg-emerald-500' : 'bg-current font-extrabold'}`}></span>
            </span>
            <span className="font-mono text-[7.5px] text-zinc-500 tracking-wide font-bold uppercase">
              {activeOp === 'idle' ? 'API DISPONIBLE' : 'PROCESANDO'}
            </span>
          </div>
        </motion.div>

        {/* Dynamic Spark / Particle effects on click */}
        <AnimatePresence>
          {isSparkling && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ transform: "translateZ(105px)" }}>
              {[...Array(8)].map((_, i) => {
                const angle = (i * Math.PI) / 4;
                const distX = Math.cos(angle) * 120;
                const distY = Math.sin(angle) * 120;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                    animate={{ 
                      opacity: 0, 
                      scale: [1.3, 0.3], 
                      x: distX, 
                      y: distY 
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                    className="absolute"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Interactive Legend Overlay */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <span className="font-mono text-[9px] text-zinc-600 flex items-center justify-center gap-1.5 bg-zinc-50 border border-zinc-200/80 px-4 py-1.5 rounded-full mx-auto max-w-max shadow-sm backdrop-blur">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
          INTERACTIVO • DESPLÁZATE Y HAZ CLIC EN LA MAQUETA
        </span>
      </div>
    </div>
  );
}
