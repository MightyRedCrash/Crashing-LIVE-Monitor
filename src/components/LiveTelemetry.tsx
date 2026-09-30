import React, { useState } from 'react';
import { SystemMetricPoint, ConnectedServer } from '../types';
import { 
  Cpu, 
  Activity, 
  Wifi, 
  HardDrive, 
  RefreshCw, 
  Zap, 
  TrendingUp, 
  ShieldCheck,
  CheckCircle2,
  Server,
  Layers,
  SlidersHorizontal,
  LayoutGrid,
  Radio,
  Plus,
  Laptop,
  Check
} from 'lucide-react';

interface LiveTelemetryProps {
  metrics: SystemMetricPoint[];
  currentMetric: SystemMetricPoint;
  onSimulateSpike: () => void;
  onRunHealthCheck: () => void;
  targetHost: string;
  servers: ConnectedServer[];
  currentServerId: string;
  onSelectServer: (server: ConnectedServer) => void;
  onOpenServerManager: () => void;
}

export const LiveTelemetry: React.FC<LiveTelemetryProps> = ({
  metrics,
  currentMetric,
  onSimulateSpike,
  onRunHealthCheck,
  targetHost,
  servers,
  currentServerId,
  onSelectServer,
  onOpenServerManager,
}) => {
  const [notification, setNotification] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'detailed' | 'multi-server'>('detailed');
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>(servers.map(s => s.id));
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Home Graph Visibility Toggles
  const [visibleGraphs, setVisibleGraphs] = useState({
    cpu: true,
    ram: true,
    bandwidth: true,
    disk: true,
    cores: true,
    processes: true,
  });

  const activeServer = servers.find((s) => s.id === currentServerId) || servers[0];

  // Helper for generating smooth SVG polyline sparklines
  const generatePath = (
    data: number[],
    width: number,
    height: number,
    maxVal: number = 100
  ) => {
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

  const cpuHistory = metrics.map((m) => m.cpu);
  const ramHistory = metrics.map((m) => m.ram);
  const netInHistory = metrics.map((m) => m.netInKB);
  const maxNetIn = Math.max(...netInHistory, 1000);
  const diskReadHistory = metrics.map((m) => m.diskReadMB);
  const maxDisk = Math.max(...diskReadHistory, 10);

  // Per-core loads based on aggregate CPU
  const simulatedCores = [
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 1.15))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 0.85))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 1.05))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 0.95))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 0.70))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 1.25))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 0.60))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 1.10))),
  ];

  const handleQuickFlush = () => {
    setNotification('Standby Memory Cache purgado con éxito. 1.4 GB liberados en ' + activeServer.name);
    setTimeout(() => setNotification(null), 4000);
  };

  const toggleServerSelection = (id: string) => {
    if (selectedServerIds.includes(id)) {
      if (selectedServerIds.length > 1) {
        setSelectedServerIds(selectedServerIds.filter((sId) => sId !== id));
      }
    } else {
      setSelectedServerIds([...selectedServerIds, id]);
    }
  };

  const selectAllServers = () => {
    setSelectedServerIds(servers.map((s) => s.id));
  };

  const selectedServersList = servers.filter((s) => selectedServerIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/40 text-[#00ff66] font-mono text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* HOME DASHBOARD CONTROLS & SERVER SELECTION BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ff6b00]">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Panel de Monitoreo Home Multiserver
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
                  {selectedServersList.length} de {servers.length} Servidores
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Visualización adaptativa (3 gráficas en pantalla completa, 2 en pantallas medianas y 1 en móviles).
              </p>
            </div>
          </div>

          {/* Mode Switcher & Admin Config */}
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all whitespace-nowrap ${
                viewMode === 'detailed'
                  ? 'bg-[#ff6b00] text-black shadow-[0_0_12px_rgba(255,107,0,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Servidor Seleccionado</span>
            </button>

            <button
              onClick={() => setViewMode('multi-server')}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all whitespace-nowrap ${
                viewMode === 'multi-server'
                  ? 'bg-[#00ff66] text-black font-black shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Multi-Servidor ({selectedServersList.length})</span>
            </button>

            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className={`p-2 rounded-lg border font-mono text-xs transition-colors ${
                showConfigPanel
                  ? 'bg-zinc-850 text-white border-zinc-600'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800'
              }`}
              title="Administrar gráficas y servidores visibles"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Server Selection Chips / Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-zinc-500 font-mono text-[11px] uppercase mr-1">Filtrar Servidores:</span>
          {servers.map((srv) => {
            const isSelected = selectedServerIds.includes(srv.id);
            const isCurrentActive = srv.id === currentServerId;

            return (
              <button
                key={srv.id}
                onClick={() => {
                  toggleServerSelection(srv.id);
                  if (viewMode === 'detailed') onSelectServer(srv);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs transition-all border ${
                  isSelected
                    ? isCurrentActive
                      ? 'bg-[#00ff66]/15 text-[#00ff66] border-[#00ff66]/50 font-bold shadow-[0_0_8px_rgba(0,255,102,0.2)]'
                      : 'bg-zinc-900 text-white border-zinc-700 font-medium'
                    : 'bg-zinc-950 text-zinc-500 border-zinc-850 opacity-60'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSelected ? (isCurrentActive ? 'bg-[#00ff66]' : 'bg-[#ff6b00]') : 'bg-zinc-600'
                  }`}
                />
                <span>{srv.name}</span>
                <span className="text-[10px] text-zinc-400">({srv.latencyMs}ms)</span>
                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}

          <button
            onClick={selectAllServers}
            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[11px] border border-zinc-800"
          >
            Todos
          </button>

          <button
            onClick={onOpenServerManager}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 text-[#ff6b00] font-mono text-[11px] font-bold border border-[#ff6b00]/30 transition-colors ml-auto"
          >
            <Plus className="w-3 h-3" />
            <span>Vincular Servidor</span>
          </button>
        </div>

        {/* Expandable Home Dashboard Customizer Panel */}
        {showConfigPanel && (
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-white uppercase text-[11px]">
                Personalizar Gráficas en Vista de Inicio
              </span>
              <span className="text-[10px] text-zinc-500">Distribución Responsive 3 &gt; 2 &gt; 1</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <label className="flex items-center gap-2 p-2 rounded bg-black/60 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleGraphs.cpu}
                  onChange={(e) => setVisibleGraphs({ ...visibleGraphs, cpu: e.target.checked })}
                  className="rounded text-[#ff6b00]"
                />
                <span className="text-zinc-300 text-[11px]">Gráfica CPU</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-black/60 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleGraphs.ram}
                  onChange={(e) => setVisibleGraphs({ ...visibleGraphs, ram: e.target.checked })}
                  className="rounded text-[#ff6b00]"
                />
                <span className="text-zinc-300 text-[11px]">Gráfica RAM</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-black/60 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleGraphs.bandwidth}
                  onChange={(e) => setVisibleGraphs({ ...visibleGraphs, bandwidth: e.target.checked })}
                  className="rounded text-[#ff6b00]"
                />
                <span className="text-zinc-300 text-[11px]">Ancho de Banda</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-black/60 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleGraphs.disk}
                  onChange={(e) => setVisibleGraphs({ ...visibleGraphs, disk: e.target.checked })}
                  className="rounded text-[#ff6b00]"
                />
                <span className="text-zinc-300 text-[11px]">Disco C:\</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-black/60 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleGraphs.cores}
                  onChange={(e) => setVisibleGraphs({ ...visibleGraphs, cores: e.target.checked })}
                  className="rounded text-[#ff6b00]"
                />
                <span className="text-zinc-300 text-[11px]">Matriz Núcleos</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-black/60 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleGraphs.processes}
                  onChange={(e) => setVisibleGraphs({ ...visibleGraphs, processes: e.target.checked })}
                  className="rounded text-[#ff6b00]"
                />
                <span className="text-zinc-300 text-[11px]">Árbol Procesos</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: DETALLE DEL SERVIDOR SELECCIONADO (GRID RESPONSIVE 3 > 2 > 1)   */}
      {/* ========================================================================= */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {/* Active Server Context Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#ff6b00]">
                {activeServer.osType.includes('Server') ? (
                  <Server className="w-5 h-5" />
                ) : (
                  <Laptop className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-mono">{activeServer.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
                    EN LÍNEA ({activeServer.latencyMs}ms)
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  {activeServer.host}:{activeServer.port} • {activeServer.osType} • Python 3.12 Daemon
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onSimulateSpike}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
                title="Simular un pico de carga en este servidor"
              >
                <Zap className="w-3.5 h-3.5 text-[#ff6b00]" />
                <span>Simular Pico</span>
              </button>

              <button
                onClick={handleQuickFlush}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#00ff66]" />
                <span>Purgar RAM</span>
              </button>

              <button
                onClick={onRunHealthCheck}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold text-xs font-mono transition-colors shadow-[0_0_12px_rgba(255,107,0,0.3)]"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Diagnóstico IA</span>
              </button>
            </div>
          </div>

          {/* MAIN RESPONSIVE GRAPHS GRID: 3 WIDE ON FULLSCREEN, 2 ON TABLET/MEDIUM, 1 ON MOBILE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* 1. CPU Utilization Graph */}
            {visibleGraphs.cpu && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#ff6b00]" /> CPU (Multi-Core)
                    </span>
                    <span className={`text-xs font-mono font-bold ${currentMetric.cpu > 80 ? 'text-red-400' : 'text-[#00ff66]'}`}>
                      {currentMetric.cpu}%
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      {currentMetric.cpu}
                      <span className="text-sm font-normal text-zinc-500 ml-0.5">%</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">@ 3.40 GHz</span>
                  </div>

                  {/* Sparkline Graph */}
                  <div className="mt-3 h-16 w-full bg-zinc-900/60 rounded border border-zinc-800/60 relative overflow-hidden flex items-end">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                      <polyline
                        fill="none"
                        stroke="#ff6b00"
                        strokeWidth="2"
                        points={generatePath(cpuHistory, 100, 40, 100)}
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>8 Cores / 16 Threads</span>
                  <span className="text-zinc-300">Temp: 44°C</span>
                </div>
              </div>
            )}

            {/* 2. RAM Memory Graph */}
            {visibleGraphs.ram && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#00ff66]" /> Memoria RAM
                    </span>
                    <span className={`text-xs font-mono font-bold ${currentMetric.ram > 85 ? 'text-red-400' : 'text-[#00ff66]'}`}>
                      {currentMetric.ram}%
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      {currentMetric.ramUsedGB.toFixed(1)}
                      <span className="text-sm font-normal text-zinc-500 ml-1">/ {currentMetric.ramTotalGB} GB</span>
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00ff66] to-[#ff6b00] transition-all duration-500"
                        style={{ width: `${currentMetric.ram}%` }}
                      />
                    </div>
                    <div className="mt-2 h-10 w-full bg-zinc-900/60 rounded border border-zinc-800/60 relative overflow-hidden flex items-end">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                        <polyline
                          fill="none"
                          stroke="#00ff66"
                          strokeWidth="2"
                          points={generatePath(ramHistory, 100, 30, 100)}
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Cache: 4.8 GB</span>
                  <span className="text-zinc-300">Libre: {(currentMetric.ramTotalGB - currentMetric.ramUsedGB).toFixed(1)} GB</span>
                </div>
              </div>
            )}

            {/* 3. Network Bandwidth (Ancho de Banda) Graph */}
            {visibleGraphs.bandwidth && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-cyan-400" /> Ancho de Banda (Red)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      1 Gbps Full
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs font-mono text-zinc-400">IN:</span>
                      <span className="text-xl font-bold font-mono text-white ml-1">
                        {(currentMetric.netInKB / 1024).toFixed(2)}
                        <span className="text-xs font-normal text-zinc-500 ml-0.5">MB/s</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-mono text-zinc-400">OUT:</span>
                      <span className="text-xl font-bold font-mono text-white ml-1">
                        {(currentMetric.netOutKB / 1024).toFixed(2)}
                        <span className="text-xs font-normal text-zinc-500 ml-0.5">MB/s</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 h-16 w-full bg-zinc-900/60 rounded border border-zinc-800/60 relative overflow-hidden flex items-end">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                      <polyline
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2"
                        points={generatePath(netInHistory, 100, 40, maxNetIn)}
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Sockets: 242 TCP</span>
                  <span className="text-[#00ff66]">Loss: 0.00%</span>
                </div>
              </div>
            )}

            {/* 4. Disk I/O & Storage Graph */}
            {visibleGraphs.disk && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Disco C:\ (NVMe)
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">58% Usado</span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      280
                      <span className="text-sm font-normal text-zinc-500 ml-1">/ 512 GB</span>
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: '58%' }} />
                    </div>
                    <div className="mt-2 h-10 w-full bg-zinc-900/60 rounded border border-zinc-800/60 relative overflow-hidden flex items-end">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          points={generatePath(diskReadHistory, 100, 30, maxDisk)}
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>R: {currentMetric.diskReadMB.toFixed(1)} MB/s | W: {currentMetric.diskWriteMB.toFixed(1)} MB/s</span>
                  <span className="text-[#00ff66]">SMART: OK</span>
                </div>
              </div>
            )}

            {/* 5. Core Breakdown Matrix */}
            {visibleGraphs.cores && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#ff6b00]" /> Matriz de Núcleos
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">8 Cores Xeon/EPYC</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {simulatedCores.map((load, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-between"
                      >
                        <span className="text-[9px] font-mono text-zinc-500">C#{idx}</span>
                        <span
                          className={`text-xs font-black font-mono my-0.5 ${
                            load > 85 ? 'text-red-400' : load > 60 ? 'text-[#ff6b00]' : 'text-[#00ff66]'
                          }`}
                        >
                          {load}%
                        </span>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${load > 85 ? 'bg-red-500' : load > 60 ? 'bg-[#ff6b00]' : 'bg-[#00ff66]'}`}
                            style={{ width: `${load}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Balanceo I/O: Óptimo</span>
                  <span className="text-[#00ff66]">No Throttling</span>
                </div>
              </div>
            )}

            {/* 6. Active Processes Widget */}
            {visibleGraphs.processes && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#00ff66]" /> Procesos de Windows
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">148 Activos</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between p-1.5 rounded bg-zinc-900/60 text-[11px]">
                      <span className="text-white font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" /> agent_daemon.py
                      </span>
                      <span className="text-[#00ff66]">1.2% CPU</span>
                      <span className="text-zinc-400">124.5 MB</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded bg-zinc-900/60 text-[11px]">
                      <span className="text-white font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" /> postgres.exe
                      </span>
                      <span className="text-[#00ff66]">3.4% CPU</span>
                      <span className="text-zinc-400">486.2 MB</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded bg-zinc-900/60 text-[11px]">
                      <span className="text-white font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" /> com.docker.service
                      </span>
                      <span className="text-[#ff6b00]">4.8% CPU</span>
                      <span className="text-zinc-400">840.1 MB</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Hilos totales: 1842</span>
                  <span className="text-zinc-300">Descriptores: 42,108</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: MULTI-SERVIDOR EN PARALELO (GRID RESPONSIVE 3 > 2 > 1)           */}
      {/* ========================================================================= */}
      {viewMode === 'multi-server' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Comparativa en Vivo de Servidores Seleccionados ({selectedServersList.length})</span>
            <span className="text-zinc-500">Haz clic en "Ver Detalle" para entrar al nodo</span>
          </div>

          {/* GRID OF SERVERS: 3 WIDE ON FULLSCREEN, 2 ON TABLET/MEDIUM, 1 ON MOBILE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {selectedServersList.map((srv) => {
              const isCurrent = srv.id === currentServerId;
              const srvCpu = isCurrent ? currentMetric.cpu : srv.cpu || 28;
              const srvRam = isCurrent ? currentMetric.ram : srv.ram || 62;
              const srvNet = isCurrent ? (currentMetric.netInKB / 1024).toFixed(1) : (((srv.netInKB || 2048) / 1024)).toFixed(1);

              return (
                <div
                  key={srv.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-zinc-950 border-[#00ff66]/60 shadow-[0_0_20px_rgba(0,255,102,0.12)]'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Server Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg ${
                            isCurrent ? 'bg-[#00ff66]/15 text-[#00ff66]' : 'bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          {srv.osType.includes('Server') ? (
                            <Server className="w-5 h-5" />
                          ) : (
                            <Laptop className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white font-mono text-sm">{srv.name}</span>
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono block">
                            {srv.host}:{srv.port} • {srv.osType}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono font-bold text-[#00ff66] px-2 py-0.5 rounded bg-[#00ff66]/10 border border-[#00ff66]/30">
                          {srv.latencyMs}ms
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono mt-0.5">{srv.lastPing}</span>
                      </div>
                    </div>

                    {/* 3 Metric Gauges per Server Card */}
                    <div className="space-y-3 font-mono text-xs">
                      {/* CPU Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-zinc-400 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-[#ff6b00]" /> CPU
                          </span>
                          <span className={`font-bold ${srvCpu > 80 ? 'text-red-400' : 'text-white'}`}>
                            {srvCpu}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              srvCpu > 80 ? 'bg-red-500' : srvCpu > 60 ? 'bg-[#ff6b00]' : 'bg-[#00ff66]'
                            }`}
                            style={{ width: `${srvCpu}%` }}
                          />
                        </div>
                      </div>

                      {/* RAM Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-zinc-400 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-[#00ff66]" /> Memoria RAM
                          </span>
                          <span className="font-bold text-white">{srvRam}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00ff66] to-[#ff6b00] transition-all duration-500"
                            style={{ width: `${srvRam}%` }}
                          />
                        </div>
                      </div>

                      {/* Bandwidth Indicator */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
                          <Wifi className="w-3 h-3 text-cyan-400" /> Red IN:
                        </span>
                        <span className="text-white font-bold">{srvNet} MB/s</span>
                        <span className="text-zinc-500 text-[10px]">TCP: OK</span>
                      </div>
                    </div>
                  </div>

                  {/* Server Action Footer */}
                  <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {isCurrent ? 'Nodo Actual' : 'Nodo Remoto'}
                    </span>
                    <button
                      onClick={() => {
                        onSelectServer(srv);
                        setViewMode('detailed');
                      }}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'bg-[#00ff66] hover:bg-[#00dd55] text-black shadow-sm'
                          : 'bg-zinc-900 hover:bg-[#ff6b00] text-zinc-200 hover:text-black border border-zinc-700'
                      }`}
                    >
                      {isCurrent ? 'Ver Telemetría Completa' : 'Gestionar Este Servidor'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
