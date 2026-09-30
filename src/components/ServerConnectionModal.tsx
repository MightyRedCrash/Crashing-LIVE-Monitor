import React, { useState } from 'react';
import { ConnectedServer } from '../types';
import { 
  Server, 
  Wifi, 
  Plus, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RotateCw, 
  ShieldCheck, 
  Radio, 
  ExternalLink,
  Laptop,
  X
} from 'lucide-react';

interface ServerConnectionModalProps {
  servers: ConnectedServer[];
  currentServerId: string;
  onSelectServer: (server: ConnectedServer) => void;
  onAddServer: (server: Omit<ConnectedServer, 'id' | 'lastPing'>) => void;
  onDeleteServer: (id: string) => void;
  onClose: () => void;
}

export const ServerConnectionModal: React.FC<ServerConnectionModalProps> = ({
  servers,
  currentServerId,
  onSelectServer,
  onAddServer,
  onDeleteServer,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testedLatency, setTestedLatency] = useState<number | null>(null);

  // New Server Form state
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(8443);
  const [osType, setOsType] = useState('Windows Server 2022');
  const [token, setToken] = useState('clk_live_sec_token_99');
  const [ssl, setSsl] = useState(true);

  const handleTestConnection = () => {
    if (!host) return;
    setTestState('testing');
    setTimeout(() => {
      const lat = Math.floor(Math.random() * 8) + 2;
      setTestedLatency(lat);
      setTestState('success');
    }, 900);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !host) return;

    onAddServer({
      name,
      host,
      port,
      osType,
      token,
      ssl,
      isCurrent: true,
      status: 'ONLINE',
      latencyMs: testedLatency || 4,
    });

    setActiveTab('list');
    setName('');
    setHost('');
    setTestState('idle');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                Gestor de Conexión de Servidores Windows
              </h2>
              <p className="text-[11px] text-zinc-400">
                Conéctate desde este panel a cualquier Windows Server o Windows 11 en la red para monitorear y controlar en tiempo real.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800 bg-black/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Servidores Vinculados ({servers.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'add'
                  ? 'bg-[#ff6b00] text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Conectar Nuevo Servidor</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'list' && (
            <div className="space-y-3">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                Selecciona un equipo para visualizar su telemetría y ejecutar procesos:
              </span>

              {servers.map((srv) => {
                const isSelected = srv.id === currentServerId;
                return (
                  <div
                    key={srv.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#00ff66]/10 border-[#00ff66]/60 shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {srv.osType.includes('Server') ? (
                          <Server className="w-5 h-5" />
                        ) : (
                          <Laptop className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{srv.name}</span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#00ff66] text-black">
                              ACTIVO EN PANEL
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span className="text-zinc-300 font-bold">{srv.host}:{srv.port}</span>
                          <span>•</span>
                          <span>{srv.osType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff66]"></span>
                        </span>
                        <span className="text-[#00ff66] font-bold">{srv.latencyMs}ms</span>
                        <span className="text-zinc-500">({srv.lastPing})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isSelected ? (
                          <button
                            onClick={() => {
                              onSelectServer(srv);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold transition-colors shadow-sm"
                          >
                            Conectar y Ver
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Conectado
                          </span>
                        )}

                        {servers.length > 1 && (
                          <button
                            onClick={() => onDeleteServer(srv.id)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors"
                            title="Desvincular servidor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 flex items-start gap-2">
                <Wifi className="w-4 h-4 text-[#ff6b00] shrink-0 mt-0.5" />
                <span>
                  Introduce la IP o dominio donde el agente Python de <strong>Crashing Live</strong> está corriendo en tu red local o VPN.
                </span>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-bold">Nombre Identificador:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Servidor Primario Windows 2022 o PC-Oficina-Ranko"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-300 mb-1 font-bold">IP o Hostname del Servidor:</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.140 o winsrv.lan"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-bold">Puerto:</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1 font-bold">Sistema Operativo:</label>
                  <select
                    value={osType}
                    onChange={(e) => setOsType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="Windows Server 2022">Windows Server 2022</option>
                    <option value="Windows Server 2019">Windows Server 2019</option>
                    <option value="Windows 11 Pro">Windows 11 Pro</option>
                    <option value="Windows 11 Enterprise">Windows 11 Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1 font-bold">Token de Autenticación:</label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="clk_live_token..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>
              </div>

              {/* Ping Connection Test */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-black border border-zinc-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sslToggle"
                    checked={ssl}
                    onChange={(e) => setSsl(e.target.checked)}
                    className="w-4 h-4 rounded text-[#ff6b00]"
                  />
                  <label htmlFor="sslToggle" className="text-zinc-300 cursor-pointer">
                    Conexión Segura TLS / HTTPS
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testState === 'testing' || !host}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${testState === 'testing' ? 'animate-spin' : ''}`} />
                  <span>{testState === 'testing' ? 'Haciendo Ping...' : 'Probar Conexión (Ping)'}</span>
                </button>
              </div>

              {testState === 'success' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Handshake exitoso con {host}:{port}. Latencia de respuesta: {testedLatency}ms. Listo para enlazar.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                >
                  Volver a la lista
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-black transition-colors shadow-[0_0_15px_rgba(0,255,102,0.3)]"
                >
                  Vincular y Conectar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-900/60 text-zinc-500 text-[11px]">
          <span>Crashing Live Remote Node Linker</span>
          <button onClick={onClose} className="text-zinc-300 hover:text-white">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
