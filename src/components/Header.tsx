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
  Zap,
  SlidersHorizontal,
  CheckCircle2,
  Download,
  FolderArchive
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
  onDownloadExe?: () => void;
  onDownloadZip?: () => void;
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
  onDownloadExe,
  onDownloadZip,
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
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  const pendingCount = pendingApprovals.filter(a => a.status === 'PENDING').length;
  const currentServer = servers.find(s => s.id === currentServerId) || servers[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-200 bg-black/95 border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* ========================================================================= */}
        {/* LEFT: LOGO Y SELECTOR DE SERVIDOR                                         */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <GlitchLogo size="md" />

          {/* Selector de Servidor Activo (Dropdown limpio) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setServerDropdownOpen(!serverDropdownOpen);
                setToolsDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono transition-all hover:border-[#00ff66]/40"
              title="Cambiar equipo monitoreado"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff66]"></span>
              </span>
              <span className="text-white font-bold truncate max-w-[130px] lg:max-w-[180px]">
                {currentServer?.name || targetHost}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${serverDropdownOpen ? 'rotate-180 text-[#00ff66]' : ''}`} />
            </button>

            {serverDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in">
                <div className="text-[10px] text-zinc-500 font-mono uppercase px-2.5 py-1.5 border-b border-zinc-900 flex items-between justify-between">
                  <span>Equipos en Red</span>
                  <span className="text-[#00ff66] font-bold">{servers.length}</span>
                </div>
                <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
                  {servers.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => {
                        onSelectServer(srv);
                        setServerDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl font-mono text-xs flex items-center justify-between transition-colors ${
                        srv.id === currentServerId
                          ? 'bg-[#00ff66]/15 text-[#00ff66] font-bold border border-[#00ff66]/30'
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
                          <div className="truncate font-semibold">{srv.name}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{srv.host}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#00ff66] shrink-0 ml-1">
                        {srv.latencyMs}ms
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-1 border-t border-zinc-900">
                  <button
                    onClick={() => {
                      setServerDropdownOpen(false);
                      onOpenServerManager();
                    }}
                    className="w-full text-center py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-white font-mono text-xs font-bold transition-colors"
                  >
                    + Conectar Nuevo Servidor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER: NAVEGACIÓN PRINCIPAL (SECCIONES LIMPIAS)                          */}
        {/* ========================================================================= */}
        {onSelectSection && (
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-zinc-900/80 border border-zinc-800/80 font-mono text-xs">
            <button
              onClick={() => onSelectSection('monitor')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                mainSection === 'monitor'
                  ? 'bg-[#00ff66] text-black shadow-[0_0_12px_rgba(0,255,102,0.25)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Monitor Central</span>
            </button>

            <button
              onClick={() => onSelectSection('installers')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                mainSection === 'installers'
                  ? 'bg-[#ff6b00] text-black shadow-[0_0_12px_rgba(255,107,0,0.25)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Instaladores</span>
            </button>

            <button
              onClick={() => onSelectSection('android')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                mainSection === 'android'
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>App Móvil</span>
            </button>
          </nav>
        )}

        {/* ========================================================================= */}
        {/* RIGHT: MENÚ LIMPIO CON BOTÓN ESTRELLA Y HERRAMIENTAS AGRUPADAS             */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2">
          {/* 1. Alertas disruptivas (solo visible cuando hay pendientes) */}
          {pendingCount > 0 && (
            <button
              onClick={onOpenApprovals}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-600/80 text-red-200 font-mono text-xs font-bold transition-all animate-pulse"
              title="Autorizaciones pendientes"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>{pendingCount}</span>
            </button>
          )}

          {/* 2. BOTÓN PRINCIPAL: ENLACE ANYDESK (DESTACADO Y LLAMATIVO) */}
          {onOpenDirectAnydesk && (
            <button
              onClick={onOpenDirectAnydesk}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00ff66]/15 hover:bg-[#00ff66]/25 border border-[#00ff66]/50 text-[#00ff66] font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)] hover:scale-[1.02]"
              title="Vincular equipo Windows por Código AnyDesk de 9 dígitos"
            >
              <Zap className="w-4 h-4 fill-[#00ff66] text-[#00ff66]" />
              <span className="font-bold">Enlace AnyDesk</span>
            </button>
          )}

          {/* 3. MENÚ ÚNICO DE HERRAMIENTAS (Desplegable limpio en lugar de 5 botones sueltos) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setToolsDropdownOpen(!toolsDropdownOpen);
                setServerDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-mono text-xs transition-colors"
              title="Herramientas y configuración"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Herramientas</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${toolsDropdownOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in font-mono text-xs">
                <div className="text-[10px] text-zinc-500 uppercase px-3 py-1.5 border-b border-zinc-900">
                  Herramientas del Sistema
                </div>

                <div className="space-y-1 mt-1">
                  <button
                    onClick={() => {
                      setToolsDropdownOpen(false);
                      onOpenServerManager();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
                  >
                    <Server className="w-4 h-4 text-[#00ff66]" />
                    <span>Administrar Servidores</span>
                  </button>

                  <button
                    onClick={() => {
                      setToolsDropdownOpen(false);
                      onOpenRemoteModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
                  >
                    <Wifi className="w-4 h-4 text-[#ff6b00]" />
                    <span>Control Remoto LAN (QR)</span>
                  </button>

                  <button
                    onClick={() => {
                      setToolsDropdownOpen(false);
                      onOpenWizard();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
                  >
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Wizard de Configuración</span>
                  </button>

                  <button
                    onClick={() => {
                      setToolsDropdownOpen(false);
                      onOpenHelp();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>Guía y Ayuda</span>
                  </button>
                </div>

                {/* Subsección: Descargas e Instaladores */}
                <div className="pt-2 mt-2 border-t border-zinc-900 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase px-3 py-1 font-bold">
                    Descargas & Instaladores
                  </div>
                  {onDownloadExe && (
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onDownloadExe();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-[#00ff66] hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
                    >
                      <Download className="w-4 h-4 text-[#00ff66]" />
                      <span className="font-semibold">Instalador Windows (.EXE)</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setToolsDropdownOpen(false);
                      onOpenAndroidSim();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-cyan-300 hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>App Android (APK)</span>
                  </button>
                  {onDownloadZip && (
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onDownloadZip();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-zinc-300 hover:text-amber-300 hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
                    >
                      <FolderArchive className="w-4 h-4 text-amber-400" />
                      <span>Paquete Portable (.ZIP)</span>
                    </button>
                  )}
                </div>

                {/* Subsección: Estado y Tema */}
                <div className="pt-2 mt-2 border-t border-zinc-900 space-y-2 px-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-2">
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#00ff66]" />
                      <span>PostgreSQL</span>
                    </span>
                    <span className="text-[#00ff66] font-bold text-[10px]">EN LÍNEA</span>
                  </div>

                  <div className="flex items-center justify-between px-2 pt-1">
                    <span className="text-[11px] text-zinc-400">Tema:</span>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
                      <button
                        onClick={() => onThemeChange('dark')}
                        className={`p-1 rounded ${theme === 'dark' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Oscuro"
                      >
                        <Moon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onThemeChange('light')}
                        className={`p-1 rounded ${theme === 'light' ? 'bg-zinc-200 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Claro"
                      >
                        <Sun className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onThemeChange('retro-green')}
                        className={`p-1 rounded ${theme === 'retro-green' ? 'bg-[#00ff66]/20 text-[#00ff66]' : 'text-zinc-500 hover:text-[#00ff66]'}`}
                        title="Verde Retro"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. BOTÓN HAMBURGUESA RESPONSIVE PARA MÓVILES */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            title="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER RESPONSIVE PARA DISPOSITIVOS MÓVILES                               */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 p-4 font-mono text-xs space-y-4 animate-in slide-in-from-top-2">
          {/* Navegación por secciones */}
          {onSelectSection && (
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
              <button
                onClick={() => {
                  onSelectSection('monitor');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 rounded-lg font-bold ${
                  mainSection === 'monitor' ? 'bg-[#00ff66] text-black' : 'text-zinc-400'
                }`}
              >
                Monitor
              </button>
              <button
                onClick={() => {
                  onSelectSection('installers');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 rounded-lg font-bold ${
                  mainSection === 'installers' ? 'bg-[#ff6b00] text-black' : 'text-zinc-400'
                }`}
              >
                Instalador
              </button>
              <button
                onClick={() => {
                  onSelectSection('android');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 rounded-lg font-bold ${
                  mainSection === 'android' ? 'bg-cyan-400 text-black' : 'text-zinc-400'
                }`}
              >
                Móvil
              </button>
            </div>
          )}

          {/* Servidor activo info */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
                <span>{currentServer?.name || targetHost}</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{ipAddress}</div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenServerManager();
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-[11px] font-bold"
            >
              Cambiar
            </button>
          </div>

          {/* Enlaces de herramientas móviles */}
          <div className="space-y-1.5">
            {onOpenDirectAnydesk && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDirectAnydesk();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#00ff66]/15 border border-[#00ff66]/40 text-[#00ff66] font-bold flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-[#00ff66]" />
                <span>Enlace por Código AnyDesk</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenServerManager();
              }}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 text-zinc-300 flex items-center gap-2"
            >
              <Server className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>Administrar Servidores</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRemoteModal();
              }}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 text-zinc-300 flex items-center gap-2"
            >
              <Wifi className="w-3.5 h-3.5 text-[#ff6b00]" />
              <span>Control Remoto LAN</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWizard();
              }}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 text-zinc-300 flex items-center gap-2"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Wizard de Instalación</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHelp();
              }}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 text-zinc-300 flex items-center gap-2"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Guía de Ayuda</span>
            </button>
          </div>

          {/* Tema selector móvil */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-400">
            <span>Tema:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onThemeChange('dark')}
                className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-[#00ff66]/20 text-[#00ff66] font-bold' : 'text-zinc-500'}`}
              >
                Oscuro
              </button>
              <button
                onClick={() => onThemeChange('light')}
                className={`px-2 py-1 rounded ${theme === 'light' ? 'bg-zinc-200 text-black font-bold' : 'text-zinc-500'}`}
              >
                Claro
              </button>
              <button
                onClick={() => onThemeChange('retro-green')}
                className={`px-2 py-1 rounded ${theme === 'retro-green' ? 'bg-[#00ff66] text-black font-bold' : 'text-zinc-500'}`}
              >
                CRT
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
