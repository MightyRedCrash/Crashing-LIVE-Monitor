import React, { useState } from 'react';
import { Wifi, Copy, CheckCircle2, QrCode, Shield, Smartphone, Monitor, RefreshCw, X } from 'lucide-react';

interface RemoteControlModalProps {
  onClose: () => void;
  targetHost: string;
  ipAddress: string;
  port: number;
}

export const RemoteControlModal: React.FC<RemoteControlModalProps> = ({
  onClose,
  targetHost,
  ipAddress,
  port,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [token, setToken] = useState('clk_live_9f82d17c4b00a94e823f6');

  const lanUrl = `http://${ipAddress}:${port}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 3000);
  };

  const handleRegenerateToken = () => {
    const newToken = 'clk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setToken(newToken);
    setCopied('Nuevo token de autenticación generado.');
    setTimeout(() => setCopied(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-5 font-mono text-xs text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#ff6b00]/15 text-[#ff6b00] border border-[#ff6b00]/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Control Remoto en Red Local (LAN)
              </h3>
              <p className="text-zinc-400 text-[11px]">
                Accede y administra {targetHost} desde cualquier otro equipo o teléfono en la misma red.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LAN Access URL */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 text-[11px] block">URL de Conexión en Red:</label>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-black border border-zinc-800">
            <span className="font-bold text-[#00ff66] flex-1 truncate">{lanUrl}</span>
            <button
              onClick={() => copyToClipboard(lanUrl, 'URL')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] transition-colors"
            >
              <Copy className="w-3 h-3 text-[#ff6b00]" />
              <span>Copiar</span>
            </button>
          </div>
        </div>

        {/* Pairing Token */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-zinc-400 text-[11px]">Token de Autorización Administrativa:</label>
            <button
              onClick={handleRegenerateToken}
              className="text-[10px] text-[#ff6b00] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerar</span>
            </button>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-black border border-zinc-800">
            <span className="text-zinc-300 flex-1 truncate font-mono">{token}</span>
            <button
              onClick={() => copyToClipboard(token, 'Token')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] transition-colors"
            >
              <Copy className="w-3 h-3 text-[#00ff66]" />
              <span>Copiar</span>
            </button>
          </div>
        </div>

        {/* QR Code & Mobile Connection Info */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-5">
          {/* Simulated High-Tech Monochromatic QR Matrix */}
          <div className="w-24 h-24 bg-white p-2 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-md">
            <div className="w-full h-full border-2 border-black grid grid-cols-4 gap-0.5 p-1 bg-black">
              <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div>
              <div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
              <div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div>
              <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
              <Smartphone className="w-4 h-4 text-[#ff6b00]" />
              <span>Escaneo Rápido con Móvil</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Apunta la cámara de tu smartphone o laptop en la misma red Wi-Fi para abrir directamente el panel de monitoreo responsivo.
            </p>
          </div>
        </div>

        {/* Active Remote Sessions */}
        <div className="space-y-2">
          <span className="text-zinc-400 text-[11px] block uppercase">Sesiones Remotas Conectadas:</span>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#00ff66]" />
                <div>
                  <div className="font-bold text-white">Workstation-Admin (Windows 11)</div>
                  <div className="text-[10px] text-zinc-500">IP: 192.168.1.88 | Latencia: 3ms</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
                ACTIVA
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
