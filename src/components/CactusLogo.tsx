/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CactusLogoProps {
  className?: string;
  size?: number;
  variant?: 'emerald' | 'charcoal' | 'white';
}

export default function CactusLogo({ className = '', size = 36, variant = 'emerald' }: CactusLogoProps) {
  // Determine gradient / flat colors based on parent request
  const primaryColor = variant === 'emerald' ? 'url(#cactus-grad-emerald)' : variant === 'white' ? '#FFFFFF' : '#181C25';
  const accentColor = variant === 'white' ? 'rgba(255, 255, 255, 0.4)' : '#10B981';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all duration-300`}
      id="swass-svg-cactus-logo"
    >
      <defs>
        <linearGradient id="cactus-grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        
        {/* Card Chip Style Hatching */}
        <pattern id="chip-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 0,8 L 8,0 M 0,0 L 0,8" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Styled Microchip/Card Background plate */}
      <rect x="10" y="10" width="80" height="80" rx="20" fill="transparent" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3" />
      <rect x="18" y="18" width="64" height="64" rx="14" fill={variant === 'white' ? 'rgba(255,255,255,0.03)' : 'rgba(16, 185, 129, 0.02)'} />

      {/* Futuristic chip connection/grid lines */}
      <line x1="50" y1="10" x2="50" y2="18" stroke={accentColor} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />
      <line x1="50" y1="82" x2="50" y2="90" stroke={accentColor} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />
      <line x1="10" y1="50" x2="18" y2="50" stroke={accentColor} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />
      <line x1="82" y1="50" x2="90" y2="50" stroke={accentColor} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />

      {/* Center Geometric Cactus Construction */}
      <g>
        {/* Main Central Trunk */}
        <path 
          d="M45 42 Q45 35 50 35 Q55 35 55 42 L55 75 C55 77.5 53.5 78 50 78 C46.5 78 45 77.5 45 75 Z" 
          fill={primaryColor} 
        />
        
        {/* Left Arm (Starts lower, bends upward) */}
        <path 
          d="M32 46 Q32 40 37 40 L37 45 C37 53 45 53 45 58 L45 61 C42 61 32 58 32 46 Z" 
          fill={primaryColor} 
        />
        
        {/* Right Arm (Starts higher, bends upward) */}
        <path 
          d="M68 38 Q68 32 63 32 L63 37 C63 45 55 45 55 50 L55 53 C58 53 68 50 68 38 Z" 
          fill={primaryColor} 
        />

        {/* Dynamic Microchip Connection nodes (Gold/Emerald sparkling dots) */}
        <circle cx="50" cy="35" r="2.5" fill="#34D399" />
        <circle cx="32" cy="40" r="2.5" fill="#34D399" />
        <circle cx="68" cy="32" r="2.5" fill="#34D399" />
        
        {/* Small horizontal details representing succulent ridges or code branches */}
        <line x1="48" y1="48" x2="52" y2="48" stroke={variant === 'white' ? '#10B981' : '#FFFFFF'} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <line x1="48" y1="56" x2="52" y2="56" stroke={variant === 'white' ? '#10B981' : '#FFFFFF'} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <line x1="48" y1="64" x2="52" y2="64" stroke={variant === 'white' ? '#10B981' : '#FFFFFF'} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}
