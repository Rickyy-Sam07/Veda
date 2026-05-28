'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  const colors: Record<ToastType, string> = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-item"
            style={{ borderLeftColor: colors[toast.type] }}
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          >
            <span className="toast-icon">{icons[toast.type]}</span>
            <span className="toast-msg">{toast.message}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .toast-stack {
          position: fixed;
          top: 80px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        .toast-item {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-left: 4px solid #3b82f6;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          pointer-events: all;
          cursor: pointer;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          max-width: 360px;
          min-width: 240px;
        }
        .toast-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        .toast-msg {
          line-height: 1.4;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
