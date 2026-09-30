import React, { useState } from 'react';
import { FileItem, FileAuditEntry } from '../types';
import { 
  Folder, 
  FileText, 
  Trash2, 
  FolderPlus, 
  FilePlus, 
  Move, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  History,
  FileCode,
  HardDrive
} from 'lucide-react';

interface FileManagerProps {
  files: FileItem[];
  audits: FileAuditEntry[];
  currentPath: string;
  onNavigate: (newPath: string) => void;
  onCreateFile: (fileName: string, content: string) => void;
  onCreateDirectory: (dirName: string) => void;
  onMoveFile: (sourceId: string, destPath: string) => void;
  onDeleteFile: (fileId: string) => { success: boolean; message: string };
}

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  audits,
  currentPath,
  onNavigate,
  onCreateFile,
  onCreateDirectory,
  onMoveFile,
  onDeleteFile,
}) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'audits'>('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileForView, setSelectedFileForView] = useState<FileItem | null>(null);
  
  // Modals
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewDirModal, setShowNewDirModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState<FileItem | null>(null);
  const [moveDestPath, setMoveDestPath] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // Form states
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [newDirName, setNewDirName] = useState('');

  const displayFiles = files.filter(f => {
    return f.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName) return;
    onCreateFile(newFileName, newFileContent);
    setFeedback({ text: `Archivo "${newFileName}" creado satisfactoriamente en ${currentPath}` });
    setShowNewFileModal(false);
    setNewFileName('');
    setNewFileContent('');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateDirSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirName) return;
    onCreateDirectory(newDirName);
    setFeedback({ text: `Directorio "${newDirName}" creado con permisos de agente.` });
    setShowNewDirModal(false);
    setNewDirName('');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleMoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMoveModal || !moveDestPath) return;
    onMoveFile(showMoveModal.id, moveDestPath);
    setFeedback({ text: `Elemento "${showMoveModal.name}" movido a "${moveDestPath}".` });
    setShowMoveModal(null);
    setMoveDestPath('');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteClick = (file: FileItem) => {
    const result = onDeleteFile(file.id);
    setFeedback({ text: result.message, error: !result.success });
    setTimeout(() => setFeedback(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3 rounded-lg border font-mono text-xs ${
            feedback.error
              ? 'bg-red-950/80 border-red-500/80 text-red-200'
              : 'bg-[#00ff66]/10 border-[#00ff66]/40 text-[#00ff66]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.error ? <ShieldAlert className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Explorer / Audits Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'explorer'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4 text-[#ff6b00]" />
            <span>Explorador Seguro de Archivos</span>
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'audits'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-[#00ff66]" />
            <span>Registro de Auditoría ({audits.length})</span>
          </button>
        </div>

        {activeTab === 'explorer' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewDirModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-mono text-xs transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-yellow-400" />
              <span>Nueva Carpeta</span>
            </button>
            <button
              onClick={() => setShowNewFileModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] text-black font-mono font-bold text-xs transition-colors shadow-[0_0_12px_rgba(255,107,0,0.3)]"
            >
              <FilePlus className="w-4 h-4" />
              <span>Crear Archivo</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: FILE EXPLORER */}
      {activeTab === 'explorer' && (
        <div className="space-y-4">
          {/* Breadcrumb Path & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            {/* Current Path Bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300">
              <span className="text-zinc-500">Ruta:</span>
              <span className="font-bold text-[#ff6b00]">{currentPath}</span>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar archivos..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 font-mono text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>
          </div>

          {/* Files List Table */}
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60 text-[11px]">
                    <th className="py-3 px-4">NOMBRE</th>
                    <th className="py-3 px-4">TIPO</th>
                    <th className="py-3 px-4">TAMAÑO</th>
                    <th className="py-3 px-4">PROTECCIÓN</th>
                    <th className="py-3 px-4">MODIFICACIÓN</th>
                    <th className="py-3 px-4 text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {displayFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {file.type === 'directory' ? (
                            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-white">{file.name}</span>
                            <div className="text-[10px] text-zinc-500">{file.path}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-zinc-400 uppercase text-[11px]">
                        {file.type === 'directory' ? 'Directorio' : file.extension || 'Archivo'}
                      </td>

                      <td className="py-3 px-4 text-zinc-300">
                        {file.type === 'directory'
                          ? '—'
                          : file.sizeBytes > 1024 * 1024
                          ? `${(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                          : `${(file.sizeBytes / 1024).toFixed(1)} KB`}
                      </td>

                      <td className="py-3 px-4">
                        {file.isSystemProtected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-700/60 text-[10px] font-bold">
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                            PROTEGIDO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30 text-[10px]">
                            <ShieldCheck className="w-3 h-3" />
                            LIBRE
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-zinc-400 text-[11px]">{file.lastModified}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {file.type === 'file' && (
                            <button
                              onClick={() => setSelectedFileForView(file)}
                              className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-400 transition-colors"
                              title="Inspeccionar contenido de archivo"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setShowMoveModal(file);
                              setMoveDestPath(file.path.substring(0, file.path.lastIndexOf('\\') + 1));
                            }}
                            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-[#ff6b00] transition-colors"
                            title="Mover o renombrar archivo"
                          >
                            <Move className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteClick(file)}
                            className={`p-1.5 rounded transition-colors ${
                              file.isSystemProtected
                                ? 'bg-zinc-900 text-zinc-600 hover:text-red-400 hover:bg-red-950/40'
                                : 'bg-zinc-900 hover:bg-red-950/80 text-zinc-400 hover:text-red-400'
                            }`}
                            title={
                              file.isSystemProtected
                                ? 'Archivo protegido por Crashing Live (Requiere bypass de seguridad)'
                                : 'Eliminar archivo de forma segura'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* VIEW 2: DETAILED AUDIT LOGS */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00ff66]" />
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  Registro Inmutable de Auditoría de Archivos (PostgreSQL)
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Todas las operaciones de creación, eliminación y movimiento son registradas con timestamp, operador y verificación de seguridad.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60 text-[11px]">
                    <th className="py-3 px-4">TIMESTAMP</th>
                    <th className="py-3 px-4">ACCIÓN</th>
                    <th className="py-3 px-4">RUTA OBJETIVO</th>
                    <th className="py-3 px-4">OPERADOR</th>
                    <th className="py-3 px-4">ESTADO</th>
                    <th className="py-3 px-4">DETALLES / MOTIVO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {audits.map((entry) => (
                    <tr key={entry.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">{entry.timestamp}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.action === 'CREATE'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : entry.action === 'DELETE'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {entry.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-white font-bold max-w-xs truncate">
                        {entry.sourcePath}
                      </td>

                      <td className="py-3 px-4 text-zinc-300">{entry.operator}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.status === 'SUCCESS'
                              ? 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-400 max-w-sm">{entry.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR ARCHIVO */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-[#ff6b00]" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Crear Nuevo Archivo en {currentPath}
                </h3>
              </div>
              <button onClick={() => setShowNewFileModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateFileSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">Nombre del Archivo (con extensión):</label>
                <input
                  type="text"
                  required
                  placeholder="ej. custom_script.ps1 o config.ini"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Contenido Inicial:</label>
                <textarea
                  rows={5}
                  placeholder="# Escribe aquí el contenido..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-[11px] focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold"
                >
                  Crear Archivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA CARPETA */}
      {showNewDirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Crear Nuevo Directorio
                </h3>
              </div>
              <button onClick={() => setShowNewDirModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDirSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">Nombre de Carpeta:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. backups o scripts"
                  value={newDirName}
                  onChange={(e) => setNewDirName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewDirModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-black font-bold"
                >
                  Crear Directorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVER ARCHIVO */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Move className="w-5 h-5 text-[#ff6b00]" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Mover / Renombrar: {showMoveModal.name}
                </h3>
              </div>
              <button onClick={() => setShowMoveModal(null)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleMoveSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">Nueva Ruta Completa de Destino:</label>
                <input
                  type="text"
                  required
                  value={moveDestPath}
                  onChange={(e) => setMoveDestPath(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold"
                >
                  Confirmar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER ARCHIVO */}
      {selectedFileForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  {selectedFileForView.name} ({selectedFileForView.path})
                </h3>
              </div>
              <button onClick={() => setSelectedFileForView(null)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-zinc-300 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {`# Visualizador Seguro de Archivos - Crashing Live
# Ubicación: ${selectedFileForView.path}
# Tamaño: ${selectedFileForView.sizeBytes} bytes
# Última modificación: ${selectedFileForView.lastModified}

[CrashingLiveConfig]
DaemonEnabled=True
PostgresHost=192.168.1.50
PostgresPort=5432
Database=crashing_live_db
TelemetryRate=2s
SelfHealingLevel=FullAutomatic
HumanApprovalForReboot=True

[Logging]
Level=INFO
AuditRotation=Daily
MaxLogSizeMB=50`}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFileForView(null)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
