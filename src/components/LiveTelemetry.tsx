import React, { useState, useMemo } from 'react';
import { SystemMetricPoint, ConnectedServer, ProcessItem } from '../types';
import { 
  Server, 
  Laptop, 
  Activity, 
  TrendingUp, 
  Search, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  Wifi, 
  HardDrive, 
  Zap, 
  Plus,
  Radio,
  Cpu
} from 'lucide-react';

interface LiveTelemetryProps {
  metrics: SystemMetricPoint[];
  currentMetric: SystemMetricPoint;
  onSimulateSpike?: () => void;
  onRunHealthCheck?: () => void;
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
  servers,
  currentServerId,
  onSelectServer,
  onOpenServerManager,
  onOpenDirectAnydesk,
}) => {
  // Estados para la tabla de procesos estilo Task Manager
  const [processSortBy, setProcessSortBy] = useState<'cpu' | 'memory'>('cpu');
  const [processSearchQuery, setProcessSearchQuery] = useState<string>('');

  // Servidor seleccionado
  const activeServer = useMemo(() => {
    return servers.find((s) => s.id === currentServerId) || servers[0];
  }, [servers, currentServerId]);

  // Métricas globales rápidas de los servidores conectados
  const clusterStats = useMemo(() => {
    const total = servers.length;
    const online = servers.filter((s) => s.status === 'ONLINE').length;
    const avgCpu = Math.round(servers.reduce((acc, s) => acc + (s.cpu || 0), 0) / Math.max(1, total));
    const avgRam = Math.round(servers.reduce((acc, s) => acc + (s.ram || 0), 0) / Math.max(1, total));
    return { total, online, avgCpu, avgRam };
  }, [servers]);

  // Lista de procesos del servidor activo (Top 10-15 del Administrador de Tareas)
  const taskManagerProcesses = useMemo(() => {
    const rawList: ProcessItem[] = (activeServer?.processes && activeServer.processes.length > 0)
      ? activeServer.processes
      : [
          { pid: 4, name: 'System', cpu: 1.2, memoryMB: 128.4, user: 'SYSTEM', status: 'running' },
          { pid: 1420, name: 'agent_daemon.py', cpu: 0.8, memoryMB: 48.5, user: 'SYSTEM', status: 'running' },
          { pid: 2840, name: 'powershell.exe', cpu: 2.1, memoryMB: 92.4, user: 'SYSTEM', status: 'running' },
          { pid: 3108, name: 'postgres.exe', cpu: 3.4, memoryMB: 386.2, user: 'postgres', status: 'running' },
          { pid: 4892, name: 'explorer.exe', cpu: 1.5, memoryMB: 215.0, user: 'Administrator', status: 'running' },
          { pid: 5612, name: 'svchost.exe', cpu: 1.1, memoryMB: 165.3, user: 'NETWORK SERVICE', status: 'running' },
          { pid: 6720, name: 'node.exe (Central Hub)', cpu: 3.8, memoryMB: 210.8, user: 'Alexis', status: 'running' },
          { pid: 8404, name: 'System Idle Process', cpu: 78.4, memoryMB: 4.0, user: 'SYSTEM', status: 'running' },
        ];

    let filtered = rawList;
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
      }
      return b.memoryMB - a.memoryMB;
    });
  }, [activeServer?.processes, processSortBy, processSearchQuery]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR MINIMALISTA: RESUMEN DE CLUSTER                         */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#121212] border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FF6600]/10 border border-[#FF6600]/30 text-[#FF6600] flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-tight">Monitor Central</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40">
                {clusterStats.online} / {clusterStats.total} ONLINE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              CPU promedio: <strong className="text-white">{clusterStats.avgCpu}%</strong> • RAM promedio: <strong className="text-white">{clusterStats.avgRam}%</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          {onOpenDirectAnydesk && (
            <button
              onClick={onOpenDirectAnydesk}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6600] hover:bg-[#ff771a] text-black font-bold text-xs transition-colors shadow-sm"
              title="Vincular servidor mediante código ID saliente (AnyDesk)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Vincular por ID</span>
            </button>
          )}
          <button
            onClick={onOpenServerManager}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 font-bold text-xs transition-colors"
            title="Administrar conexiones IP"
          >
            <span>Servidores</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS COMPACTAS POR SERVIDOR (HOST/ID, ESTADO, CPU, RAM)           */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs font-mono text-zinc-400">
          <span>Servidores Monitoreados ({servers.length})</span>
          <span className="text-[11px] text-zinc-500">Seleccione un equipo para ver su Task Manager en vivo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {servers.map((srv) => {
            const isSelected = srv.id === currentServerId;
            const isOnline = srv.status === 'ONLINE';
            const srvCpu = isSelected ? currentMetric.cpu : (srv.cpu ?? 0);
            const srvRam = isSelected ? currentMetric.ram : (srv.ram ?? 0);
            const ramUsed = isSelected ? currentMetric.ramUsedGB : (srv.ramUsedGB ?? 0);
            const ramTotal = isSelected ? currentMetric.ramTotalGB : (srv.ramTotalGB ?? 16);

            return (
              <div
                key={srv.id}
                onClick={() => onSelectServer(srv)}
                className={`p-4 rounded-xl border text-left font-mono cursor-pointer transition-all duration-150 relative ${
                  isSelected
                    ? 'bg-[#181818] border-[#FF6600] shadow-[0_0_15px_rgba(255,102,0,0.15)] ring-1 ring-[#FF6600]/40'
                    : 'bg-[#121212] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-[#FF6600]/15 text-[#FF6600]' : 'bg-zinc-900 text-zinc-400'}`}>
                      {srv.osType?.includes('Server') ? (
                        <Server className="w-4 h-4" />
                      ) : (
                        <Laptop className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{srv.name}</span>
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF6600] text-black font-black">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                        {srv.host} • {srv.agentId || srv.id}
                      </span>
                    </div>
                  </div>

                  {/* Badge Online/Offline */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOnline
                          ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#00E676] animate-pulse' : 'bg-red-500'}`} />
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                {/* Barras simples de CPU y RAM */}
                <div className="space-y-2 text-xs">
                  {/* CPU */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-[#FF6600]" /> CPU
                      </span>
                      <span className={`font-bold ${srvCpu > 80 ? 'text-red-400' : srvCpu > 50 ? 'text-[#FF6600]' : 'text-white'}`}>
                        {srvCpu}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          srvCpu > 80 ? 'bg-red-500' : srvCpu > 50 ? 'bg-[#FF6600]' : 'bg-[#00E676]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, srvCpu))}%` }}
                      />
                    </div>
                  </div>

                  {/* RAM */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-[#00E676]" /> RAM
                      </span>
                      <span className="font-bold text-white">
                        {srvRam}% <span className="text-[10px] text-zinc-500">({ramUsed.toFixed(1)}/{ramTotal.toFixed(0)} GB)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, srvRam))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pie de la tarjeta */}
                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{srv.lastPing || (isOnline ? 'En vivo' : 'Sin señal')}</span>
                  <span className="text-[#FF6600] font-bold flex items-center gap-1">
                    Ver Task Manager →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISTA DETALLADA ESTILO TASK MANAGER (SERVIDOR ACTIVO)                  */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#121212] border border-zinc-800 shadow-xl font-mono">
        {/* Encabezado del Detalle */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase">
                  {activeServer.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40">
                  TASK MANAGER EN VIVO • 2s
                </span>
                <span className="text-xs text-zinc-400">
                  ({activeServer.host} • {activeServer.osType})
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <span>CPU: <strong className="text-white">{currentMetric.cpu}%</strong></span>
                <span>•</span>
                <span>RAM: <strong className="text-white">{currentMetric.ram}%</strong> ({currentMetric.ramUsedGB.toFixed(1)} GB)</span>
                <span>•</span>
                <span>Red: <strong className="text-white">{(currentMetric.netInKB / 1024).toFixed(1)} MB/s</strong></span>
                <span>•</span>
                <span>Disco: <strong className="text-white">{activeServer.diskFreeGB ? `${activeServer.diskFreeGB} GB libres` : 'OK'}</strong></span>
              </div>
            </div>
          </div>

          {/* Filtros de la tabla de procesos */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={processSearchQuery}
                onChange={(e) => setProcessSearchQuery(e.target.value)}
                placeholder="Filtrar proceso o PID..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#FF6600]/60 transition-colors"
              />
              {processSearchQuery && (
                <button
                  onClick={() => setProcessSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setProcessSortBy('cpu')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  processSortBy === 'cpu'
                    ? 'bg-[#FF6600] text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Ordenar por mayor consumo de CPU"
              >
                CPU %
              </button>
              <button
                onClick={() => setProcessSortBy('memory')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  processSortBy === 'memory'
                    ? 'bg-[#FF6600] text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Ordenar por mayor uso de RAM"
              >
                RAM MB
              </button>
            </div>
          </div>
        </div>

        {/* Tabla Limpia de Procesos (Task Manager) */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                <th className="pb-2.5 pl-2">PID</th>
                <th className="pb-2.5">Proceso</th>
                <th className="pb-2.5 text-right w-36">CPU (%)</th>
                <th className="pb-2.5 text-right w-36">Memoria RAM</th>
                <th className="pb-2.5 pl-4">Usuario / Cuenta</th>
                <th className="pb-2.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {taskManagerProcesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No se encontraron procesos coincidentes con "{processSearchQuery}"
                  </td>
                </tr>
              ) : (
                taskManagerProcesses.map((proc) => {
                  const isHighCpu = proc.cpu > 20;
                  const isMediumCpu = proc.cpu > 5;
                  return (
                    <tr key={`${proc.pid}-${proc.name}`} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-2.5 pl-2 text-zinc-500 font-mono">
                        #{proc.pid}
                      </td>
                      <td className="py-2.5 text-white font-bold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
                        {proc.name}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`font-bold ${
                              isHighCpu
                                ? 'text-red-400'
                                : isMediumCpu
                                ? 'text-[#FF6600]'
                                : 'text-[#00E676]'
                            }`}
                          >
                            {proc.cpu.toFixed(1)}%
                          </span>
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                isHighCpu
                                  ? 'bg-red-500'
                                  : isMediumCpu
                                  ? 'bg-[#FF6600]'
                                  : 'bg-[#00E676]'
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
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
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

        {/* Pie de tabla */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Mostrando {taskManagerProcesses.length} procesos activos • Modelo saliente HTTPS/WSS (puerto 443 estándar)
          </span>
          <span className="text-[#00E676] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            Canal Activo
          </span>
        </div>
      </div>
    </div>
  );
};
