/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Coins, Key, Landmark, Layers, ArrowUpRight, Check } from 'lucide-react';

interface BentoItemProps {
  key?: React.Key;
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
  details: string[];
  accentColor: string;
  gridSpan?: string;
}

function BentoItem({ icon, tag, title, description, details, accentColor, gridSpan = 'md:col-span-1' }: BentoItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 flex flex-col justify-between group shadow-xs ${gridSpan} hover:shadow-md transition-all duration-300`}
    >
      {/* Background glow circle that grows on hover */}
      <div 
        className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full blur-[40px] transition-all duration-300 pointer-events-none opacity-5 group-hover:opacity-15"
        style={{ backgroundColor: accentColor }}
      />
      
      {/* Interactive top line border accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-300 transform scale-x-0 group-hover:scale-x-100"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}
      />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-zinc-50 border border-zinc-150 rounded-xl group-hover:border-zinc-250 transition-all text-emerald-600">
            {icon}
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200/60 text-zinc-500 font-extrabold">
            {tag}
          </span>
        </div>

        <h3 className="font-display text-base md:text-lg font-extrabold text-zinc-900 group-hover:text-emerald-700 transition-colors">
          {title}
        </h3>
        
        <p className="text-zinc-650 text-xs mt-2.5 leading-relaxed font-sans">
          {description}
        </p>
      </div>

      <div className="mt-5 pt-3.5 border-t border-zinc-100 space-y-1.5">
        {details.map((detail, idx) => (
          <div key={idx} className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 font-semibold">
            <Check className="w-3.5 h-3.5 text-emerald-600 font-extrabold" />
            <span>{detail}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-between pointer-events-none">
        <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">RECURSOS SEGUROS</span>
        <ArrowUpRight className="w-4 h-4 text-zinc-400 transition-all group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </motion.div>
  );
}

export default function BentoFeatures() {
  const features = [
    {
      icon: <Zap className="w-5 h-5 text-emerald-600" />,
      tag: "PROCESAMIENTO CORE",
      title: "Checkout e Integración de Tarjetas Globales",
      description: "Acepta tarjetas de crédito y débito internacionales en tu plataforma con procesamiento inmediato. Convertimos el importe interbancario de USD a MXN en tiempo real con cero rechazos por bancos locales.",
      details: ["Aceptación de Visa, Mastercard y Amex", "Protocolo de Seguridad 3D Secure 2.0", "Módulo inteligente de prevención de antifraude"],
      accentColor: "#10b981",
      gridSpan: "md:col-span-1 lg:col-span-2"
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      tag: "CUMPLIMIENTO",
      title: "Adquirencia Regulada Local",
      description: "Cumple con las de directrices más exigentes de la banca nacional. Operamos bajo las circulares aplicables de Banco de México, CNBV y con los entes emisores y adquirentes directos de la república.",
      details: ["Certificación PCI-DSS Nivel 1", "Prevención PLD y KYC automatizada", "Reportes listos para conciliaciones"],
      accentColor: "#f59e0b",
      gridSpan: "md:col-span-1 lg:col-span-1"
    },
    {
      icon: <Coins className="w-5 h-5 text-emerald-600" />,
      tag: "SPLITS DE PAGO",
      title: "División de Fondos y Dispersión SPEI",
      description: "Automatiza la división de cobros (splits) para comisiones de de marketplaces o SaaS, y dispersa los retiros inmediatos por SPEI a cualquier tarjeta o cuenta CLABE en segundos.",
      details: ["Orquestación automatizada de comisiones", "Liquidaciones los 365 días del año", "Conciliación por ID de webhook"],
      accentColor: "#3b82f6",
      gridSpan: "md:col-span-1 lg:col-span-1"
    },
    {
      icon: <Layers className="w-5 h-5 text-emerald-600" />,
      tag: "INFRAESTRUCTURA",
      title: "API-First para Desarrolladores Modernos",
      description: "Monta nuestra pasarela de pagos SDK en minutos. Obtén webhooks rápidos que notifican el estatus transaccional inmediatamente a tus sistemas con excelente soporte técnico y Sandbox listos.",
      details: ["SDKs para React, Node y Python", "Webhook retry policy de alta frecuencia", "Entorno Sandbox dedicado para pruebas"],
      accentColor: "#10b981",
      gridSpan: "md:col-span-1 lg:col-span-2"
    }
  ];

  return (
    <div className="w-full">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest font-extrabold block">INFRAESTRUCTURA DE PROCESAMIENTO</span>
        <h3 className="font-display text-2xl md:text-3xl font-extrabold text-zinc-900 mt-1.5">
          La pasarela integral para escalar en México
        </h3>
        <p className="text-zinc-550 text-xs md:text-sm mt-3 leading-relaxed font-sans">
          Te habilitamos para operar de manera global con adquirencia local mexicana de primer nivel y conciliaciones instantáneas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => (
          <BentoItem
            key={idx}
            icon={feat.icon}
            tag={feat.tag}
            title={feat.title}
            description={feat.description}
            details={feat.details}
            accentColor={feat.accentColor}
            gridSpan={feat.gridSpan}
          />
        ))}
      </div>
    </div>
  );
}
