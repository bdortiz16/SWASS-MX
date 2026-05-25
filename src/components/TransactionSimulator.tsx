/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronRight, Calculator, Check, ArrowRight, ShieldCheck, Zap, TrendingUp, DollarSign } from 'lucide-react';

export default function TransactionSimulator() {
  const [amountUSD, setAmountUSD] = useState<number>(150000);
  const [useCase, setUseCase] = useState<'ecommerce' | 'saas' | 'marketplace'>('ecommerce');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [simRes, setSimRes] = useState<any>(null);

  useEffect(() => {
    // Pricing logic
    const swassPct = 0.018;       // 1.80%
    const swassMarkup = 0.0035;    // 0.35% FX
    const swassFixed = 0.15;      // $0.15 USD
    
    const tradPct = 0.039;        // 3.9% (Traditional international card gateway)
    const tradMarkup = 0.025;     // 2.5% fx cross-border markup
    const tradFixed = 0.30;       // $0.30 USD

    // Assume average ticket size is $100 USD (to calculate average count of txs)
    const totalTxns = amountUSD / 100;

    // SWASS PSP
    const swassFee = (amountUSD * swassPct) + (amountUSD * swassMarkup) + (totalTxns * swassFixed);
    // Traditional PSP
    const tradFee = (amountUSD * tradPct) + (amountUSD * tradMarkup) + (totalTxns * tradFixed);

    const savingsUSD = tradFee - swassFee;
    const savingsPercentage = (savingsUSD / amountUSD) * 100;

    setSimRes({
      amountUSD,
      swassFee,
      tradFee,
      savingsUSD,
      savingsPercentage,
      totalTxns
    });
  }, [amountUSD, useCase]);

  const handleStartSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setSimStep(1);
    
    const timeline = [
      { step: 1, delay: 900 },
      { step: 2, delay: 1800 },
      { step: 3, delay: 2800 },
      { step: 4, delay: 3500 }
    ];

    timeline.forEach(({ step, delay }) => {
      setTimeout(() => {
        setSimStep(step);
        if (step === 4) {
          setIsRunning(false);
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
              osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
              osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
              gain.gain.setValueAtTime(0.04, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            }
          } catch (_) {}
        }
      }, delay);
    });
  };

  const formattedUSD = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div id="swass-simulator" className="bg-white border border-zinc-250/90 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      <div className="p-4 md:p-6 border-b border-zinc-100 bg-zinc-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-emerald-600 font-extrabold tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-600" />
            SIMULADOR DE COSTOS DE ADQUIRENCIA PSP
          </span>
          <h3 className="font-display text-xl md:text-2xl font-extrabold text-zinc-900 mt-1">Calcula tu ahorro de procesamiento</h3>
          <p className="text-zinc-500 text-xs md:text-sm mt-0.5">Compara la pasarela SWASS vs Procesadores Internacionales con recargo.</p>
        </div>
        
        {/* Real-time rates banner */}
        <div className="flex gap-3 bg-white p-2.5 rounded-lg border border-zinc-200/80 max-w-max self-start font-mono text-[11px] shadow-xs">
          <div>
            <span className="text-zinc-400 block uppercase tracking-wider text-[8px] font-bold">Tasa SWASS PSP</span>
            <span className="font-extrabold text-emerald-600">1.80% + $0.15 USD</span>
          </div>
          <div className="w-px bg-zinc-200" />
          <div>
            <span className="text-zinc-400 block uppercase tracking-wider text-[8px] font-bold">Agregadores Estándar</span>
            <span className="font-extrabold text-orange-600">3.90% + $0.30 USD</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">
        
        {/* Controls Container: Left */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1.5 flex justify-between font-bold">
              <span>Categoría de Negocio / Giro</span>
              <span className="text-emerald-600 text-[10px] font-extrabold">Estructura Optimizada</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUseCase('ecommerce')}
                className={`py-2 px-3 rounded-md text-xs font-bold border transition-all ${
                  useCase === 'ecommerce' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                E-commerce
              </button>
              <button
                type="button"
                onClick={() => setUseCase('saas')}
                className={`py-2 px-3 rounded-md text-xs font-bold border transition-all ${
                  useCase === 'saas' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                SaaS B2B
              </button>
              <button
                type="button"
                onClick={() => setUseCase('marketplace')}
                className={`py-2 px-3 rounded-md text-xs font-bold border transition-all ${
                  useCase === 'marketplace' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                Marketplace
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed font-sans">
              {useCase === 'ecommerce' && 'Cobro de canastas de consumo en dólares y entrega directa en pesos mexicanos.'}
              {useCase === 'saas' && 'Cobros de membresías recurrentes corporativas con reintentos inteligentes contra declinaciones.'}
              {useCase === 'marketplace' && 'Cobro centralizado y split de pagos dinámicos para repartir comisiones y transferencias a bancos locales.'}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1 font-bold">
              <span>Volumen Procesado Mensual (USD)</span>
              <span className="text-zinc-900 font-extrabold bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200 font-mono text-xs">
                {formattedUSD(amountUSD)}
              </span>
            </div>
            
            <input
              type="range"
              min="10000"
              max="2000000"
              step="10000"
              value={amountUSD}
              onChange={(e) => setAmountUSD(Number(e.target.value))}
              className="w-full accent-emerald-600 my-2 cursor-pointer h-1.5 bg-zinc-100 rounded-lg appearance-none"
            />
            
            <div className="flex justify-between font-mono text-[9px] text-zinc-400 font-semibold">
              <span>$10,000 USD</span>
              <span>$1,000,500 USD</span>
              <span>$2,000,000 USD</span>
            </div>

            {/* Quick selectors */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50000, 150000, 500000, 1000000, 2000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountUSD(preset)}
                  className={`text-[10px] font-mono py-1 px-2.5 rounded border font-semibold transition-all ${
                    amountUSD === preset
                      ? 'bg-zinc-900 text-white border-zinc-800 shadow-xs'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {formattedUSD(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50/50 border border-zinc-200/70">
            <h4 className="text-zinc-800 font-display text-xs font-extrabold uppercase tracking-widest mb-2.5">Desglose SWASS PSP</h4>
            <div className="space-y-1.5 font-mono text-[11px] text-zinc-600">
              <div className="flex justify-between">
                <span>Adquirencia local mexicana</span>
                <span className="text-zinc-900 font-medium">1.80% fijo</span>
              </div>
              <div className="flex justify-between">
                <span>Transacciones estimadas</span>
                <span className="text-zinc-900 font-medium">~{simRes?.totalTxns.toFixed(0)} cobros ($100 avg)</span>
              </div>
              <div className="flex justify-between">
                <span>FX Markup optimizado</span>
                <span className="text-zinc-900 font-medium font-semibold">0.35%</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200">
                <span className="font-bold text-zinc-700">Costo Estimado Mensual</span>
                <span className="text-emerald-600 font-extrabold text-sm">{simRes && formattedUSD(simRes.swassFee)} USD</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={isRunning}
            className={`w-full py-3 px-4 rounded-xl font-display text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${
              isRunning 
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 hover:scale-[1.015]'
            }`}
          >
            {isRunning ? 'CALCULANDO COSTO DE APIS...' : 'EMPEZAR AUDITORIA DE COMISIONES'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Visualization & Savings: Right */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Interactive Screen Display (Stunning light layout with dot-grid matching the premium aesthetics) */}
          <div className="relative bg-[#f8fafc] rounded-xl border border-zinc-200 h-60 md:h-64 overflow-hidden flex flex-col justify-between p-4 shadow-xs bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
            
            {/* Top Bar overlay */}
            <div className="flex justify-between items-center z-10">
              <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CONEXIÓN ADQUIRENTE ACTIVA (CNBV)
              </span>
              <span className="text-[9px] font-mono text-zinc-600 bg-white border border-zinc-200 px-2 py-0.5 rounded shadow-xs">
                METRICS: PSP-PROD
              </span>
            </div>

            {/* Glowing Wire Animation / Diagram */}
            <div className="absolute inset-0 flex items-center justify-between px-8 md:px-14 pointer-events-none opacity-90">
              {/* Card Terminal Node */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full border border-zinc-200 shadow-md flex items-center justify-center relative overflow-hidden">
                  <span className="text-xl">💳</span>
                  <div className="absolute inset-0 bg-transparent rounded-full border border-dashed border-zinc-350/20" />
                </div>
                <span className="font-mono text-[9px] text-zinc-800 font-extrabold mt-2">CLIENTE GLOBAL</span>
                <span className="font-mono text-[8px] text-zinc-400 font-bold">Tarjetas de Crédito</span>
              </div>

              {/* Glowing Line for packets */}
              <div className="flex-1 h-[2px] bg-zinc-200 relative mx-2">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-500/20" />
                
                <AnimatePresence>
                  {isRunning && (
                    <motion.div
                      initial={{ left: '0%' }}
                      animate={{ left: '100%' }}
                      transition={{ duration: 3.5, ease: 'linear', repeat: Infinity }}
                      className="absolute -top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_8px_#10b981]"
                    >
                      <Zap className="w-2.5 h-2.5 text-white p-[1px] fill-current" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute left-1/2 -translate-x-1/2 -top-8 flex flex-col items-center">
                  <div className="bg-white px-3 py-1 rounded-full border border-zinc-200 text-[8px] md:text-[9.5px] font-mono flex items-center gap-1.5 whitespace-nowrap shadow-xs font-bold text-zinc-700">
                    <span className="text-emerald-600">SWASS: 1.80%</span>
                    <span className="text-zinc-400">vs</span>
                    <span className="text-orange-500">Otros: up to 6.40%</span>
                  </div>
                </div>
              </div>

              {/* Merchant Bank Node */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-emerald-500 shadow-md flex items-center justify-center relative overflow-hidden">
                  <span className="text-xl">🏦</span>
                  <div className="absolute inset-0 bg-transparent rounded-full border border-dashed border-emerald-500/20 animate-[spin_40s_linear_infinite]" />
                </div>
                <span className="font-mono text-[9px] text-zinc-800 font-extrabold mt-2">TU BANCO MÉXICO</span>
                <span className="font-mono text-[8px] text-emerald-600 font-extrabold">Pesos Directos</span>
              </div>
            </div>

            {/* Trace Steps Console */}
            <div className="bg-white/95 backdrop-blur border border-zinc-200 shadow-sm rounded-xl p-3 font-mono text-[10px] space-y-1 z-10 mt-auto">
              {!isRunning && simStep === 0 && (
                <div className="text-zinc-400 text-center py-1.5 font-semibold">
                  Haz clic en <span className="text-zinc-700">"EMPEZAR AUDITORIA"</span> para correr el simulador de flujos del PSP.
                </div>
              )}
              {isRunning && (
                <div className="space-y-1 text-zinc-700">
                  <div className={`flex items-center gap-2 ${simStep >= 1 ? 'text-zinc-800 font-semibold' : 'text-zinc-400'}`}>
                    <div className="w-3.5 h-3.5 flex items-center justify-center bg-zinc-100 border rounded-full border-zinc-300">
                      {simStep > 1 ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                    <span>Conectando con adquirente mexicano regulado por CNBV [OK]</span>
                  </div>
                  <div className={`flex items-center gap-2 ${simStep >= 2 ? 'text-zinc-800 font-semibold' : 'text-zinc-400'}`}>
                    <div className="w-3.5 h-3.5 flex items-center justify-center bg-zinc-100 border rounded-full border-zinc-300">
                      {simStep > 2 ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : simStep === 2 ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> : null}
                    </div>
                    <span>Removiendo cargo de emisor cross-border tradicional...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${simStep >= 3 ? 'text-zinc-800 font-semibold' : 'text-zinc-400'}`}>
                    <div className="w-3.5 h-3.5 flex items-center justify-center bg-zinc-100 border rounded-full border-zinc-300">
                      {simStep > 3 ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : simStep === 3 ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> : null}
                    </div>
                    <span>Calculando división de comisiones (Split API) y conciliando SPEI.</span>
                  </div>
                </div>
              )}
              {!isRunning && simStep === 4 && (
                <div className="text-center py-1.5 font-semibold text-emerald-600 flex items-center justify-center gap-1 bg-emerald-50/55 rounded border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>¡PSP ESTADÍSTICAS LISTAS! Procesamiento local en México optimizado con éxito.</span>
                </div>
              )}
            </div>
          </div>

          {/* Value comparison and call to action card */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-50/70 to-zinc-50/50 border border-emerald-200/50 relative overflow-hidden shadow-xs">
            <div className="absolute top-0 right-0 px-2.5 py-1 bg-emerald-600 text-white font-mono font-bold text-[8.5px] uppercase tracking-wider rounded-bl">
              Estructura Corporativa PSP
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 mt-1 shadow-xs">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-sm text-zinc-900 tracking-tight">Ahorro Neto de Procesamiento Mensual</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-2xl md:text-3xl font-extrabold text-emerald-600">
                    {simRes && formattedUSD(simRes.savingsUSD)} USD
                  </span>
                  <span className="font-mono text-zinc-500 text-xs font-semibold">ahorrados al mes</span>
                </div>
                <p className="text-zinc-550 text-[11px] mt-1.5 leading-relaxed font-sans">
                  Al consolidar tus transacciones mediante nuestra adquirencia local de SWASS, dejas de pagar el recargo del 2.5% de cambio de divisas internacional y reduces tus comisiones base.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-zinc-200/90 grid grid-cols-2 gap-4 text-left font-mono">
              <div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Otros Procesadores (6.4%)</span>
                <span className="text-orange-600 text-xs block font-bold mt-0.5">{simRes && formattedUSD(simRes.tradFee)} USD en comisiones</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-emerald-600 uppercase tracking-widest block font-bold">SWASS PSP (2.15%)</span>
                <span className="text-emerald-700 text-xs block font-extrabold mt-0.5">{simRes && formattedUSD(simRes.swassFee)} USD en comisiones</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
