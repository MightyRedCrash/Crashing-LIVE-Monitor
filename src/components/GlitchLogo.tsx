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
        className={`relative ${currentSize.box} bg-black border border-zinc-700/80 rounded-xl flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.9),0_0_12px_rgba(0,255,102,0.15)] group transition-all hover:border-[#00ff66]/50`}
      >
        {/* Cuadrícula sutil de fondo tipo osciloscopio / monitor */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0, 255, 102, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 102, 0.2) 1px, transparent 1px)',
            backgroundSize: '6px 6px',
          }}
        />

        {/* SVG con Señal Verde de Status y Destello Naranja en el Pico */}
        <svg
          viewBox="0 0 44 44"
          className="w-full h-full p-1 relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Resplandor verde para la señal de status */}
            <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#00ff66" floodOpacity="0.8" />
            </filter>

            {/* Degradado radial para el destello naranja */}
            <radialGradient id="orangeFlareRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#ffb300" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#ff6b00" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ff3700" stopOpacity="0" />
            </radialGradient>

            {/* Resplandor para el destello */}
            <filter id="flareGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ff6b00" floodOpacity="0.95" />
            </filter>
          </defs>

          {/* Sombra de la señal de status (profundidad en verde) */}
          <path
            d="M 3 23 L 10 23 L 12.5 21 L 15 25 L 17 18 L 22 7 L 26 33 L 29 20 L 31.5 24 L 34 23 L 41 23"
            stroke="#00ff66"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
          />

          {/* Señal Verde de Status (Línea principal nítida) */}
          <path
            d="M 3 23 L 10 23 L 12.5 21 L 15 25 L 17 18 L 22 7 L 26 33 L 29 20 L 31.5 24 L 34 23 L 41 23"
            stroke="#00ff66"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#greenGlow)"
          />

          {/* Punto de status pulsante en el inicio */}
          <circle cx="5" cy="23" r="1.2" fill="#00ff66" opacity="0.8" />

          {/* ======================================================== */}
          {/* DESTELLO NARANJA SOBRE EL PICO DE LA SEÑAL (X: 22, Y: 7)  */}
          {/* ======================================================== */}
          <g filter="url(#flareGlow)">
            {/* Halo radial expansivo */}
            <circle cx="22" cy="7" r="7" fill="url(#orangeFlareRadial)" />

            {/* Destello horizontal (haz luminoso anamórfico) */}
            <ellipse cx="22" cy="7" rx="8.5" ry="1.2" fill="#ff9900" opacity="0.9" />
            <ellipse cx="22" cy="7" rx="5.5" ry="0.8" fill="#ffffff" opacity="0.95" />

            {/* Destello vertical */}
            <ellipse cx="22" cy="7" rx="1.2" ry="7.5" fill="#ff7700" opacity="0.85" />

            {/* Destellos diagonales en cruz (estrella del destello) */}
            <ellipse cx="22" cy="7" rx="5" ry="0.8" transform="rotate(45 22 7)" fill="#ffaa00" opacity="0.8" />
            <ellipse cx="22" cy="7" rx="5" ry="0.8" transform="rotate(-45 22 7)" fill="#ffaa00" opacity="0.8" />

            {/* Anillo de pulso sutil del destello */}
            <circle cx="22" cy="7" r="3.2" fill="#ff6b00" opacity="0.5" className="animate-ping" />

            {/* Núcleo brillante / punto central blanco incandescente */}
            <circle cx="22" cy="7" r="1.6" fill="#ffffff" />
          </g>
        </svg>

        {/* Pequeño destello de esquina de actividad */}
        <span className="absolute bottom-1 right-1 w-1 h-1 bg-[#00ff66] rounded-full shadow-[0_0_4px_#00ff66]" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-wider uppercase font-mono ${currentSize.text} text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
            >
              CRASHING<span className="text-[#ff6b00] ml-1">LIVE</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-black tracking-widest uppercase bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/50 rounded shadow-[0_0_8px_rgba(0,255,102,0.3)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
              MONITOR
            </span>
          </div>
          <span className={`font-mono text-zinc-300 font-medium ${currentSize.sub} tracking-tight flex items-center gap-1 mt-0.5`}>
            <span className="text-[#00ff66] font-bold tracking-wider uppercase">MONITOR:</span>
            <span className="text-zinc-400">Panel de Control & Telemetría en Tiempo Real</span>
          </span>
        </div>
      )}
    </div>
  );
};

export const AppLogo = GlitchLogo;

