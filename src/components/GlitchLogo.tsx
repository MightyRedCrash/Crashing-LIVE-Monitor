import React from 'react';

interface GlitchLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const GlitchLogo: React.FC<GlitchLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-11 h-11', text: 'text-lg', sub: 'text-[10px]' },
    lg: { box: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Recuadro negro del Logo */}
      <div
        className={`app-logo-box relative ${currentSize.box} bg-black border border-zinc-700/80 rounded-xl flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.9),0_0_12px_rgba(0,255,102,0.15)] group transition-all hover:border-[#00ff66]/50 shrink-0`}
      >
        {/* SVG Minimalista: Servidores en Rack, Servicios y Monitoreo en Tiempo Real */}
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full p-1 relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Resplandor verde para la señal de telemetría y servicios */}
            <filter id="telemetryGreenGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor="#00ff66" floodOpacity="0.85" />
            </filter>

            {/* Resplandor naranja para el destello y alertas */}
            <filter id="telemetryOrangeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ff6b00" floodOpacity="0.95" />
            </filter>

            {/* Degradado radial para el destello: centro blanco puro a naranja */}
            <radialGradient id="destelloBlancoNaranja" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="60%" stopColor="#ffaa00" stopOpacity="0.9" />
              <stop offset="85%" stopColor="#ff6b00" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#ff3700" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ========================================================================= */}
          {/* 1. SERVIDORES: 3 Módulos de Servidor en Rack (Blade Chassis)             */}
          {/* ========================================================================= */}
          {/* Servidor 1 (Superior) */}
          <rect
            x="6.5"
            y="9.5"
            width="35"
            height="7.5"
            rx="2"
            fill="#090d12"
            stroke="#27272a"
            strokeWidth="0.8"
          />
          {/* Servicios Servidor 1: LED Verde (Servicio Web/Host Activo) y Ámbar */}
          <circle cx="10.5" cy="13.25" r="1.4" fill="#00ff66" filter="url(#telemetryGreenGlow)" />
          <circle cx="14.5" cy="13.25" r="1" fill="#ff6b00" opacity="0.85" />
          {/* Rejilla de ventilación / handle rack */}
          <line x1="33" y1="13.25" x2="38" y2="13.25" stroke="#3f3f46" strokeWidth="1" strokeLinecap="round" />

          {/* Servidor 2 (Medio) */}
          <rect
            x="6.5"
            y="19.5"
            width="35"
            height="7.5"
            rx="2"
            fill="#090d12"
            stroke="#27272a"
            strokeWidth="0.8"
          />
          {/* Servicios Servidor 2: LED Verde (PostgreSQL) y Cyan (Red LAN) */}
          <circle cx="10.5" cy="23.25" r="1.4" fill="#00ff66" filter="url(#telemetryGreenGlow)" />
          <circle cx="14.5" cy="23.25" r="1" fill="#00e5ff" opacity="0.85" />
          {/* Rejilla de ventilación / handle rack */}
          <line x1="33" y1="23.25" x2="38" y2="23.25" stroke="#3f3f46" strokeWidth="1" strokeLinecap="round" />

          {/* Servidor 3 (Inferior) */}
          <rect
            x="6.5"
            y="29.5"
            width="35"
            height="7.5"
            rx="2"
            fill="#090d12"
            stroke="#27272a"
            strokeWidth="0.8"
          />
          {/* Servicios Servidor 3: LED Naranja (Daemon) y LED Verde (PowerShell Guard) */}
          <circle cx="10.5" cy="33.25" r="1.4" fill="#ff6b00" opacity="0.9" />
          <circle cx="14.5" cy="33.25" r="1" fill="#00ff66" filter="url(#telemetryGreenGlow)" />
          {/* Rejilla de ventilación / handle rack */}
          <line x1="33" y1="33.25" x2="38" y2="33.25" stroke="#3f3f46" strokeWidth="1" strokeLinecap="round" />

          {/* ========================================================================= */}
          {/* 2. MONITOREO: Señal de Telemetría Verde Neón que Atraviesa los Servidores */}
          {/* ========================================================================= */}
          {/* Sombra de profundidad verde de la señal de monitoreo */}
          <path
            d="M 5 23.25 L 18 23.25 L 20.5 21 L 22.5 25.5 L 24.5 22 L 26.5 23.25 L 28.5 27.5 L 32.5 6 L 36.5 35 L 39 21.5 L 41 23.25 L 43.5 23.25"
            stroke="#00ff66"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.25"
          />

          {/* Línea principal nítida de monitoreo en tiempo real */}
          <path
            d="M 5 23.25 L 18 23.25 L 20.5 21 L 22.5 25.5 L 24.5 22 L 26.5 23.25 L 28.5 27.5 L 32.5 6 L 36.5 35 L 39 21.5 L 41 23.25 L 43.5 23.25"
            stroke="#00ff66"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#telemetryGreenGlow)"
          />

          {/* Pulso inicial de sondeo en la entrada del bus */}
          <circle cx="5" cy="23.25" r="1.2" fill="#00ff66" />

          {/* ========================================================================= */}
          {/* 3. DESTELLO BLANCO CON NARANJA: En el Pico a la Derecha (X: 32.5, Y: 6)   */}
          {/* ========================================================================= */}
          <g filter="url(#telemetryOrangeGlow)">
            {/* Halo radial de blanco incandescente a naranja */}
            <circle cx="32.5" cy="6" r="7.5" fill="url(#destelloBlancoNaranja)" />

            {/* Haz luminoso horizontal (destello anamórfico) */}
            <ellipse cx="32.5" cy="6" rx="8.5" ry="1.3" fill="#ff7700" opacity="0.9" />
            <ellipse cx="32.5" cy="6" rx="5" ry="0.8" fill="#ffffff" opacity="0.98" />

            {/* Haz luminoso vertical */}
            <ellipse cx="32.5" cy="6" rx="1.3" ry="7" fill="#ff7700" opacity="0.88" />
            <ellipse cx="32.5" cy="6" rx="0.8" ry="4" fill="#ffffff" opacity="0.98" />

            {/* Haces estelares diagonales */}
            <ellipse cx="32.5" cy="6" rx="4.5" ry="0.8" transform="rotate(45 32.5 6)" fill="#ff9900" opacity="0.85" />
            <ellipse cx="32.5" cy="6" rx="2.2" ry="0.5" transform="rotate(45 32.5 6)" fill="#ffffff" opacity="0.95" />
            <ellipse cx="32.5" cy="6" rx="4.5" ry="0.8" transform="rotate(-45 32.5 6)" fill="#ff9900" opacity="0.85" />
            <ellipse cx="32.5" cy="6" rx="2.2" ry="0.5" transform="rotate(-45 32.5 6)" fill="#ffffff" opacity="0.95" />

            {/* Anillo de pulso sutil del destello */}
            <circle cx="32.5" cy="6" r="3.2" fill="#ff6b00" opacity="0.45" className="animate-ping" />

            {/* Centro blanco puro incandescente */}
            <circle cx="32.5" cy="6" r="2.1" fill="#ffffff" />
            <circle cx="32.5" cy="6" r="1.1" fill="#ffffff" />
          </g>
        </svg>

        {/* Indicador de actividad en esquina */}
        <span className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff66] rounded-full shadow-[0_0_4px_#00ff66]" />
      </div>

      {showText && (
        <div className="app-brand-name flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`brand-title font-black tracking-wider uppercase font-mono ${currentSize.text} text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
            >
              CRASHING<span className="brand-accent text-[#ff6b00] ml-1">LIVE</span>
            </span>
            <span className="brand-badge px-2 py-0.5 text-[10px] font-mono font-black tracking-widest uppercase bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/50 rounded shadow-[0_0_8px_rgba(0,255,102,0.3)] flex items-center gap-1.5">
              <span className="brand-dot w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
              MONITOR
            </span>
          </div>
          <span className={`font-mono text-zinc-300 font-medium ${currentSize.sub} tracking-tight flex items-center gap-1 mt-0.5`}>
            <span className="brand-sub-badge text-[#00ff66] font-bold tracking-wider uppercase">MONITOR:</span>
            <span className="brand-sub-text text-zinc-400">Panel de Control & Telemetría en Tiempo Real</span>
          </span>
        </div>
      )}
    </div>
  );
};

export const AppLogo = GlitchLogo;

