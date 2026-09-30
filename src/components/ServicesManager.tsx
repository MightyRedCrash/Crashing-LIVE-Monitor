import React, { useState } from 'react';
import { WindowsService, AutomatedRoutine } from '../types';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCw, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Settings2, 
  Code, 
  Trash2,
  Calendar,
  Zap,
  Sparkles
} from 'lucide-react';

interface ServicesManagerProps {
  services: WindowsService[];
  routines: AutomatedRoutine[];
  onUpdateServiceStatus: (id: string, newStatus: WindowsService['status']) => void;
  onCreateService: (newService: Omit<WindowsService, 'id'>) => void;
  onCreateRoutine: (newRoutine: Omit<AutomatedRoutine, 'id' | 'runCount'>) => void;
  onToggleRoutine: (id: string) => void;
  onRunRoutineNow: (id: string) => void;
  onDeleteRoutine: (id: string) => void;
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({
  services,
  routines,
  onUpdateServiceStatus,
  onCreateService,
  onCreateRoutine,
  onToggleRoutine,
  onRunRoutineNow,
  onDeleteRoutine,
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'routines'>('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Modals state
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // New Service Form
  const [newServiceName, setNewServiceName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBinaryPath, setNewBinaryPath] = useState('');
  const [newStartupType, setNewStartupType] = useState<WindowsService['startupType']>('Automatic');
  const [newAccount, setNewAccount] = useState('LocalSystem');
  const [newDescription, setNewDescription] = useState('');

  // New Routine Form
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newScheduleType, setNewScheduleType] = useState<AutomatedRoutine['scheduleType']>('cron');
  const [newCronExpr, setNewCronExpr] = useState('0 2 * * *');
  const [newIntervalMin, setNewIntervalMin] = useState(60);
  const [newTriggerEvent, setNewTriggerEvent] = useState<AutomatedRoutine['triggerEvent']>('OnHighMemory');
  const [newActionType, setNewActionType] = useState<AutomatedRoutine['actionType']>('RESTART_SERVICE');
  const [newTargetResource, setNewTargetResource] = useState('Spooler');
  const [newScriptPayload, setNewScriptPayload] = useState('Write-Host "Ejecutando rutina preventiva..."');

  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || srv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleServiceAction = (id: string, name: string, action: WindowsService['status']) => {
    onUpdateServiceStatus(id, action);
    setActionFeedback(`Servicio "${name}" actualizado a estado: ${action}`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleCreateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newBinaryPath) return;

    onCreateService({
      name: newServiceName,
      displayName: newDisplayName || newServiceName,
      status: 'Running',
      startupType: newStartupType,
      pid: Math.floor(Math.random() * 5000) + 1000,
      memoryMB: 45.0,
      cpuPercent: 0.2,
      binaryPath: newBinaryPath,
      account: newAccount,
      description: newDescription || 'Servicio creado por Crashing Live Agent',
      isCritical: false,
    });

    setActionFeedback(`Servicio "${newServiceName}" creado y registrado en Windows Service Manager.`);
    setShowCreateServiceModal(false);
    setNewServiceName('');
    setNewDisplayName('');
    setNewBinaryPath('');
    setNewDescription('');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleCreateRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName) return;

    onCreateRoutine({
      name: newRoutineName,
      description: newRoutineDesc || 'Rutina preventiva configurada en Crashing Live',
      scheduleType: newScheduleType,
      cronExpression: newScheduleType === 'cron' ? newCronExpr : undefined,
      intervalMinutes: newScheduleType === 'interval' ? newIntervalMin : undefined,
      triggerEvent: newScheduleType === 'event' ? newTriggerEvent : undefined,
      actionType: newActionType,
      targetResource: newTargetResource,
      scriptPayload: newScriptPayload,
      enabled: true,
      nextRun: newScheduleType === 'cron' ? 'Próximo ciclo programado' : 'Según eventos del agente',
      lastResult: 'SUCCESS',
    });

    setActionFeedback(`Rutina de automatización "${newRoutineName}" activada en el scheduler.`);
    setShowCreateRoutineModal(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionFeedback && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/40 text-[#00ff66] font-mono text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Tabs & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Toggle between Windows Services and Routines */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'services'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Settings2 className="w-4 h-4 text-[#ff6b00]" />
            <span>Servicios de Windows ({services.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('routines')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'routines'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-[#00ff66]" />
            <span>Rutinas Automatizadas ({routines.length})</span>
          </button>
        </div>

        {/* Action Button */}
        <div>
          {activeTab === 'services' ? (
            <button
              onClick={() => setShowCreateServiceModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-black font-mono font-bold text-xs transition-colors shadow-[0_0_15px_rgba(255,107,0,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Servicio</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCreateRoutineModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00dd55] text-black font-mono font-bold text-xs transition-colors shadow-[0_0_15px_rgba(0,255,102,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>Fijar Nueva Rutina</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: SERVICES LIST & CONTROLS */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar servicio por nombre, binario o descripción..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="Running">Running (En ejecución)</option>
                <option value="Paused">Paused (Pausado)</option>
                <option value="Stopped">Stopped (Detenido)</option>
              </select>
            </div>
          </div>

          {/* Services Table */}
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60 text-[11px]">
                    <th className="py-3 px-4">NOMBRE / SERVICIO</th>
                    <th className="py-3 px-4">ESTADO</th>
                    <th className="py-3 px-4">TIPO INICIO</th>
                    <th className="py-3 px-4">PID</th>
                    <th className="py-3 px-4 text-right">RAM</th>
                    <th className="py-3 px-4 text-right">CPU</th>
                    <th className="py-3 px-4 text-center">ACCIONES RÁPIDAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredServices.map((srv) => (
                    <tr key={srv.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {srv.displayName}
                          {srv.isCritical && (
                            <span className="px-1.5 py-0.2 text-[9px] rounded bg-amber-950 text-amber-400 border border-amber-800">
                              CRÍTICO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-sm">
                          {srv.name} — <span className="text-zinc-500">{srv.binaryPath}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            srv.status === 'Running'
                              ? 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30'
                              : srv.status === 'Paused'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-700/60'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              srv.status === 'Running'
                                ? 'bg-[#00ff66] animate-pulse'
                                : srv.status === 'Paused'
                                ? 'bg-amber-400'
                                : 'bg-zinc-500'
                            }`}
                          />
                          {srv.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-300">{srv.startupType}</td>
                      <td className="py-3 px-4 text-zinc-400">{srv.pid || '—'}</td>
                      <td className="py-3 px-4 text-right text-zinc-300 font-medium">
                        {srv.memoryMB > 0 ? `${srv.memoryMB.toFixed(1)} MB` : '0 MB'}
                      </td>
                      <td className="py-3 px-4 text-right text-[#00ff66]">
                        {srv.cpuPercent > 0 ? `${srv.cpuPercent.toFixed(1)}%` : '0%'}
                      </td>

                      {/* Action buttons: Start, Pause, Stop, Restart */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* Start */}
                          <button
                            disabled={srv.status === 'Running'}
                            onClick={() => handleServiceAction(srv.id, srv.name, 'Running')}
                            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-[#00ff66] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Iniciar servicio (Start-Service)"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          {/* Pause */}
                          <button
                            disabled={srv.status !== 'Running'}
                            onClick={() => handleServiceAction(srv.id, srv.name, 'Paused')}
                            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Pausar servicio (Suspend-Service)"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>

                          {/* Stop */}
                          <button
                            disabled={srv.status === 'Stopped'}
                            onClick={() => handleServiceAction(srv.id, srv.name, 'Stopped')}
                            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Detener servicio (Stop-Service)"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>

                          {/* Restart */}
                          <button
                            onClick={() => handleServiceAction(srv.id, srv.name, 'Running')}
                            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-[#ff6b00] transition-colors"
                            title="Reiniciar servicio (Restart-Service)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: AUTOMATED ROUTINES (RUTINAS FIJADAS) */}
      {activeTab === 'routines' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#00ff66]" />
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  Motor de Rutinas Autónomas de Crashing Live
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  El agente ejecuta estas tareas preventivas de forma autónoma en Windows y registra el resultado en PostgreSQL.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routines.map((rtn) => (
              <div
                key={rtn.id}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                        rtn.scheduleType === 'cron'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : rtn.scheduleType === 'event'
                          ? 'bg-[#ff6b00]/15 text-[#ff6b00] border border-[#ff6b00]/30'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {rtn.scheduleType === 'cron' ? `CRON: ${rtn.cronExpression}` : rtn.scheduleType === 'event' ? `TRIGGER: ${rtn.triggerEvent}` : `INTERVAL: ${rtn.intervalMinutes}m`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onToggleRoutine(rtn.id)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition-colors ${
                          rtn.enabled
                            ? 'bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/40'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}
                      >
                        {rtn.enabled ? 'ACTIVA' : 'PAUSADA'}
                      </button>
                    </div>
                  </div>

                  <h4 className="mt-3 text-sm font-bold text-white font-mono">
                    {rtn.name}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-400 font-mono line-clamp-2">
                    {rtn.description}
                  </p>

                  <div className="mt-3 p-2 rounded bg-zinc-900/80 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Recurso:</span>
                      <span className="text-zinc-200 truncate max-w-[180px]">{rtn.targetResource}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Última ejec.:</span>
                      <span>{rtn.lastRun || 'Pendiente'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Veces ejecutada:</span>
                      <span className="text-[#00ff66] font-bold">{rtn.runCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onRunRoutineNow(rtn.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs border border-zinc-700 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#00ff66]" />
                    <span>Ejecutar Ahora</span>
                  </button>
                  <button
                    onClick={() => onDeleteRoutine(rtn.id)}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors"
                    title="Eliminar rutina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREAR NUEVO SERVICIO */}
      {showCreateServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#ff6b00]" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Crear Nuevo Servicio de Windows (New-Service)
                </h3>
              </div>
              <button
                onClick={() => setShowCreateServiceModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateServiceSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">Nombre Técnico del Servicio:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. CrashingLiveWorker02"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Nombre Visible (Display Name):</label>
                <input
                  type="text"
                  placeholder="ej. Crashing Live Backup Worker"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Ruta del Binario / Script (BinaryPathName):</label>
                <input
                  type="text"
                  required
                  placeholder="C:\CrashingLive\bin\python.exe C:\CrashingLive\scripts\worker.py"
                  value={newBinaryPath}
                  onChange={(e) => setNewBinaryPath(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Tipo de Inicio:</label>
                  <select
                    value={newStartupType}
                    onChange={(e) => setNewStartupType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="Automatic">Automatic (Automático)</option>
                    <option value="Manual">Manual</option>
                    <option value="Disabled">Disabled (Deshabilitado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Cuenta de Ejecución:</label>
                  <select
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="LocalSystem">LocalSystem</option>
                    <option value="NetworkService">NetworkService</option>
                    <option value="NT AUTHORITY\SYSTEM">NT AUTHORITY\SYSTEM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  placeholder="Propósito del servicio para el registro de auditoría..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div className="p-2.5 rounded bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400">
                <span className="text-[#00ff66] font-bold">Comando generado por Crashing Live:</span>
                <p className="font-mono mt-1 text-zinc-300 break-all">
                  New-Service -Name "{newServiceName || 'ServiceName'}" -BinaryPathName "{newBinaryPath || 'Path'}" -StartupType {newStartupType}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateServiceModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold transition-colors"
                >
                  Crear y Registrar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FIJAR NUEVA RUTINA */}
      {showCreateRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#00ff66]" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Fijar Nueva Rutina Autónoma de Mantenimiento
                </h3>
              </div>
              <button
                onClick={() => setShowCreateRoutineModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoutineSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">Nombre de la Rutina:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Rotación Semanal de Logs de IIS"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Disparador (Trigger):</label>
                  <select
                    value={newScheduleType}
                    onChange={(e) => setNewScheduleType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
                  >
                    <option value="cron">Expresión Cron</option>
                    <option value="interval">Intervalo de Minutos</option>
                    <option value="event">Evento Reactivo (IA / Sensores)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Tipo de Acción:</label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
                  >
                    <option value="RESTART_SERVICE">Reiniciar Servicio</option>
                    <option value="RUN_POWERSHELL">Ejecutar Script PowerShell</option>
                    <option value="CLEAR_TEMP_FILES">Limpieza de Archivos Temporales</option>
                    <option value="POSTGRES_VACUUM">VACUUM / Reindex PostgreSQL</option>
                  </select>
                </div>
              </div>

              {newScheduleType === 'cron' && (
                <div>
                  <label className="block text-zinc-300 mb-1">Expresión Cron (5 campos):</label>
                  <input
                    type="text"
                    value={newCronExpr}
                    onChange={(e) => setNewCronExpr(e.target.value)}
                    placeholder="0 2 * * *"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
                  />
                  <span className="text-[10px] text-zinc-500">ej. "0 2 * * *" = Todos los días a las 02:00 AM</span>
                </div>
              )}

              {newScheduleType === 'interval' && (
                <div>
                  <label className="block text-zinc-300 mb-1">Intervalo en Minutos:</label>
                  <input
                    type="number"
                    min={5}
                    value={newIntervalMin}
                    onChange={(e) => setNewIntervalMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
                  />
                </div>
              )}

              {newScheduleType === 'event' && (
                <div>
                  <label className="block text-zinc-300 mb-1">Condición de Evento:</label>
                  <select
                    value={newTriggerEvent}
                    onChange={(e) => setNewTriggerEvent(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
                  >
                    <option value="OnHighMemory">OnHighMemory (Memoria RAM &gt; 85%)</option>
                    <option value="OnServiceCrash">OnServiceCrash (Caída de Servicio Crítico)</option>
                    <option value="OnDiskPressure">OnDiskPressure (Espacio libre en C: &lt; 15%)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-zinc-300 mb-1">Recurso / Servicio Objetivo:</label>
                <input
                  type="text"
                  placeholder="ej. Spooler, C:\Windows\Temp, etc."
                  value={newTargetResource}
                  onChange={(e) => setNewTargetResource(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#00ff66]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Script de PowerShell Asociado:</label>
                <textarea
                  rows={3}
                  value={newScriptPayload}
                  onChange={(e) => setNewScriptPayload(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-[11px] focus:outline-none focus:border-[#00ff66]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRoutineModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-bold transition-colors shadow-[0_0_12px_rgba(0,255,102,0.3)]"
                >
                  Fijar Rutina Autónoma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
