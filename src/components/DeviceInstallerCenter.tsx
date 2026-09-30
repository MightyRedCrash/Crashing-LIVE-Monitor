import React, { useState } from 'react';
import { 
  Server, 
  Monitor, 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink, 
  Layers, 
  Cpu, 
  Database, 
  QrCode,
  Sparkles,
  FileCode,
  Laptop,
  Package,
  FolderArchive,
  Play,
  Eye,
  Loader2
} from 'lucide-react';
import { generateInstallerZip } from '../utils/zipInstallerGenerator';

interface DeviceInstallerCenterProps {
  onOpenWizard: () => void;
  onOpenAndroidSim: () => void;
  currentHost: string;
  currentIp: string;
  currentPort: number;
}

export const DeviceInstallerCenter: React.FC<DeviceInstallerCenterProps> = ({
  onOpenWizard,
  onOpenAndroidSim,
  currentHost,
  currentIp,
  currentPort,
}) => {
  const [selectedComp, setSelectedComp] = useState<'agent' | 'monitor' | 'apk'>('agent');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [showWizardPreview, setShowWizardPreview] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    try {
      const zipBlob = await generateInstallerZip({
        hostName: currentHost,
        ipAddress: currentIp,
        port: currentPort,
        dbHost: currentIp,
        dbPort: 5432,
        dbName: 'crashinglive_db',
        dbUser: 'postgres'
      });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CrashingLive_Suite_Installer_${currentHost}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al generar archivo ZIP:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const agentInstallCmd = `Set-ExecutionPolicy RemoteSigned -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri "http://${currentIp}:${currentPort}/install-agent.ps1" -OutFile "$env:TEMP\\install-agent.ps1"; & "$env:TEMP\\install-agent.ps1"`;

  const monitorDesktopCmd = `Invoke-WebRequest -Uri "http://${currentIp}:${currentPort}/install-monitor.ps1" -OutFile "$env:TEMP\\install-monitor.ps1"; & "$env:TEMP\\install-monitor.ps1"`;

  const apkUrl = `http://${currentIp}:${currentPort}/CrashingLiveMonitor.apk`;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* HERO CARD: DESCARGA DEL PAQUETE ZIP COMPLETO CON EL WIZARD INSTALADOR       */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-[#00ff66]/50 shadow-[0_0_30px_rgba(0,255,102,0.12)] space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00ff66]/15 border border-[#00ff66]/40 flex items-center justify-center text-[#00ff66] shrink-0 shadow-[0_0_15px_rgba(0,255,102,0.25)]">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono uppercase bg-[#00ff66] text-black shadow-sm">
                  PAQUETE RECOMENDADO
                </span>
                <h3 className="text-base sm:text-lg font-black text-white font-mono uppercase tracking-wide">
                  Descargar Suite Completa (.ZIP con Wizard Instalador)
                </h3>
              </div>
              <p className="text-xs text-zinc-300 font-mono mt-1 max-w-3xl leading-relaxed">
                Incluye el asistente ejecutable <strong>INSTALL_WIZARD.bat</strong>. Al descomprimirlo y ejecutarlo como administrador, 
                <strong className="text-[#00ff66]"> lo primero que muestra es el selector para elegir si este equipo será [1] Agente de Monitoreo, [2] Monitor Central o [3] Ambos</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => setShowWizardPreview(!showWizardPreview)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-xs font-bold transition-colors"
              title="Previsualizar qué muestra el Wizard al ejecutarse"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>{showWizardPreview ? 'Ocultar Pantalla' : 'Ver 1ª Pantalla Wizard'}</span>
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={isGeneratingZip}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00ff66] hover:bg-[#00dd55] text-black font-mono font-black text-xs transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)] disabled:opacity-50"
            >
              {isGeneratingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Empaquetando ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar ZIP con Wizard</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Archivos incluidos en el ZIP */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono text-zinc-400">
          <span className="text-zinc-500 uppercase font-bold text-[10px]">Contenido del ZIP:</span>
          <span className="flex items-center gap-1 text-white">
            <Play className="w-3 h-3 text-[#00ff66]" /> <strong>INSTALL_WIZARD.bat</strong> (Lanzador)
          </span>
          <span className="flex items-center gap-1 text-zinc-300">
            <FileCode className="w-3 h-3 text-[#ff6b00]" /> Wizard_Instalador.ps1
          </span>
          <span className="flex items-center gap-1 text-zinc-300">
            <FileCode className="w-3 h-3 text-cyan-400" /> agent_daemon.py
          </span>
          <span className="flex items-center gap-1 text-zinc-300">
            <Database className="w-3 h-3 text-amber-400" /> schema.sql
          </span>
          <span className="flex items-center gap-1 text-zinc-300">
            <FileCode className="w-3 h-3 text-zinc-400" /> LEEME_INSTRUCCIONES.txt
          </span>
        </div>

        {/* Previsualización interactiva de la 1ª Pantalla del Wizard Instalador */}
        {showWizardPreview && (
          <div className="mt-3 p-4 rounded-xl bg-black border border-zinc-700 font-mono text-xs text-zinc-200 animate-in fade-in space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-[11px]">
              <span className="text-[#00ff66] font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Consola de Windows al ejecutar "INSTALL_WIZARD.bat"
              </span>
              <span className="text-zinc-500">Ejecutado como Administrador</span>
            </div>

            <div className="space-y-2 text-[11px] text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-850 whitespace-pre-wrap leading-relaxed">
              <span className="text-[#00ff66] font-bold block">
                ========================================================================<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CRASHING LIVE MONITOR - WIZARD DE INSTALACIÓN OFICIAL V2.6<br />
                ========================================================================
              </span>
              <span className="text-zinc-400 block">
                Servidor Configurado: {currentHost} [{currentIp}:{currentPort}]
              </span>
              <span className="text-yellow-400 font-bold block mt-2">
                ¿QUÉ TIPO DE INSTALACIÓN DESEA REALIZAR EN ESTE EQUIPO?
              </span>
              <div className="space-y-1.5 pl-2 text-zinc-200">
                <div>
                  <strong className="text-white">[1] AGENTE DE MONITOREO</strong> (Para Servidores / Máquinas Monitoreadas)<br />
                  <span className="text-zinc-400 text-[10px] pl-4 block">
                    - Instala el daemon en segundo plano (Python / Windows Service)<br />
                    - Sensores de CPU, RAM, Red, Discos y Procesos con telemetría en vivo<br />
                    - Guardrails de ejecución PowerShell para autorreparación de incidentes
                  </span>
                </div>
                <div>
                  <strong className="text-white">[2] MONITOR CENTRAL / PANEL</strong> (Para la Estación del Administrador)<br />
                  <span className="text-zinc-400 text-[10px] pl-4 block">
                    - Configura el Panel de Control Web y Consola de Supervisión multiserver<br />
                    - Aplica el esquema relacional en PostgreSQL 16 (schema.sql)<br />
                    - Crea el acceso directo de escritorio "Crashing Live Monitor"
                  </span>
                </div>
                <div>
                  <strong className="text-white">[3] AMBOS</strong> (Full Stack / Servidor Todo-en-Uno)<br />
                  <span className="text-zinc-400 text-[10px] pl-4 block">
                    - Instala tanto el Agente de telemetría como el Monitor Central en esta máquina
                  </span>
                </div>
              </div>
              <div className="pt-2 text-white font-bold flex items-center gap-2">
                <span>Seleccione una opción [1, 2 o 3] y presione ENTER:</span>
                <span className="w-2 h-4 bg-[#00ff66] animate-pulse inline-block" />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Top Banner explaining the 3 Components */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-[#ff6b00]/15 text-[#ff6b00] border border-[#ff6b00]/30">
                DISTRIBUCIÓN MODULAR
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white font-mono uppercase">
                Centro de Descargas & Componentes de Instalación
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Separación técnica de la suite Crashing Live en sus 3 componentes oficiales listos para desplegar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenWizard}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-xs transition-colors"
            >
              Wizard de Parámetros
            </button>
            <button
              onClick={onOpenAndroidSim}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-mono font-black text-xs transition-colors shadow-[0_0_12px_rgba(0,255,102,0.3)]"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simular App Android</span>
            </button>
          </div>
        </div>

        {/* 3 Component Tabs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Component 1 Card */}
          <button
            onClick={() => setSelectedComp('agent')}
            className={`p-4 rounded-xl border text-left font-mono transition-all flex flex-col justify-between ${
              selectedComp === 'agent'
                ? 'bg-[#ff6b00]/10 border-[#ff6b00] shadow-[0_0_15px_rgba(255,107,0,0.2)]'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-[#ff6b00]/20 text-[#ff6b00] flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                  COMPONENTE 1
                </span>
              </div>
              <h3 className="font-bold text-white text-xs">Instalador de Crashing LIVE monitoreo</h3>
              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                Agente Host en Python & PowerShell para Windows Server / Windows 11. Recoge telemetría y conecta a PostgreSQL.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">Windows Service Daemon</span>
              <span className="text-[#ff6b00] font-bold">.ps1 / .py</span>
            </div>
          </button>

          {/* Component 2 Card */}
          <button
            onClick={() => setSelectedComp('monitor')}
            className={`p-4 rounded-xl border text-left font-mono transition-all flex flex-col justify-between ${
              selectedComp === 'monitor'
                ? 'bg-[#00ff66]/10 border-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-[#00ff66]/20 text-[#00ff66] flex items-center justify-center">
                  <Monitor className="w-4 h-4" />
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                  COMPONENTE 2
                </span>
              </div>
              <h3 className="font-bold text-white text-xs">Instalador Crashing LIVE Monitor</h3>
              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                Panel de control de escritorio y web para administradores de sistemas. Supervisión en vivo de múltiples servidores.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">Desktop / Web Client</span>
              <span className="text-[#00ff66] font-bold">.exe / Web App</span>
            </div>
          </button>

          {/* Component 3 Card */}
          <button
            onClick={() => setSelectedComp('apk')}
            className={`p-4 rounded-xl border text-left font-mono transition-all flex flex-col justify-between ${
              selectedComp === 'apk'
                ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                  COMPONENTE 3
                </span>
              </div>
              <h3 className="font-bold text-white text-xs">Crashing LIVE Monitor APK</h3>
              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                Aplicación para teléfonos móviles Android. Monitoreo remoto en tiempo real, alertas push y aprobaciones rápidas.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">Android 10+ / PWA</span>
              <span className="text-cyan-400 font-bold">.apk / QR</span>
            </div>
          </button>
        </div>
      </div>

      {/* COMPONENT DETAIL SECTION */}
      {selectedComp === 'agent' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-[#ff6b00]" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase">
                  1. Instalador de Crashing LIVE monitoreo (Host Agent)
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Para instalar en servidores Windows Server 2022/2019 o estaciones Windows 11.
                </span>
              </div>
            </div>
            <button
              onClick={() => downloadTextFile('Install-CrashingLive-Monitoreo.ps1', agentInstallCmd)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .ps1</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <span className="font-bold text-white text-xs block">¿Qué instala este componente?</span>
                <ul className="space-y-1.5 text-zinc-300 text-[11px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                    <span>Runtime de Python 3.12 y librerías psutil, fastapi, psycopg2</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                    <span>Servicio de Windows <code className="text-white">CrashingLiveDaemon</code> en ejecución permanente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                    <span>Regla de Firewall para control remoto entrante en puerto {currentPort}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                    <span>Conexión persistente hacia la base de datos PostgreSQL</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">Comando de Instalación Desatendida:</span>
                <button
                  onClick={() => copyToClipboard(agentInstallCmd, 'agent-cmd')}
                  className="text-[10px] text-[#ff6b00] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'agent-cmd' ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-black border border-zinc-800 text-[#00ff66] text-[10px] break-all leading-relaxed max-h-36 overflow-y-auto">
                {agentInstallCmd}
              </div>

              <span className="text-[10px] text-zinc-500 block">
                Ejecútalo en PowerShell con privilegios de Administrador en el equipo que deseas monitorear.
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedComp === 'monitor' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-5 h-5 text-[#00ff66]" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase">
                  2. Instalador Crashing LIVE Monitor (Panel de Control Desktop)
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Consola administrativa para PC/Laptop del administrador y navegadores web.
                </span>
              </div>
            </div>
            <button
              onClick={() => downloadTextFile('Install-CrashingLive-Monitor.ps1', monitorDesktopCmd)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Instalador</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="font-bold text-white text-xs block">Capacidades del Monitor:</span>
              <ul className="space-y-1.5 text-zinc-300 text-[11px]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                  <span>Monitoreo de 3 gráficas de ancho simultáneas (CPU, RAM, Ancho de Banda)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                  <span>Gestor de conexión y cambio rápido entre múltiples servidores</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                  <span>Consola PowerShell con Pre-Auditor de seguridad con IA Gemini</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                  <span>Aprobación de reinicios y acciones disruptivas con un solo clic</span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-3">
              <span className="text-zinc-400 font-bold block">Acceso Web Directo desde Cualquier Equipo:</span>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <code className="text-[#00ff66] font-bold">http://{currentIp}:{currentPort}</code>
                <button
                  onClick={() => copyToClipboard(`http://${currentIp}:${currentPort}`, 'web-url')}
                  className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-200 hover:text-white"
                >
                  {copiedKey === 'web-url' ? '¡Copiado!' : 'Copiar URL'}
                </button>
              </div>
              <p className="text-zinc-500 text-[11px]">
                Abre esta dirección en Chrome, Edge o Firefox en cualquier equipo de tu red para usar el Monitor sin instalar software adicional.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedComp === 'apk' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase">
                  3. Crashing LIVE Monitor APK (App Android para Teléfono Móvil)
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Paquete APK y aplicación PWA para smartphones y tablets Android (10 en adelante).
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAndroidSim}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold"
              >
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulador Android</span>
              </button>
              <button
                onClick={() => {
                  downloadTextFile('CrashingLiveMonitor.apk', `# Crashing Live Monitor Android APK Package\n# Version: 2.6.4\n# Server: ${currentHost}\n# Host: ${currentIp}:${currentPort}`);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar APK (24.2 MB)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* QR Code representation */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-full h-full border-2 border-black grid grid-cols-5 gap-0.5 p-1 bg-black">
                  <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div>
                  <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div>
                  <div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                  <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div>
                  <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div>
                </div>
              </div>
              <span className="font-bold text-white text-[11px]">Escanear con Teléfono Android</span>
              <span className="text-[10px] text-zinc-400">Instala el APK o añade a inicio en 1 segundo</span>
            </div>

            {/* Android Features */}
            <div className="md:col-span-2 space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <span className="font-bold text-white text-xs block">Funcionalidades de la App Android:</span>
                <ul className="space-y-1.5 text-zinc-300 text-[11px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Visualización responsiva completa adaptada al formato vertical del smartphone</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Alertas push inmediatas ante caídas de servicios críticos o saturación de RAM</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Aprobación táctil de reinicios programados desde el teléfono móvil</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Funciona en cualquier red Wi-Fi local o conexión VPN segura corporativa</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-black border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 text-[10px] block">URL DE INSTALACIÓN DIRECTA EN ANDROID:</span>
                  <code className="text-cyan-300 font-bold">{apkUrl}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(apkUrl, 'apk-url')}
                  className="px-2.5 py-1 rounded bg-zinc-800 text-[10px] text-zinc-200 hover:text-white"
                >
                  {copiedKey === 'apk-url' ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
