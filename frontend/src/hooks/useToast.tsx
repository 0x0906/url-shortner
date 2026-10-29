import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
const ToastContext = createContext<((message: string, type?: ToastType) => void) | null>(null);
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all duration-300"
            style={{
              animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />}
            <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-5 flex-grow pr-2">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all duration-200 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
