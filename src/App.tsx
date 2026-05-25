/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  HelpCircle, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  ArrowLeftRight, 
  Globe2, 
  Menu, 
  X,
  PhoneCall,
  Lock,
  ChevronDown,
  Info,
  Layers,
  Code
} from 'lucide-react';

import CoreRing from './components/CoreRing';
import TransactionSimulator from './components/TransactionSimulator';
import MeetingScheduler from './components/MeetingScheduler';
import BentoFeatures from './components/BentoFeatures';
import CactusLogo from './components/CactusLogo';
import CactusAdventureGame from './components/CactusAdventureGame';
import { TickerRate } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [currencyTickers, setCurrencyTickers] = useState<TickerRate[]>([
    { pair: "USD / MXN", rate: 16.8520, change: -0.12 },
    { pair: "EUR / MXN", rate: 18.2430, change: +0.05 },
    { pair: "GBP / MXN", rate: 21.3910, change: -0.02 },
    { pair: "CAD / MXN", rate: 12.3550, change: +0.18 }
  ]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCoreOp, setActiveCoreOp] = useState<'idle' | 'liq' | 'fraud' | 'split' | 'webhook'>('idle');

  // Key listening for deck navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        activeTab === 0
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setActiveTab((prev) => Math.min(prev + 1, 3));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setActiveTab((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Update rates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrencyTickers(prev => prev.map(t => {
        const offset = (Math.random() - 0.5) * 0.005;
        const newRate = t.rate + offset;
        return {
          ...t,
          rate: Number(newRate.toFixed(4)),
          change: Number((t.change + (Math.random() - 0.5) * 0.02).toFixed(2))
        };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleBookRedirect = () => {
    setActiveTab(3);
    const element = document.getElementById('scheduler-anchor');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-zinc-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Upper Scrolling FX Rates Banner */}
      <div className="w-full bg-zinc-50 border-b border-zinc-150 py-2.5 overflow-hidden z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-6 whitespace-nowrap text-[11px] font-mono">
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="tracking-wider uppercase font-extrabold text-[10px]">TIPO DE CAMBIO EN DIRECTO</span>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            <div className="flex gap-8 justify-center animate-[scrollRates_25s_linear_infinite]">
              {currencyTickers.map((ticker, idx) => (
                <div key={idx} className="flex items-center gap-2 font-semibold">
                  <span className="text-zinc-400 font-bold">{ticker.pair}:</span>
                  <span className="text-zinc-700 font-extrabold">{ticker.rate.toFixed(4)}</span>
                  <span className={`text-[9.5px] px-1.5 py-0.5 font-bold rounded ${ticker.change >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                    {ticker.change >= 0 ? '+' : ''}{ticker.change}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-zinc-450 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mesa Regulada CNBV & FinCEN</span>
          </div>
        </div>
      </div>

      {/* Primary Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-zinc-100 z-40 transition-all shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab(0)}>
            <CactusLogo variant="emerald" size={38} className="hover:scale-[1.08] hover:rotate-6 transition-all duration-350" />
            <div>
              <span className="font-display font-black text-lg text-zinc-900 tracking-wider block">SWASS</span>
              <span className="font-mono text-[9px] text-zinc-400 font-extrabold block leading-none">PSP & ADQUIRENCIA MÉXICO</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5 bg-zinc-50 border border-zinc-200/80 rounded-full p-1 shadow-2xs">
            {[
              { id: 0, label: "01 // SOLUCIÓN" },
              { id: 1, label: "02 // TARIFAS" },
              { id: 2, label: "03 // INGENIERÍA" },
              { id: 3, label: "04 // AGENDAR REUNIÓN" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`px-4 py-1.5 rounded-full font-mono text-[9px] lg:text-[10px] font-bold tracking-wider transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-600 border border-zinc-200/60 shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-900 border border-transparent'
                }`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 3) handleBookRedirect();
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Header Action CTA (Clean and dark similar to Glassdoor Sign-In style) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={handleBookRedirect}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-full font-display text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center gap-2 shadow-xs cursor-pointer hover:scale-[1.02]"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Agendar de Una
            </button>
          </div>

          {/* Mobile menu trigger */}
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile nav menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-b border-zinc-200 bg-white p-4 absolute left-0 right-0 z-30 flex flex-col gap-3 font-mono text-xs shadow-md"
          >
            {[
              { id: 0, label: "01 // SOLUCIÓN" },
              { id: 1, label: "02 // TARIFAS" },
              { id: 2, label: "03 // INGENIERÍA" },
              { id: 3, label: "04 // AGENDAR REUNIÓN" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`py-2 px-3 text-left rounded-lg transition-colors font-bold ${
                  activeTab === tab.id 
                    ? 'bg-zinc-100 text-emerald-600 font-extrabold' 
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                  if (tab.id === 3) handleBookRedirect();
                }}
              >
                {tab.label}
              </button>
            ))}
            <div className="h-px bg-zinc-100 my-1" />
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleBookRedirect();
              }}
              className="w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold uppercase tracking-wider rounded-lg text-xs"
            >
              Agendar de Una con David
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interactive Presentation Show */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="slide-cover"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="space-y-12"
            >
              {/* Top Hero Layout: Pitch on Left, CoreRing Interactive Diagram on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-250/90 rounded-full font-mono text-[10px] text-emerald-700 font-extrabold tracking-widest uppercase shadow-2xs">
                    <Globe2 className="w-3.5 h-3.5 animate-spin-slow text-emerald-600" />
                    MÉXICO MERCHANT SERVICE PSP
                  </div>

                  <h1 className="font-display text-4xl sm:text-5xl lg:text-5.5xl font-extrabold text-zinc-900 tracking-tight leading-tight">
                    No es solo una pasarela.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-500">
                      Es Ingeniería Core.
                    </span>
                  </h1>

                  <p className="text-zinc-650 text-sm md:text-base leading-relaxed max-w-xl font-sans">
                    Bypass a los obsoletos agregadores internacionales de tarjetas. SWASS te provee de adquirencia local de alto rendimiento con splits automáticos y dispersión directa por SPEI.
                  </p>

                  <div className="flex flex-wrap gap-4 items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab(1)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-display text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-[1.015] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      Comparar Comisiones
                      <ArrowRight className="w-4 h-4 text-emerald-100" />
                    </button>
                    <button
                      type="button"
                      onClick={handleBookRedirect}
                      className="px-6 py-3 border border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 rounded-xl font-display text-xs font-bold uppercase tracking-wider text-zinc-650 hover:text-zinc-900 transition-all cursor-pointer"
                    >
                      Agendar Demo Técnica
                    </button>
                  </div>
                </div>

                {/* CoreRing representation */}
                <div className="lg:col-span-5 flex items-center justify-center">
                  <CoreRing activeOp={activeCoreOp} onTriggerOp={(op) => setActiveCoreOp(op)} />
                </div>
              </div>

              {/* Centered Dedicated Game Zone: Full-Width 800px Container with Pristine Spacing */}
              <div className="border-t border-zinc-100 pt-10 max-w-4xl mx-auto w-full">
                <div className="text-center mb-6">
                  <span className="px-3.5 py-1 bg-amber-50 border border-amber-200 rounded-full font-mono text-[9px] text-amber-805 font-extrabold tracking-widest uppercase">
                    ⭐ CACTUS ARCADE INTEGRADO ⭐
                  </span>
                  <h2 className="text-xl md:text-2xl font-serif font-black text-amber-950 mt-2">
                    Cactushead: El Duelo de Adquirencia México
                  </h2>
                  <p className="text-zinc-500 text-xs mt-1 max-w-md mx-auto">
                    Esquiva la usura de los intermediarios y salva la liquidez local de las empresas mexicanas. ¡Haz "Parry" a las facturas magentas!
                  </p>
                </div>
                
                <div className="bg-amber-50/5/10 border border-zinc-200 rounded-2xl p-4 md:p-6 shadow-sm">
                  <CactusAdventureGame />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div
              key="slide-simulator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <TransactionSimulator />
            </motion.div>
          )}

          {activeTab === 2 && (
            <motion.div
              key="slide-benefits"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <BentoFeatures />
            </motion.div>
          )}

          {activeTab === 3 && (
            <motion.div
              key="slide-scheduler"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
              id="scheduler-anchor"
            >
              <MeetingScheduler />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic slide progress navigation overlay dot indicators (Inspired by the premium Glassdoor layouts) */}
        <div className="hidden lg:flex flex-col items-center gap-4 fixed right-8 top-1/2 -translate-y-1/2 z-40 bg-white/90 border border-zinc-200/90 rounded-full py-4.5 px-2.5 shadow-sm backdrop-blur">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              type="button"
              className={`w-3.5 h-3.5 rounded-full relative transition-all duration-300 cursor-pointer ${
                activeTab === idx 
                  ? 'bg-emerald-500 scale-125 shadow-xs' 
                  : 'bg-zinc-250 hover:bg-zinc-400'
              }`}
              onClick={() => {
                setActiveTab(idx);
                if (idx === 3) handleBookRedirect();
              }}
              title={`Slide ${idx + 1}`}
            >
              {activeTab === idx && (
                <span className="absolute right-7 -top-1 font-mono text-[9px] text-emerald-800 font-extrabold uppercase tracking-widest whitespace-nowrap bg-white border border-zinc-200 px-2 py-1 rounded shadow-2xs">
                  {idx === 0 && "SOLUCIÓN"}
                  {idx === 1 && "TARIFAS"}
                  {idx === 2 && "PROPIEDADES"}
                  {idx === 3 && "AGENDAR DE UNA"}
                </span>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Trust & Testimonials Bar (Refined corporate testimonial grid) */}
      <section className="bg-zinc-50 border-t border-zinc-150 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="font-mono text-xs text-emerald-600 font-extrabold tracking-wider block uppercase">NUESTRO COMPROMISO</span>
            <h3 className="font-display text-xl md:text-2xl font-extrabold text-zinc-900 mt-1.5">Confiado por Tesoreros Corporativos en México</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-3xs flex flex-col justify-between hover:shadow-xs transition-all duration-300">
              <p className="text-zinc-650 text-xs md:text-[13px] leading-relaxed italic font-sans font-medium">
                "Aceptar pagos con tarjetas emitidas internacionalmente solía darnos una alta tasa de declinación por parte de los bancos adquirentes tradicionales. Al integrar SWASS todo el procesamiento paso a ser idóneo y local, subiendo la conversión al 98%."
              </p>
              <div className="mt-5 pt-3.5 border-t border-zinc-100 flex items-center justify-between font-sans">
                <div>
                  <span className="text-zinc-900 text-xs font-extrabold font-display block leading-none mb-1">Ing. Fernando Robles</span>
                  <span className="text-[10px] text-zinc-400 font-bold font-mono">CTO, Soluciones E-Commerce Latam</span>
                </div>
                <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">🇲🇽 GDL</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-3xs flex flex-col justify-between hover:shadow-xs transition-all duration-300">
              <p className="text-zinc-650 text-xs md:text-[13px] leading-relaxed italic font-sans font-medium">
                "Nuestros clientes globales pagan en USD con tarjeta y SWASS entrega los pesos a nuestras subsidiarias locales mexicanas mediante SPEI en segundos. Automatizan toda la división de comisiones por split y las conciliaciones impositivas sin esfuerzo."
              </p>
              <div className="mt-5 pt-3.5 border-t border-zinc-100 flex items-center justify-between font-sans">
                <div>
                  <span className="text-zinc-900 text-xs font-extrabold font-display block leading-none mb-1">C.P. Sofía Villarreal</span>
                  <span className="text-[10px] text-zinc-400 font-bold font-mono">Directora de Operaciones, SaaS Ventures</span>
                </div>
                <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">🇲🇽 MTY</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-3xs flex flex-col justify-between hover:shadow-xs transition-all duration-300">
              <p className="text-zinc-650 text-xs md:text-[13px] leading-relaxed italic font-sans font-medium">
                "El API de splits de pago dinámicos de SWASS nos resolvió la complejidad técnica de transferir comisiones a miles de repartidores y aliados locales en toda la república. Todo se dispersa inmediatamente mediante una robusta cola SPEI."
              </p>
              <div className="mt-5 pt-3.5 border-t border-zinc-100 flex items-center justify-between font-sans">
                <div>
                  <span className="text-zinc-900 text-xs font-extrabold font-display block leading-none mb-1">Lic. Mateo de la Garza</span>
                  <span className="text-[10px] text-zinc-400 font-bold font-mono">Director de Operaciones, Delivery RealTime</span>
                </div>
                <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">🇲🇽 CDMX</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Area */}
      <footer className="bg-zinc-50 py-12 border-t border-zinc-150">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <CactusLogo variant="emerald" size={32} />
            <div className="text-left">
              <span className="font-display font-extrabold text-zinc-900 text-sm tracking-wider block">SWASS INTERNATIONAL CO.</span>
              <span className="font-mono text-[9px] text-zinc-400 font-extrabold block">Socio tecnológico SPEI • Regulado bajo mejores prácticas</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-center text-zinc-500 font-mono text-[10px] font-bold">
            <span>© 2026 SWASS. TODOS LOS DERECHOS RESERVADOS.</span>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <a href="#" className="hover:text-emerald-600 transition-colors">Términos del Servicio</a>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <a href="#" className="hover:text-emerald-600 transition-colors">Aviso de Privacidad (CNBV)</a>
          </div>
        </div>
        
        {/* Floating Keyboard Legend help (Clean design note) */}
        <div className="hidden lg:block text-center mt-8 font-mono text-[9.5px] text-zinc-400 tracking-wider font-bold">
          💡 CONSEJO SWASS: USA LAS FLECHAS ◄ ▲ ▼ ► DE TU TECLADO PARA NAVEGAR LAS PÁGINAS DEL DECK DE PRESENTACIÓN
        </div>
      </footer>
    </div>
  );
}

// Custom animation support for FX tickers scroll
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scrollRates {
      0% { transform: translateX(0); }
      100% { transform: translateX(-35%); }
    }
  `;
  document.head.appendChild(style);
}
