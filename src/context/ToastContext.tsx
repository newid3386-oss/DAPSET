import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { soundEffects } from '../utils/audio';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  confirmDialog: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3800) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Play appropriate sound effect
    if (type === 'success') {
      soundEffects.playSuccess();
    } else if (type === 'error' || type === 'warning') {
      soundEffects.playWarning();
    } else {
      soundEffects.playClick();
    }

    setToasts((prev) => [...prev, { id, type, message, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const confirmDialog = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    soundEffects.playClick();
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve: (val: boolean) => {
          if (val) soundEffects.playClick();
          setConfirmState(null);
          resolve(val);
        },
      });
    });
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, confirmDialog }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-9999 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let bg = 'bg-slate-900 text-white border-slate-800';
          let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/20';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-900 text-white border-rose-700 shadow-rose-950/20';
            icon = <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-900 text-white border-amber-700 shadow-amber-950/20';
            icon = <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${bg}`}
              role="alert"
            >
              {icon}
              <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed break-words">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-white/60 hover:text-white transition p-0.5 rounded-lg shrink-0"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Accessible Confirm Modal */}
      {confirmState?.isOpen && (
        <div className="fixed inset-0 z-9998 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  confirmState.options.variant === 'danger'
                    ? 'bg-rose-100 text-rose-700'
                    : confirmState.options.variant === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {confirmState.options.variant === 'danger' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {confirmState.options.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {confirmState.options.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => confirmState.resolve(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                {confirmState.options.cancelText || 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => confirmState.resolve(true)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition shadow-sm ${
                  confirmState.options.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmState.options.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-800 hover:bg-emerald-700'
                }`}
              >
                {confirmState.options.confirmText || 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
