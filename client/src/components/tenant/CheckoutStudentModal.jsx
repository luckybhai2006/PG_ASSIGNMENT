import React from 'react';
import { X, LogOut, Loader2 } from 'lucide-react';

export default function CheckoutStudentModal({
  student,
  reason,
  onReasonChange,
  markMaintenance,
  onMarkMaintenanceChange,
  maintenanceReason,
  onMaintenanceReasonChange,
  loading,
  onConfirm,
  onClose,
}) {
  if (!student) return null;

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
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
              <LogOut size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
                Checkout Student
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)' }}>
                Residency exit & room release
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

        <form onSubmit={onConfirm}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Student Info Box */}
            <div style={{
              padding: '12px 14px',
              background: 'var(--bg-hover, #f8fafc)',
              borderRadius: '10px',
              border: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main, #0f172a)' }}>
                  {student.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)' }}>
                  {student.email}
                </div>
              </div>
              {student.roomNumber && (
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                }}>
                  Room {student.roomNumber}
                </span>
              )}
            </div>

            {/* Reason Input */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                Checkout Reason / Note *
              </label>
              <input
                type="text"
                className="form-input"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="e.g. Course completed, Relocated, Vacated"
                required
                style={{ height: '36px', fontSize: '0.8rem' }}
              />
            </div>

            {/* Mark Room for Maintenance Checkbox */}
            {student.roomNumber && student.roomNumber !== 'Unassigned' && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#92400e',
                  margin: 0,
                }}>
                  <input
                    type="checkbox"
                    checked={markMaintenance}
                    onChange={(e) => onMarkMaintenanceChange(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#d97706', cursor: 'pointer' }}
                  />
                  <span>Mark Room {student.roomNumber} for Cleaning / Maintenance</span>
                </label>

                {markMaintenance && (
                  <input
                    type="text"
                    className="form-input"
                    value={maintenanceReason}
                    onChange={(e) => onMaintenanceReasonChange(e.target.value)}
                    placeholder="Maintenance note (e.g. Deep cleaning & sanitization)"
                    style={{ height: '32px', fontSize: '0.76rem', background: '#ffffff' }}
                  />
                )}
                <span style={{ fontSize: '0.7rem', color: '#b45309' }}>
                  Locks this room from incoming admissions until you toggle it back to clean.
                </span>
              </div>
            )}

            {/* Privacy Warning */}
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted, #64748b)',
              background: 'var(--bg-hover, #f8fafc)',
              padding: '8px 10px',
              borderRadius: '6px',
              lineHeight: 1.5,
            }}>
              🔒 <strong>Privacy Guarantee:</strong> Student's active PG portal session, internal complaints access, and join passcodes will be immediately revoked.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
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
                  background: '#e11d48',
                  color: '#ffffff',
                  border: '1px solid #be123c',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="spin" />
                    <span>Checking out...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={13} />
                    <span>Confirm Checkout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
