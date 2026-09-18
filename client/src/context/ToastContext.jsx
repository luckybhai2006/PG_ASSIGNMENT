import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, Bell, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const recentToastsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((arg1, arg2 = 'info') => {
    let title, message, type, duration;
    if (typeof arg1 === 'string') {
      message = arg1;
      type = arg2 || 'info';
      title = type === 'success' ? 'Success' : type === 'error' ? 'Alert' : 'Notice';
      duration = 4500;
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      title = arg1.title || (arg1.type === 'success' ? 'Success' : arg1.type === 'error' ? 'Alert' : 'Notice');
      message = arg1.message || arg1.text || '';
      type = arg1.type || 'info';
      duration = arg1.duration || 4500;
    }

    if (!message && !title) return;

    // Deduplication guard: ignore exact same toast arriving within 3 seconds
    const dedupeKey = `${title}__${message}__${type}`;
    const now = Date.now();
    if (recentToastsRef.current.has(dedupeKey)) {
      const lastTime = recentToastsRef.current.get(dedupeKey);
      if (now - lastTime < 3000) {
        return; // Suppress duplicate toast
      }
    }
    recentToastsRef.current.set(dedupeKey, now);

    // Keep map memory clean
    if (recentToastsRef.current.size > 25) {
      for (const [k, v] of recentToastsRef.current.entries()) {
        if (now - v > 8000) recentToastsRef.current.delete(k);
      }
    }

    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const contextValue = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Floating Notification Popups Container */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100vw - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let bg = '#ffffff';
          let border = '#e2e8f0';
          let text = '#0f172a';
          let iconColor = '#3b82f6';
          let Icon = Info;

          if (toast.type === 'success') {
            bg = '#ffffff';
            border = '#86efac';
            iconColor = '#16a34a';
            Icon = CheckCircle2;
          } else if (toast.type === 'warning') {
            bg = '#fffbeb';
            border = '#fde68a';
            iconColor = '#d97706';
            Icon = AlertCircle;
          } else if (toast.type === 'alert' || toast.type === 'error') {
            bg = '#fef2f2';
            border = '#fecaca';
            iconColor = '#dc2626';
            Icon = AlertCircle;
          } else if (toast.type === 'bell') {
            bg = '#ffffff';
            border = 'rgba(79, 70, 229, 0.3)';
            iconColor = 'var(--primary, #4f46e5)';
            Icon = Bell;
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: '12px',
                padding: '12px 14px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                <Icon size={18} color={iconColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: text, marginBottom: '2px' }}>
                    {toast.title}
                  </div>
                )}
                <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(100%) scale(0.92);
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
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: () => {}, removeToast: () => {} };
  }
  return context;
}
