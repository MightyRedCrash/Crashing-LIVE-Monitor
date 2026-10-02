export type ThemeMode = 'dark' | 'light' | 'retro-green';

export interface SystemMetricPoint {
  time: string;
  cpu: number; // percentage 0-100
  ram: number; // percentage 0-100
  ramUsedGB: number;
  ramTotalGB: number;
  netInKB: number;
  netOutKB: number;
  diskReadMB: number;
  diskWriteMB: number;
}

export interface WindowsService {
  id: string;
  name: string;
  displayName: string;
  status: 'Running' | 'Stopped' | 'Paused' | 'Starting' | 'Error';
  startupType: 'Automatic' | 'Manual' | 'Disabled';
  pid?: number;
  memoryMB: number;
  cpuPercent: number;
  binaryPath: string;
  account: string;
  description: string;
  isCritical: boolean;
}

export interface AutomatedRoutine {
  id: string;
  name: string;
  description: string;
  scheduleType: 'cron' | 'interval' | 'event';
  cronExpression?: string;
  intervalMinutes?: number;
  triggerEvent?: 'OnHighMemory' | 'OnServiceCrash' | 'OnDiskPressure';
  actionType: 'RESTART_SERVICE' | 'RUN_POWERSHELL' | 'CLEAR_TEMP_FILES' | 'POSTGRES_VACUUM';
  targetResource: string;
  scriptPayload?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  lastResult?: 'SUCCESS' | 'WARNING' | 'FAILED';
  runCount: number;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  sizeBytes: number;
  lastModified: string;
  isSystemProtected: boolean;
  extension?: string;
}

export interface FileAuditEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'MOVE' | 'DELETE' | 'READ' | 'EDIT';
  sourcePath: string;
  destinationPath?: string;
  operator: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  safetyCheckPassed: boolean;
  reason?: string;
}

export interface PowerShellExecutionLog {
  id: string;
  timestamp: string;
  command: string;
  exitCode: number;
  output: string;
  error?: string;
  durationMs: number;
  operator: string;
  safetyScore: number;
  riskLevel: 'SAFE' | 'LOW_RISK' | 'MODERATE_WARNING' | 'CRITICAL_DISRUPTIVE';
  approvedBy?: string;
}

export interface DiagnosticIncident {
  id: string;
  timestamp: string;
  type: 'SERVICE_HANG' | 'HIGH_RAM_LEAK' | 'DISK_PRESSURE' | 'POSTGRES_LOCK' | 'NETWORK_LATENCY';
  severity: 'BAJA' | 'MEDIA' | 'ELEVADA' | 'CRITICA';
  title: string;
  description: string;
  serviceAffected?: string;
  status: 'DETECTED' | 'AUTO_HEALING' | 'RESOLVED' | 'AWAITING_APPROVAL';
  rootCause?: string;
  remediationScript?: string;
  requiresReboot: boolean;
  appliedAt?: string;
}

export interface DisruptiveApproval {
  id: string;
  actionType: 'REBOOT' | 'SERVICE_STOP_CRITICAL' | 'FILE_PURGE' | 'REGISTRY_MOD';
  title: string;
  description: string;
  riskLevel: 'HIGH' | 'CRITICAL';
  requestedAt: string;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  metadata: {
    uptimeHours?: number;
    pendingUpdatesCount?: number;
    suggestedWindow?: string;
    affectedServices?: string[];
  };
  reviewedAt?: string;
  reviewerNotes?: string;
}

export interface MonthlyReportData {
  month: string;
  year: number;
  executiveSummary: string;
  systemUptime: string;
  totalIncidents: number;
  autoHealedCount: number;
  humanInterventions: number;
  averageCpuUsage: string;
  peakRamUsage: string;
  totalNetworkVolumeGB: number;
  keyFindings: string[];
  strategicRecommendations: string[];
}

export interface WizardConfig {
  osType: 'Windows Server 2022' | 'Windows Server 2019' | 'Windows 11 Pro' | 'Windows 11 Enterprise';
  agentHostname: string;
  listenPort: number;
  listenHost: string;
  allowedRemoteIps: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPass: string;
  dbSsl: boolean;
  executionPolicy: 'RemoteSigned' | 'AllSigned' | 'Restricted' | 'Bypass';
  requireApprovalForReboot: boolean;
  enableAiSelfHealing: boolean;
  telemetryIntervalSec: number;
  enableNotificationWebhook: boolean;
  webhookUrl: string;
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu: number;       // % CPU (e.g. 12.4)
  memoryMB: number;  // RAM in MB (e.g. 450.8)
  user?: string;     // User account (e.g. SYSTEM, Alexis)
  status?: string;   // Running, Sleeping, etc.
}

export interface ConnectedServer {
  id: string;
  name: string;
  host: string;
  port: number;
  osType: string;
  token?: string;
  ssl: boolean;
  isCurrent: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'CONNECTING';
  latencyMs: number;
  lastPing: string;
  agentId?: string; // AnyDesk style ID: e.g. CL-948-201-143
  isLocalDiscovered?: boolean;
  macAddress?: string;
  cpu?: number;
  ram?: number;
  ramUsedGB?: number;
  ramTotalGB?: number;
  netInKB?: number;
  netOutKB?: number;
  diskReadMB?: number;
  diskWriteMB?: number;
  diskPercent?: number;
  diskFreeGB?: number;
  diskTotalGB?: number;
  uptimeSeconds?: number;
  servicesRunning?: number;
  processes?: ProcessItem[];
  metricsHistory?: SystemMetricPoint[];
}

export interface AnyDeskRemoteSession {
  remoteId: string;
  serverName: string;
  ipAddress: string;
  port: number;
  osType: string;
  status: 'DISCONNECTED' | 'SEARCHING' | 'CONNECTING' | 'CONNECTED';
  connectionType: 'LAN_LOCAL_DISCOVERY' | 'AGENT_ID_DIRECT';
  fps: number;
  latencyMs: number;
  quality: 'HIGH' | 'BALANCED' | 'FAST';
  sessionStartTime?: string;
  keyboardCaptured: boolean;
  mouseCaptured: boolean;
  viewOnly: boolean;
}

export interface SystemComponentCheck {
  id: string;
  name: string;
  category: 'runtime' | 'package' | 'database' | 'service';
  installedVersion: string | null;
  latestVersion: string;
  status: 'INSTALLED' | 'OUTDATED' | 'MISSING';
  installCommand: string;
  upgradeCommand: string;
  description: string;
}

