/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Sparkles, CheckCircle2, AlertCircle, Building, Mail, User, ShieldCheck, Phone, RefreshCw, X } from 'lucide-react';
import { DemoBooking } from '../types';

export default function MeetingScheduler() {
  const [scheduled, setScheduled] = useState<DemoBooking | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [monthlyVolume, setMonthlyVolume] = useState('$50k-$250k');
  
  // Custom interactive calendar states
  const availableDates = [
    { label: 'Mañana, Mar 26', value: '2026-05-26', weekday: 'Martes' },
    { label: 'Mié, Mar 27', value: '2026-05-27', weekday: 'Miércoles' },
    { label: 'Jue, Mar 28', value: '2026-05-28', weekday: 'Jueves' },
    { label: 'Vie, Mar 29', value: '2026-05-29', weekday: 'Viernes' },
    { label: 'Lun, Jun 01', value: '2026-06-01', weekday: 'Lunes' },
  ];
  const [selectedDate, setSelectedDate] = useState(availableDates[0].value);

  const availableHours = [
    '09:00 AM CST',
    '10:30 AM CST',
    '12:00 PM CST',
    '02:30 PM CST',
    '04:00 PM CST',
    '05:30 PM CST',
  ];
  const [selectedHour, setSelectedHour] = useState(availableHours[1]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    // Read persisted booking if exists
    const local = localStorage.getItem('swass_meeting_booking');
    if (local) {
      try {
        setScheduled(JSON.parse(local));
      } catch (_) {}
    }
  }, []);

  const handleBookDemo = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) return setFormError('Por favor ingresa tu nombre.');
    if (!email.trim() || !email.includes('@')) return setFormError('Ingresa un correo institucional válido.');
    if (!companyName.trim()) return setFormError('El nombre de la empresa es requerido.');
    if (!phoneNumber.trim()) return setFormError('Por favor proporciona un teléfono de contacto.');

    setIsSubmitting(true);

    // Simulate server side registering details with delayed loading
    setTimeout(() => {
      const newBooking: DemoBooking = {
        id: `SW-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        email,
        companyName,
        phoneNumber,
        monthlyVolume,
        preferredDate: selectedDate,
        preferredTime: selectedHour,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('swass_meeting_booking', JSON.stringify(newBooking));
      setScheduled(newBooking);
      setIsSubmitting(false);

      // Trigger Web Audio Confirmation Ping
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc1.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25); // C6

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          osc2.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.25); // E6

          gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 0.55);
          osc2.stop(ctx.currentTime + 0.55);
        }
      } catch (_) {}
    }, 1200);
  };

  const cancelBooking = () => {
    localStorage.removeItem('swass_meeting_booking');
    setScheduled(null);
  };

  const getFriendlyDate = (dateStr: string) => {
    const matched = availableDates.find(d => d.value === dateStr);
    return matched ? `${matched.weekday}, ${matched.label.split(',')[1]}` : dateStr;
  };

  return (
    <div id="booking-scheduler" className="relative max-w-4xl mx-auto bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm animate-fade-in">
      
      {/* Visual neon edge lines representing direct connection */}
      <div className="absolute top-0 left-1/3 right-1/3 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

      <AnimatePresence mode="wait">
        {!scheduled ? (
          <motion.div
            key="booking-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
          >
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="font-mono text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full uppercase tracking-widest font-extrabold inline-flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                INTEGRACIÓN Y ADQUIRENCIA CORPORATIVA
              </span>
              <h3 className="font-display text-2xl md:text-3xl font-extrabold text-zinc-900 mt-2.5">
                Agenda tu sesión con un especialista de SWASS
              </h3>
              <p className="text-zinc-550 text-xs md:text-sm mt-3 leading-relaxed font-sans">
                Analizamos tu modelo de adquirencia, tasas de declinación, conciliaciones de impuestos por split API y te configuramos un entorno Sandbox o cuenta piloto de inmediato.
              </p>
            </div>

            <form onSubmit={handleBookDemo} className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Client Credentials */}
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. David de la Garza"
                      className="w-full bg-zinc-50 border border-zinc-200/90 rounded-xl py-2.5 px-3.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        Correo Corporativo
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@tuempresa.mx"
                        className="w-full bg-zinc-50 border border-zinc-200/90 rounded-xl py-2.5 px-3.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold font-sans">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        Teléfono Móvil
                      </label>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+52 (55) 1234 5678"
                        className="w-full bg-zinc-50 border border-zinc-200/90 rounded-xl py-2.5 px-3.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
                      <Building className="w-3.5 h-3.5 text-zinc-400" />
                      Nombre de la Empresa o Persona Moral
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ej. Comercializadora SWASS, S.A. de C.V."
                      className="w-full bg-zinc-50 border border-zinc-200/90 rounded-xl py-2.5 px-3.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-1 font-bold">
                      Volumen de Procesamiento Mensual Estimado (USD)
                    </label>
                    <select
                      value={monthlyVolume}
                      onChange={(e) => setMonthlyVolume(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3.5 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer font-sans font-medium"
                    >
                      <option value="<$50k">Menor a $50,000 USD al mes</option>
                      <option value="$50k-$250k">$50,000 - $250,000 USD al mes</option>
                      <option value="$250k-$1M">$250,000 - $1,000,000 USD al mes</option>
                      <option value="$1M-$5M">$1,000,000 - $5,000,000 USD al mes</option>
                      <option value="$5M+">Mayor a $5,000,000 USD al mes (Soporte VIP)</option>
                    </select>
                  </div>
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Slot Picker / Planner */}
              <div className="md:col-span-5 space-y-4">
                
                {/* Visual dates list */}
                <div>
                  <span className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    Elegir Fecha Disponible
                  </span>
                  <div className="space-y-1.5">
                    {availableDates.map((date) => (
                      <button
                        key={date.value}
                        type="button"
                        onClick={() => setSelectedDate(date.value)}
                        className={`w-full py-2 px-3 rounded-lg text-left text-xs transition-all flex justify-between items-center border font-medium ${
                          selectedDate === date.value
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-extrabold'
                            : 'bg-zinc-55/40 border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        <span>{date.label}</span>
                        {selectedDate === date.value && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hour slots */}
                <div>
                  <span className="block text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    Horarios Disponibles (CST)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {availableHours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => setSelectedHour(hour)}
                        className={`py-2 px-1 rounded-lg text-center text-[10px] font-mono transition-all border font-bold ${
                          selectedHour === hour
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'bg-zinc-55/40 border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                        }`}
                      >
                        {hour.replace(' CST', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-xl font-display text-xs font-extrabold uppercase tracking-widest transition-all mt-4 border flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                    isSubmitting
                      ? 'bg-zinc-100 text-zinc-450 border-zinc-200 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 hover:scale-[1.015]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      PREPARANDO CONEXIÓN DEL GATEWAY...
                    </>
                  ) : (
                    <>
                      AGENDAR SESIÓN TÉCNICA
                      <Sparkles className="w-4 h-4 text-emerald-100 fill-current" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-4.5 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left leading-relaxed">
              <span className="text-[10px] font-mono text-zinc-450 flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Seguro de grado bancario regulado según PCI-DSS & leyes aplicables.
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                ¿Dudas urgentes? Email: <span className="text-emerald-600 underline font-bold">integraciones@swass.mx</span>
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="booking-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-6 text-center"
          >
            {/* Tick success circle */}
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-250/80 shadow-xs mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <span className="font-mono text-xs text-emerald-600 tracking-widest uppercase font-extrabold">SESIÓN CONFIRMADA</span>
            <h3 className="font-display text-2xl md:text-3xl font-extrabold text-zinc-900 mt-2">¡Todo listo para optimizar tus cobros y adquirencia!</h3>
            <p className="text-zinc-600 text-xs md:text-sm max-w-xl mx-auto mt-2 leading-relaxed font-sans">
              Se ha reservado tu sesión técnica para configurar tu pasarela de adquirencia local y dar de alta tu Sandbox SWASS. Recibirás tu invitación de Google Meet y los accesos iniciales en breve.
            </p>

            {/* Immersive Meeting Ticket style pass (Styled gorgeously with pure white punches that match are background canvas) */}
            <div className="w-full max-w-md bg-zinc-50 rounded-2xl p-6 border border-zinc-200/90 relative mt-6 overflow-hidden shadow-sm">
              
              {/* Ticket punches on left/right using current page white background */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-r border-zinc-200" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-l border-zinc-200" />
              
              {/* Decorative dash line */}
              <div className="absolute inset-x-8 top-1/2 h-[1px] border-b border-dashed border-zinc-200" />

              {/* Upper Ticket Core */}
              <div className="pb-4 flex justify-between items-start font-mono text-[10px] text-zinc-400 font-bold">
                <div className="text-left">
                  <span className="text-zinc-400 block tracking-wider uppercase text-[8px]">COMPAÑÍA REGISTRADA</span>
                  <span className="text-zinc-800 font-extrabold text-xs uppercase mt-0.5 block">{scheduled.companyName}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block tracking-wider uppercase text-[8px]">TICKET DE REGISTRO</span>
                  <span className="text-emerald-600 font-extrabold text-xs mt-0.5 block">{scheduled.id}</span>
                </div>
              </div>

              {/* Middle Ticket Details */}
              <div className="pt-8 pb-1 grid grid-cols-2 gap-4 text-left">
                <div>
                  <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">FECHA REUNIÓN</span>
                  <span className="font-display text-xs md:text-sm font-extrabold text-zinc-800 mt-0.5 block">{getFriendlyDate(scheduled.preferredDate)}</span>
                </div>
                <div>
                  <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-wider block font-bold">HORA DESIGNADA</span>
                  <span className="font-display text-xs md:text-sm font-extrabold text-emerald-600 mt-0.5 block">{scheduled.preferredTime}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between text-[10px] font-mono text-zinc-400">
                <div>
                  <span>VOLUMEN PLAN: </span>
                  <span className="text-zinc-700 font-bold">{scheduled.monthlyVolume} USD / mes</span>
                </div>
                <div>
                  <span>LÍDER: </span>
                  <span className="text-zinc-700 font-bold">{scheduled.name.split(' ')[0]}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={cancelBooking}
                className="py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 font-mono text-[11px] uppercase transition-all flex items-center gap-1.5 font-bold cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5 text-red-500" />
                Cancelar Reunión
              </button>
              
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-850 text-white font-mono text-[11px] uppercase transition-all cursor-pointer shadow-xs hover:bg-zinc-800"
              >
                Imprimir Boleto
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
