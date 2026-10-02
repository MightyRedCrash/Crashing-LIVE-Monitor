import React, { useState, useEffect } from 'react';
import { ConnectedServer } from '../types';
import { Edit3, Check, X, RotateCcw, Monitor, Server, Tag, ShieldCheck } from 'lucide-react';

interface RenameServerModalProps {
  server: ConnectedServer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (serverId: string, newName: string) => void;
  onResetOriginal?: (serverId: string) => void;
}

export const RenameServerModal: React.FC<RenameServerModalProps> = ({
  server,
  isOpen,
  onClose,
  onSave,
  onResetOriginal,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (server) {
      setNameInput(server.customName || server.name || '');
      setError(null);
    }
  }, [server, isOpen]);

  if (!isOpen || !server) return null;

  const handleSave = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    onSave(server.id, trimmed);
    onClose();
  };

  const handleReset = () => {
    if (onResetOriginal) {
      onResetOriginal(server.id);
    } else {
      const original = server.rawHostname || 'EQUIPO-LOCAL';
      onSave(server.id, original);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const originalName = server.rawHostname || server.name;
  const isCustomized = Boolean(server.customName && server.customName !== server.rawHostname);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Renombrar Equipo en el Monitor
              </h3>
              <p className="text-[10px] text-zinc-400">
                Personalice el nombre de referencia para mejor identificación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Card con Información Actual del Equipo */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">Datos del Sistema Reportado:</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                server.isLocalHost
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'bg-[#ff6b00]/15 text-[#ff6b00] border border-[#ff6b00]/30'
              }`}>
                {server.isLocalHost ? 'EQUIPO LOCAL' : 'CONECTADO POR ID'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-zinc-500 block text-[10px]">Nombre Original Windows:</span>
                <span className="text-zinc-200 font-bold break-all">{originalName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">ID de Conexión:</span>
                <span className="text-[#00ff66] font-bold break-all">{server.agentId || 'CL-LOCAL-HOST'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Dirección IP:</span>
                <span className="text-zinc-300">{server.host}:{server.port}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">Sistema Operativo:</span>
                <span className="text-zinc-300">{server.osType}</span>
              </div>
            </div>
          </div>

          {/* Formulario de Renombrado */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#00ff66]" />
              <span>Nuevo Nombre de Referencia Personalizado:</span>
            </label>
            <input
              type="text"
              autoFocus
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ej: Servidor Principal Contabilidad, Caja 01, DC01"
              className="w-full px-3 py-2.5 rounded-xl bg-black border border-zinc-700 focus:border-[#00ff66] text-white text-xs font-mono outline-none transition-colors shadow-inner"
            />
            {error && (
              <p className="text-[11px] text-red-400 font-mono mt-1">{error}</p>
            )}
            <p className="text-[10px] text-zinc-400">
              Este nombre se mostrará en todas las gráficas, listas de servidores y alertas del monitor.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
          {isCustomized ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 transition-colors text-[11px]"
              title="Restaurar el nombre original detectado por Windows"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Original</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 font-bold transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00ff66] hover:bg-[#00dd55] text-black font-black font-mono transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)] text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar Nombre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
