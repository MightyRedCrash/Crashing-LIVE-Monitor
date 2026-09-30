import React, { useState, useEffect } from 'react';
import { 
  ThemeMode, 
  SystemMetricPoint, 
  WindowsService, 
  AutomatedRoutine, 
  FileItem, 
  FileAuditEntry, 
  PowerShellExecutionLog, 
  DiagnosticIncident, 
  DisruptiveApproval, 
  WizardConfig,
  ConnectedServer
} from './types';
import { 
  initialServices, 
  initialRoutines, 
  initialFiles, 
  initialAudits, 
  initialPowerShellLogs, 
  initialIncidents, 
  defaultWizardConfig 
} from './data/mockData';
import { fetchApprovals, decideApproval, fetchRealSystemTelemetry, RealSystemTelemetry } from './services/api';
import { Header } from './components/Header';
import { LiveTelemetry } from './components/LiveTelemetry';
import { ServicesManager } from './components/ServicesManager';
import { FileManager } from './components/FileManager';
import { PowerShellStudio } from './components/PowerShellStudio';
import { DiagnosticCenter } from './components/DiagnosticCenter';
import { MonthlyReportView } from './components/MonthlyReportView';
import { InstallWizard } from './components/InstallWizard';
import { RemoteControlModal } from './components/RemoteControlModal';
import { ServerConnectionModal } from './components/ServerConnectionModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { DeviceInstallerCenter } from './components/DeviceInstallerCenter';
import { AndroidAppView } from './components/AndroidAppView';
import { 
  Activity, 
  Server, 
  HardDrive, 
  Terminal, 
  ShieldAlert, 
  FileText, 
  Wrench,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  Radio,
  HelpCircle,
  Sparkles,
  Copy,
  Download,
  Smartphone,
  Menu,
  ChevronDown,
  Check,
  PackageCheck,
  Monitor,
  Cpu
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mainSection, setMainSection] = useState<'monitor' | 'installers' | 'android'>('monitor');
  const [activeTab, setActiveTab] = useState<'telemetry' | 'services' | 'files' | 'powershell' | 'diagnostics' | 'reports'>('telemetry');

  // Hamburger and Popover Menus
  const [monitorMenuOpen, setMonitorMenuOpen] = useState(false);
  const [installMenuOpen, setInstallMenuOpen] = useState(false);
  const [realHardwareData, setRealHardwareData] = useState<RealSystemTelemetry | null>(null);

  // Monitor Navigation Options
  const monitorTabs = [
    { id: 'telemetry' as const, label: 'Telemetría en Vivo', icon: Activity, desc: 'Gráficas en tiempo real de CPU, RAM y Red' },
    { id: 'services' as const, label: 'Servicios & Rutinas', icon: Server, desc: 'Control de servicios Windows y automatizaciones' },
    { id: 'files' as const, label: 'Archivos & Auditoría', icon: HardDrive, desc: 'Explorador seguro y registro en PostgreSQL' },
    { id: 'powershell' as const, label: 'PowerShell Seguro', icon: Terminal, desc: 'Consola auditada con IA y guardrails' },
    { id: 'diagnostics' as const, label: 'Autodiagnóstico & Aprobaciones', icon: ShieldAlert, desc: 'Incidentes y autorizaciones de reinicio' },
    { id: 'reports' as const, label: 'Informes Mensuales', icon: FileText, desc: 'Resumen ejecutivo de SLA y salud general' },
  ];

  const currentTabConfig = monitorTabs.find((t) => t.id === activeTab) || monitorTabs[0];

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showServerManager, setShowServerManager] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAndroidSim, setShowAndroidSim] = useState(false);
  const [showQuickBanner, setShowQuickBanner] = useState(false);

  // Connected Servers List
  const [servers, setServers] = useState<ConnectedServer[]>([
    {
      id: 'srv-node-1',
      name: 'WINSRV-2022-DC01',
      host: '192.168.1.140',
      port: 8443,
      osType: 'Windows Server 2022',
      token: 'clk_live_tok_dc01',
      ssl: true,
      isCurrent: true,
      status: 'ONLINE',
      latencyMs: 2,
      lastPing: 'En vivo',
      cpu: 25,
      ram: 66,
      ramUsedGB: 10.6,
      ramTotalGB: 16.0,
      netInKB: 2900,
      netOutKB: 980,
      diskReadMB: 3.1,
      diskWriteMB: 1.4,
    },
    {
      id: 'srv-node-2',
      name: 'WIN11-DEV-STATION',
      host: '192.168.1.88',
      port: 8443,
      osType: 'Windows 11 Pro',
      token: 'clk_live_tok_win11',
      ssl: false,
      isCurrent: false,
      status: 'ONLINE',
      latencyMs: 4,
      lastPing: 'Hace 1m',
      cpu: 18,
      ram: 54,
      ramUsedGB: 8.6,
      ramTotalGB: 16.0,
      netInKB: 1450,
      netOutKB: 420,
      diskReadMB: 1.8,
      diskWriteMB: 0.6,
    },
    {
      id: 'srv-node-3',
      name: 'WINSRV-BACKUP02',
      host: '10.0.2.14',
      port: 8443,
      osType: 'Windows Server 2019',
      token: 'clk_live_tok_bk02',
      ssl: true,
      isCurrent: false,
      status: 'ONLINE',
      latencyMs: 9,
      lastPing: 'Hace 2m',
      cpu: 44,
      ram: 72,
      ramUsedGB: 23.0,
      ramTotalGB: 32.0,
      netInKB: 6800,
      netOutKB: 4100,
      diskReadMB: 14.2,
      diskWriteMB: 8.5,
    }
  ]);
  const [currentServerId, setCurrentServerId] = useState<string>('srv-node-1');

  // Core Data States
  const [wizardConfig, setWizardConfig] = useState<WizardConfig>(defaultWizardConfig);
  const [services, setServices] = useState<WindowsService[]>(initialServices);
  const [routines, setRoutines] = useState<AutomatedRoutine[]>(initialRoutines);
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [audits, setAudits] = useState<FileAuditEntry[]>(initialAudits);
  const [powerShellLogs, setPowerShellLogs] = useState<PowerShellExecutionLog[]>(initialPowerShellLogs);
  const [incidents, setIncidents] = useState<DiagnosticIncident[]>(initialIncidents);
  const [approvals, setApprovals] = useState<DisruptiveApproval[]>([]);
  const [agentConnected, setAgentConnected] = useState(true);
  const [serverSwitchToast, setServerSwitchToast] = useState<string | null>(null);

  // Active connected server object
  const currentServer = servers.find((s) => s.id === currentServerId) || servers[0];

  // Real-Time Telemetry Stream
  const [metricsHistory, setMetricsHistory] = useState<SystemMetricPoint[]>([
    { time: '09:10:00', cpu: 22, ram: 64, ramUsedGB: 10.2, ramTotalGB: 16.0, netInKB: 2450, netOutKB: 890, diskReadMB: 4.2, diskWriteMB: 1.1 },
    { time: '09:11:00', cpu: 28, ram: 64, ramUsedGB: 10.3, ramTotalGB: 16.0, netInKB: 3100, netOutKB: 920, diskReadMB: 6.5, diskWriteMB: 2.4 },
    { time: '09:12:00', cpu: 34, ram: 65, ramUsedGB: 10.4, ramTotalGB: 16.0, netInKB: 2800, netOutKB: 1100, diskReadMB: 2.1, diskWriteMB: 0.8 },
    { time: '09:13:00', cpu: 24, ram: 65, ramUsedGB: 10.4, ramTotalGB: 16.0, netInKB: 1950, netOutKB: 740, diskReadMB: 1.8, diskWriteMB: 0.5 },
    { time: '09:14:00', cpu: 26, ram: 66, ramUsedGB: 10.5, ramTotalGB: 16.0, netInKB: 3400, netOutKB: 1250, diskReadMB: 5.3, diskWriteMB: 3.2 },
    { time: '09:15:00', cpu: 25, ram: 66, ramUsedGB: 10.6, ramTotalGB: 16.0, netInKB: 2900, netOutKB: 980, diskReadMB: 3.1, diskWriteMB: 1.4 },
  ]);

  const currentMetric = metricsHistory[metricsHistory.length - 1] || {
    time: '09:15:00',
    cpu: 25,
    ram: 66,
    ramUsedGB: 10.6,
    ramTotalGB: 16.0,
    netInKB: 2900,
    netOutKB: 980,
    diskReadMB: 3.1,
    diskWriteMB: 1.4,
  };

  // Load approvals & query real host hardware on mount
  useEffect(() => {
    fetchApprovals().then((data) => {
      if (data && data.length > 0) {
        setApprovals(data);
      }
    });

    // Query real host telemetry from the computer where the agent is running
    fetchRealSystemTelemetry().then((real) => {
      if (real && real.isRealHost) {
        setRealHardwareData(real);
        // Automatically sync the first local node with REAL computer metrics
        setServers((prev) =>
          prev.map((s, idx) =>
            idx === 0
              ? {
                  ...s,
                  name: real.hostname,
                  host: real.ip,
                  port: real.port,
                  osType: real.osName as any,
                  cpu: real.cpu,
                  ram: real.ram,
                  ramUsedGB: real.ramUsedGB,
                  ramTotalGB: real.ramTotalGB,
                  lastPing: 'Hardware Real',
                }
              : s
          )
        );
        // Update wizard config with real values
        setWizardConfig((prev) => ({
          ...prev,
          agentHostname: real.hostname,
          listenHost: real.ip,
          osType: real.osName as any,
        }));
      }
    });
  }, []);

  // Periodic Telemetry Stream (Synchronized with real hardware when available)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      fetchRealSystemTelemetry()
        .then((real) => {
          if (real && real.isRealHost) {
            setRealHardwareData(real);
            const newPoint: SystemMetricPoint = {
              time: timeStr,
              cpu: real.cpu,
              ram: real.ram,
              ramUsedGB: real.ramUsedGB,
              ramTotalGB: real.ramTotalGB,
              netInKB: 2400 + Math.round((Math.random() - 0.5) * 800),
              netOutKB: 920 + Math.round((Math.random() - 0.5) * 400),
              diskReadMB: Number((Math.random() * 5).toFixed(1)),
              diskWriteMB: Number((Math.random() * 3).toFixed(1)),
            };
            setMetricsHistory((prev) => [...prev.slice(-19), newPoint]);

            // Sync current server if it's the local host
            setServers((prev) =>
              prev.map((s) =>
                s.id === 'srv-node-1'
                  ? {
                      ...s,
                      cpu: real.cpu,
                      ram: real.ram,
                      ramUsedGB: real.ramUsedGB,
                      ramTotalGB: real.ramTotalGB,
                      lastPing: 'Hardware Real (En vivo)',
                    }
                  : s
              )
            );
          } else {
            // Simulated noise fallback
            setMetricsHistory((prev) => {
              const last = prev[prev.length - 1] || currentMetric;
              const cpuNoise = (Math.random() - 0.48) * 8;
              const newCpu = Math.min(95, Math.max(12, Math.round(last.cpu + cpuNoise)));

              const ramDelta = (Math.random() - 0.5) * 0.1;
              const newRamGB = Math.min(15.2, Math.max(8.0, Number((last.ramUsedGB + ramDelta).toFixed(2))));
              const newRamPct = Math.round((newRamGB / 16.0) * 100);

              const newNetIn = Math.max(800, Math.round(last.netInKB + (Math.random() - 0.5) * 1200));
              const newNetOut = Math.max(300, Math.round(last.netOutKB + (Math.random() - 0.5) * 600));

              const newPoint: SystemMetricPoint = {
                time: timeStr,
                cpu: newCpu,
                ram: newRamPct,
                ramUsedGB: newRamGB,
                ramTotalGB: 16.0,
                netInKB: newNetIn,
                netOutKB: newNetOut,
                diskReadMB: Number((Math.random() * 8).toFixed(1)),
                diskWriteMB: Number((Math.random() * 4).toFixed(1)),
              };

              return [...prev.slice(-19), newPoint];
            });
          }
        })
        .catch(() => {});
    }, wizardConfig.telemetryIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [wizardConfig.telemetryIntervalSec]);

  // Handle Server Switching (Connect to another computer in the network)
  const handleSelectServer = (selected: ConnectedServer) => {
    setCurrentServerId(selected.id);
    setServers((prev) =>
      prev.map((s) => ({
        ...s,
        isCurrent: s.id === selected.id,
      }))
    );

    // Update wizardConfig hostname & host
    setWizardConfig((prev) => ({
      ...prev,
      agentHostname: selected.name,
      listenHost: selected.host,
      listenPort: selected.port,
      osType: selected.osType as any,
    }));

    // Trigger toast notification
    setServerSwitchToast(`Conectado al servidor "${selected.name}" (${selected.host}:${selected.port}). Telemetría en vivo sincronizada.`);
    setTimeout(() => setServerSwitchToast(null), 4500);
  };

  const handleAddServer = (newSrv: Omit<ConnectedServer, 'id' | 'lastPing'>) => {
    const srv: ConnectedServer = {
      ...newSrv,
      id: `srv-node-${Date.now()}`,
      lastPing: 'Justo ahora',
      cpu: 20,
      ram: 58,
      ramUsedGB: 9.2,
      ramTotalGB: 16.0,
      netInKB: 2100,
      netOutKB: 850,
      diskReadMB: 2.4,
      diskWriteMB: 1.0,
    };
    setServers((prev) => [...prev, srv]);
    handleSelectServer(srv);
  };

  const handleDeleteServer = (id: string) => {
    if (servers.length <= 1) return;
    setServers((prev) => prev.filter((s) => s.id !== id));
    if (currentServerId === id) {
      const remaining = servers.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        handleSelectServer(remaining[0]);
      }
    }
  };

  // Simulate Spike
  const handleSimulateSpike = () => {
    setMetricsHistory((prev) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const spikePoint: SystemMetricPoint = {
        time: timeStr,
        cpu: 91,
        ram: 88,
        ramUsedGB: 14.1,
        ramTotalGB: 16.0,
        netInKB: 18400,
        netOutKB: 9600,
        diskReadMB: 28.5,
        diskWriteMB: 19.2,
      };
      return [...prev.slice(-19), spikePoint];
    });

    const newIncident: DiagnosticIncident = {
      id: `inc-${Date.now()}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      type: 'HIGH_RAM_LEAK',
      severity: 'ELEVADA',
      title: 'Pico Anómalo de Carga de CPU (91%) y saturación de ancho de banda',
      description: `El agente en ${currentServer.name} detectó una sobrecarga momentánea. Se disparó análisis preventivo autónomo.`,
      serviceAffected: 'CrashingWorkerPool',
      status: 'AUTO_HEALING',
      requiresReboot: false,
    };
    setIncidents((prev) => [newIncident, ...prev]);
  };

  // Service Handlers
  const handleUpdateServiceStatus = (id: string, newStatus: WindowsService['status']) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const handleCreateService = (newService: Omit<WindowsService, 'id'>) => {
    const srv: WindowsService = {
      ...newService,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [...prev, srv]);
  };

  // Routine Handlers
  const handleCreateRoutine = (newRoutine: Omit<AutomatedRoutine, 'id' | 'runCount'>) => {
    const rtn: AutomatedRoutine = {
      ...newRoutine,
      id: `rtn-${Date.now()}`,
      runCount: 0,
    };
    setRoutines((prev) => [rtn, ...prev]);
  };

  const handleToggleRoutine = (id: string) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleRunRoutineNow = (id: string) => {
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              runCount: r.runCount + 1,
              lastRun: 'Justo ahora',
              lastResult: 'SUCCESS',
            }
          : r
      )
    );
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  // File Handlers
  const handleCreateFile = (name: string, content: string) => {
    const newFile: FileItem = {
      id: `f-${Date.now()}`,
      name,
      path: `C:\\CrashingLive\\${name}`,
      type: 'file',
      sizeBytes: content.length,
      lastModified: new Date().toISOString().replace('T', ' ').slice(0, 19),
      isSystemProtected: false,
      extension: name.split('.').pop() || 'txt',
    };
    setFiles((prev) => [...prev, newFile]);

    const audit: FileAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: 'CREATE',
      sourcePath: newFile.path,
      operator: `CrashingLive_AdminWeb@${currentServer.name}`,
      status: 'SUCCESS',
      safetyCheckPassed: true,
      reason: 'Archivo creado desde la interfaz web',
    };
    setAudits((prev) => [audit, ...prev]);
  };

  const handleCreateDirectory = (dirName: string) => {
    const newDir: FileItem = {
      id: `f-${Date.now()}`,
      name: dirName,
      path: `C:\\CrashingLive\\${dirName}`,
      type: 'directory',
      sizeBytes: 0,
      lastModified: new Date().toISOString().replace('T', ' ').slice(0, 19),
      isSystemProtected: false,
    };
    setFiles((prev) => [...prev, newDir]);

    const audit: FileAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: 'CREATE',
      sourcePath: newDir.path,
      operator: `CrashingLive_AdminWeb@${currentServer.name}`,
      status: 'SUCCESS',
      safetyCheckPassed: true,
      reason: 'Directorio creado',
    };
    setAudits((prev) => [audit, ...prev]);
  };

  const handleMoveFile = (sourceId: string, destPath: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === sourceId) {
          const newName = destPath.split('\\').pop() || f.name;
          return { ...f, path: destPath, name: newName };
        }
        return f;
      })
    );

    const audit: FileAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: 'MOVE',
      sourcePath: destPath,
      operator: `CrashingLive_AdminWeb@${currentServer.name}`,
      status: 'SUCCESS',
      safetyCheckPassed: true,
      reason: 'Elemento movido / renombrado',
    };
    setAudits((prev) => [audit, ...prev]);
  };

  const handleDeleteFile = (fileId: string): { success: boolean; message: string } => {
    const target = files.find((f) => f.id === fileId);
    if (!target) return { success: false, message: 'Archivo no encontrado' };

    if (target.isSystemProtected || target.path.toLowerCase().includes('windows\\system32')) {
      const deniedAudit: FileAuditEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        action: 'DELETE',
        sourcePath: target.path,
        operator: `CrashingLive_SecurityGuardrail@${currentServer.name}`,
        status: 'DENIED',
        safetyCheckPassed: false,
        reason: 'BLOQUEADO: Intento de eliminación sobre directorio o archivo crítico del sistema.',
      };
      setAudits((prev) => [deniedAudit, ...prev]);
      return {
        success: false,
        message: 'SEGURIDAD: Bloqueado. No se permite eliminar archivos protegidos del sistema Windows.',
      };
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    const okAudit: FileAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: 'DELETE',
      sourcePath: target.path,
      operator: `CrashingLive_AdminWeb@${currentServer.name}`,
      status: 'SUCCESS',
      safetyCheckPassed: true,
      reason: 'Eliminación segura confirmada',
    };
    setAudits((prev) => [okAudit, ...prev]);
    return { success: true, message: `Archivo "${target.name}" eliminado correctamente.` };
  };

  // PowerShell Handler
  const handleExecutePowerShell = (command: string, auditInfo: any) => {
    const nowStr = new Date().toTimeString().split(' ')[0];
    const newLog: PowerShellExecutionLog = {
      id: `ps-${Date.now()}`,
      timestamp: nowStr,
      command,
      exitCode: 0,
      output: `PS C:\\CrashingLive> ${command}\n[CrashingLive] Operación ejecutada satisfactoriamente en ${currentServer.name} (${currentServer.osType}).\nResultado: OK | Verificado contra PostgreSQL en ${currentServer.host}.`,
      durationMs: Math.floor(Math.random() * 80) + 30,
      operator: `admin@${currentServer.name}`,
      safetyScore: auditInfo?.safetyScore || 95,
      riskLevel: auditInfo?.riskLevel || 'SAFE',
    };
    setPowerShellLogs((prev) => [newLog, ...prev]);
  };

  const handleRequestDisruptiveApproval = (title: string, desc: string, script: string) => {
    const newApproval: DisruptiveApproval = {
      id: `appr-${Date.now()}`,
      actionType: /restart|reboot|shutdown/i.test(script) ? 'REBOOT' : 'SERVICE_STOP_CRITICAL',
      title,
      description: desc,
      riskLevel: 'CRITICAL',
      requestedAt: new Date().toISOString(),
      requestedBy: `Administrador Web (${currentServer.name})`,
      status: 'PENDING',
      metadata: {
        uptimeHours: 742,
        suggestedWindow: '02:00 AM - 03:00 AM',
      },
    };
    setApprovals((prev) => [newApproval, ...prev]);
    setActiveTab('diagnostics');
  };

  const handleDecideApproval = (id: string, decision: 'APPROVED' | 'REJECTED', notes?: string) => {
    decideApproval(id, decision, notes);
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: decision,
              reviewedAt: new Date().toISOString(),
              reviewerNotes: notes || 'Decisión manual en panel web',
            }
          : a
      )
    );
  };

  const handleApplyRemediation = (incidentId: string, script: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              status: 'RESOLVED',
              appliedAt: `${new Date().toTimeString().split(' ')[0]} (Autocorregido con éxito en ${currentServer.name})`,
            }
          : inc
      )
    );
  };

  const themeClass =
    theme === 'retro-green'
      ? 'theme-retro-green bg-[#030a04] text-[#00ff66]'
      : theme === 'light'
      ? 'theme-light bg-[#f8fafc] text-zinc-900'
      : 'bg-black text-white';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 pb-16 md:pb-0 ${themeClass}`}>
      {/* Top Application Header with Server Switcher */}
      <Header
        theme={theme}
        onThemeChange={setTheme}
        targetHost={currentServer.name}
        osName={currentServer.osType}
        ipAddress={`${currentServer.host}:${currentServer.port}`}
        pendingApprovals={approvals}
        onOpenApprovals={() => {
          setMainSection('monitor');
          setActiveTab('diagnostics');
        }}
        onOpenRemoteModal={() => setShowRemoteModal(true)}
        onOpenWizard={() => setShowWizard(true)}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenAndroidSim={() => setShowAndroidSim(true)}
        agentConnected={agentConnected}
        servers={servers}
        currentServerId={currentServerId}
        onSelectServer={handleSelectServer}
        onOpenServerManager={() => setShowServerManager(true)}
        mainSection={mainSection}
        onSelectSection={setMainSection}
      />

      {/* Quick Setup & Help Banner */}
      {showQuickBanner && (
        <div className="bg-zinc-950/90 border-b border-zinc-800/80 px-3 sm:px-6 py-2.5 font-mono text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-zinc-300">
              <Sparkles className="w-4 h-4 text-[#ff6b00] shrink-0" />
              <span>
                Servidor activo: <strong className="text-white">{currentServer.name}</strong> ({currentServer.host}) • Agente Python & PostgreSQL enlazados.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setMainSection('installers')}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#ff6b00]/15 hover:bg-[#ff6b00]/25 border border-[#ff6b00]/40 text-[#ff6b00] font-bold text-[11px] transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Ver los 3 Instaladores</span>
              </button>
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#00ff66]/15 hover:bg-[#00ff66]/25 border border-[#00ff66]/40 text-[#00ff66] font-bold text-[11px] transition-colors shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>¿Cómo instalar y conectar?</span>
              </button>
              <button
                onClick={() => setShowQuickBanner(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5 rounded hover:bg-zinc-800"
                title="Cerrar aviso"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Switch Notification Toast */}
      {serverSwitchToast && (
        <div className="bg-[#00ff66]/15 border-b border-[#00ff66]/40 text-[#00ff66] px-4 py-2 text-center font-mono text-xs flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{serverSwitchToast}</span>
        </div>
      )}

      {/* Main Tab Navigation Bar (Desktop & Tablet) */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-16 z-30 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {mainSection === 'monitor' ? (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {/* 1. Menú hamburguesa dentro de la opción actualmente seleccionada */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setMonitorMenuOpen(!monitorMenuOpen);
                      setInstallMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-700/80 text-white font-mono text-xs font-bold transition-all shadow-sm hover:border-[#00ff66]/50 group"
                    title="Abrir menú de opciones del Monitor"
                  >
                    <Menu className="w-4 h-4 text-[#00ff66] group-hover:rotate-90 transition-transform duration-200" />
                    <currentTabConfig.icon className="w-4 h-4 text-[#00ff66]" />
                    <span className="text-white tracking-wide">{currentTabConfig.label}</span>
                    {activeTab === 'diagnostics' && approvals.filter((a) => a.status === 'PENDING').length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${monitorMenuOpen ? 'rotate-180 text-[#00ff66]' : ''}`} />
                  </button>

                  {/* Dropdown con todas las opciones ocultas dentro del botón actual */}
                  {monitorMenuOpen && (
                    <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 font-mono text-xs">
                      <div className="text-[10px] text-zinc-500 uppercase px-3 py-1.5 border-b border-zinc-900 flex items-center justify-between">
                        <span>Opciones del Monitor</span>
                        <span className="text-[#00ff66] font-bold">6 Vistas</span>
                      </div>
                      <div className="space-y-1 pt-1.5">
                        {monitorTabs.map((tab) => {
                          const Icon = tab.icon;
                          const isSelected = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id);
                                setMonitorMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-[#00ff66]/15 text-[#00ff66] font-bold border border-[#00ff66]/30'
                                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon className="w-4 h-4 shrink-0" />
                                <div className="truncate">
                                  <div className="truncate">{tab.label}</div>
                                  <div className="text-[10px] text-zinc-500 truncate">{tab.desc}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#00ff66] shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Insignia de Hardware Real sincronizado del agente */}
                {realHardwareData && (
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/70 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff66]"></span>
                    </span>
                    <span className="text-zinc-400">Host Real:</span>
                    <span className="text-white font-bold">{realHardwareData.hostname}</span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-[#00ff66] font-bold">{realHardwareData.cpu}% CPU</span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-white">{realHardwareData.ramUsedGB} / {realHardwareData.ramTotalGB} GB RAM</span>
                  </div>
                )}
              </div>

              {/* 2. Botón único "Instalar" con todos los instaladores agrupados dentro */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <button
                    onClick={() => {
                      setInstallMenuOpen(!installMenuOpen);
                      setMonitorMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all border shadow-sm ${
                      installMenuOpen
                        ? 'bg-[#ff6b00] text-black border-[#ff6b00] shadow-[0_0_12px_rgba(255,107,0,0.3)]'
                        : 'bg-zinc-900/90 hover:bg-zinc-850 border-zinc-700/80 text-white hover:border-[#ff6b00]/60'
                    }`}
                    title="Desplegar instaladores de Crashing Live"
                  >
                    <Menu className="w-3.5 h-3.5" />
                    <Download className="w-3.5 h-3.5" />
                    <span>Instalar</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${installMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Menú de opciones de instalación */}
                  {installMenuOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 font-mono text-xs">
                      <div className="text-[10px] text-zinc-500 uppercase px-3 py-1.5 border-b border-zinc-900 flex items-center justify-between">
                        <span>Componentes para Instalar</span>
                        <span className="text-[#ff6b00] font-bold">3 Opciones</span>
                      </div>
                      <div className="space-y-1.5 pt-2">
                        {/* Opción 1: Agente Host */}
                        <button
                          onClick={() => {
                            setMainSection('installers');
                            setInstallMenuOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-[#ff6b00]/50 transition-all flex items-start gap-2.5 group"
                        >
                          <Server className="w-4 h-4 text-[#ff6b00] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-white text-xs group-hover:text-[#ff6b00] transition-colors">
                              1. Instalador de Crashing LIVE monitoreo
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              Host Daemon para Windows Server / Win 11 (Python & PostgreSQL)
                            </div>
                          </div>
                        </button>

                        {/* Opción 2: Monitor Desktop */}
                        <button
                          onClick={() => {
                            setMainSection('installers');
                            setInstallMenuOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-[#00ff66]/50 transition-all flex items-start gap-2.5 group"
                        >
                          <Monitor className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-white text-xs group-hover:text-[#00ff66] transition-colors">
                              2. Instalador Crashing LIVE Monitor
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              Panel de Control Desktop y Web para Administradores
                            </div>
                          </div>
                        </button>

                        {/* Opción 3: APK Android */}
                        <button
                          onClick={() => {
                            setMainSection('android');
                            setInstallMenuOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-400/50 transition-all flex items-start gap-2.5 group"
                        >
                          <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-white text-xs group-hover:text-cyan-400 transition-colors">
                              3. Crashing LIVE Monitor APK
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              App móvil para teléfonos Android (Descarga directa / QR)
                            </div>
                          </div>
                        </button>

                        <div className="pt-2 border-t border-zinc-850 flex items-center justify-between px-1">
                          <button
                            onClick={() => {
                              setShowWizard(true);
                              setInstallMenuOpen(false);
                            }}
                            className="text-[11px] text-[#ff6b00] hover:underline font-bold flex items-center gap-1"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Wizard Paso a Paso</span>
                          </button>
                          <button
                            onClick={() => {
                              setMainSection('installers');
                              setInstallMenuOpen(false);
                            }}
                            className="text-[11px] text-zinc-400 hover:text-white"
                          >
                            Centro Completo →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Acceso rápido a App Android */}
                <button
                  onClick={() => setMainSection('android')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-mono text-xs font-bold transition-all bg-zinc-900/90 hover:bg-zinc-850 border-zinc-700/80 text-cyan-300 hover:border-cyan-400"
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>App Android (APK)</span>
                </button>
              </div>
            </div>
          ) : mainSection === 'installers' ? (
            <div className="flex items-center justify-between py-2 font-mono text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMainSection('monitor')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition-colors"
                >
                  <span>← Volver al Panel Monitor</span>
                </button>
                <span className="text-zinc-500">|</span>
                <span className="text-zinc-300 font-bold uppercase text-[11px]">
                  Instaladores Oficiales: 1. Host Monitoreo • 2. Monitor Desktop • 3. APK Android
                </span>
              </div>

              <button
                onClick={() => setMainSection('android')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold text-xs"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Ver App Android</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between py-2 font-mono text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMainSection('monitor')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition-colors"
                >
                  <span>← Volver al Panel Monitor</span>
                </button>
                <span className="text-zinc-500">|</span>
                <span className="text-cyan-400 font-bold uppercase text-[11px]">
                  Crashing LIVE Monitor APK • Vista Móvil Android en Vivo
                </span>
              </div>

              <button
                onClick={() => setMainSection('installers')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs"
              >
                <Wrench className="w-3.5 h-3.5 text-[#ff6b00]" />
                <span>Centro de Instaladores</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {mainSection === 'installers' && (
          <DeviceInstallerCenter
            onOpenWizard={() => setShowWizard(true)}
            onOpenAndroidSim={() => setMainSection('android')}
            currentHost={currentServer.name}
            currentIp={currentServer.host}
            currentPort={currentServer.port}
          />
        )}

        {mainSection === 'android' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white uppercase flex items-center gap-2">
                    Crashing LIVE Monitor APK
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                      ANDROID APP
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Visualiza y opera el panel de monitoreo desde un teléfono móvil Android en tiempo real.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMainSection('monitor')}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold"
                >
                  Ir al Monitor Desktop
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([`# Crashing Live Monitor Android APK Package\n# Server: ${currentServer.name}\n# Host: ${currentServer.host}:${currentServer.port}`], { type: 'application/vnd.android.package-archive' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'CrashingLiveMonitor.apk';
                    a.click();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar APK</span>
                </button>
              </div>
            </div>

            {/* Android Device Simulator Display */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Phone Frame */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[340px] h-[680px] bg-black border-[7px] border-zinc-800 rounded-[44px] shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden relative select-none">
                  {/* Top Phone Notch */}
                  <div className="h-6 w-full bg-black flex items-center justify-between px-6 pt-1 text-[10px] text-zinc-400 font-mono z-30 shrink-0">
                    <span>10:00</span>
                    <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                    </div>
                    <div className="flex items-center gap-1 text-[#00ff66]">
                      <span className="text-[9px] font-bold">5G</span>
                      <Wifi className="w-3 h-3" />
                      <Activity className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Android App Header */}
                  <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black font-mono text-white text-xs tracking-wider">
                          CRASHING<span className="text-[#ff6b00]">LIVE</span>
                        </span>
                        <span className="text-[9px] font-black font-mono px-1.5 py-0.2 rounded bg-[#00ff66]/15 text-[#00ff66]">
                          MONITOR
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {currentServer.name} ({currentServer.latencyMs}ms)
                      </span>
                    </div>

                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff66]"></span>
                    </span>
                  </div>

                  {/* Android App Body */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-mono text-xs text-white">
                    {/* Server Quick Card */}
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-[#ff6b00]" />
                        <div>
                          <div className="font-bold text-white text-xs">{currentServer.name}</div>
                          <div className="text-[10px] text-zinc-400">{currentServer.host}:{currentServer.port}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#00ff66]/15 text-[#00ff66]">
                        ONLINE
                      </span>
                    </div>

                    {/* 1. CPU Widget */}
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-[11px] uppercase flex items-center gap-1">
                          <Activity className="w-3 h-3 text-[#ff6b00]" /> CPU
                        </span>
                        <span className="font-bold text-[#00ff66] text-xs">{currentMetric.cpu}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00ff66] to-[#ff6b00]" style={{ width: `${currentMetric.cpu}%` }} />
                      </div>
                    </div>

                    {/* 2. RAM Widget */}
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-[11px] uppercase flex items-center gap-1">
                          <Activity className="w-3 h-3 text-[#00ff66]" /> RAM
                        </span>
                        <span className="font-bold text-white text-xs">{currentMetric.ram}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#00ff66] to-[#ff6b00]" style={{ width: `${currentMetric.ram}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{currentMetric.ramUsedGB.toFixed(1)} GB Usados</span>
                        <span>{currentMetric.ramTotalGB} GB Total</span>
                      </div>
                    </div>

                    {/* 3. Bandwidth Widget */}
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-[11px] uppercase flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-cyan-400" /> Red
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold">1 Gbps</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-white pt-1">
                        <span>IN: {(currentMetric.netInKB / 1024).toFixed(2)} MB/s</span>
                        <span>OUT: {(currentMetric.netOutKB / 1024).toFixed(2)} MB/s</span>
                      </div>
                    </div>

                    {/* Mobile Action */}
                    <button
                      onClick={handleSimulateSpike}
                      className="w-full py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-black font-black text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Simular Pico de Carga</span>
                    </button>
                  </div>

                  {/* Android Bottom Bar */}
                  <div className="h-10 bg-zinc-950 border-t border-zinc-850 px-6 flex items-center justify-around font-mono text-[10px] shrink-0">
                    <span className="text-[#00ff66] font-bold">● Monitor</span>
                    <span className="text-zinc-500">Nodos ({servers.length})</span>
                    <span className="text-zinc-500">Alertas</span>
                  </div>
                </div>
              </div>

              {/* Information & QR Code */}
              <div className="lg:col-span-7 space-y-4 font-mono text-xs">
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    Cómo ver el Panel en tu Teléfono Móvil Android
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                        <div className="w-full h-full border-2 border-black grid grid-cols-5 gap-0.5 p-1 bg-black">
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div>
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div>
                          <div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div>
                          <div className="bg-white"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-black"></div>
                          <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div>
                        </div>
                      </div>
                      <span className="font-bold text-white text-[11px]">Escanear con Teléfono Android</span>
                      <span className="text-[10px] text-zinc-400">Abre la cámara de tu smartphone y escanea</span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-zinc-400 font-bold block">1. Descarga el APK o accede por Wi-Fi</span>
                        <p className="text-zinc-400 text-[11px]">
                          Conéctate a la misma red Wi-Fi y accede a: <code className="text-[#00ff66] font-bold">http://{currentServer.host}:{currentServer.port}</code>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-400 font-bold block">2. Instala CrashingLiveMonitor.apk</span>
                        <p className="text-zinc-400 text-[11px]">
                          Si instalas el APK en Android, activa la opción <em>"Permitir instalar aplicaciones de fuentes desconocidas"</em> en Ajustes de Seguridad.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-400 font-bold block">3. Notificaciones Push en Vivo</span>
                        <p className="text-zinc-400 text-[11px]">
                          Recibe alertas en la barra de notificaciones del celular si el uso de RAM supera el 85% o si un servicio Windows se detiene inesperadamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mainSection === 'monitor' && (
          <>
            {activeTab === 'telemetry' && (
              <LiveTelemetry
                metrics={metricsHistory}
                currentMetric={currentMetric}
                onSimulateSpike={handleSimulateSpike}
                onRunHealthCheck={() => setActiveTab('diagnostics')}
                targetHost={`${currentServer.name} (${currentServer.host})`}
                servers={servers}
                currentServerId={currentServerId}
                onSelectServer={handleSelectServer}
                onOpenServerManager={() => setShowServerManager(true)}
              />
            )}

            {activeTab === 'services' && (
              <ServicesManager
                services={services}
                routines={routines}
                onUpdateServiceStatus={handleUpdateServiceStatus}
                onCreateService={handleCreateService}
                onCreateRoutine={handleCreateRoutine}
                onToggleRoutine={handleToggleRoutine}
                onRunRoutineNow={handleRunRoutineNow}
                onDeleteRoutine={handleDeleteRoutine}
              />
            )}

            {activeTab === 'files' && (
              <FileManager
                files={files}
                audits={audits}
                currentPath="C:\CrashingLive"
                onNavigate={() => {}}
                onCreateFile={handleCreateFile}
                onCreateDirectory={handleCreateDirectory}
                onMoveFile={handleMoveFile}
                onDeleteFile={handleDeleteFile}
              />
            )}

            {activeTab === 'powershell' && (
              <PowerShellStudio
                logs={powerShellLogs}
                onExecuteScript={handleExecutePowerShell}
                onRequestDisruptiveApproval={handleRequestDisruptiveApproval}
              />
            )}

            {activeTab === 'diagnostics' && (
              <DiagnosticCenter
                incidents={incidents}
                approvals={approvals}
                currentMetric={currentMetric}
                onApplyRemediation={handleApplyRemediation}
                onDecideApproval={handleDecideApproval}
                onTriggerDiagnosis={() => {}}
              />
            )}

            {activeTab === 'reports' && <MonthlyReportView />}
          </>
        )}
      </main>

      {/* Mobile Responsive Bottom Dock Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-zinc-800 px-1 py-1 flex items-center justify-around font-mono text-[10px]">
        <button
          onClick={() => {
            setMainSection('monitor');
            setActiveTab('telemetry');
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg ${
            mainSection === 'monitor' && activeTab === 'telemetry' ? 'text-[#00ff66] font-bold' : 'text-zinc-400'
          }`}
        >
          <Activity className="w-4 h-4 mb-0.5" />
          <span>Monitor</span>
        </button>

        <button
          onClick={() => {
            setMainSection('monitor');
            setActiveTab('services');
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg ${
            mainSection === 'monitor' && activeTab === 'services' ? 'text-[#ff6b00] font-bold' : 'text-zinc-400'
          }`}
        >
          <Server className="w-4 h-4 mb-0.5" />
          <span>Servicios</span>
        </button>

        <button
          onClick={() => setMainSection('installers')}
          className={`flex flex-col items-center p-1.5 rounded-lg ${
            mainSection === 'installers' ? 'text-[#ff6b00] font-bold' : 'text-zinc-400'
          }`}
        >
          <Wrench className="w-4 h-4 mb-0.5" />
          <span>Instalador</span>
        </button>

        <button
          onClick={() => setMainSection('android')}
          className={`flex flex-col items-center p-1.5 rounded-lg ${
            mainSection === 'android' ? 'text-cyan-400 font-bold' : 'text-zinc-400'
          }`}
        >
          <Smartphone className="w-4 h-4 mb-0.5" />
          <span>App Android</span>
        </button>

        <button
          onClick={() => {
            setMainSection('monitor');
            setActiveTab('diagnostics');
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg relative ${
            mainSection === 'monitor' && activeTab === 'diagnostics' ? 'text-[#ff6b00] font-bold' : 'text-zinc-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4 mb-0.5" />
          <span>Alertas</span>
          {approvals.filter((a) => a.status === 'PENDING').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 right-2 animate-ping" />
          )}
        </button>
      </div>

      {/* Modals */}
      {showWizard && (
        <InstallWizard
          config={wizardConfig}
          onSaveConfig={(cfg) => {
            setWizardConfig(cfg);
            setServers((prev) =>
              prev.map((s) =>
                s.id === currentServerId
                  ? {
                      ...s,
                      name: cfg.agentHostname,
                      host: cfg.listenHost === '0.0.0.0' ? s.host : cfg.listenHost,
                      port: cfg.listenPort,
                      osType: cfg.osType,
                    }
                  : s
              )
            );
          }}
          onClose={() => setShowWizard(false)}
        />
      )}

      {showRemoteModal && (
        <RemoteControlModal
          onClose={() => setShowRemoteModal(false)}
          targetHost={currentServer.name}
          ipAddress={currentServer.host}
          port={currentServer.port}
        />
      )}

      {showServerManager && (
        <ServerConnectionModal
          servers={servers}
          currentServerId={currentServerId}
          onSelectServer={handleSelectServer}
          onAddServer={handleAddServer}
          onDeleteServer={handleDeleteServer}
          onClose={() => setShowServerManager(false)}
        />
      )}

      {showHelpModal && (
        <HelpGuideModal
          onClose={() => setShowHelpModal(false)}
          onOpenWizard={() => setShowWizard(true)}
          onOpenServerManager={() => setShowServerManager(true)}
          currentHost={currentServer.name}
          currentIp={currentServer.host}
          currentPort={currentServer.port}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-4 px-4 text-center font-mono text-xs text-zinc-500 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
            <span>Crashing Live Agent v2.6.4 — Python 3.12 / PostgreSQL 16</span>
          </div>
          <div>
            Conectado a: <strong className="text-zinc-300">{currentServer.name}</strong> ({currentServer.host}) | Latencia: <span className="text-[#00ff66]">{currentServer.latencyMs}ms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
