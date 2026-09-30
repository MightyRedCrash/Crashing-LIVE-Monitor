import React, { useState } from 'react';
import { 
  HelpCircle, 
  Server, 
  Laptop, 
  Wifi, 
  Copy, 
  Check, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  BookOpen, 
  Share2, 
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';

interface HelpGuideModalProps {
  onClose: () => void;
  onOpenWizard: () => void;
  onOpenServerManager: () => void;
  currentHost: string;
  currentIp: string;
  currentPort: number;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  onClose,
  onOpenWizard,
  onOpenServerManager,
  currentHost,
  currentIp,
  currentPort,
}) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'networking' | 'troubleshooting'>('quickstart');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const oneLinerCommand = `Set-ExecutionPolicy RemoteSigned -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri "http://${currentIp}:${currentPort}/install.ps1" -OutFile "$env:TEMP\\install.ps1"; & "$env:TEMP\\install.ps1"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/40 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                Guía de Ayuda: Instalación & Conexión Entre Equipos
              </h2>
              <p className="text-[11px] text-zinc-400">
                Paso a paso simple para configurar Crashing Live y conectarte desde cualquier computadora o móvil.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-zinc-800 bg-black/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'quickstart'
                ? 'bg-[#ff6b00] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>1. Instalar en el Servidor (Windows)</span>
          </button>

          <button
            onClick={() => setActiveTab('networking')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'networking'
                ? 'bg-[#ff6b00] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>2. Conectar Desde Otro Equipo (LAN)</span>
          </button>

          <button
            onClick={() => setActiveTab('troubleshooting')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'troubleshooting'
                ? 'bg-[#ff6b00] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Diagnóstico & Firewall</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: INSTALACIÓN EN EL SERVIDOR */}
          {activeTab === 'quickstart' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30">
                  MÉTODO RÁPIDO
                </span>
                <h3 className="text-sm font-bold text-white">
                  ¿Cómo instalar el agente en Windows Server o Windows 11?
                </h3>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  El agente en Python y todos sus componentes necesarios (Python 3.12, librerías, base de datos PostgreSQL y servicio de Windows) se configuran automáticamente en un solo paso.
                </p>
              </div>

              {/* 3 Steps Visual Timeline */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-[#ff6b00] text-black font-black flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-bold text-white text-xs">
                      Abre PowerShell como Administrador en el servidor
                    </h4>
                    <p className="text-zinc-400 text-[11px]">
                      Haz clic derecho en el menú Inicio de Windows y selecciona <strong>"Terminal (Administrador)"</strong> o <strong>"Windows PowerShell (Ejecutar como administrador)"</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-[#ff6b00] text-black font-black flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs">
                        Ejecuta el script instalador autónomo
                      </h4>
                      <button
                        onClick={() => copyText(oneLinerCommand, 'oneliner')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[#00ff66] text-[10px] font-bold transition-colors"
                      >
                        {copiedKey === 'oneliner' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'oneliner' ? '¡Copiado!' : 'Copiar Comando'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-black border border-zinc-800 text-[#00ff66] font-mono text-[10px] break-all leading-relaxed">
                      {oneLinerCommand}
                    </div>

                    <p className="text-zinc-400 text-[11px]">
                      Este comando descarga e instala silenciosamente Python 3.12, los drivers de PostgreSQL y registra el servicio de Windows <code>CrashingLiveDaemon</code> en ejecución permanente.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="w-6 h-6 rounded-full bg-[#00ff66] text-black font-black flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-bold text-white text-xs">
                      Verificación automática del servicio
                    </h4>
                    <p className="text-zinc-400 text-[11px]">
                      El servicio arrancará de inmediato. Puedes verificarlo en PowerShell con:
                    </p>
                    <div className="p-2 rounded bg-black border border-zinc-800 text-zinc-200 text-[11px]">
                      <code>Get-Service -Name "CrashingLiveDaemon"</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] text-zinc-300">
                  ¿Deseas personalizar puertos, usuario de PostgreSQL o certificados antes?
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenWizard();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold text-xs transition-colors shrink-0"
                >
                  Abrir Wizard de Configuración
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONECTAR ENTRE EQUIPOS */}
          {activeTab === 'networking' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <h3 className="text-sm font-bold text-white">
                  ¿Cómo controlar el servidor desde otra computadora o teléfono en la red?
                </h3>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Crashing Live cuenta con un servidor web autónomo ligero integrado en el agente. Cualquier dispositivo conectado a la misma red Wi-Fi, Ethernet o VPN puede abrir el panel sin instalar nada adicional.
                </p>
              </div>

              {/* Network Diagram Graphic */}
              <div className="p-4 rounded-xl bg-black border border-zinc-800 text-center space-y-3">
                <div className="flex items-center justify-center gap-3 sm:gap-8 text-xs">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <Server className="w-6 h-6 text-[#ff6b00] mb-1" />
                    <span className="font-bold text-white">Servidor Windows</span>
                    <span className="text-[10px] text-zinc-400">IP: {currentIp}</span>
                    <span className="text-[9px] text-[#00ff66]">Daemon Activo :8443</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-[#ff6b00]">
                      <span className="w-8 sm:w-16 h-0.5 bg-[#ff6b00]" />
                      <Wifi className="w-4 h-4" />
                      <span className="w-8 sm:w-16 h-0.5 bg-[#ff6b00]" />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1">Red LAN / VPN</span>
                  </div>

                  <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <Laptop className="w-6 h-6 text-cyan-400 mb-1" />
                    <span className="font-bold text-white">Tu Equipo / Laptop</span>
                    <span className="text-[10px] text-zinc-400">Navegador Web</span>
                    <span className="text-[9px] text-cyan-300">Monitoreo en Vivo</span>
                  </div>
                </div>
              </div>

              {/* Steps to connect */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="font-bold text-white text-xs block">Opción A: Abrir directamente en el navegador</span>
                  <p className="text-zinc-400 text-[11px]">
                    Desde cualquier laptop, PC o teléfono en la red, escribe en la barra de direcciones de Chrome/Edge:
                  </p>
                  <div className="flex items-center justify-between p-2 rounded bg-black border border-zinc-800">
                    <code className="text-[#00ff66] font-bold">http://{currentIp}:{currentPort}</code>
                    <button
                      onClick={() => copyText(`http://${currentIp}:${currentPort}`, 'url')}
                      className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800"
                    >
                      {copiedKey === 'url' ? '¡Copiado!' : 'Copiar URL'}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="font-bold text-white text-xs block">Opción B: Conectar desde este panel a un servidor remoto</span>
                  <p className="text-zinc-400 text-[11px]">
                    Si ya estás en el panel de control y quieres cambiar o vincular otro equipo Windows Server en tu infraestructura:
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenServerManager();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>Abrir Gestor de Servidores Remotos</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TROUBLESHOOTING & FIREWALL */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#ff6b00]" />
                  Resolución de Problemas Frecuentes
                </h3>
                <p className="text-zinc-400 text-[11px]">
                  Verificaciones rápidas si no puedes conectar entre equipos o el agente no responde.
                </p>
              </div>

              {/* Troubleshooting items */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    El equipo remoto no conecta o da "Connection Timed Out"
                  </div>
                  <p className="text-zinc-300 text-[11px]">
                    Causa más común: el Firewall de Windows bloqueó el puerto entrante. Ejecuta en PowerShell del servidor:
                  </p>
                  <div className="p-2 rounded bg-black border border-zinc-800 text-[#00ff66] text-[10px]">
                    <code>New-NetFirewallRule -DisplayName "CrashingLive Inbound" -Direction Inbound -Protocol TCP -LocalPort {currentPort} -Action Allow</code>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    ¿Cómo reiniciar o verificar el estado del agente?
                  </div>
                  <p className="text-zinc-300 text-[11px]">
                    Si modificaste configuraciones o credenciales de PostgreSQL, reinicia el servicio con:
                  </p>
                  <div className="p-2 rounded bg-black border border-zinc-800 text-zinc-200 text-[10px]">
                    <code>Restart-Service -Name "CrashingLiveDaemon" -Force</code>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
                    ¿Cómo probar la conexión de red entre dos equipos?
                  </div>
                  <p className="text-zinc-300 text-[11px]">
                    Desde tu equipo cliente hacia el servidor, prueba en PowerShell:
                  </p>
                  <div className="p-2 rounded bg-black border border-zinc-800 text-zinc-200 text-[10px]">
                    <code>Test-NetConnection -ComputerName "{currentIp}" -Port {currentPort}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-900/60 gap-2">
          <span className="text-[11px] text-zinc-500">
            Soporte & Asistente Integrado Crashing Live v2.6
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors"
          >
            Entendido, Cerrar Ayuda
          </button>
        </div>
      </div>
    </div>
  );
};
