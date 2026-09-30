import React, { useState } from 'react';
import { ConnectedServer, SystemMetricPoint } from '../types';
import { 
  Smartphone, 
  Wifi, 
  Battery, 
  X, 
  Cpu, 
  Activity, 
  Server, 
  HardDrive, 
  Download, 
  Radio, 
  ShieldAlert, 
  CheckCircle2,
  Share2,
  RefreshCw,
  Zap,
  Layers
} from 'lucide-react';

interface AndroidAppViewProps {
  currentServer: ConnectedServer;
  metrics: SystemMetricPoint[];
  currentMetric: SystemMetricPoint;
  onClose: () => void;
  onSimulateSpike: () => void;
}

export const AndroidAppView: React.FC<AndroidAppViewProps> = ({
  currentServer,
  metrics,
  currentMetric,
  onClose,
  onSimulateSpike,
}) => {
  const [activeScreen, setActiveScreen] = useState<'monitor' | 'servers' | 'alerts'>('monitor');

  const cpuHistory = metrics.map((m) => m.cpu);
  const ramHistory = metrics.map((m) => m.ram);

  const generatePath = (data: number[], width: number, height: number, maxVal = 100) => {
    if (!data || data.length < 2) return '';
    const step = width / (data.length - 1);
    return data
      .map((val, index) => {
        const x = index * step;
        const normalized = Math.min(maxVal, Math.max(0, val));
        const y = height - (normalized / maxVal) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      {/* Container with Android Mockup and side panel */}
      <div className="relative max-w-md w-full flex flex-col items-center">
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between mb-3 px-2 text-white font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold text-[10px]">
              ANDROID APK SIMULATOR
            </span>
            <span className="text-zinc-400 text-[11px]">Crashing Live Monitor Mobile</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic Android Smartphone Chassis Frame */}
        <div className="w-full max-w-[360px] h-[720px] bg-black border-[7px] border-zinc-800 rounded-[48px] shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(0,255,102,0.15)] flex flex-col overflow-hidden relative select-none">
          {/* Top Notch & Camera Punch-Hole */}
          <div className="h-6 w-full bg-black flex items-center justify-between px-6 pt-1 text-[10px] text-zinc-400 font-mono z-30 shrink-0">
            <span>09:55</span>
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-[9px] font-bold text-[#00ff66]">5G</span>
              <Wifi className="w-3 h-3 text-[#00ff66]" />
              <Battery className="w-3.5 h-3.5 text-[#00ff66]" />
            </div>
          </div>

          {/* Android App Title Header */}
          <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black font-mono text-white text-xs tracking-wider">
                  CRASHING<span className="text-[#ff6b00]">LIVE</span>
                </span>
                <span className="text-[9px] font-black font-mono px-1.5 py-0.2 rounded bg-[#00ff66]/15 text-[#00ff66]">
                  MONITOR
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {currentServer.name} ({currentServer.latencyMs}ms)
              </span>
            </div>

            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff66]"></span>
            </span>
          </div>

          {/* Scrollable Mobile App Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-mono text-xs text-white">
            {activeScreen === 'monitor' && (
              <div className="space-y-3">
                {/* Server Quick Card */}
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#ff6b00]" />
                    <div>
                      <div className="font-bold text-white text-xs">{currentServer.name}</div>
                      <div className="text-[10px] text-zinc-400">{currentServer.host}:{currentServer.port}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#00ff66]/15 text-[#00ff66]">
                    EN LÍNEA
                  </span>
                </div>

                {/* 1. CPU Mobile Widget */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px] uppercase flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-[#ff6b00]" /> CPU
                    </span>
                    <span className="font-bold text-[#00ff66] text-xs">{currentMetric.cpu}%</span>
                  </div>

                  <div className="h-12 w-full bg-zinc-900/60 rounded border border-zinc-850 flex items-end overflow-hidden">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                      <polyline fill="none" stroke="#ff6b00" strokeWidth="2" points={generatePath(cpuHistory, 100, 40, 100)} />
                    </svg>
                  </div>
                </div>

                {/* 2. RAM Mobile Widget */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px] uppercase flex items-center gap-1">
                      <Activity className="w-3 h-3 text-[#00ff66]" /> Memoria RAM
                    </span>
                    <span className="font-bold text-white text-xs">{currentMetric.ram}%</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00ff66] to-[#ff6b00]" style={{ width: `${currentMetric.ram}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{currentMetric.ramUsedGB.toFixed(1)} GB Usados</span>
                    <span>{currentMetric.ramTotalGB} GB Total</span>
                  </div>
                </div>

                {/* 3. Bandwidth Mobile Widget */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-[11px] uppercase flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-cyan-400" /> Ancho de Banda
                    </span>
                    <span className="text-[10px] text-cyan-400 font-bold">1 Gbps</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-white pt-1">
                    <span>IN: {(currentMetric.netInKB / 1024).toFixed(2)} MB/s</span>
                    <span>OUT: {(currentMetric.netOutKB / 1024).toFixed(2)} MB/s</span>
                  </div>
                </div>

                {/* Quick Touch Action */}
                <button
                  onClick={onSimulateSpike}
                  className="w-full py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-black font-black text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Simular Pico de Carga</span>
                </button>
              </div>
            )}

            {activeScreen === 'servers' && (
              <div className="space-y-2">
                <span className="text-[11px] text-zinc-400 uppercase font-bold block mb-1">
                  Nodos Windows en Red
                </span>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="font-bold text-white text-xs">{currentServer.name}</div>
                  <div className="text-[10px] text-zinc-400">{currentServer.host}:{currentServer.port}</div>
                  <div className="text-[10px] text-[#00ff66] font-bold">Latencia: {currentServer.latencyMs}ms</div>
                </div>
              </div>
            )}

            {activeScreen === 'alerts' && (
              <div className="space-y-2 text-center py-6">
                <CheckCircle2 className="w-8 h-8 mx-auto text-[#00ff66]" />
                <span className="font-bold text-white text-xs block">Sin Incidentes Críticos</span>
                <p className="text-zinc-400 text-[11px]">
                  Todos los servicios de Windows operan con normalidad en {currentServer.name}.
                </p>
              </div>
            )}
          </div>

          {/* Android Bottom App Navigation Bar */}
          <div className="h-12 bg-zinc-950 border-t border-zinc-850 px-6 flex items-center justify-around font-mono text-[10px] shrink-0 z-30">
            <button
              onClick={() => setActiveScreen('monitor')}
              className={`flex flex-col items-center ${activeScreen === 'monitor' ? 'text-[#ff6b00] font-bold' : 'text-zinc-500'}`}
            >
              <Activity className="w-4 h-4 mb-0.5" />
              <span>Monitor</span>
            </button>
            <button
              onClick={() => setActiveScreen('servers')}
              className={`flex flex-col items-center ${activeScreen === 'servers' ? 'text-[#ff6b00] font-bold' : 'text-zinc-500'}`}
            >
              <Server className="w-4 h-4 mb-0.5" />
              <span>Nodos</span>
            </button>
            <button
              onClick={() => setActiveScreen('alerts')}
              className={`flex flex-col items-center ${activeScreen === 'alerts' ? 'text-[#ff6b00] font-bold' : 'text-zinc-500'}`}
            >
              <ShieldAlert className="w-4 h-4 mb-0.5" />
              <span>Alertas</span>
            </button>
          </div>

          {/* Android Home Gesture Pill */}
          <div className="h-4 w-full bg-zinc-950 flex items-center justify-center pb-1 shrink-0 z-30">
            <div className="w-24 h-1 rounded-full bg-zinc-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
