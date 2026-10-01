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
  Sliders, 
  MousePointer, 
  FolderDown, 
  ArrowRight,
  Radio,
  FileCode,
  HardDrive,
  Cpu,
  Activity,
  Send
} from 'lucide-react';

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
  // My Local Monitor ID
  const myMonitorId = 'CL-104-582-901';

  // Remote Target ID input
  const [remoteIdInput, setRemoteIdInput] = useState('');
  const [remotePinInput, setRemotePinInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connect' | 'discovery' | 'session'>('connect');

  // Local Network Discovery State
  const [isScanningLan, setIsScanningLan] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);

  // Active Session State
  const [session, setSession] = useState<AnyDeskRemoteSession | null>(null);
  const [connectingStep, setConnectingStep] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 340, y: 220 });
  const [activeRemoteApp, setActiveRemoteApp] = useState<'powershell' | 'taskmgr' | 'explorer'>('powershell');
  const [remoteCommandInput, setRemoteCommandInput] = useState('');
  const [remoteTerminalLogs, setRemoteTerminalLogs] = useState<string[]>([
    'Microsoft Windows [Versión 10.0.20348.2407]',
    '(c) Microsoft Corporation. Todos los derechos reservados.',
    '',
    'PS C:\\CrashingLive> Get-Service -Name CrashingLiveDaemon',
    'Status   Name               DisplayName',
    '------   ----               -----------',
    'Running  CrashingLiveDaemon Crashing Live Autonomous AI Daemon',
    '',
    'PS C:\\CrashingLive> [System.Net.Dns]::GetHostByName($env:computerName).AddressList.IPAddressToString',
    '192.168.1.140',
    ''
  ]);

  // Detected Local Servers on LAN
  const [localDetectedAgents, setLocalDetectedAgents] = useState<Array<{
    id: string;
    agentId: string;
    name: string;
    ip: string;
    port: number;
    osType: string;
    latencyMs: number;
    mac: string;
    status: 'ONLINE';
    cpu: number;
    ram: number;
  }>>([
    {
      id: 'srv-node-1',
      agentId: 'CL-948-201-143',
      name: 'WINSRV-2022-DC01',
      ip: '192.168.1.140',
      port: 8443,
      osType: 'Windows Server 2022 Datacenter',
      latencyMs: 1,
      mac: '00:15:5D:84:A2:10',
      status: 'ONLINE',
      cpu: 24,
      ram: 64,
    },
    {
      id: 'srv-node-2',
      agentId: 'CL-834-192-750',
      name: 'WIN11-DEV-STATION',
      ip: '192.168.1.88',
      port: 8443,
      osType: 'Windows 11 Pro 23H2',
      latencyMs: 2,
      mac: 'E4:5F:01:3C:99:A4',
      status: 'ONLINE',
      cpu: 18,
      ram: 52,
    },
    {
      id: 'srv-node-4',
      agentId: 'CL-550-184-902',
      name: 'CONTABILIDAD-PC',
      ip: '192.168.1.55',
      port: 8443,
      osType: 'Windows 10 Pro',
      latencyMs: 1,
      mac: '70:85:C2:55:12:88',
      status: 'ONLINE',
      cpu: 12,
      ram: 45,
    },
    {
      id: 'srv-node-3',
      agentId: 'CL-712-409-338',
      name: 'WINSRV-BACKUP02',
      ip: '10.0.2.14',
      port: 8443,
      osType: 'Windows Server 2019',
      latencyMs: 4,
      mac: '00:15:5D:71:02:B9',
      status: 'ONLINE',
      cpu: 42,
      ram: 70,
    },
  ]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setNotification(`${label} copiado al portapapeles.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleScanLan = () => {
    setIsScanningLan(true);
    setScanProgress(15);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanningLan(false);
          setNotification('Escaneo LAN completado: 4 agentes detectados localmente.');
          setTimeout(() => setNotification(null), 3000);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Formateador de ID estilo AnyDesk (ej: CL-849-201-143 o 849 201 143)
  const handleIdInputChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRemoteIdInput(clean);
  };

  // Conectar usando ID de Agente o Detección Local
  const handleStartConnection = (targetAgentId: string, serverObj?: any) => {
    if (!targetAgentId && !serverObj) return;

    const idToUse = targetAgentId || serverObj?.agentId || 'CL-948-201-143';
    const foundLocal = localDetectedAgents.find(
      (a) => a.agentId.replace(/-/g, '') === idToUse.replace(/-/g, '') || a.name === serverObj?.name
    );

    const isLocal = !!foundLocal;
    const targetName = foundLocal?.name || serverObj?.name || `Equipo Remoto (${idToUse})`;
    const targetIp = foundLocal?.ip || serverObj?.host || '192.168.1.140';
    const targetOs = foundLocal?.osType || serverObj?.osType || 'Windows Server 2022';
    const targetLatency = isLocal ? (foundLocal?.latencyMs || 2) : 18;

    setActiveTab('session');
    setConnectingStep('Buscando Agente en red local y relay AnyDesk...');

    setTimeout(() => {
      setConnectingStep(isLocal ? 'Agente detectado en red local (192.168.1.0/24)...' : 'Negociando túnel P2P TLS 1.3 con ID de Agente...');
      setTimeout(() => {
        setConnectingStep('Autenticación y guardrails de seguridad aceptados...');
        setTimeout(() => {
          setConnectingStep(null);
          setSession({
            remoteId: idToUse,
            serverName: targetName,
            ipAddress: targetIp,
            port: 8443,
            osType: targetOs,
            status: 'CONNECTED',
            connectionType: isLocal ? 'LAN_LOCAL_DISCOVERY' : 'AGENT_ID_DIRECT',
            fps: 60,
            latencyMs: targetLatency,
            quality: 'HIGH',
            sessionStartTime: new Date().toLocaleTimeString(),
            keyboardCaptured: true,
            mouseCaptured: true,
            viewOnly: false,
          });

          // Sincronizar o crear en la lista de servidores si no existe
          const exists = servers.some(s => s.host === targetIp);
          if (!exists) {
            onAddServer({
              name: targetName,
              host: targetIp,
              port: 8443,
              osType: targetOs,
              ssl: true,
              isCurrent: true,
              status: 'ONLINE',
              latencyMs: targetLatency,
              agentId: idToUse,
              isLocalDiscovered: isLocal
            });
          }

          setNotification(`Conectado con éxito a ${targetName} vía ${isLocal ? 'Detección LAN Local' : 'Túnel por ID de Agente'}.`);
          setTimeout(() => setNotification(null), 4000);
        }, 600);
      }, 700);
    }, 600);
  };

  const handleDisconnect = () => {
    setSession(null);
    setActiveTab('connect');
    setNotification('Sesión AnyDesk finalizada correctamente.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSendRemoteCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteCommandInput.trim()) return;

    const cmd = remoteCommandInput.trim();
    const newLogs = [...remoteTerminalLogs, `PS C:\\CrashingLive> ${cmd}`];

    if (cmd.toLowerCase().includes('help') || cmd.toLowerCase().includes('ayuda')) {
      newLogs.push('Comandos disponibles: Get-Process, Get-Service, Restart-Service, ping, hostname, ipconfig');
    } else if (cmd.toLowerCase().includes('hostname')) {
      newLogs.push(session?.serverName || 'WINSRV-2022-DC01');
    } else if (cmd.toLowerCase().includes('ipconfig')) {
      newLogs.push(`Adaptador de Ethernet Ethernet0:\n   Dirección IPv4. . . . . . . . . . . : ${session?.ipAddress || '192.168.1.140'}\n   Máscara de subred . . . . . . . . . : 255.255.255.0\n   Puerta de enlace predeterminada . . : 192.168.1.1`);
    } else if (cmd.toLowerCase().includes('get-process')) {
      newLogs.push('Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id ProcessName\n-------  ------    -----      -----     ------     -- -----------\n    420      24   124500     145000       1.24   4912 agent_daemon\n    890      45   486200     520000       4.12   1204 postgres\n    310      18    84000      92000       0.85   3190 powershell');
    } else {
      newLogs.push(`[OK] Comando '${cmd}' ejecutado en ${session?.serverName}. Guardrail validado.`);
    }

    setRemoteTerminalLogs(newLogs);
    setRemoteCommandInput('');
  };

  const sendMacro = (macroName: string) => {
    setNotification(`Macro enviado a ${session?.serverName}: [${macroName}]`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`w-full flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs text-white transition-all ${
        isFullscreen ? 'h-full max-w-none rounded-none border-none' : 'max-w-5xl max-h-[92vh]'
      }`}>
        {/* ========================================================================= */}
        {/* 1. TOP HEADER ESTILO ANYDESK                                              */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,69,0,0.4)] shrink-0">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-wide">
                  CRASHING LIVE DIRECT CONNECT
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 uppercase">
                  Estilo AnyDesk P2P
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Conexión directa por ID de Agente o Auto-Detección Local en LAN.
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
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Conexión por ID
                </button>
                <button
                  onClick={() => {
                    setActiveTab('discovery');
                    handleScanLan();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'discovery'
                      ? 'bg-[#00ff66] text-black shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Detección Local ({localDetectedAgents.length})</span>
                </button>
              </div>
            )}

            {session && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#00ff66]/15 border border-[#00ff66]/30 text-[#00ff66] text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
                  <span>Conectado: {session.serverName} ({session.latencyMs}ms)</span>
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
                  title="Abrir y enfocar este equipo en el Monitor de Estado principal"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Ver en Monitor de Estado</span>
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
                  Desconectar
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
          {/* ----------------------------------------------------------------------- */}
          {/* TAB 1: CONEXIÓN POR ID DE AGENTE (ESTILO ANYDESK)                       */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'connect' && !session && (
            <div className="space-y-6">
              {/* Bloque Superior: Mi Puesto vs Otro Puesto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Panel 1: Su Puesto (ID de Este Monitor) */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-[#00ff66]" /> Su Puesto (Este Monitor)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20">
                        ONLINE • LISTO
                      </span>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                        Su Dirección / ID de Agente:
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
                    Cualquier agente configurado puede conectarse a este centro de mando utilizando este ID o a través de la red local.
                  </p>
                </div>

                {/* Panel 2: Otro Puesto (Conectar a un Equipo Remoto por ID) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950 border-2 border-red-500/30 shadow-[0_0_20px_rgba(255,69,0,0.1)] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white font-bold uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-500" /> Conectar a Otro Puesto
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      ID de Agente (AnyDesk Style)
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-zinc-300 font-bold block mb-1">
                        Ingrese el ID del Agente Remoto:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={remoteIdInput}
                          onChange={(e) => handleIdInputChange(e.target.value)}
                          placeholder="Ej: CL-948-201-143 o 849201143"
                          className="w-full pl-3 pr-10 py-3 rounded-xl bg-black border-2 border-zinc-700 focus:border-red-500 text-lg font-mono text-white tracking-widest placeholder:text-zinc-600 focus:outline-none transition-all uppercase"
                        />
                        <Zap className="w-4 h-4 text-orange-400 absolute right-3.5 top-3.5 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">
                        PIN o Contraseña Desatendida (Opcional si tiene auto-aprobación):
                      </label>
                      <input
                        type="password"
                        value={remotePinInput}
                        onChange={(e) => setRemotePinInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-800 focus:border-red-500 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleStartConnection(remoteIdInput)}
                      disabled={!remoteIdInput.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(255,69,0,0.35)] disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Conectar de Manera Directa</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Banner de Detección Local Rápida: "A menos que lo detecte localmente" */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-[#00ff66]/30 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00ff66]/15 border border-[#00ff66]/30 text-[#00ff66] flex items-center justify-center shrink-0">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase flex items-center gap-2">
                        <span>Equipos Detectados en Red Local (Auto-Discovery)</span>
                        <span className="px-2 py-0.2 rounded text-[10px] bg-[#00ff66] text-black font-black">
                          {localDetectedAgents.length} ENCONTRADOS
                        </span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        No requiere ingresar el ID si el equipo está en la misma subred LAN: conexión en 1 clic.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleScanLan}
                    disabled={isScanningLan}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningLan ? 'animate-spin text-[#00ff66]' : ''}`} />
                    <span>{isScanningLan ? 'Escaneando LAN...' : 'Volver a Escanear'}</span>
                  </button>
                </div>

                {/* Listado de Equipos Detectados en Red Local */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {localDetectedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-[#00ff66]/50 transition-all flex flex-col justify-between group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-black border border-zinc-800 text-[#00ff66]">
                            {agent.osType.includes('Server') ? <Server className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block group-hover:text-[#00ff66] transition-colors">
                              {agent.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              IP: {agent.ip} • ID: <strong className="text-zinc-200">{agent.agentId}</strong>
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30 shrink-0">
                          {agent.latencyMs}ms LAN
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-500">{agent.osType}</span>
                        <button
                          onClick={() => handleStartConnection(agent.agentId, agent)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-black text-xs transition-all shadow-[0_0_12px_rgba(0,255,102,0.25)]"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Conectar Local</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 2: DETECCIÓN LOCAL RADAR & ESCÁNER LAN                               */}
          {/* ----------------------------------------------------------------------- */}
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
                      Subred activa: <strong className="text-white">192.168.1.0/24</strong> • Escaneando agentes en segundo plano
                    </p>
                  </div>

                  <button
                    onClick={handleScanLan}
                    disabled={isScanningLan}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00dd55] text-black font-black text-xs transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningLan ? 'animate-spin' : ''}`} />
                    <span>Escanear Ahora</span>
                  </button>
                </div>

                {/* Radar Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Estado del Escáner:</span>
                    <span>{isScanningLan ? `Escaneando puertos 8443 / 8444... ${scanProgress}%` : 'Escaneo Completado'}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-[#00ff66] transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>

                {/* Grid con detalles de hardware descubierto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {localDetectedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-3"
                    >
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
                        <span className="text-zinc-400">ID de Agente AnyDesk:</span>
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
                          <span>Conectar Directo</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 3: SESIÓN ACTIVA DE ESCRITORIO REMOTO (ESTILO ANYDESK)              */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'session' && (
            <div className="space-y-4">
              {connectingStep && (
                <div className="p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center space-y-4 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 text-white flex items-center justify-center mx-auto shadow-xl">
                    <Zap className="w-6 h-6 animate-bounce" />
                  </div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Estableciendo Conexión AnyDesk Directa
                  </h3>
                  <p className="text-xs text-[#00ff66] font-mono">{connectingStep}</p>
                </div>
              )}

              {session && !connectingStep && (
                <div className="space-y-3">
                  {/* Floating Toolbar AnyDesk */}
                  <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-black text-[#00ff66] font-bold border border-zinc-800">
                        {session.fps} FPS
                      </span>
                      <span className="text-zinc-400 hidden sm:inline">
                        Latencia: <strong className="text-white">{session.latencyMs}ms</strong>
                      </span>
                      <span className="text-zinc-400 hidden md:inline">
                        Tipo: <strong className="text-white">{session.connectionType === 'LAN_LOCAL_DISCOVERY' ? 'LAN Direct P2P' : 'Túnel Agente Relay'}</strong>
                      </span>
                    </div>

                    {/* Macros Rápidos de Teclado */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => sendMacro('Ctrl+Alt+Del')}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] transition-colors"
                        title="Enviar combinación de teclas Ctrl+Alt+Del"
                      >
                        Ctrl+Alt+Del
                      </button>
                      <button
                        onClick={() => sendMacro('Win+R')}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] transition-colors"
                        title="Abrir diálogo Ejecutar de Windows"
                      >
                        Win+R
                      </button>
                      <button
                        onClick={() => sendMacro('Win+X')}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] transition-colors"
                        title="Menú Administrativo de Windows"
                      >
                        Win+X
                      </button>
                      <button
                        onClick={() => setActiveRemoteApp(activeRemoteApp === 'powershell' ? 'taskmgr' : 'powershell')}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[#00ff66] font-bold text-[10px] transition-colors"
                      >
                        Cambiar Ventana ({activeRemoteApp.toUpperCase()})
                      </button>
                    </div>
                  </div>

                  {/* Canvas / Pantalla Simulada del Escritorio Remoto Windows */}
                  <div
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMousePos({ x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) });
                    }}
                    className="relative w-full h-[480px] sm:h-[540px] rounded-2xl bg-slate-950 border-2 border-zinc-700 overflow-hidden shadow-2xl flex flex-col justify-between select-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 50% 50%, #0d1b2a 0%, #020617 100%)'
                    }}
                  >
                    {/* Watermark / HUD Superior de la pantalla remota */}
                    <div className="p-3 flex items-center justify-between text-[11px] text-zinc-400 bg-black/40 backdrop-blur-sm border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
                        <span className="font-bold text-white">{session.serverName}</span>
                        <span>({session.ipAddress})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Puntero Remoto: X:{mousePos.x} Y:{mousePos.y}</span>
                        <span className="text-[#00ff66]">Direct Stream Activo</span>
                      </div>
                    </div>

                    {/* Ventana Activa en el Escritorio Remoto */}
                    <div className="p-4 flex-1 flex items-center justify-center">
                      {activeRemoteApp === 'powershell' && (
                        <div className="w-full max-w-2xl h-80 rounded-xl bg-black/90 border border-zinc-700 shadow-2xl flex flex-col overflow-hidden font-mono text-xs">
                          {/* Ventana Header */}
                          <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-[11px]">
                            <span className="text-white font-bold flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Administrador: Windows PowerShell ({session.serverName})
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                            </div>
                          </div>

                          {/* Terminal Output */}
                          <div className="p-3 flex-1 overflow-y-auto text-zinc-300 text-[11px] space-y-1">
                            {remoteTerminalLogs.map((log, idx) => (
                              <div key={idx} className="whitespace-pre-wrap">{log}</div>
                            ))}
                          </div>

                          {/* Interactive Command Input */}
                          <form onSubmit={handleSendRemoteCommand} className="p-2 border-t border-zinc-800 flex items-center gap-2 bg-zinc-950">
                            <span className="text-[#00ff66] font-bold text-xs">PS&gt;</span>
                            <input
                              type="text"
                              value={remoteCommandInput}
                              onChange={(e) => setRemoteCommandInput(e.target.value)}
                              placeholder="Escribe un comando remoto (ej: hostname, Get-Process, ipconfig)..."
                              className="flex-1 bg-transparent text-white text-xs font-mono focus:outline-none placeholder:text-zinc-600"
                            />
                            <button
                              type="submit"
                              className="px-2.5 py-1 rounded bg-[#00ff66] text-black font-bold text-[10px] hover:bg-[#00dd55]"
                            >
                              Enviar
                            </button>
                          </form>
                        </div>
                      )}

                      {activeRemoteApp === 'taskmgr' && (
                        <div className="w-full max-w-2xl h-80 rounded-xl bg-zinc-950/95 border border-zinc-700 shadow-2xl p-4 flex flex-col justify-between font-mono text-xs">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <Activity className="w-4 h-4 text-[#ff6b00]" /> Administrador de Tareas ({session.serverName})
                            </span>
                            <span className="text-[#00ff66] text-[10px]">Actualizando en vivo</span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 my-2">
                            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                              <span className="text-[10px] text-zinc-400 block">CPU</span>
                              <span className="text-xl font-black text-white">24%</span>
                              <span className="text-[10px] text-[#00ff66]">3.40 GHz</span>
                            </div>
                            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                              <span className="text-[10px] text-zinc-400 block">MEMORIA</span>
                              <span className="text-xl font-black text-white">64%</span>
                              <span className="text-[10px] text-zinc-400">10.2 / 16 GB</span>
                            </div>
                            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                              <span className="text-[10px] text-zinc-400 block">DISCO (C:)</span>
                              <span className="text-xl font-black text-white">58%</span>
                              <span className="text-[10px] text-amber-400">NVMe OK</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-zinc-400 border-t border-zinc-850 pt-2 flex items-center justify-between">
                            <span>Daemon de Telemetría: <strong className="text-[#00ff66]">ONLINE</strong></span>
                            <button
                              onClick={() => setActiveRemoteApp('powershell')}
                              className="text-[#00ff66] hover:underline"
                            >
                              Volver a Terminal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simulated Remote Cursor */}
                    <div
                      className="absolute w-4 h-4 pointer-events-none transition-all duration-75 text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                      style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
                    >
                      <MousePointer className="w-4 h-4 fill-red-500" />
                    </div>

                    {/* Barra de Tareas Inferior de Windows */}
                    <div className="h-10 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 flex items-center justify-between px-3 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Windows Start Button */}
                        <div className="w-7 h-7 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer shadow-sm">
                          <span className="font-black text-[10px]">田</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/80 text-[11px] text-zinc-300">
                          <Terminal className="w-3 h-3 text-cyan-400" />
                          <span>PowerShell</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/80 text-[11px] text-zinc-300">
                          <HardDrive className="w-3 h-3 text-amber-400" />
                          <span>C:\CrashingLive</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                        <span className="text-[#00ff66] flex items-center gap-1">
                          <Wifi className="w-3 h-3" /> LAN
                        </span>
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
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
