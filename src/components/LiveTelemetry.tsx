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
  Check,
  ChevronDown,
  Info
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
  const [activeSubmenu, setActiveSubmenu] = useState<'actions' | 'servers' | 'panels' | null>(null);

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

      {/* ========================================================================= */}
      {/* BARRA SUPERIOR MINIMALISTA HOME: STATUS EN VIVO Y 3 SUBMENÚS DESCRIPTIVOS   */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl relative z-20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Identidad de la máquina y métricas clave en una línea limpia */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ff6b00] shrink-0">
              {activeServer.osType.includes('Server') ? (
                <Server className="w-4 h-4" />
              ) : (
                <Laptop className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white font-mono text-sm tracking-tight">{activeServer.name}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30 font-mono">
                  {activeServer.latencyMs}ms
                </span>
                <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                  {activeServer.host}:{activeServer.port}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 hidden md:inline">
                  {activeServer.osType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-0.5">
                <span>CPU: <strong className="text-white">{currentMetric.cpu}%</strong></span>
                <span className="text-zinc-600">•</span>
                <span>RAM: <strong className="text-white">{currentMetric.ramUsedGB.toFixed(1)} GB</strong> ({currentMetric.ram}%)</span>
                <span className="text-zinc-600">•</span>
                <span>Red: <strong className="text-white">{(currentMetric.netInKB / 1024).toFixed(1)} MB/s</strong></span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">{viewMode === 'detailed' ? 'Vista Detalle' : `Malla Multi-Server (${selectedServersList.length})`}</span>
              </div>
            </div>
          </div>

          {/* 3 Submenús Plegables Descriptivos (Opciones organizadas y limpias) */}
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pt-1 lg:pt-0">
            {/* 1. SUBMENÚ: ACCIONES RÁPIDAS & DIAGNÓSTICO */}
            <div className="relative flex-1 lg:flex-none">
              <button
                onClick={() => setActiveSubmenu(activeSubmenu === 'actions' ? null : 'actions')}
                className={`w-full lg:w-auto flex items-center justify-between lg:justify-start gap-2 px-3 py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                  activeSubmenu === 'actions'
                    ? 'bg-[#ff6b00] text-black border-[#ff6b00] shadow-[0_0_12px_rgba(255,107,0,0.3)]'
                    : 'bg-zinc-900/90 hover:bg-zinc-850 text-zinc-200 border-zinc-800 hover:border-[#ff6b00]/50'
                }`}
                title="Desplegar acciones del servidor: simular picos, purgar memoria y diagnóstico IA"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Zap className="w-3.5 h-3.5 text-[#ff6b00] shrink-0" />
                  <span className="truncate">Acciones</span>
                  <span className="text-[10px] px-1 rounded bg-black/40 text-zinc-300 font-normal">3</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeSubmenu === 'actions' ? 'rotate-180' : ''}`} />
              </button>

              {activeSubmenu === 'actions' && (
                <div className="absolute left-0 lg:right-0 lg:left-auto mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl p-3 z-50 animate-in fade-in font-mono text-xs space-y-2.5">
                  <div className="border-b border-zinc-850 pb-2 px-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#ff6b00]" /> Herramientas de Mantenimiento
                      </span>
                      <button onClick={() => setActiveSubmenu(null)} className="text-zinc-500 hover:text-white text-xs">✕</button>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      <strong>Qué contiene:</strong> Pruebas de estrés temporal de carga, purga inmediata de memoria RAM en espera y diagnóstico automatizado con IA.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        onSimulateSpike();
                        setActiveSubmenu(null);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-[#ff6b00]/50 transition-all flex items-start gap-2.5 group"
                    >
                      <Zap className="w-4 h-4 text-[#ff6b00] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-bold text-white text-xs group-hover:text-[#ff6b00] transition-colors">
                          Simular Pico de Carga
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Genera un pico controlado de CPU y red para probar umbrales y alertas.
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleQuickFlush();
                        setActiveSubmenu(null);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-[#00ff66]/50 transition-all flex items-start gap-2.5 group"
                    >
                      <RefreshCw className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5 group-hover:rotate-180 transition-transform duration-500" />
                      <div>
                        <div className="font-bold text-white text-xs group-hover:text-[#00ff66] transition-colors">
                          Purgar Standby Cache (RAM)
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Libera páginas de memoria en espera en Windows, recuperando memoria de inmediato.
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onRunHealthCheck();
                        setActiveSubmenu(null);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-[#ff6b00]/50 transition-all flex items-start gap-2.5 group"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#ff6b00] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white text-xs group-hover:text-[#ff6b00] transition-colors">
                          Diagnóstico Heurístico con IA
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Audita registros de incidentes, estabilidad de servicios y correlación de caídas.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. SUBMENÚ: GESTIÓN DE SERVIDORES Y VISTAS */}
            <div className="relative flex-1 lg:flex-none">
              <button
                onClick={() => setActiveSubmenu(activeSubmenu === 'servers' ? null : 'servers')}
                className={`w-full lg:w-auto flex items-center justify-between lg:justify-start gap-2 px-3 py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                  activeSubmenu === 'servers'
                    ? 'bg-[#00ff66] text-black border-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                    : 'bg-zinc-900/90 hover:bg-zinc-850 text-zinc-200 border-zinc-800 hover:border-[#00ff66]/50'
                }`}
                title="Desplegar servidores conectados y cambiar modo de vista"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Server className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                  <span className="truncate">Nodos & Red</span>
                  <span className="text-[10px] px-1 rounded bg-black/40 text-zinc-300 font-normal">{servers.length}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeSubmenu === 'servers' ? 'rotate-180' : ''}`} />
              </button>

              {activeSubmenu === 'servers' && (
                <div className="absolute left-0 lg:right-0 lg:left-auto mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl p-3 z-50 animate-in fade-in font-mono text-xs space-y-2.5">
                  <div className="border-b border-zinc-850 pb-2 px-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-[#00ff66]" /> Gestión de Nodos y Red
                      </span>
                      <button onClick={() => setActiveSubmenu(null)} className="text-zinc-500 hover:text-white text-xs">✕</button>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      <strong>Qué contiene:</strong> Selector de host activo, alternador entre vista detallada individual o malla multi-server, y acceso para conectar nuevos servidores.
                    </p>
                  </div>

                  {/* Alternador de Modo de Vista */}
                  <div className="bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800 flex items-center gap-1">
                    <button
                      onClick={() => setViewMode('detailed')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-center font-bold text-xs transition-all ${
                        viewMode === 'detailed'
                          ? 'bg-[#00ff66] text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Vista Individual
                    </button>
                    <button
                      onClick={() => setViewMode('multi-server')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-center font-bold text-xs transition-all ${
                        viewMode === 'multi-server'
                          ? 'bg-[#00ff66] text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Malla Multi-Server
                    </button>
                  </div>

                  {/* Lista de Servidores Vinculados */}
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {servers.map((srv) => {
                      const isCurrent = srv.id === currentServerId;
                      const isChecked = selectedServerIds.includes(srv.id);

                      return (
                        <div
                          key={srv.id}
                          className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-[#00ff66]/10 border-[#00ff66]/40 text-white'
                              : 'bg-zinc-900/50 border-zinc-850 hover:bg-zinc-900 text-zinc-300'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onSelectServer(srv);
                              if (viewMode === 'detailed') setActiveSubmenu(null);
                            }}
                            className="flex items-center gap-2 truncate text-left flex-1 mr-2"
                          >
                            <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[#00ff66]' : 'bg-zinc-500'}`} />
                            <div className="truncate">
                              <div className="font-bold text-xs truncate flex items-center gap-1.5">
                                <span>{srv.name}</span>
                                {isCurrent && <span className="text-[9px] text-[#00ff66] font-normal">(Activo)</span>}
                              </div>
                              <div className="text-[10px] text-zinc-400">{srv.host} • {srv.latencyMs}ms</div>
                            </div>
                          </button>

                          <button
                            onClick={() => toggleServerSelection(srv.id)}
                            className={`p-1 rounded border text-[10px] ${
                              isChecked
                                ? 'bg-zinc-800 border-zinc-700 text-[#00ff66]'
                                : 'bg-transparent border-zinc-800 text-zinc-600'
                            }`}
                            title="Incluir/Excluir de la comparativa"
                          >
                            <Check className={`w-3 h-3 ${isChecked ? 'opacity-100' : 'opacity-20'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-1 border-t border-zinc-850 flex items-center justify-between">
                    <button
                      onClick={selectAllServers}
                      className="text-[11px] text-zinc-400 hover:text-white"
                    >
                      Seleccionar todos
                    </button>
                    <button
                      onClick={() => {
                        setActiveSubmenu(null);
                        onOpenServerManager();
                      }}
                      className="text-[11px] text-[#ff6b00] hover:underline font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Administrar Servidores</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. SUBMENÚ: PERSONALIZACIÓN DE GRÁFICAS */}
            <div className="relative flex-1 lg:flex-none">
              <button
                onClick={() => setActiveSubmenu(activeSubmenu === 'panels' ? null : 'panels')}
                className={`w-full lg:w-auto flex items-center justify-between lg:justify-start gap-2 px-3 py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                  activeSubmenu === 'panels'
                    ? 'bg-zinc-200 text-black border-zinc-300 shadow-sm'
                    : 'bg-zinc-900/90 hover:bg-zinc-850 text-zinc-200 border-zinc-800 hover:border-zinc-700'
                }`}
                title="Configurar qué paneles de telemetría mostrar u ocultar"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                  <span className="truncate">Paneles</span>
                  <span className="text-[10px] px-1 rounded bg-black/40 text-zinc-300 font-normal">
                    {Object.values(visibleGraphs).filter(Boolean).length}/6
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeSubmenu === 'panels' ? 'rotate-180' : ''}`} />
              </button>

              {activeSubmenu === 'panels' && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl p-3 z-50 animate-in fade-in font-mono text-xs space-y-2.5">
                  <div className="border-b border-zinc-850 pb-2 px-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-300" /> Paneles Visibles
                      </span>
                      <button onClick={() => setActiveSubmenu(null)} className="text-zinc-500 hover:text-white text-xs">✕</button>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      <strong>Qué contiene:</strong> Activa o desactiva de forma individual cada una de las 6 gráficas de telemetría para una visualización más limpia.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-[#ff6b00]" />
                        <div>
                          <div className="font-bold text-white text-xs">CPU Multi-Core</div>
                          <div className="text-[10px] text-zinc-500">Carga global, frecuencia y temperatura</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={visibleGraphs.cpu}
                        onChange={(e) => setVisibleGraphs({ ...visibleGraphs, cpu: e.target.checked })}
                        className="rounded text-[#00ff66] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-[#00ff66]" />
                        <div>
                          <div className="font-bold text-white text-xs">Memoria RAM</div>
                          <div className="text-[10px] text-zinc-500">Consumo en GB, porcentaje y caché libre</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={visibleGraphs.ram}
                        onChange={(e) => setVisibleGraphs({ ...visibleGraphs, ram: e.target.checked })}
                        className="rounded text-[#00ff66] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                        <div>
                          <div className="font-bold text-white text-xs">Ancho de Banda (Red)</div>
                          <div className="text-[10px] text-zinc-500">Tráfico en vivo IN / OUT y sockets TCP</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={visibleGraphs.bandwidth}
                        onChange={(e) => setVisibleGraphs({ ...visibleGraphs, bandwidth: e.target.checked })}
                        className="rounded text-[#00ff66] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                        <div>
                          <div className="font-bold text-white text-xs">Disco & Almacenamiento</div>
                          <div className="text-[10px] text-zinc-500">Lectura/escritura NVMe y salud SMART</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={visibleGraphs.disk}
                        onChange={(e) => setVisibleGraphs({ ...visibleGraphs, disk: e.target.checked })}
                        className="rounded text-[#00ff66] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[#ff6b00]" />
                        <div>
                          <div className="font-bold text-white text-xs">Matriz de Núcleos</div>
                          <div className="text-[10px] text-zinc-500">Balanceo de carga por cada hilo físico</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={visibleGraphs.cores}
                        onChange={(e) => setVisibleGraphs({ ...visibleGraphs, cores: e.target.checked })}
                        className="rounded text-[#00ff66] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-[#00ff66]" />
                        <div>
                          <div className="font-bold text-white text-xs">Procesos de Windows</div>
                          <div className="text-[10px] text-zinc-500">Servicios y procesos de mayor impacto</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={visibleGraphs.processes}
                        onChange={(e) => setVisibleGraphs({ ...visibleGraphs, processes: e.target.checked })}
                        className="rounded text-[#00ff66] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="pt-2 border-t border-zinc-850 flex items-center justify-between px-1">
                    <button
                      onClick={() => setVisibleGraphs({ cpu: true, ram: true, bandwidth: true, disk: true, cores: true, processes: true })}
                      className="text-[11px] text-[#00ff66] hover:underline"
                    >
                      Mostrar Todos (6)
                    </button>
                    <button
                      onClick={() => setVisibleGraphs({ cpu: true, ram: true, bandwidth: true, disk: false, cores: false, processes: false })}
                      className="text-[11px] text-zinc-400 hover:text-white"
                    >
                      Esencial (CPU / RAM / Red)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: DETALLE DEL SERVIDOR SELECCIONADO (GRID RESPONSIVE 3 > 2 > 1)   */}
      {/* ========================================================================= */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
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
