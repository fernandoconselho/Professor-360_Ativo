import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AVA+ ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('ava_')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 ring-8 ring-rose-500/10">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h1 className="text-xl font-bold text-slate-100 mb-2">
              Recuperação do Sistema AVA+
            </h1>
            
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Ocorreu uma inconsistência inesperada na renderização. Você pode recarregar a tela ou restaurar os dados padrão com segurança.
            </p>

            {this.state.error?.message && (
              <div className="text-left bg-slate-950 p-3 rounded-lg text-xs font-mono text-rose-300 mb-6 overflow-x-auto border border-rose-950">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="w-4 h-4" /> Recarregar
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors border border-slate-600"
              >
                <RotateCcw className="w-4 h-4" /> Restaurar Padrões
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
