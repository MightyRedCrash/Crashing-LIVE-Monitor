import React, { useState } from 'react';
import { GlitchLogo } from './GlitchLogo';
import { ThemeMode, DisruptiveApproval, ConnectedServer } from '../types';
import { 
  Server, 
  Database, 
  Wifi, 
  ShieldAlert, 
  Sun, 
  Moon, 
  Terminal, 
  Wrench, 
  ChevronDown, 
  Menu, 
  X, 
  Radio, 
  Laptop,
  HelpCircle,
  Smartphone,
  Zap
} from 'lucide-react';

interface HeaderProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  targetHost: string;
  osName: string;
  ipAddress: string;
  pendingApprovals: DisruptiveApproval[];
  onOpenApprovals: () => void;
  onOpenRemoteModal: () => void;
  onOpenDirectAnydesk?: () => void;
  onOpenWizard: () => void;
  onOpenHelp: () => void;
  onOpenAndroidSim: () => void;
  agentConnected: boolean;
  servers: ConnectedServer[];
  currentServerId: string;
  onSelectServer: (server: ConnectedServer) => void;
  onOpenServerManager: () => void;
  mainSection?: 'monitor' | 'installers' | 'android';
  onSelectSection?: (section: 'monitor' | 'installers' | 'android') => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeChange,
  targetHost,
  osName,
  ipAddress,
  pendingApprovals,
  onOpenApprovals,
  onOpenRemoteModal,
  onOpenDirectAnydesk,
  onOpenWizard,
  onOpenHelp,
  onOpenAndroidSim,
  agentConnected,
  servers,
  currentServerId,
  onSelectServer,
  onOpenServerManager,
  mainSection = 'monitor',
  onSelectSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);

  const pendingCount = pendingApprovals.filter(a => a.status === 'PENDING').length;
  const currentServer = servers.find(s => s.id === currentServerId) || servers[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-200 bg-black/95 border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 sm:gap-5">
          <GlitchLogo size="md" />

          {/* Connected Server Dropdown Switcher (Desktop & Tablet) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-750 font-mono text-xs transition-all hover:border-[#00ff66]/50"
              title="Cambiar de servidor Windows o añadir nuevo equipo"
            >
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff66]"></span>
                </span>
                <span className="text-white font-bold">{currentServer?.name || targetHost}</span>
              </div>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400 text-[11px]">{ipAddress}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {serverDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in">
                <div className="text-[10px] text-zinc-500 font-mono uppercase px-2 py-1">
                  Servidores en Red Vinculados ({servers.length})
                </div>
                <div className="space-y-1">
                  {servers.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => {
                        onSelectServer(srv);
                        setServerDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg font-mono text-xs flex items-center justify-between transition-colors ${
                        srv.id === currentServerId
                          ? 'bg-[#00ff66]/15 text-[#00ff66] font-bold'
                          : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {srv.osType.includes('Server') ? (
                          <Server className="w-3.5 h-3.5 text-[#ff6b00] shrink-0" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="truncate">{srv.name}</div>
                          <div className="text-[10px] text-zinc-500">{srv.host}:{srv.port}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#00ff66] font-mono shrink-0 ml-2">
                        {srv.latencyMs}ms
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-1 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      setServerDropdownOpen(false);
                      onOpenServerManager();
                    }}
                    className="w-full text-center py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-white font-mono text-xs font-bold transition-colors"
                  >
                    + Conectar / Administrar Servidores
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center/Right Section Switcher */}
        {onSelectSection && (
          <div className="hidden xl:flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-750 font-mono text-xs">
            <button
              onClick={() => onSelectSection('monitor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                mainSection === 'monitor'
                  ? 'bg-[#00ff66] text-black shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Panel Monitor</span>
            </button>

            <button
              onClick={() => onSelectSection('installers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                mainSection === 'installers'
                  ? 'bg-[#ff6b00] text-black shadow-[0_0_12px_rgba(255,107,0,0.3)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Instalador (3 Componentes)</span>
            </button>

            <button
              onClick={() => onSelectSection('android')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                mainSection === 'android'
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>App Android (APK)</span>
            </button>
          </div>
        )}

        {/* Right Desktop Controls */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* PostgreSQL Node Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300">
            <Database className="w-3.5 h-3.5 text-[#00ff66]" />
            <span className="text-[11px]">POSTGRES: OK</span>
          </div>

          {/* Pending Disruptive Approvals (Reboots, etc.) */}
          {pendingCount > 0 && (
            <button
              onClick={onOpenApprovals}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-600/80 text-red-200 font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse"
              title="Acciones disruptivas pendientes de autorización humana"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>{pendingCount} REINICIO/ACCIÓN</span>
            </button>
          )}

          {/* AnyDesk Direct Connect Button */}
          {onOpenDirectAnydesk && (
            <button
              onClick={onOpenDirectAnydesk}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/35 hover:to-orange-600/35 border border-orange-500/50 text-orange-400 font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,69,0,0.2)]"
              title="Conexión Directa estilo AnyDesk por ID de Agente o Detección Local en LAN"
            >
              <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span className="hidden xl:inline">AnyDesk Direct Connect</span>
              <span className="xl:hidden">AnyDesk</span>
            </button>
          )}

          {/* Server Connection Manager Button */}
          <button
            onClick={onOpenServerManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-xs transition-colors"
            title="Conectar a otro servidor o máquina Windows en la red"
          >
            <Radio className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>Servidores</span>
          </button>

          {/* Remote LAN Control Modal */}
          <button
            onClick={onOpenRemoteModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-xs transition-colors"
            title="Control Remoto LAN y código QR"
          >
            <Wifi className="w-3.5 h-3.5 text-[#ff6b00]" />
            <span>LAN</span>
          </button>

          {/* Setup Wizard Button */}
          <button
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ff6b00]/15 hover:bg-[#ff6b00]/25 border border-[#ff6b00]/40 text-[#ff6b00] font-mono text-xs font-bold transition-colors"
            title="Wizard de instalación y actualización de componentes"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Wizard</span>
          </button>

          {/* Help & Guide Button */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00ff66]/15 hover:bg-[#00ff66]/25 border border-[#00ff66]/40 text-[#00ff66] font-mono text-xs font-bold transition-all shadow-[0_0_10px_rgba(0,255,102,0.15)]"
            title="Guía de ayuda: Cómo instalar y conectar entre equipos"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ayuda</span>
          </button>

          {/* Android Mobile App View Button */}
          <button
            onClick={onOpenAndroidSim}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            title="Visualizar cómo se ve en un teléfono móvil Android"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Android</span>
          </button>

          {/* Theme Selector */}
          <div className="flex items-center p-0.5 rounded bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => onThemeChange('dark')}
              className={`p-1.5 rounded transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Modo Oscuro"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('light')}
              className={`p-1.5 rounded transition-all ${
                theme === 'light'
                  ? 'bg-zinc-200 text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Modo Claro"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('retro-green')}
              className={`p-1.5 rounded transition-all ${
                theme === 'retro-green'
                  ? 'bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_8px_#00ff66]'
                  : 'text-zinc-500 hover:text-[#00ff66]'
              }`}
              title="Modo Consola Retro Verde CRT"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Actions: Pending Badge + Hamburger Menu Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={onOpenApprovals}
              className="flex items-center gap-1 px-2 py-1 rounded bg-red-950 border border-red-600 text-red-200 font-mono text-[11px] font-bold animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>{pendingCount}</span>
            </button>
          )}

          <button
            onClick={() => onOpenServerManager()}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[#00ff66]"
            title="Conectar a Servidor"
          >
            <Server className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
            title="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-zinc-800 bg-zinc-950 p-4 font-mono text-xs space-y-3 animate-in slide-in-from-top-2">
          {/* Main Section Switcher Mobile */}
          {onSelectSection && (
            <div className="p-1 rounded-xl bg-zinc-900 border border-zinc-800 grid grid-cols-3 gap-1 text-[11px]">
              <button
                onClick={() => {
                  onSelectSection('monitor');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 rounded-lg font-bold text-center transition-all ${
                  mainSection === 'monitor'
                    ? 'bg-[#00ff66] text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Monitor
              </button>
              <button
                onClick={() => {
                  onSelectSection('installers');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 rounded-lg font-bold text-center transition-all ${
                  mainSection === 'installers'
                    ? 'bg-[#ff6b00] text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Instalador
              </button>
              <button
                onClick={() => {
                  onSelectSection('android');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 rounded-lg font-bold text-center transition-all ${
                  mainSection === 'android'
                    ? 'bg-cyan-400 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                App APK
              </button>
            </div>
          )}

          {/* Current Connected Server Info */}
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
                {currentServer?.name || targetHost}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">{ipAddress} • {osName}</div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenServerManager();
              }}
              className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-200 text-[11px] font-bold"
            >
              Cambiar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenServerManager();
              }}
              className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-left flex items-center gap-2"
            >
              <Radio className="w-4 h-4 text-[#00ff66]" />
              <span>Servidores ({servers.length})</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRemoteModal();
              }}
              className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-left flex items-center gap-2"
            >
              <Wifi className="w-4 h-4 text-[#ff6b00]" />
              <span>Control LAN</span>
            </button>
            {onOpenDirectAnydesk && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDirectAnydesk();
                }}
                className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-600/40 text-left flex items-center gap-2 text-orange-400 font-bold"
              >
                <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span>AnyDesk Direct Connect</span>
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWizard();
              }}
              className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-left flex items-center gap-2"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Wizard Instalador</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHelp();
              }}
              className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-left flex items-center gap-2 text-[#00ff66]"
            >
              <HelpCircle className="w-4 h-4 text-[#00ff66]" />
              <span>Guía de Ayuda</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAndroidSim();
              }}
              className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-left flex items-center gap-2 text-cyan-300"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>App Android</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenApprovals();
              }}
              className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-left flex items-center gap-2 text-red-300"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Aprobaciones ({pendingCount})</span>
            </button>
          </div>

          {/* Theme Selector Mobile */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">Tema Visual:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onThemeChange('dark')}
                className={`px-3 py-1 rounded text-[11px] ${theme === 'dark' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-900 text-zinc-400'}`}
              >
                Oscuro
              </button>
              <button
                onClick={() => onThemeChange('light')}
                className={`px-3 py-1 rounded text-[11px] ${theme === 'light' ? 'bg-[#ff6b00] text-black font-bold' : 'bg-zinc-900 text-zinc-400'}`}
              >
                Claro
              </button>
              <button
                onClick={() => onThemeChange('retro-green')}
                className={`px-3 py-1 rounded text-[11px] ${theme === 'retro-green' ? 'bg-[#00ff66] text-black font-bold' : 'bg-zinc-900 text-zinc-400'}`}
              >
                Retro CRT
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
