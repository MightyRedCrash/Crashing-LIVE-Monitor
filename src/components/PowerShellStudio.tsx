import React, { useState } from 'react';
import { PowerShellExecutionLog } from '../types';
import { auditPowerShellScript, AuditPowerShellResponse } from '../services/api';
import { 
  Terminal as TerminalIcon, 
  Play, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Trash2, 
  ArrowRight,
  Shield,
  Clock,
  Cpu
} from 'lucide-react';

interface PowerShellStudioProps {
  logs: PowerShellExecutionLog[];
  onExecuteScript: (command: string, audit: AuditPowerShellResponse['audit']) => void;
  onRequestDisruptiveApproval: (title: string, desc: string, script: string) => void;
}

export const PowerShellStudio: React.FC<PowerShellStudioProps> = ({
  logs,
  onExecuteScript,
  onRequestDisruptiveApproval,
}) => {
  const [commandInput, setCommandInput] = useState('Get-Service -Name "postgresql*" | Select-Object Name, Status, StartType');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditPowerShellResponse['audit'] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'history'>('console');

  // Pre-configured maintenance snippets
  const quickSnippets = [
    {
      title: 'Verificar PostgreSQL',
      cmd: 'Test-NetConnection -ComputerName "192.168.1.50" -Port 5432',
      risk: 'SAFE',
    },
    {
      title: 'Top 5 Procesos por RAM',
      cmd: 'Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 ProcessName, Id, WS',
      risk: 'SAFE',
    },
    {
      title: 'Servicios en Estado Pausado/Detenido',
      cmd: 'Get-Service | Where-Object { $_.Status -ne "Running" -and $_.StartType -eq "Automatic" }',
      risk: 'SAFE',
    },
    {
      title: 'Limpieza de DNS y Sockets',
      cmd: 'Clear-DnsClientCache; Write-Host "DNS Cache purgada" -ForegroundColor Green',
      risk: 'SAFE',
    },
    {
      title: 'Reinicio Programado (Disruptivo)',
      cmd: 'Restart-Computer -Force -Wait',
      risk: 'CRITICAL',
    },
  ];

  const handleAuditClick = async () => {
    if (!commandInput.trim()) return;
    setIsAuditing(true);
    setAuditResult(null);

    const res = await auditPowerShellScript(commandInput);
    setIsAuditing(false);
    if (res.success && res.audit) {
      setAuditResult(res.audit);
    }
  };

  const handleRunClick = async () => {
    if (!commandInput.trim()) return;

    // Check if audit has been performed or perform one now
    let currentAudit = auditResult;
    if (!currentAudit) {
      setIsAuditing(true);
      const res = await auditPowerShellScript(commandInput);
      setIsAuditing(false);
      currentAudit = res.audit;
      setAuditResult(currentAudit);
    }

    // If disruptive action detected, block immediate run and route to approval
    if (currentAudit?.isDisruptive || currentAudit?.requiresHumanApproval) {
      onRequestDisruptiveApproval(
        'Comando PowerShell de Alto Impacto / Disruptivo',
        `El comando contiene instrucciones potencialmente disruptivas: "${commandInput.slice(0, 80)}...". Requiere confirmación humana.`,
        commandInput
      );
      setFeedback('⚠️ ACCIÓN DISRUPTIVA BLOQUEADA: Se ha enviado a la cola de Aprobación de Administrador Humano.');
      setTimeout(() => setFeedback(null), 6000);
      return;
    }

    setIsExecuting(true);
    setTimeout(() => {
      onExecuteScript(commandInput, currentAudit);
      setIsExecuting(false);
      setFeedback('Comando PowerShell ejecutado con éxito y registrado en auditoría.');
      setTimeout(() => setFeedback(null), 3500);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {feedback && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-[#ff6b00]/60 text-[#ff6b00] font-mono text-xs shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#ff6b00]" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Bar: Snippets & Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800">
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'console'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TerminalIcon className="w-4 h-4 text-[#00ff66]" />
            <span>Consola PowerShell & Auditoría IA</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-[#ff6b00]" />
            <span>Historial de Ejecución ({logs.length})</span>
          </button>
        </div>

        {/* Quick Snippets Pills */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
          <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">Snippets:</span>
          {quickSnippets.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCommandInput(s.cmd);
                setAuditResult(null);
              }}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-mono text-[11px] whitespace-nowrap transition-colors flex items-center gap-1.5"
            >
              {s.risk === 'CRITICAL' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Terminal Editor & Runner (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl flex flex-col">
              {/* Terminal Window Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                  </div>
                  <span className="text-zinc-400 ml-2">Windows PowerShell (Elevated Admin) — Crashing Live Agent</span>
                </div>
                <span className="text-[10px] text-[#00ff66] font-bold">ExecutionPolicy: RemoteSigned</span>
              </div>

              {/* Code Input Area */}
              <div className="p-4 bg-black/90 font-mono text-xs text-white">
                <div className="flex items-start gap-2">
                  <span className="text-[#00ff66] font-bold select-none pt-1">PS C:\CrashingLive&gt;</span>
                  <textarea
                    rows={4}
                    value={commandInput}
                    onChange={(e) => {
                      setCommandInput(e.target.value);
                      if (auditResult) setAuditResult(null);
                    }}
                    placeholder="Escribe aquí comandos o scripts de PowerShell..."
                    className="w-full bg-transparent border-none text-white focus:outline-none resize-none leading-relaxed font-mono"
                  />
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between p-3 bg-zinc-950 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAuditClick}
                    disabled={isAuditing || !commandInput.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-xs disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#ff6b00]" />
                    <span>{isAuditing ? 'Auditando con IA...' : 'Pre-Auditar Seguridad (IA)'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCommandInput('');
                      setAuditResult(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono text-xs"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={handleRunClick}
                    disabled={isExecuting || !commandInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#00ff66] hover:bg-[#00dd55] text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(0,255,102,0.3)] disabled:opacity-50 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isExecuting ? 'Ejecutando...' : 'Ejecutar en Windows'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Terminal Output Window */}
            <div className="rounded-xl bg-black border border-zinc-800 overflow-hidden font-mono text-xs">
              <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 flex items-center justify-between">
                <span>Última Salida de Terminal (STDOUT / STDERR)</span>
                <span className="text-[10px] text-zinc-500">Sesión interactiva</span>
              </div>
              <div className="p-4 text-zinc-300 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {logs.length > 0 ? (
                  <div>
                    <div className="text-zinc-500 text-[11px] mb-2">
                      [{logs[0].timestamp}] Operator: {logs[0].operator} | ExitCode: {logs[0].exitCode} | Duration: {logs[0].durationMs}ms
                    </div>
                    <div className="text-[#00ff66] mb-1 font-bold">PS&gt; {logs[0].command}</div>
                    <div className="text-zinc-200">{logs[0].output}</div>
                  </div>
                ) : (
                  <span className="text-zinc-600">Ningún comando ejecutado en la sesión actual.</span>
                )}
              </div>
            </div>
          </div>

          {/* AI Pre-Audit & Safety Guardrails Card (1 col) */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#ff6b00]" />
                  <h3 className="text-xs font-bold text-white font-mono uppercase">
                    Auditor de Guardrails de Seguridad
                  </h3>
                </div>
                {auditResult && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      auditResult.riskLevel === 'SAFE'
                        ? 'bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30'
                        : auditResult.riskLevel === 'CRITICAL_DISRUPTIVE'
                        ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {auditResult.riskLevel}
                  </span>
                )}
              </div>

              {auditResult ? (
                <div className="space-y-3 font-mono text-xs">
                  {/* Safety Score Meter */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-400">Puntuación de Seguridad:</span>
                      <span className="text-white font-bold">{auditResult.safetyScore}/100</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          auditResult.safetyScore > 80
                            ? 'bg-[#00ff66]'
                            : auditResult.safetyScore > 50
                            ? 'bg-[#ff6b00]'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${auditResult.safetyScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Summary & Impact */}
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">EVALUACIÓN IA:</span>
                      <p className="text-zinc-200 mt-0.5">{auditResult.summary}</p>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block">IMPACTO POTENCIAL:</span>
                      <p className="text-zinc-400 mt-0.5">{auditResult.potentialImpact}</p>
                    </div>
                  </div>

                  {/* Disruptive Guardrail Warning */}
                  {auditResult.requiresHumanApproval && (
                    <div className="p-3 rounded-lg bg-red-950/80 border border-red-700/80 text-red-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-red-300">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span>ACCIÓN DISRUPTIVA DETECTADA</span>
                      </div>
                      <p className="text-[11px] text-red-200">
                        Este comando puede causar indisponibilidad del servidor o pérdida de datos. La política de Crashing Live requiere confirmación de un administrador humano antes de su ejecución.
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {auditResult.suggestions && auditResult.suggestions.length > 0 && (
                    <div>
                      <span className="text-zinc-500 text-[10px] block mb-1">SUGERENCIAS:</span>
                      <ul className="space-y-1">
                        {auditResult.suggestions.map((sug, i) => (
                          <li key={i} className="text-zinc-400 text-[11px] flex items-start gap-1.5">
                            <span className="text-[#00ff66]">•</span>
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-zinc-500 font-mono text-xs space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-zinc-600 opacity-60" />
                  <p>Haz clic en "Pre-Auditar Seguridad (IA)" para analizar riesgos de seguridad con Gemini antes de ejecutar.</p>
                </div>
              )}
            </div>

            {/* Security Guardrail Policies Summary */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-400 space-y-2">
              <span className="text-white font-bold text-[11px] block">POLÍTICAS ACTIVAS EN AGENTE:</span>
              <div className="flex items-center justify-between text-[11px]">
                <span>Bloqueo de C:\Windows:</span>
                <span className="text-[#00ff66]">Habilitado</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Reinicio requiere aprobación:</span>
                <span className="text-[#00ff66]">Habilitado</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Registro en PostgreSQL:</span>
                <span className="text-[#00ff66]">Auditoría Total</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EXECUTION HISTORY */}
      {activeTab === 'history' && (
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono">
              Historial de Comandos de PowerShell Ejecutados
            </h3>
            <span className="text-xs text-zinc-500 font-mono">{logs.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60 text-[11px]">
                  <th className="py-3 px-4">HORA</th>
                  <th className="py-3 px-4">COMANDO</th>
                  <th className="py-3 px-4">OPERADOR</th>
                  <th className="py-3 px-4">NIVEL RIESGO</th>
                  <th className="py-3 px-4">DURACIÓN</th>
                  <th className="py-3 px-4">ESTADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {logs.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-4 text-zinc-400">{item.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-white max-w-md truncate">
                      {item.command}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{item.operator}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.riskLevel === 'SAFE'
                            ? 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {item.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{item.durationMs}ms</td>
                    <td className="py-3 px-4">
                      <span className="text-[#00ff66] font-bold">ExitCode {item.exitCode}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
