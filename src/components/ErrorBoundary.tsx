import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CrashingLive ErrorBoundary] Excepción no capturada en React:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopy = () => {
    const errorDetails = `Error: ${this.state.error?.message || 'Desconocido'}\n\nStack:\n${this.state.error?.stack || ''}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0d0d] text-white font-mono flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#161616] border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  CRASHING LIVE • ERROR DE RENDERIZADO CAPTURADO
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  El Error Boundary previno una pantalla en negro (Black Screen).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Mensaje de Excepción:</span>
              </div>
              <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-mono overflow-x-auto whitespace-pre-wrap">
                {this.state.error?.message || 'Error desconocido'}
              </div>
            </div>

            {this.state.error?.stack && (
              <details className="text-xs text-zinc-400 bg-zinc-900/60 rounded-xl p-3 border border-zinc-800">
                <summary className="cursor-pointer font-bold text-zinc-300 hover:text-white">
                  Ver Seguimiento de Pila (Stack Trace)
                </summary>
                <pre className="mt-2 text-[11px] text-zinc-400 overflow-x-auto p-2 bg-black/50 rounded-lg">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={this.handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold transition-colors"
              >
                {this.state.copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{this.state.copied ? 'Copiado al portapapeles' : 'Copiar Diagnóstico'}</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6600] hover:bg-[#ff771a] text-black font-bold text-xs transition-colors shadow-lg shadow-[#FF6600]/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Aplicación</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
