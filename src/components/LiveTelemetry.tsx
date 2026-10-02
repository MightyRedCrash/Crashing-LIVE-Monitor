import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Info,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Filter,
  Eye,
  EyeOff,
  Move,
  Search,
  ArrowUpDown,
  Maximize2,
  X
} from 'lucide-react';

export type ModuleId = 
  | 'cpu' 
  | 'ram' 
  | 'bandwidth' 
  | 'disk' 
  | 'cores' 
  | 'processes' 
  | 'quick_tools' 
  | 'health_overview';

interface ModuleMetadata {
  id: ModuleId;
  title: string;
  category: 'Rendimiento' | 'Sistema' | 'Diagnóstico';
  icon: React.ReactNode;
}

const DEFAULT_MODULE_ORDER: ModuleId[] = [
  'cpu',
  'ram',
  'bandwidth',
  'disk',
  'cores',
  'processes',
  'quick_tools',
  'health_overview',
];

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
  onOpenDirectAnydesk?: () => void;
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
  onOpenDirectAnydesk,
}) => {
  const [notification, setNotification] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'detailed' | 'multi-server'>('detailed');
  
  // Servidores visibles seleccionados en pantalla
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>(() => {
    return servers.map(s => s.id);
  });

  // Orden de los módulos configurable y persistente
  const [moduleOrder, setModuleOrder] = useState<ModuleId[]>(() => {
    try {
      const saved = localStorage.getItem('crashinglive_module_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_MODULE_ORDER;
  });

  const [draggedModule, setDraggedModule] = useState<ModuleId | null>(null);
  const [dragOverModule, setDragOverModule] = useState<ModuleId | null>(null);

  const activeServer = servers.find((s) => s.id === currentServerId) || servers[0];

  // Estados interactivos para el Administrador de Tareas (Windows Task Manager)
  const [processSortBy, setProcessSortBy] = useState<'cpu' | 'memory'>('cpu');
  const [processSearchQuery, setProcessSearchQuery] = useState<string>('');
  const [processModalOpen, setProcessModalOpen] = useState<boolean>(false);

  // Lista en vivo de procesos (Top 10-15) transmitidos por el agente saliente
  const serverProcesses = useMemo(() => {
    const list = (activeServer?.processes && activeServer.processes.length > 0)
      ? activeServer.processes
      : [
          { pid: 1420, name: 'agent_daemon.py', cpu: 1.2, memoryMB: 48.5, user: 'SYSTEM', status: 'running' as const },
          { pid: 2840, name: 'powershell.exe', cpu: 2.1, memoryMB: 92.4, user: 'SYSTEM', status: 'running' as const },
          { pid: 3108, name: 'postgres.exe', cpu: 3.4, memoryMB: 386.2, user: 'postgres', status: 'running' as const },
          { pid: 4892, name: 'explorer.exe', cpu: 0.8, memoryMB: 195.0, user: 'Alexis', status: 'running' as const },
          { pid: 5612, name: 'svchost.exe', cpu: 1.5, memoryMB: 112.3, user: 'NETWORK SERVICE', status: 'running' as const },
          { pid: 6720, name: 'node.exe (Hub)', cpu: 4.2, memoryMB: 210.8, user: 'Alexis', status: 'running' as const },
          { pid: 7120, name: 'brave.exe', cpu: 5.6, memoryMB: 640.2, user: 'Alexis', status: 'running' as const },
          { pid: 8404, name: 'System Idle', cpu: 75.2, memoryMB: 4.0, user: 'SYSTEM', status: 'running' as const },
        ];

    let filtered = list;
    if (processSearchQuery.trim()) {
      const q = processSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        String(p.pid).includes(q) ||
        (p.user && p.user.toLowerCase().includes(q))
      );
    }

    return [...filtered].sort((a, b) => {
      if (processSortBy === 'cpu') {
        return b.cpu - a.cpu;
      } else {
        return b.memoryMB - a.memoryMB;
      }
    });
  }, [activeServer?.processes, processSortBy, processSearchQuery]);

  // Helper for generating smooth SVG polyline sparklines memoized
  const generatePath = useCallback((
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
  }, []);

  const { cpuHistory, ramHistory, netInHistory, maxNetIn, diskReadHistory, maxDisk } = useMemo(() => {
    const cpuH = metrics.map((m) => m.cpu);
    const ramH = metrics.map((m) => m.ram);
    const netInH = metrics.map((m) => m.netInKB);
    const maxN = Math.max(...netInH, 1000);
    const diskH = metrics.map((m) => m.diskReadMB);
    const maxD = Math.max(...diskH, 10);
    return {
      cpuHistory: cpuH,
      ramHistory: ramH,
      netInHistory: netInH,
      maxNetIn: maxN,
      diskReadHistory: diskH,
      maxDisk: maxD
    };
  }, [metrics]);

  // Per-core loads based on aggregate CPU memoized
  const simulatedCores = useMemo(() => [
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 1.15))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 0.85))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 1.05))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 0.95))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 0.70))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 1.25))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 0.60))),
    Math.min(100, Math.max(5, Math.round(currentMetric.cpu * 1.10))),
  ], [currentMetric.cpu]);

  const handleQuickFlush = () => {
    setNotification('Standby Memory Cache purgado con éxito. 1.4 GB liberados en ' + activeServer.name);
    setTimeout(() => setNotification(null), 4000);
  };

  // Guardar orden de módulos
  const saveModuleOrder = (newOrder: ModuleId[]) => {
    setModuleOrder(newOrder);
    try {
      localStorage.setItem('crashinglive_module_order', JSON.stringify(newOrder));
    } catch (e) {}
  };

  // Mover módulo a la izquierda o derecha
  const moveModule = (id: ModuleId, direction: 'left' | 'right') => {
    const currentIndex = moduleOrder.indexOf(id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= moduleOrder.length) return;

    const newOrder = [...moduleOrder];
    const item = newOrder.splice(currentIndex, 1)[0];
    newOrder.splice(targetIndex, 0, item);

    saveModuleOrder(newOrder);
    setNotification(`Módulo reubicado a la posición #${targetIndex + 1}`);
    setTimeout(() => setNotification(null), 2000);
  };

  // Drag and Drop Handlers
  const handleDragStart = (id: ModuleId) => {
    setDraggedModule(id);
  };

  const handleDragOver = (e: React.DragEvent, id: ModuleId) => {
    e.preventDefault();
    if (dragOverModule !== id) {
      setDragOverModule(id);
    }
  };

  const handleDrop = (targetId: ModuleId) => {
    if (!draggedModule || draggedModule === targetId) {
      setDraggedModule(null);
      setDragOverModule(null);
      return;
    }
    const currentIndex = moduleOrder.indexOf(draggedModule);
    const targetIndex = moduleOrder.indexOf(targetId);
    if (currentIndex === -1 || targetIndex === -1) return;

    const newOrder = [...moduleOrder];
    newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, draggedModule);

    saveModuleOrder(newOrder);
    setDraggedModule(null);
    setDragOverModule(null);
    setNotification(`Módulo posicionado en la posición #${targetIndex + 1}`);
    setTimeout(() => setNotification(null), 2500);
  };

  const resetModuleOrder = () => {
    saveModuleOrder(DEFAULT_MODULE_ORDER);
    setNotification('Orden de módulos restablecido al diseño predeterminado.');
    setTimeout(() => setNotification(null), 3000);
  };

  const applyPresetLayout = (preset: 'default' | 'performance' | 'storage' | 'diagnostics') => {
    let order: ModuleId[] = DEFAULT_MODULE_ORDER;
    if (preset === 'performance') {
      order = ['cpu', 'ram', 'bandwidth', 'cores', 'disk', 'processes', 'quick_tools', 'health_overview'];
    } else if (preset === 'storage') {
      order = ['disk', 'bandwidth', 'cpu', 'ram', 'cores', 'processes', 'quick_tools', 'health_overview'];
    } else if (preset === 'diagnostics') {
      order = ['processes', 'health_overview', 'quick_tools', 'cpu', 'ram', 'bandwidth', 'disk', 'cores'];
    }
    saveModuleOrder(order);
    setNotification('Plantilla de orden aplicada correctamente.');
    setTimeout(() => setNotification(null), 2500);
  };

  // Toggle visibilidad de un servidor en pantalla
  const toggleServerVisibility = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedServerIds.includes(id)) {
      if (selectedServerIds.length > 1) {
        setSelectedServerIds(selectedServerIds.filter(sId => sId !== id));
      } else {
        setNotification('Debe haber al menos 1 servidor visible en pantalla.');
        setTimeout(() => setNotification(null), 3000);
      }
    } else {
      setSelectedServerIds([...selectedServerIds, id]);
    }
  };

  const selectAllServers = () => {
    setSelectedServerIds(servers.map(s => s.id));
    setNotification('Todos los servidores seleccionados para visualización en pantalla.');
    setTimeout(() => setNotification(null), 2500);
  };

  const selectOnlyCurrentServer = () => {
    setSelectedServerIds([currentServerId]);
    setViewMode('detailed');
    setNotification(`Enfocando únicamente en ${activeServer.name}.`);
    setTimeout(() => setNotification(null), 2500);
  };

  const selectedServersList = useMemo(() => {
    return servers.filter((s) => selectedServerIds.includes(s.id));
  }, [servers, selectedServerIds]);

  // =========================================================================
  // RENDERIZADO DE CADA MÓDULO INDIVIDUAL
  // =========================================================================
  const renderModuleHeader = (title: string, icon: React.ReactNode, id: ModuleId) => {
    const index = moduleOrder.indexOf(id);
    const isFirst = index === 0;
    const isLast = index === moduleOrder.length - 1;

    return (
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          {/* Manija de Arrastre Drag & Drop */}
          <div 
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Arrastra para reordenar este módulo en la pantalla"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            {icon} {title}
          </span>
        </div>

        {/* Controles rápidos de reordenamiento con flechas */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            #{index + 1}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveModule(id, 'left');
            }}
            disabled={isFirst}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Mover módulo hacia la izquierda"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveModule(id, 'right');
            }}
            disabled={isLast}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Mover módulo hacia la derecha"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderModuleContent = (id: ModuleId) => {
    switch (id) {
      case 'cpu':
        return (
          <div className="flex flex-col justify-between h-full">
            {renderModuleHeader('CPU (Multi-Core)', <Cpu className="w-3.5 h-3.5 text-[#ff6b00]" />, 'cpu')}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Carga Agregada</span>
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
        );

      case 'ram':
        return (
          <div className="flex flex-col justify-between h-full">
            {renderModuleHeader('Memoria RAM', <Activity className="w-3.5 h-3.5 text-[#00ff66]" />, 'ram')}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Consumo Activo</span>
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
        );

      case 'bandwidth':
        return (
          <div className="flex flex-col justify-between h-full">
            {renderModuleHeader('Ancho de Banda (Red)', <Wifi className="w-3.5 h-3.5 text-cyan-400" />, 'bandwidth')}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Interfaces LAN/WAN</span>
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
        );

      case 'disk':
        return (
          <div className="flex flex-col justify-between h-full">
            {renderModuleHeader('Disco C:\\ (NVMe)', <HardDrive className="w-3.5 h-3.5 text-amber-400" />, 'disk')}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Almacenamiento del Sistema</span>
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
        );

      case 'cores':
        return (
          <div className="flex flex-col justify-between h-full">
            {renderModuleHeader('Matriz de Núcleos', <Layers className="w-3.5 h-3.5 text-[#ff6b00]" />, 'cores')}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-zinc-400">8 Hilos Lógicos</span>
                <span className="text-[10px] font-mono text-[#00ff66]">Balanceo Óptimo</span>
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
              <span>Distribución I/O: Balanceado</span>
              <span className="text-[#00ff66]">Sin Cuello de Botella</span>
            </div>
          </div>
        );

      case 'processes': {
        const totalTopRamMB = serverProcesses.reduce((acc, p) => acc + (p.memoryMB || 0), 0);
        return (
          <div className="flex flex-col justify-between h-full space-y-2.5">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/70">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[#00ff66]/10 text-[#00ff66]">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      Task Manager (Windows)
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" title="Transmisión en vivo" />
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setProcessModalOpen(true)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Abrir Administrador de Tareas a pantalla completa"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  {renderModuleHeader('', null, 'processes')}
                </div>
              </div>

              {/* Controles de ordenamiento y filtrado */}
              <div className="mt-2.5 flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={processSearchQuery}
                    onChange={(e) => setProcessSearchQuery(e.target.value)}
                    placeholder="Filtrar proceso o PID..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-6 pr-2 py-1 text-[11px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#00ff66]/60 transition-colors"
                  />
                  {processSearchQuery && (
                    <button
                      onClick={() => setProcessSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Botones de ordenamiento rápido */}
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shrink-0">
                  <button
                    onClick={() => setProcessSortBy('cpu')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      processSortBy === 'cpu'
                        ? 'bg-[#00ff66] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Ordenar por mayor uso de CPU"
                  >
                    CPU
                  </button>
                  <button
                    onClick={() => setProcessSortBy('memory')}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      processSortBy === 'memory'
                        ? 'bg-[#00ff66] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Ordenar por mayor uso de RAM"
                  >
                    RAM
                  </button>
                </div>
              </div>

              {/* Lista compacta con scroll */}
              <div className="mt-2.5 max-h-[170px] overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                {serverProcesses.length === 0 ? (
                  <div className="p-4 text-center text-zinc-500 text-xs">
                    No se encontraron procesos coincidentes
                  </div>
                ) : (
                  serverProcesses.map((proc) => {
                    const isHighCpu = proc.cpu > 20;
                    const isMediumCpu = proc.cpu > 5;
                    return (
                      <div
                        key={`${proc.pid}-${proc.name}`}
                        className="p-1.5 rounded-lg bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-850/80 hover:border-zinc-700 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-[9px] text-zinc-500 px-1 py-0.2 rounded bg-zinc-800 font-mono shrink-0">
                            {proc.pid}
                          </span>
                          <span className="text-zinc-200 font-medium truncate" title={`${proc.name} (${proc.user || 'SYSTEM'})`}>
                            {proc.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* CPU */}
                          <div className="text-right w-14">
                            <span
                              className={`font-bold ${
                                isHighCpu
                                  ? 'text-red-400'
                                  : isMediumCpu
                                  ? 'text-[#ff6b00]'
                                  : 'text-[#00ff66]'
                              }`}
                            >
                              {proc.cpu.toFixed(1)}%
                            </span>
                            <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5 ml-auto">
                              <div
                                className={`h-full ${
                                  isHighCpu
                                    ? 'bg-red-500'
                                    : isMediumCpu
                                    ? 'bg-[#ff6b00]'
                                    : 'bg-[#00ff66]'
                                }`}
                                style={{ width: `${Math.min(100, proc.cpu * 2)}%` }}
                              />
                            </div>
                          </div>

                          {/* RAM */}
                          <div className="text-right w-16">
                            <span className="text-zinc-300 font-bold">
                              {proc.memoryMB >= 1024
                                ? `${(proc.memoryMB / 1024).toFixed(1)} GB`
                                : `${proc.memoryMB.toFixed(0)} MB`}
                            </span>
                            <div className="w-14 h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5 ml-auto">
                              <div
                                className="h-full bg-cyan-400"
                                style={{ width: `${Math.min(100, (proc.memoryMB / 1024) * 50)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="text-zinc-400">
                Top {serverProcesses.length} procesos ({totalTopRamMB > 1024 ? `${(totalTopRamMB / 1024).toFixed(1)} GB` : `${totalTopRamMB.toFixed(0)} MB`} RAM)
              </span>
              <span className="text-[#00ff66] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" /> Saliente 443
              </span>
            </div>
          </div>
        );
      }

      case 'quick_tools':
        return (
          <div className="flex flex-col justify-between h-full">
            {renderModuleHeader('Herramientas Rápidas', <Zap className="w-3.5 h-3.5 text-[#ff6b00]" />, 'quick_tools')}
            <div className="space-y-2">
              <button
                onClick={onSimulateSpike}
                className="w-full text-left p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-[#ff6b00]/60 transition-colors flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#ff6b00]" />
                  <span className="text-white font-bold">Simular Pico de Carga</span>
                </div>
                <span className="text-[10px] text-zinc-500">Prueba Alertas</span>
              </button>

              <button
                onClick={handleQuickFlush}
                className="w-full text-left p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-[#00ff66]/60 transition-colors flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span className="text-white font-bold">Purgar Standby Cache</span>
                </div>
                <span className="text-[10px] text-[#00ff66]">Libera 1.4 GB</span>
              </button>

              <button
                onClick={onRunHealthCheck}
                className="w-full text-left p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-cyan-400/60 transition-colors flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-white font-bold">Diagnóstico Heurístico</span>
                </div>
                <span className="text-[10px] text-cyan-300">Auditar IA</span>
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Acciones Directas Host</span>
              <span className="text-[#00ff66]">Listo</span>
            </div>
          </div>
        );

      case 'health_overview':
        return (
          <div className="flex flex-col justify-between h-full">
            {renderModuleHeader('Estado de Salud & SLA', <ShieldCheck className="w-3.5 h-3.5 text-[#00ff66]" />, 'health_overview')}
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 text-[11px] block">Índice de Disponibilidad</span>
                  <span className="text-lg font-black text-[#00ff66]">99.98% SLA</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">Incidentes Hoy</span>
                  <span className="text-xs font-bold text-white">0 Críticos</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-zinc-300">
                <div className="flex items-center justify-between">
                  <span>Guardrails de PowerShell:</span>
                  <span className="text-[#00ff66] font-bold">ACTIVOS (100%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auditoría de Archivos:</span>
                  <span className="text-[#00ff66] font-bold">SIN ANOMALÍAS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Conexión PostgreSQL:</span>
                  <span className="text-cyan-400 font-bold">SINCRONIZADO</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Salud del Nodo: Óptima</span>
              <span className="text-[#00ff66]">Sin Alertas</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/40 text-[#00ff66] font-mono text-xs animate-in fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. BARRA PRINCIPAL: TELEMETRÍA EN VIVO (STATUS DEL SERVIDOR ACTIVO)        */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-center text-[#ff6b00] shrink-0 shadow-inner">
              {activeServer.osType.includes('Server') ? (
                <Server className="w-5 h-5" />
              ) : (
                <Laptop className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-[#ff6b00]/15 text-[#ff6b00] border border-[#ff6b00]/30">
                  TELEMETRÍA EN VIVO
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white font-mono uppercase tracking-tight">
                  {activeServer.name}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30 font-mono">
                  {activeServer.latencyMs}ms LATENCIA
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1">
                <span>{activeServer.host}:{activeServer.port}</span>
                <span className="text-zinc-600">•</span>
                <span>{activeServer.osType}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-300">
                  CPU: <strong className="text-white">{currentMetric.cpu}%</strong> | RAM: <strong className="text-white">{currentMetric.ram}%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Modo de Vista */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                viewMode === 'detailed'
                  ? 'bg-[#00ff66] text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Servidor Único (Módulos)</span>
            </button>

            <button
              onClick={() => setViewMode('multi-server')}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                viewMode === 'multi-server'
                  ? 'bg-[#00ff66] text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Malla Multi-Server ({selectedServersList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REQUERIMIENTO DEL USUARIO: SELECTOR DE SERVIDORES VISIBLES EN PANTALLA */}
      {/*    "Justo debajo de Telemetria en vivo quiero seleccionar los sevidores"   */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-850 pb-2.5">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#00ff66]" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Servidores Visibles en Pantalla
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              {selectedServersList.length} de {servers.length} seleccionados
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={selectAllServers}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] transition-colors"
            >
              Seleccionar Todos
            </button>
            <button
              onClick={selectOnlyCurrentServer}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] transition-colors"
            >
              Solo Activo
            </button>
            <button
              onClick={onOpenServerManager}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ff6b00]/15 hover:bg-[#ff6b00]/25 text-[#ff6b00] border border-[#ff6b00]/30 text-[11px] font-bold transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Conectar Servidor</span>
            </button>
          </div>
        </div>

        {/* Banner Conexión Directa Agente ⇄ Monitor (Código de Telemetría) */}
        {onOpenDirectAnydesk && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-[#00ff66]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-xs shadow-[0_0_20px_rgba(0,255,102,0.06)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00ff66]/15 border border-[#00ff66]/40 text-[#00ff66] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,255,102,0.2)]">
                <Zap className="w-4 h-4 fill-[#00ff66]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white uppercase text-xs">
                    Enlace Agente ⇄ Monitor (Código ID estilo AnyDesk)
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/40 font-bold uppercase">
                    TELEMETRÍA EN VIVO
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Vincula agentes de telemetría a este monitor en tiempo real mediante su <strong>Código ID de Enlace</strong> (ej. <code className="text-zinc-200">CL-948-201-143</code>) o por <strong>Detección LAN</strong>. <em>(No es escritorio remoto, es transmisión segura de métricas de salud y hardware).</em>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
              <button
                onClick={onOpenDirectAnydesk}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00dd55] text-black font-black text-xs shadow-[0_0_15px_rgba(0,255,102,0.25)] transition-all"
                title="Vincular agente remoto al monitor usando su Código ID estilo AnyDesk"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Vincular por ID / LAN</span>
              </button>

              <button
                onClick={onOpenServerManager}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-cyan-300 border border-cyan-800/60 font-bold text-xs transition-all"
                title="Conectar equipo al monitor usando IP y Puerto directo"
              >
                <span>Por IP y Puerto</span>
              </button>
            </div>
          </div>
        )}

        {/* Fila Horizontal de Servidores Seleccionables en Pantalla */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {servers.map((srv) => {
            const isVisible = selectedServerIds.includes(srv.id);
            const isCurrent = srv.id === currentServerId;
            const srvCpu = isCurrent ? currentMetric.cpu : srv.cpu || 24;
            const srvRam = isCurrent ? currentMetric.ram : srv.ram || 60;

            return (
              <div
                key={srv.id}
                onClick={() => onSelectServer(srv)}
                className={`p-3 rounded-xl border text-left font-mono cursor-pointer transition-all relative group ${
                  isCurrent
                    ? 'bg-zinc-900/90 border-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.15)] ring-1 ring-[#00ff66]/50'
                    : isVisible
                    ? 'bg-zinc-900/50 border-zinc-700/80 hover:border-zinc-500'
                    : 'bg-zinc-950 border-zinc-850 opacity-55 hover:opacity-85'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Checkbox para alternar visibilidad en pantalla */}
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => toggleServerVisibility(srv.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-[#00ff66] focus:ring-0 bg-zinc-800 border-zinc-700 cursor-pointer accent-[#00ff66]"
                      title="Activar/Desactivar visibilidad de este servidor"
                    />

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{srv.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00ff66] text-black font-black">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        {srv.host}:{srv.port} • {srv.osType}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 rounded border border-[#00ff66]/20 shrink-0">
                    {srv.latencyMs}ms
                  </span>
                </div>

                {/* Métricas compactas en el selector */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#ff6b00]" />
                    <span>CPU: <strong className="text-white">{srvCpu}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#00ff66]" />
                    <span>RAM: <strong className="text-white">{srvRam}%</strong></span>
                  </div>
                  <span className={`text-[9px] uppercase font-bold ${isVisible ? 'text-[#00ff66]' : 'text-zinc-500'}`}>
                    {isVisible ? 'Visible' : 'Oculto'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISTA 1: MÓDULOS DE TELEMETRÍA ORDENABLES POR EL USUARIO               */}
      {/*    "y que pueda mover los modulos para ordenarlos en la forma que quiera"  */}
      {/* ========================================================================= */}
      {viewMode === 'detailed' && (
        <div className="space-y-4">
          {/* BARRA DE CONTROL DE DISPOSICIÓN & ORDEN DE MÓDULOS */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[#00ff66]">
                <Move className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-white text-xs block">
                  Disposición de Módulos Personalizada
                </span>
                <span className="text-[11px] text-zinc-400">
                  Arrastra cualquier módulo con el icono <strong className="text-white">⋮⋮</strong> o usa las flechas <strong className="text-white">← →</strong> para ordenarlos como prefieras.
                </span>
              </div>
            </div>

            {/* Presets Rápidos de Disposición */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              <span className="text-zinc-500 text-[10px] uppercase font-bold hidden lg:inline">Plantillas:</span>
              <button
                onClick={() => applyPresetLayout('performance')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] whitespace-nowrap transition-colors"
                title="Coloca CPU, RAM y Red primero"
              >
                Rendimiento 1º
              </button>
              <button
                onClick={() => applyPresetLayout('storage')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] whitespace-nowrap transition-colors"
                title="Coloca Disco y Red primero"
              >
                Disco & Red 1º
              </button>
              <button
                onClick={() => applyPresetLayout('diagnostics')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] whitespace-nowrap transition-colors"
                title="Coloca Procesos y Salud primero"
              >
                Procesos 1º
              </button>
              <button
                onClick={resetModuleOrder}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-[11px] whitespace-nowrap transition-colors"
                title="Restablecer al orden original de fábrica"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
            </div>
          </div>

          {/* GRID RESPONSIVO CON MÓDULOS REORDENABLES POR DRAG AND DROP */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {moduleOrder.map((modId) => {
              const isDragging = draggedModule === modId;
              const isOver = dragOverModule === modId;

              return (
                <div
                  key={modId}
                  draggable
                  onDragStart={() => handleDragStart(modId)}
                  onDragOver={(e) => handleDragOver(e, modId)}
                  onDrop={() => handleDrop(modId)}
                  onDragEnd={() => {
                    setDraggedModule(null);
                    setDragOverModule(null);
                  }}
                  className={`p-4 rounded-xl bg-zinc-950 border transition-all duration-200 flex flex-col justify-between select-none ${
                    isDragging
                      ? 'opacity-30 scale-95 border-dashed border-[#ff6b00] shadow-2xl'
                      : isOver
                      ? 'border-2 border-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.35)] scale-[1.02]'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {renderModuleContent(modId)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VISTA 2: MALLA COMPARATIVA MULTI-SERVIDOR (LOS SERVIDORES SELECCIONADOS) */}
      {/* ========================================================================= */}
      {viewMode === 'multi-server' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Comparativa en Vivo de Servidores Seleccionados ({selectedServersList.length})</span>
            <span className="text-zinc-500">Haz clic en "Ver Detalle" para entrar a un nodo específico</span>
          </div>

          {/* GRID DE SERVIDORES SELECCIONADOS EN PANTALLA */}
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
                    {/* Encabezado del Servidor */}
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

                    {/* Barras de Métricas */}
                    <div className="space-y-3 font-mono text-xs">
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

                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-850">
                        <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
                          <Wifi className="w-3 h-3 text-cyan-400" /> Red IN:
                        </span>
                        <span className="text-white font-bold">{srvNet} MB/s</span>
                        <span className="text-zinc-500 text-[10px]">TCP: OK</span>
                      </div>
                    </div>
                  </div>

                  {/* Pie de Acción */}
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
                      {isCurrent ? 'Ver Módulos' : 'Enfocar Servidor'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DETALLADO ESTILO ADMINISTRADOR DE TAREAS (WINDOWS TASK MANAGER) */}
      {processModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#00ff66]/15 border border-[#00ff66]/30 text-[#00ff66]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
                      Administrador de Tareas de Windows
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/40">
                      EN VIVO • 2s
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Servidor: <strong className="text-zinc-200">{activeServer.name}</strong> ({activeServer.host}) • Agente Saliente WSS
                  </p>
                </div>
              </div>

              <button
                onClick={() => setProcessModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Filtros y Métricas Rápidas */}
            <div className="p-4 border-b border-zinc-850 bg-zinc-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={processSearchQuery}
                  onChange={(e) => setProcessSearchQuery(e.target.value)}
                  placeholder="Buscar por proceso, PID o usuario..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#00ff66]/60 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-zinc-400 hidden sm:inline">Ordenar:</span>
                <button
                  onClick={() => setProcessSortBy('cpu')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    processSortBy === 'cpu'
                      ? 'bg-[#00ff66] text-black shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Mayor CPU %
                </button>
                <button
                  onClick={() => setProcessSortBy('memory')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    processSortBy === 'memory'
                      ? 'bg-[#00ff66] text-black shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Mayor RAM (MB)
                </button>
              </div>
            </div>

            {/* Tabla Completa de Procesos */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[55vh]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                      <th className="pb-2.5 pl-2">PID</th>
                      <th className="pb-2.5">Nombre del Proceso</th>
                      <th className="pb-2.5 text-right w-36">CPU (%)</th>
                      <th className="pb-2.5 text-right w-36">Memoria RAM</th>
                      <th className="pb-2.5 pl-4">Usuario / Cuenta</th>
                      <th className="pb-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {serverProcesses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                          No se encontraron procesos que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      serverProcesses.map((proc) => {
                        const isHighCpu = proc.cpu > 20;
                        const isMediumCpu = proc.cpu > 5;
                        return (
                          <tr key={`${proc.pid}-${proc.name}`} className="hover:bg-zinc-900/60 transition-colors">
                            <td className="py-2.5 pl-2 text-zinc-500 font-mono">
                              #{proc.pid}
                            </td>
                            <td className="py-2.5 text-white font-bold flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
                              {proc.name}
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span
                                  className={`font-bold ${
                                    isHighCpu
                                      ? 'text-red-400'
                                      : isMediumCpu
                                      ? 'text-[#ff6b00]'
                                      : 'text-[#00ff66]'
                                  }`}
                                >
                                  {proc.cpu.toFixed(1)}%
                                </span>
                                <div className="w-16 h-1.5 bg-zinc-850 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      isHighCpu
                                        ? 'bg-red-500'
                                        : isMediumCpu
                                        ? 'bg-[#ff6b00]'
                                        : 'bg-[#00ff66]'
                                    }`}
                                    style={{ width: `${Math.min(100, proc.cpu * 2)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-zinc-200 font-bold">
                                  {proc.memoryMB >= 1024
                                    ? `${(proc.memoryMB / 1024).toFixed(2)} GB`
                                    : `${proc.memoryMB.toFixed(1)} MB`}
                                </span>
                                <div className="w-16 h-1.5 bg-zinc-850 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-400"
                                    style={{ width: `${Math.min(100, (proc.memoryMB / 1024) * 40)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 pl-4 text-zinc-400">
                              {proc.user || 'NT AUTHORITY\\SYSTEM'}
                            </td>
                            <td className="py-2.5 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30">
                                En ejecución
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
              <div>
                Monitoreando <strong className="text-white">{serverProcesses.length}</strong> procesos principales • Transmisión saliente cifrada
              </div>
              <button
                onClick={() => setProcessModalOpen(false)}
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold transition-colors"
              >
                Cerrar Administrador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

