import React from 'react';
import { X, Wrench, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

const COMMON_REASONS = [
  { label: '🧹 Deep Cleaning & Sanitization', text: 'Deep cleaning & sanitization after student move out' },
  { label: '🎨 Whitewash & Wall Paint', text: 'Whitewash and wall painting work' },
  { label: '❄️ AC / Fan Servicing', text: 'AC / Fan servicing and electrical check' },
  { label: '🚰 Plumbing & Bathroom Fix', text: 'Plumbing repair & bathroom tap fixing' },
  { label: '🛏️ Bed & Carpentry Work', text: 'Bed / furniture repair and carpentry work' },
];

export default function RoomMaintenanceModal({
  room,
  reason,
  onReasonChange,
  loading,
  onSubmit,
  onMarkClean,
  onClose,
}) {
  if (!room) return null;

  const isUnderMaintenance = room.status === 'maintenance';
  const hasResidents = room.residents && room.residents.length > 0;

  return (
    <div
      className="modal-backdrop center-dialog-backdrop"
      style={{ zIndex: 1200, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)' }}
      onClick={() => !loading && onClose()}
    >
      <div
        className="modal-content center-dialog-modal"
        style={{
          maxWidth: '460px',
          width: '92%',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-light, #e2e8f0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isUnderMaintenance ? '#ecfdf5' : '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isUnderMaintenance ? '#059669' : '#b45309',
              }}
            >
              <Wrench size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
                {isUnderMaintenance ? 'Room Maintenance Status' : 'Mark Under Maintenance'}
              </h3>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)' }}>
                Room {room.roomNumber} {room.block ? `(${room.block})` : ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Occupancy Warning if residents are present */}
        {hasResidents && (
          <div
            style={{
              marginBottom: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              color: '#334155',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Active Residents:</strong> {room.occupied} student(s) (
              {room.residents.map((r) => r.name).join(', ')}) are currently allocated here. Putting this room under maintenance freezes <em>new</em> admissions without evicting existing students.
            </span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                Work / Maintenance Reason *
              </label>
              <input
                type="text"
                className="form-input"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="e.g. Deep cleaning, Whitewash, AC repair"
                required
                style={{ height: '36px', fontSize: '0.82rem' }}
              />
            </div>

            {/* Quick-Pick Common Reason Chips */}
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '5px' }}>
                ⚡ Quick Auto-Fill:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {COMMON_REASONS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onReasonChange(chip.text)}
                    style={{
                      background: reason === chip.text ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-hover, #f1f5f9)',
                      color: reason === chip.text ? 'var(--primary, #4f46e5)' : 'var(--text-main, #334155)',
                      border: reason === chip.text ? '1px solid var(--primary, #4f46e5)' : '1px solid var(--border-light, #cbd5e1)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                fontSize: '0.74rem',
                color: '#92400e',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '8px 10px',
                borderRadius: '6px',
              }}
            >
              ⚠️ When marked under maintenance, this room will be locked and cannot be selected or allocated for student admission.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              {isUnderMaintenance && onMarkClean ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={onMarkClean}
                  className="btn"
                  style={{
                    height: '36px',
                    fontSize: '0.8rem',
                    padding: '0 14px',
                    fontWeight: 700,
                    background: '#059669',
                    color: '#ffffff',
                    border: '1px solid #047857',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  title="Remove maintenance lock and make room ready for admissions"
                >
                  <CheckCircle2 size={14} />
                  <span>Mark Clean & Ready</span>
                </button>
              ) : (
                <div />
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ height: '36px', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn"
                  style={{
                    height: '36px',
                    fontSize: '0.8rem',
                    padding: '0 16px',
                    fontWeight: 700,
                    background: '#d97706',
                    color: '#ffffff',
                    border: '1px solid #b45309',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Wrench size={13} />
                      <span>{isUnderMaintenance ? 'Update Reason' : 'Set to Maintenance'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
