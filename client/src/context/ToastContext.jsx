import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, Bell, X, MessageCircle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

const ToastContext = createContext(null);

function ToastItem({ toast, removeToast }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isChat = toast.type === 'chat';

  const handleClick = (e) => {
    if (toast.onClick) {
      toast.onClick();
      removeToast(toast.id);
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    removeToast(toast.id);
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  if (isChat) {
    const isMultiple = (toast.count || 1) > 1;

    return (
      <div
        key={toast.id}
        onClick={handleClick}
        className="toast-chat-card"
        style={{
          pointerEvents: 'auto',
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '16px',
          padding: '12px 14px',
          boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          cursor: toast.onClick ? 'pointer' : 'default',
          animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent top gradient bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #25D366, #128C7E, #10b981)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          {/* WhatsApp-style avatar */}
          <div style={{ position: 'relative', flexShrink: 0, marginTop: '2px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(18, 140, 126, 0.3)',
              }}
            >
              <MessageCircle size={20} color="#ffffff" />
            </div>
            {isMultiple && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card, #ffffff)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  animation: 'toastPulse 0.4s ease',
                }}
              >
                {toast.count > 9 ? '9+' : toast.count}
              </span>
            )}
          </div>

          {/* Chat Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: 'var(--text-main, #0f172a)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '150px',
                  }}
                >
                  {toast.senderName || toast.title || 'Team Member'}
                </span>
                {toast.senderRole && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '6px',
                      background:
                        toast.senderRole === 'Owner'
                          ? 'rgba(79, 70, 229, 0.12)'
                          : toast.senderRole === 'Manager'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(100, 116, 139, 0.15)',
                      color:
                        toast.senderRole === 'Owner'
                          ? '#4f46e5'
                          : toast.senderRole === 'Manager'
                            ? '#059669'
                            : '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {toast.senderRole}
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                title="Dismiss"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #94a3b8)',
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Multiple Messages Indicator */}
            {isMultiple && (
              <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '1px 8px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {toast.count} new messages
                </span>
                <button
                  type="button"
                  onClick={toggleExpand}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    color: '#059669',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '1px 4px',
                  }}
                >
                  {isExpanded ? (
                    <>
                      Hide <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      View all <ChevronDown size={12} />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Latest Message Preview */}
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-main, #334155)',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                marginTop: isMultiple ? '4px' : '2px',
              }}
            >
              {isMultiple && <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem' }}>Latest: </span>}
              <span style={{ fontWeight: isMultiple ? 600 : 400 }}>{toast.message}</span>
            </div>
          </div>
        </div>

        {/* Expandable message stack preview */}
        {isExpanded && toast.messages && toast.messages.length > 1 && (
          <div
            style={{
              marginTop: '4px',
              padding: '6px 10px',
              background: 'var(--bg-hover, #f8fafc)',
              borderRadius: '8px',
              border: '1px solid var(--border, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              maxHeight: '130px',
              overflowY: 'auto',
            }}
          >
            {toast.messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '0.73rem',
                  lineHeight: 1.35,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '5px',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)', flexShrink: 0 }}>
                  {m.senderName}:
                </span>
                <span style={{ color: 'var(--text-muted, #64748b)', wordBreak: 'break-word' }}>{m.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action prompt footer */}
        {toast.onClick && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '6px',
              borderTop: '1px solid var(--border, rgba(16, 185, 129, 0.15))',
              fontSize: '0.72rem',
              color: '#059669',
              fontWeight: 700,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Click to open chat
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              Open Chat <ArrowRight size={13} />
            </span>
          </div>
        )}
      </div>
    );
  }

  // Standard toast rendering (success, warning, alert, info, bell)
  let bg = 'var(--bg-card, #ffffff)';
  let border = 'var(--border, #e2e8f0)';
  let text = 'var(--text-main, #0f172a)';
  let iconColor = '#3b82f6';
  let Icon = Info;

  if (toast.type === 'success') {
    border = '#86efac';
    iconColor = '#16a34a';
    Icon = CheckCircle2;
  } else if (toast.type === 'warning') {
    bg = 'var(--bg-card, #fffbeb)';
    border = '#fde68a';
    iconColor = '#d97706';
    Icon = AlertCircle;
  } else if (toast.type === 'alert' || toast.type === 'error') {
    bg = 'var(--bg-card, #fef2f2)';
    border = '#fecaca';
    iconColor = '#dc2626';
    Icon = AlertCircle;
  } else if (toast.type === 'bell') {
    border = 'rgba(79, 70, 229, 0.3)';
    iconColor = 'var(--primary, #4f46e5)';
    Icon = Bell;
  }

  return (
    <div
      key={toast.id}
      onClick={handleClick}
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
        cursor: toast.onClick ? 'pointer' : 'default',
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
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #475569)', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {toast.message}
        </div>
      </div>
      <button
        type="button"
        onClick={handleClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted, #94a3b8)',
          padding: '2px',
          borderRadius: '4px',
          display: 'inline-flex',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const recentToastsRef = useRef(new Map());
  const timersRef = useRef(new Map());
  const activeGroupMapRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target?.groupKey) {
        activeGroupMapRef.current.delete(target.groupKey);
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const removeToastsByGroupKey = useCallback((groupKey) => {
    if (!groupKey) return;
    setToasts((prev) => {
      const matches = prev.filter((t) => t.groupKey === groupKey);
      matches.forEach((t) => {
        if (timersRef.current.has(t.id)) {
          clearTimeout(timersRef.current.get(t.id));
          timersRef.current.delete(t.id);
        }
      });
      activeGroupMapRef.current.delete(groupKey);
      return prev.filter((t) => t.groupKey !== groupKey);
    });
  }, []);

  const showToast = useCallback(
    (arg1, arg2 = 'info') => {
      let title, message, type, duration, groupKey, onClick, senderName, senderRole;
      if (typeof arg1 === 'string') {
        message = arg1;
        type = arg2 || 'info';
        title = type === 'success' ? 'Success' : type === 'error' ? 'Alert' : 'Notice';
        duration = 4500;
      } else if (typeof arg1 === 'object' && arg1 !== null) {
        title = arg1.title || (arg1.type === 'success' ? 'Success' : arg1.type === 'error' ? 'Alert' : 'Notice');
        message = arg1.message || arg1.text || '';
        type = arg1.type || 'info';
        duration = arg1.duration ?? (type === 'chat' ? 7000 : 4500);
        groupKey = arg1.groupKey;
        onClick = arg1.onClick;
        senderName = arg1.senderName;
        senderRole = arg1.senderRole;
      }

      if (!message && !title) return;

      const now = Date.now();

      // If grouping is requested (e.g. consecutive chat messages)
      if (groupKey) {
        const existingId = activeGroupMapRef.current.get(groupKey);
        if (existingId) {
          // Clear previous timeout and schedule fresh expiration
          if (timersRef.current.has(existingId)) {
            clearTimeout(timersRef.current.get(existingId));
          }
          if (duration > 0) {
            const timerId = setTimeout(() => {
              removeToast(existingId);
            }, duration);
            timersRef.current.set(existingId, timerId);
          }

          setToasts((prev) =>
            prev.map((t) => {
              if (t.id !== existingId) return t;
              const newCount = (t.count || 1) + 1;
              const updatedMessages = [
                ...(t.messages || []),
                {
                  text: message,
                  senderName: senderName || title || 'Team Member',
                  senderRole: senderRole || t.senderRole,
                  time: now,
                },
              ].slice(-8); // Retain latest 8 messages for preview

              return {
                ...t,
                count: newCount,
                messages: updatedMessages,
                message: message, // update to latest message
                title: title || t.title,
                senderName: senderName || t.senderName,
                senderRole: senderRole || t.senderRole,
                onClick: onClick || t.onClick,
                lastBump: now,
              };
            })
          );
          return;
        }
      }

      // Deduplication guard for regular toasts: ignore exact same toast arriving within 3 seconds
      const dedupeKey = `${title}__${message}__${type}`;
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
      if (groupKey) {
        activeGroupMapRef.current.set(groupKey, id);
      }

      const newToast = {
        id,
        groupKey,
        title,
        message,
        messages: [
          {
            text: message,
            senderName: senderName || title || 'Team Member',
            senderRole: senderRole,
            time: now,
          },
        ],
        count: 1,
        type,
        duration,
        onClick,
        senderName,
        senderRole,
        lastBump: now,
      };

      // Cap visible toasts to max 5 to prevent screen overflowing
      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration > 0) {
        const timerId = setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timerId);
      }
    },
    [removeToast]
  );

  const contextValue = useMemo(
    () => ({ showToast, removeToast, removeToastsByGroupKey }),
    [showToast, removeToast, removeToastsByGroupKey]
  );

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
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(110%) scale(0.92);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes toastPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .toast-chat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.2), 0 0 0 1.5px rgba(16, 185, 129, 0.4) !important;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: () => {}, removeToast: () => {}, removeToastsByGroupKey: () => {} };
  }
  return context;
}
