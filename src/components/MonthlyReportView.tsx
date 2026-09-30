import React, { useState } from 'react';
import { MonthlyReportData } from '../types';
import { generateMonthlyHealthReport, MonthlyReportResponse } from '../services/api';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Printer, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Wifi, 
  RotateCw,
  Copy,
  Lightbulb
} from 'lucide-react';

export const MonthlyReportView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('Septiembre');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [report, setReport] = useState<MonthlyReportData>({
    month: 'Septiembre',
    year: 2026,
    executiveSummary:
      'El sistema Windows Server 2022 operó con un SLA de alta disponibilidad del 99.96% durante el ciclo mensual de Septiembre 2026. El agente autónomo Crashing Live ejecutó 188 rutinas preventivas, neutralizó 24 micro-incidentes de latencia y fuga de descriptores, y retuvo la telemetría en PostgreSQL de manera íntegra.',
    systemUptime: '99.96%',
    totalIncidents: 24,
    autoHealedCount: 23,
    humanInterventions: 1,
    averageCpuUsage: '23.4%',
    peakRamUsage: '79.8%',
    totalNetworkVolumeGB: 2140.5,
    keyFindings: [
      'La base de datos relacional PostgreSQL operó sin bloqueos prolongados gracias a la rutina de VACUUM diario programada por el agente.',
      'El motor de autodiagnóstico con IA previno 5 degradaciones de servicio reiniciando workers bloqueados de forma proactiva.',
      'El único evento que requirió intervención humana fue un reinicio planificado por el parche de seguridad acumulativo KB5034441, ejecutado a las 02:00 AM tras la autorización del administrador.',
    ],
    strategicRecommendations: [
      'Mantener la cuota de almacenamiento del volumen C: por encima de 40 GB para amortiguar el archivo de paginación de Windows.',
      'Habilitar compresión en frío en la tabla de telemetría de PostgreSQL para reducir en un 35% el consumo de I/O de disco.',
      'Configurar alertas directas por webhook para notificar al canal de infraestructura de IT ante consumos de memoria superiores al 85%.',
    ],
  });

  const handleGenerateReport = async () => {
    setIsLoading(true);
    const res = await generateMonthlyHealthReport(selectedMonth, selectedYear);
    setIsLoading(false);
    if (res.success && res.report) {
      setReport(res.report);
      setFeedback(`Informe mensual de ${selectedMonth} ${selectedYear} generado con IA.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `# Informe Mensual del Estado del Sistema - Crashing Live
**Periodo:** ${report.month} ${report.year}
**Uptime:** ${report.systemUptime} | **Incidentes:** ${report.totalIncidents} (Autocorregidos: ${report.autoHealedCount})

## Resumen Ejecutivo
${report.executiveSummary}

## Métricas Clave
- **CPU Promedio:** ${report.averageCpuUsage}
- **Pico de RAM:** ${report.peakRamUsage}
- **Volumen de Red:** ${report.totalNetworkVolumeGB} GB
- **Intervenciones Humanas:** ${report.humanInterventions}

## Hallazgos Clave
${report.keyFindings.map((f) => `- ${f}`).join('\n')}

## Recomendaciones Estratégicas
${report.strategicRecommendations.map((r) => `- ${r}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setFeedback('Informe copiado al portapapeles en formato Markdown.');
    setTimeout(() => setFeedback(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {feedback && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/40 text-[#00ff66] font-mono text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Toolbar: Month selector & Generate with AI */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[#ff6b00]" />
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase">
              Informes Mensuales de Salud del Sistema
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Consolidación periódica de incidentes, telemetría y recomendaciones preventivas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
          >
            <option value="Enero">Enero</option>
            <option value="Febrero">Febrero</option>
            <option value="Marzo">Marzo</option>
            <option value="Abril">Abril</option>
            <option value="Mayo">Mayo</option>
            <option value="Junio">Junio</option>
            <option value="Julio">Julio</option>
            <option value="Agosto">Agosto</option>
            <option value="Septiembre">Septiembre</option>
            <option value="Octubre">Octubre</option>
            <option value="Noviembre">Noviembre</option>
            <option value="Diciembre">Diciembre</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(255,107,0,0.3)] transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Generando...' : 'Generar con IA'}</span>
          </button>
        </div>
      </div>

      {/* Main Report Document Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6 shadow-2xl print:bg-white print:text-black">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
                CRASHING LIVE AUDIT
              </span>
              <span className="text-zinc-500 font-mono text-xs">
                ID: RPT-{report.year}-{report.month.toUpperCase().slice(0, 3)}-994
              </span>
            </div>
            <h1 className="mt-2 text-xl font-black text-white font-mono uppercase tracking-tight">
              Informe Mensual de Estado: {report.month} {report.year}
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              Generado de forma autónoma a partir de registros en PostgreSQL y sensores del sistema.
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>Copiar Markdown</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#ff6b00]" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono">
            <span className="text-zinc-500 text-[10px] uppercase">Disponibilidad (SLA)</span>
            <div className="text-2xl font-black text-[#00ff66] mt-1">{report.systemUptime}</div>
            <span className="text-[11px] text-zinc-400">Objetivo: 99.90%</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono">
            <span className="text-zinc-500 text-[10px] uppercase">Incidentes Totales</span>
            <div className="text-2xl font-black text-white mt-1">{report.totalIncidents}</div>
            <span className="text-[11px] text-[#00ff66]">{report.autoHealedCount} Autocorregidos</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono">
            <span className="text-zinc-500 text-[10px] uppercase">Pico de Memoria RAM</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{report.peakRamUsage}</div>
            <span className="text-[11px] text-zinc-400">Promedio CPU: {report.averageCpuUsage}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono">
            <span className="text-zinc-500 text-[10px] uppercase">Volumen de Red Total</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">{report.totalNetworkVolumeGB} GB</div>
            <span className="text-[11px] text-zinc-400">Sin pérdida de paquetes</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2 font-mono">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ff6b00]" /> Resumen Ejecutivo
          </h3>
          <p className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-200 text-xs leading-relaxed">
            {report.executiveSummary}
          </p>
        </div>

        {/* Key Findings */}
        <div className="space-y-2 font-mono">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00ff66]" /> Hallazgos y Diagnósticos Clave
          </h3>
          <div className="space-y-2">
            {report.keyFindings.map((finding, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-300"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00ff66] shrink-0 mt-0.5" />
                <span>{finding}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="space-y-2 font-mono">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" /> Recomendaciones Estratégicas & Plan Preventivo
          </h3>
          <div className="space-y-2">
            {report.strategicRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-300"
              >
                <span className="text-amber-400 font-bold shrink-0 mt-0.5">#{idx + 1}</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
