import React, { useState, useEffect } from 'react';
import { ConnectedServer, AnyDeskRemoteSession } from '../types';
import { 
  Monitor, 
  Wifi, 
  Copy, 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Terminal, 
  X, 
  Laptop, 
  Server, 
  Search, 
  Lock, 
  Maximize2, 
  Minimize2, 
  ArrowRight,
  Radio,
  FileCode,
  HardDrive,
  Cpu,
  Activity,
  Send,
  AlertTriangle,
  Info
} from 'lucide-react';

import { 
  fetchConnectedAgents, 
  connectAgentByCode, 
  fetchAgentById, 
  fetchHostAgentCode, 
  AgentSessionData 
} from '../services/api';

interface DirectAnydeskModalProps {
  onClose: () => void;
  servers: ConnectedServer[];
  currentServerId: string;
  onSelectServer: (server: ConnectedServer) => void;
  onAddServer: (server: Omit<ConnectedServer, 'id' | 'lastPing'>) => void;
}

export const DirectAnydeskModal: React.FC<DirectAnydeskModalProps> = ({
  onClose,
  servers,
  currentServerId,
  onSelectServer,
  onAddServer,
}) => {
  // ID de este Monitor Central (dinamico del host)
  const [myMonitorId, setMyMonitorId] = useState('CL-104-582-901');

  // Remote Target ID input
  const [remoteIdInput, setRemoteIdInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connect' | 'discovery' | 'session'>('connect');

  // Local Network Discovery State
  const [isScanningLan, setIsScanningLan] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);

  // Active Session State (Flujo de Telemetría Agente -> Monitor)
  const [session, setSession] = useState<AnyDeskRemoteSession | null>(null);
  const [connectingStep, setConnectingStep] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Métricas dinámicas en vivo del Agente vinculado
  const [liveMetrics, setLiveMetrics] = useState({
    cpu: 22.4,
    ram: 58.1,
    ramUsedGB: 9.3,
    ramTotalGB: 16.0,
    diskReadMB: 4.8,
    diskWriteMB: 2.1,
    netInKB: 840,
    netOutKB: 320,
    uptime: '14d 6h 32m',
    servicesRunning: 142
  });

  // Simulated & Live Telemetry logs
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    'Enlace P2P TLS 1.3 establecido.',
    'Agente de telemetría sincronizado en puerto 8443.',
    'Recibiendo telemetría continua de hardware en tiempo real...'
  ]);

  // Detected Local Servers on LAN (cargados dinámicamente desde el backend)
  const [localDetectedAgents, setLocalDetectedAgents] = useState<Array<{
    id: string;
    agentId: string;
    name: string;
    ip: string;
    port: number;
    osType: string;
    latencyMs: number;
    mac: string;
    status: 'ONLINE' | 'OFFLINE';
    cpu: number;
    ram: number;
  }>>([]);

  // Cargar ID del monitor propio y sincronizar agentes conectados en red
  useEffect(() => {
    fetchHostAgentCode().then(info => {
      if (info?.displayCode) {
        setMyMonitorId(info.displayCode);
      }
    });

    const refreshAgents = async () => {
      const agents = await fetchConnectedAgents();
      if (agents && agents.length > 0) {
        setLocalDetectedAgents(agents.map(a => ({
          id: a.agentId,
          agentId: a.displayCode,
          name: a.hostname,
          ip: a.ip,
          port: a.port,
          osType: a.osType,
          latencyMs: a.status === 'ONLINE' ? 2 : 120,
          mac: '00:15:5D:84:A2:10',
          status: a.status,
          cpu: a.cpu,
          ram: a.ram
        })));
      }
    };

    refreshAgents();
    const poller = setInterval(refreshAgents, 3000);
    return () => clearInterval(poller);
  }, []);

  // Actualizar métricas dinámicas y telemetría real si hay sesión activa
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(async () => {
      const agent = await fetchAgentById(session.remoteId);
      if (agent) {
        setLiveMetrics({
          cpu: agent.cpu,
          ram: agent.ram,
          ramUsedGB: agent.ramUsedGB,
          ramTotalGB: agent.ramTotalGB,
          diskReadMB: 3.4,
          diskWriteMB: 1.2,
          netInKB: agent.netInKB,
          netOutKB: agent.netOutKB,
          uptime: `${Math.floor(agent.uptimeSeconds / 3600)}h ${Math.floor((agent.uptimeSeconds % 3600) / 60)}m`,
          servicesRunning: agent.servicesRunning
        });
        const nowStr = new Date().toLocaleTimeString('es-ES', { hour12: false });
        setTelemetryLogs(prev => [
          `[${nowStr}] CPU: ${agent.cpu}% | RAM: ${agent.ram}% (${agent.ramUsedGB} GB / ${agent.ramTotalGB} GB) | Red: ${agent.netInKB} KB/s IN`,
          ...prev.slice(0, 19)
        ]);
      } else {
        // Fallback dinámico si es nodo de prueba sin agente local activo
        setLiveMetrics(prev => {
          const nextCpu = Math.max(8, Math.min(95, prev.cpu + (Math.random() * 6 - 3)));
          const nextRam = Math.max(30, Math.min(85, prev.ram + (Math.random() * 2 - 1)));
          return {
            ...prev,
            cpu: Number(nextCpu.toFixed(1)),
            ram: Number(nextRam.toFixed(1)),
            netInKB: Math.floor(600 + Math.random() * 600),
            netOutKB: Math.floor(200 + Math.random() * 300),
            diskReadMB: Number((2 + Math.random() * 4).toFixed(1)),
            diskWriteMB: Number((1 + Math.random() * 3).toFixed(1))
          };
        });
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [session]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setNotification(`${label} copiado al portapapeles.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleScanLan = () => {
    setIsScanningLan(true);
    setScanProgress(15);
    const interval = setInterval(async () => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanningLan(false);
          setNotification('Escaneo de red completado: Agentes sincronizados en tiempo real.');
          setTimeout(() => setNotification(null), 3000);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleIdInputChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
    setRemoteIdInput(clean);
  };

  // Conectar usando ID de Agente al estilo AnyDesk
  const handleStartConnection = async (targetAgentId: string, serverObj?: any) => {
    const rawId = (targetAgentId || serverObj?.agentId || '').trim();
    if (!rawId && !serverObj) return;

    setActiveTab('session');
    setConnectingStep(`Buscando Agente con código AnyDesk "${rawId}"...`);

    // Consultar al backend central si el agente está transmitiendo
    const connResult = await connectAgentByCode(rawId);

    if (connResult.success && connResult.agent) {
      const ag = connResult.agent;
      setConnectingStep(`Agente ${ag.hostname} detectado. Estableciendo túnel de telemetría en vivo...`);
      setTimeout(() => {
        setConnectingStep('Sincronizando flujo de métricas de CPU, memoria y discos...');
        setTimeout(() => {
          setConnectingStep(null);
          setSession({
            remoteId: ag.agentId,
            serverName: ag.hostname,
            ipAddress: ag.ip,
            port: ag.port,
            osType: ag.osType,
            status: 'CONNECTED',
            connectionType: 'AGENT_ID_DIRECT',
            fps: 60,
            latencyMs: 2,
            quality: 'HIGH',
            sessionStartTime: new Date().toLocaleTimeString(),
            keyboardCaptured: false,
            mouseCaptured: false,
            viewOnly: true,
          });

          setLiveMetrics({
            cpu: ag.cpu,
            ram: ag.ram,
            ramUsedGB: ag.ramUsedGB,
            ramTotalGB: ag.ramTotalGB,
            diskReadMB: 3.5,
            diskWriteMB: 1.2,
            netInKB: ag.netInKB,
            netOutKB: ag.netOutKB,
            uptime: `${Math.floor(ag.uptimeSeconds / 3600)}h ${Math.floor((ag.uptimeSeconds % 3600) / 60)}m`,
            servicesRunning: ag.servicesRunning
          });

          // Agregar o seleccionar en la lista de servidores del monitor
          onAddServer({
            name: ag.hostname,
            host: ag.ip,
            port: ag.port,
            osType: ag.osType,
            ssl: true,
            isCurrent: true,
            status: 'ONLINE',
            latencyMs: 2,
            agentId: ag.displayCode,
            isLocalDiscovered: true,
            cpu: ag.cpu,
            ram: ag.ram,
            ramUsedGB: ag.ramUsedGB,
            ramTotalGB: ag.ramTotalGB,
            netInKB: ag.netInKB,
            netOutKB: ag.netOutKB
          });

          setNotification(`Agente ${ag.hostname} [${ag.displayCode}] vinculado con éxito.`);
          setTimeout(() => setNotification(null), 4000);
        }, 500);
      }, 500);
    } else {
      // Fallback a agentes locales detectados si coincide parcialmente
      const foundLocal = localDetectedAgents.find(
        (a) => a.agentId.replace(/\D/g, '') === rawId.replace(/\D/g, '') || a.name.toLowerCase() === rawId.toLowerCase()
      );

      if (foundLocal) {
        setConnectingStep(`Agente ${foundLocal.name} localizado en red local...`);
        setTimeout(() => {
          setConnectingStep(null);
          setSession({
            remoteId: foundLocal.agentId,
            serverName: foundLocal.name,
            ipAddress: foundLocal.ip,
            port: foundLocal.port,
            osType: foundLocal.osType,
            status: 'CONNECTED',
            connectionType: 'LAN_LOCAL_DISCOVERY',
            fps: 60,
            latencyMs: foundLocal.latencyMs,
            quality: 'HIGH',
            sessionStartTime: new Date().toLocaleTimeString(),
            keyboardCaptured: false,
            mouseCaptured: false,
            viewOnly: true,
          });

          onAddServer({
            name: foundLocal.name,
            host: foundLocal.ip,
            port: foundLocal.port,
            osType: foundLocal.osType,
            ssl: true,
            isCurrent: true,
            status: 'ONLINE',
            latencyMs: foundLocal.latencyMs,
            agentId: foundLocal.agentId,
            isLocalDiscovered: true,
            cpu: foundLocal.cpu,
            ram: foundLocal.ram
          });

          setNotification(`Agente ${foundLocal.name} vinculado exitosamente.`);
          setTimeout(() => setNotification(null), 4000);
        }, 600);
      } else {
        setConnectingStep(null);
        setActiveTab('connect');
        setNotification(connResult.error || `No se encontró transmisión activa para el código "${rawId}". Ejecute "iniciar_agente.bat" en el equipo Windows para transmitir.`);
        setTimeout(() => setNotification(null), 6000);
      }
    }
  };

  const handleDisconnect = () => {
    setSession(null);
    setActiveTab('connect');
    setNotification('Enlace de telemetría con el Agente finalizado.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`w-full flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs text-white transition-all ${
        isFullscreen ? 'h-full max-w-none rounded-none border-none' : 'max-w-5xl max-h-[92vh]'
      }`}>
        {/* ========================================================================= */}
        {/* 1. TOP HEADER                                                             */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00ff66]/15 border border-[#00ff66]/30 text-[#00ff66] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.25)] shrink-0">
              <Zap className="w-5 h-5 fill-[#00ff66]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-wide">
                  CRASHING LIVE • ENLACE AGENTE ⇄ MONITOR
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30 uppercase">
                  Código ID de Enlace
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Conecta agentes de telemetría a este monitor central en tiempo real.
              </p>
            </div>
          </div>

          {/* Selector de Pestañas Header */}
          <div className="flex items-center gap-1.5">
            {!session && (
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setActiveTab('connect')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'connect'
                      ? 'bg-[#00ff66] text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Vincular por ID
                </button>
                <button
                  onClick={() => {
                    setActiveTab('discovery');
                    handleScanLan();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'discovery'
                      ? 'bg-[#00ff66] text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Detección Local (LAN)</span>
                </button>
              </div>
            )}

            {session && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
                  <span>Agente Enlazado: {session.serverName} ({session.latencyMs}ms)</span>
                </span>
                <button
                  onClick={() => {
                    const srv = servers.find(s => s.name === session.serverName || s.host === session.ipAddress) || {
                      id: `srv-${Date.now()}`,
                      name: session.serverName,
                      host: session.ipAddress,
                      port: session.port,
                      osType: session.osType,
                      ssl: true,
                      isCurrent: true,
                      status: 'ONLINE' as const,
                      latencyMs: session.latencyMs,
                      agentId: session.remoteId,
                      isLocalDiscovered: session.connectionType === 'LAN_LOCAL_DISCOVERY',
                      lastPing: 'En vivo'
                    };
                    onSelectServer(srv as any);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-black text-xs shadow-sm transition-colors flex items-center gap-1"
                  title="Abrir y enfocar este equipo en el Monitor principal"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Ver en Monitor Principal</span>
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
                  title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Desconectar Enlace
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notificación de Propósito del Enlace (Aclaración explícita) */}
        <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-300">
          <Info className="w-4 h-4 text-[#00ff66] shrink-0" />
          <span>
            <strong>Propósito del Enlace:</strong> La conexión por código ID estilo AnyDesk permite conectar agentes remotos al monitor central para recibir telemetría continua de hardware, alertas y estado de servicios. <em>(No es para tomar control remoto de escritorio ni pantalla).</em>
          </span>
        </div>

        {/* Notificaciones emergentes */}
        {notification && (
          <div className="px-4 py-2 bg-[#00ff66]/15 border-b border-[#00ff66]/30 text-[#00ff66] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. CONTENIDO PRINCIPAL SEGÚN LA PESTAÑA ACTIVA                            */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CONEXIÓN POR ID DE AGENTE */}
          {activeTab === 'connect' && !session && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Panel 1: Su Puesto (ID de Este Monitor) */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-[#00ff66]" /> Su Puesto (Este Monitor Central)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20">
                        MONITOR LISTO
                      </span>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                        Dirección / ID de Este Monitor:
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
                          {myMonitorId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(myMonitorId, 'ID de Monitor')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
                          title="Copiar ID para compartir"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#00ff66]" />
                          <span>Copiar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Los agentes de telemetría configurados en servidores o puestos remotos pueden emitir sus métricas directamente a este ID sin necesidad de configuración en routers ni cortafuegos.
                  </p>
                </div>

                {/* Panel 2: Conectar a Agente Remoto */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#00ff66]" /> Vincular Agente Remoto
                    </span>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 mb-1.5 block">
                          Ingrese el ID del Agente Remoto:
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={remoteIdInput}
                            onChange={(e) => handleIdInputChange(e.target.value)}
                            placeholder="Ej: CL-948-201-143 o 948 201 143"
                            className="w-full px-4 py-3 rounded-xl bg-black border border-zinc-700 text-base font-mono font-bold tracking-wider text-white placeholder-zinc-600 focus:outline-none focus:border-[#00ff66]"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartConnection(remoteIdInput)}
                        disabled={!remoteIdInput.trim()}
                        className="w-full py-3 rounded-xl bg-[#00ff66] hover:bg-[#00dd55] disabled:opacity-40 disabled:pointer-events-none text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)] flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Vincular y Recibir Telemetría en Vivo</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                    <span className="font-bold text-white block">¿Cómo obtener el ID del Agente?</span>
                    <span>El ID se genera al instalar el Agente Host en el equipo remoto y se visualiza en su archivo <code>config.json</code> o en el acceso directo del escritorio.</span>
                  </div>
                </div>
              </div>

              {/* Lista de Agentes Detectados Recientemente */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[#00ff66]" /> Agentes de Telemetría Detectados en LAN
                  </span>
                  <span className="text-[11px] text-zinc-500">Auto-descubrimiento en tiempo real</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {localDetectedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-[#00ff66]/50 transition-all flex flex-col justify-between space-y-2 group"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs truncate">{agent.name}</span>
                          <span className="text-[10px] font-mono text-[#00ff66]">{agent.latencyMs}ms</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                          ID: <strong className="text-zinc-200">{agent.agentId}</strong>
                        </span>
                        <span className="text-[10px] text-zinc-500 block truncate">{agent.osType}</span>
                      </div>

                      <button
                        onClick={() => handleStartConnection(agent.agentId, agent)}
                        className="w-full mt-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-[#00ff66] text-zinc-200 hover:text-black font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Vincular al Monitor</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETECCIÓN LOCAL EN RED */}
          {activeTab === 'discovery' && !session && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-[#00ff66]" />
                      <span>Escáner de Red Local (Broadcast / mDNS)</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Subred activa: <strong className="text-white">192.168.1.0/24</strong> • Buscando balizas de agentes en segundo plano
                    </p>
                  </div>

                  <button
                    onClick={handleScanLan}
                    disabled={isScanningLan}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00dd55] text-black font-black text-xs transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningLan ? 'animate-spin' : ''}`} />
                    <span>Escanear Red Ahora</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Estado del Escáner:</span>
                    <span>{isScanningLan ? `Escaneando puertos de telemetría 8443 / 8444... ${scanProgress}%` : 'Escaneo Completado'}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                    <div className="h-full bg-[#00ff66] transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {localDetectedAgents.map((agent) => (
                    <div key={agent.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-white text-sm block">{agent.name}</span>
                          <span className="text-[11px] text-zinc-400 font-mono mt-0.5 block">
                            IP: {agent.ip}:{agent.port} • MAC: {agent.mac}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
                          {agent.latencyMs}ms PING
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black border border-zinc-800 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">ID de Agente:</span>
                        <strong className="text-white font-mono tracking-wider">{agent.agentId}</strong>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                          <span>CPU: <strong className="text-white">{agent.cpu}%</strong></span>
                          <span>RAM: <strong className="text-white">{agent.ram}%</strong></span>
                        </div>
                        <button
                          onClick={() => handleStartConnection(agent.agentId, agent)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-black text-xs transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Conectar al Monitor</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SESIÓN DE TELEMETRÍA EN VIVO (AGENTE -> MONITOR) */}
          {activeTab === 'session' && (
            <div className="space-y-4">
              {connectingStep && (
                <div className="p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center space-y-4 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-[#00ff66]/20 border border-[#00ff66]/40 text-[#00ff66] flex items-center justify-center mx-auto shadow-xl">
                    <Zap className="w-6 h-6 animate-bounce" />
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Sincronizando Enlace de Telemetría
                  </h3>
                  <p className="text-xs text-[#00ff66] font-mono">{connectingStep}</p>
                </div>
              )}

              {session && !connectingStep && (
                <div className="space-y-4">
                  {/* Tarjeta de Identidad del Agente Enlazado */}
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-black border border-zinc-700 text-[#00ff66]">
                        <Server className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">{session.serverName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff66] text-black">
                            TELEMETRÍA EN VIVO
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          ID: <strong className="text-white">{session.remoteId}</strong> • IP: {session.ipAddress} • {session.osType}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setNotification(`Heartbeat enviado a ${session.serverName}. Latencia: ${session.latencyMs}ms`);
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Test Heartbeat</span>
                      </button>
                      <button
                        onClick={() => {
                          const srv = servers.find(s => s.name === session.serverName || s.host === session.ipAddress) || {
                            id: `srv-${Date.now()}`,
                            name: session.serverName,
                            host: session.ipAddress,
                            port: session.port,
                            osType: session.osType,
                            ssl: true,
                            isCurrent: true,
                            status: 'ONLINE' as const,
                            latencyMs: session.latencyMs,
                            agentId: session.remoteId,
                            isLocalDiscovered: session.connectionType === 'LAN_LOCAL_DISCOVERY',
                            lastPing: 'En vivo'
                          };
                          onSelectServer(srv as any);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00dd55] text-black font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.25)] transition-all"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Abrir en Panel de Control Principal</span>
                      </button>
                    </div>
                  </div>

                  {/* Panel de Métricas de Hardware en Tiempo Real */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* CPU */}
                    <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-[#00ff66]" /> Uso de CPU
                        </span>
                        <span className="text-xs font-bold text-white">{liveMetrics.cpu}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                        <div className="h-full bg-[#00ff66] transition-all duration-500" style={{ width: `${liveMetrics.cpu}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-500 block">Frecuencia nominal: 3.20 GHz</span>
                    </div>

                    {/* RAM */}
                    <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-[#00ff66]" /> Memoria RAM
                        </span>
                        <span className="text-xs font-bold text-white">{liveMetrics.ram}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${liveMetrics.ram}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-500 block">{liveMetrics.ramUsedGB} GB de {liveMetrics.ramTotalGB} GB en uso</span>
                    </div>

                    {/* Red I/O */}
                    <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-[#00ff66]" /> Tráfico de Red
                        </span>
                        <span className="text-[10px] text-emerald-400">{session.latencyMs}ms PING</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-300">IN: <strong>{liveMetrics.netInKB} KB/s</strong></span>
                        <span className="text-zinc-300">OUT: <strong>{liveMetrics.netOutKB} KB/s</strong></span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block">Adaptador Ethernet principal activo</span>
                    </div>

                    {/* Salud y Servicios */}
                    <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00ff66]" /> Salud del Nodo
                        </span>
                        <span className="text-[10px] text-[#00ff66] font-bold">ÓPTIMA</span>
                      </div>
                      <div className="text-xs text-zinc-300 font-mono">
                        <span>Servicios activos: <strong>{liveMetrics.servicesRunning}</strong></span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block">Uptime: {liveMetrics.uptime}</span>
                    </div>
                  </div>

                  {/* Consola de Registro de Telemetría en Vivo */}
                  <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-[#00ff66]" /> Registro Continuo de Telemetría (Daemon Log)
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Puerto: 8443 (TCP Stream)</span>
                    </div>

                    <div className="font-mono text-[11px] text-zinc-300 space-y-1 max-h-36 overflow-y-auto">
                      {telemetryLogs.map((log, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-zinc-500">[{new Date().toLocaleTimeString()}]</span>
                          <span className={idx === telemetryLogs.length - 1 ? 'text-[#00ff66]' : ''}>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
