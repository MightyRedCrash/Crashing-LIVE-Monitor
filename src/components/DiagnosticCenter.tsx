import React, { useState } from 'react';
import { DiagnosticIncident, DisruptiveApproval, SystemMetricPoint } from '../types';
import { requestAiDiagnosis, DiagnoseResponse } from '../services/api';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Terminal, 
  Server, 
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DiagnosticCenterProps {
  incidents: DiagnosticIncident[];
  approvals: DisruptiveApproval[];
  currentMetric: SystemMetricPoint;
  onApplyRemediation: (incidentId: string, script: string) => void;
  onDecideApproval: (id: string, decision: 'APPROVED' | 'REJECTED', notes?: string) => void;
  onTriggerDiagnosis: () => void;
}

export const DiagnosticCenter: React.FC<DiagnosticCenterProps> = ({
  incidents,
  approvals,
  currentMetric,
  onApplyRemediation,
  onDecideApproval,
  onTriggerDiagnosis,
}) => {
  const [isRunningScan, setIsRunningScan] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<DiagnoseResponse['analysis'] | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState<Record<string, string>>({});

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const pastApprovals = approvals.filter((a) => a.status !== 'PENDING');

  const handleRunAiDiagnostic = async () => {
    setIsRunningScan(true);
    setAiAnalysisResult(null);

    const res = await requestAiDiagnosis({
      incident: 'Verificación preventiva autónoma de integridad de Windows Server y PostgreSQL.',
      systemState: {
        cpu: `${currentMetric.cpu}%`,
        ram: `${currentMetric.ram}%`,
        diskReadMB: currentMetric.diskReadMB,
        netInKB: currentMetric.netInKB,
      },
      logs: [
        'WinRM connection active from 192.168.1.140',
        'PostgreSQL checkpoint complete: 34 WAL segments recycled',
        'Spooler service paused by user policy',
      ],
    });

    setIsRunningScan(false);
    if (res.success && res.analysis) {
      setAiAnalysisResult(res.analysis);
      setFeedback('Autodiagnóstico con IA finalizado satisfactoriamente.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleApplyScript = (incidentId: string, script: string) => {
    onApplyRemediation(incidentId, script);
    setFeedback('Script de mantenimiento preventivo ejecutado. Servicio normalizado.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleApprovalAction = (id: string, decision: 'APPROVED' | 'REJECTED') => {
    onDecideApproval(id, decision, reviewerNotes[id]);
    setFeedback(`Acción disruptiva ${decision === 'APPROVED' ? 'APROBADA Y PROGRAMADA' : 'RECHAZADA'}.`);
    setTimeout(() => setFeedback(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {feedback && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/40 text-[#00ff66] font-mono text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TOP SECTION: HUMAN-IN-THE-LOOP DISRUPTIVE ACTIONS APPROVAL QUEUE */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-red-900/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/80 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
                Autorizaciones Disruptivas Requeridas (Human-in-the-Loop)
                {pendingApprovals.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-500 text-black font-black">
                    {pendingApprovals.length} PENDIENTE
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Por política de seguridad de Crashing Live, los reinicios y paradas críticas requieren confirmación humana explícita antes de su ejecución.
              </p>
            </div>
          </div>
        </div>

        {pendingApprovals.length > 0 ? (
          <div className="space-y-3">
            {pendingApprovals.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-red-950/20 border border-red-700/50 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900/80 text-red-200 border border-red-600">
                      {item.actionType}
                    </span>
                    <span className="text-sm font-bold text-white font-mono">{item.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Solicitado por: <span className="text-zinc-200">{item.requestedBy}</span>
                  </span>
                </div>

                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  {item.description}
                </p>

                {/* Metadata Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-black/60 border border-zinc-800 font-mono text-[11px]">
                  <div>
                    <span className="text-zinc-500">Uptime Actual:</span>
                    <span className="text-white ml-1 font-bold">{item.metadata.uptimeHours || 742} horas</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Ventana Sugerida:</span>
                    <span className="text-[#00ff66] ml-1 font-bold">{item.metadata.suggestedWindow || '02:00 AM - 03:00 AM'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Nivel de Impacto:</span>
                    <span className="text-red-400 ml-1 font-bold">Interrupción Breve (2m)</span>
                  </div>
                </div>

                {/* Decision Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Notas o justificativo del administrador (opcional)..."
                    value={reviewerNotes[item.id] || ''}
                    onChange={(e) =>
                      setReviewerNotes({ ...reviewerNotes, [item.id]: e.target.value })
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprovalAction(item.id, 'REJECTED')}
                      className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs font-bold transition-colors"
                    >
                      Rechazar / Posponer
                    </button>
                    <button
                      onClick={() => handleApprovalAction(item.id, 'APPROVED')}
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-colors"
                    >
                      Aprobar y Ejecutar Reinicio
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center font-mono text-xs text-zinc-400 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00ff66]" />
            <span>No hay acciones disruptivas pendientes. Todos los procesos operan de forma segura.</span>
          </div>
        )}
      </div>

      {/* AI AUTONOMOUS SELF-HEALER & PREVENTIVE DIAGNOSTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner & Remediation Generator (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#ff6b00]" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    Motor de Autodiagnóstico y Autocorrección (IA Gemini)
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Evalúa la telemetría viva de Windows, detecta fugas de recursos y formula scripts de mantenimiento preventivo.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunAiDiagnostic}
                disabled={isRunningScan}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(255,107,0,0.3)] transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isRunningScan ? 'animate-spin' : ''}`} />
                <span>{isRunningScan ? 'Analizando con IA...' : 'Ejecutar Diagnóstico IA'}</span>
              </button>
            </div>

            {/* AI Diagnosis Output */}
            {aiAnalysisResult ? (
              <div className="space-y-4 font-mono text-xs">
                {/* Result header */}
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">CAUSA RAÍZ IDENTIFICADA:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        aiAnalysisResult.severity === 'CRITICA'
                          ? 'bg-red-950 text-red-400'
                          : 'bg-[#ff6b00]/20 text-[#ff6b00]'
                      }`}
                    >
                      SEVERIDAD: {aiAnalysisResult.severity}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white leading-relaxed">
                    {aiAnalysisResult.rootCause}
                  </p>
                  <div className="text-[11px] text-zinc-500">
                    Nivel de Confianza: {(aiAnalysisResult.confidenceScore * 100).toFixed(0)}% | Downtime estimado: {aiAnalysisResult.estimatedDowntimeSeconds}s
                  </div>
                </div>

                {/* Preventive Actions List */}
                <div>
                  <span className="text-zinc-400 text-[11px] font-bold block mb-2">
                    ACCIONES PREVENTIVAS RECOMENDADAS:
                  </span>
                  <div className="space-y-1.5">
                    {aiAnalysisResult.preventiveActions.map((act, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated Remediation PowerShell Script */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-[11px] font-bold flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#00ff66]" />
                      SCRIPT DE MANTENIMIENTO PREVENTIVO GENERADO:
                    </span>
                    <button
                      onClick={() => handleApplyScript('inc-ai-gen', aiAnalysisResult.remediationPowerShell)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-bold text-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Ejecutar Autocorrección Ahora</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-black border border-zinc-800 text-[#00ff66] font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                    {aiAnalysisResult.remediationPowerShell}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 font-mono text-xs space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-zinc-700" />
                <p>Haz clic en "Ejecutar Diagnóstico IA" para solicitar a Gemini un análisis profundo de rendimiento y scripts de autocorrección.</p>
              </div>
            )}
          </div>

          {/* INCIDENT TIMELINE */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00ff66]" />
              Historial de Anomalías y Autocorrecciones
            </h3>

            <div className="space-y-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          inc.status === 'RESOLVED' ? 'bg-[#00ff66]' : 'bg-[#ff6b00] animate-ping'
                        }`}
                      />
                      <span className="font-bold text-white">{inc.title}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inc.status === 'RESOLVED'
                          ? 'bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30'
                          : 'bg-[#ff6b00]/15 text-[#ff6b00] border border-[#ff6b00]/30'
                      }`}
                    >
                      {inc.status === 'RESOLVED' ? 'AUTOCORREGIDO' : 'EN REMEDIACIÓN'}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-[11px]">{inc.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/80">
                    <span>Hora: {inc.timestamp} | Servicio: {inc.serviceAffected || 'Sistema General'}</span>
                    <span className="text-zinc-300">{inc.appliedAt || 'Resolución autónoma'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health Indicators & PostgreSQL State (1 col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Server className="w-4 h-4 text-[#ff6b00]" />
              Estado del Agente Autónomo
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400">Modo de Autocorrección:</span>
                <span className="text-[#00ff66] font-bold">Activo (Preventivo)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400">Filtro Disruptivo (Reboot):</span>
                <span className="text-amber-400 font-bold">Requiere Aprobación</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400">Almacén de Eventos:</span>
                <span className="text-zinc-200">PostgreSQL (16.2)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400">Canal de Alertas:</span>
                <span className="text-zinc-200">Webhook & Dashboard</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
              <span className="text-white font-bold block mb-1">Regla de Oro de Crashing Live:</span>
              El agente nunca ejecuta comandos destructivos ni reinicios de servidor de forma unilateral. Toda acción que afecte la continuidad del negocio se escala a un humano.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
