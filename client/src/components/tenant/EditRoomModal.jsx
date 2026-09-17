import React from 'react';
import { X, Edit2, Loader2 } from 'lucide-react';

export default function EditRoomModal({
  room,
  formData,
  onFormChange,
  loading,
  onSubmit,
  onClose,
}) {
  if (!room) return null;

  return (
    <div
      className="modal-backdrop center-dialog-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content center-dialog-modal"
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '14px',
          padding: '22px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--border-light, #e2e8f0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit2 size={18} color="var(--primary, #4f46e5)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              Edit Room {room.roomNumber}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light, #94a3b8)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Room Number *</label>
              <input
                type="text"
                className="form-input"
                value={formData.roomNumber}
                onChange={(e) => onFormChange({ ...formData, roomNumber: e.target.value.toUpperCase() })}
                required
                style={{ height: '36px', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Block (e.g. A, Main)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.block}
                  onChange={(e) => onFormChange({ ...formData, block: e.target.value.toUpperCase() })}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Wing (e.g. East, Wing-A)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.wing}
                  onChange={(e) => onFormChange({ ...formData, wing: e.target.value.toUpperCase() })}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Floor Number</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={formData.floor}
                  onChange={(e) => onFormChange({ ...formData, floor: parseInt(e.target.value, 10) || 0 })}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Capacity (Beds) *</label>
                <input
                  type="number"
                  min={room.occupied || 1}
                  max="10"
                  className="form-input"
                  value={formData.capacity}
                  onChange={(e) => onFormChange({ ...formData, capacity: Math.max(room.occupied || 1, parseInt(e.target.value, 10) || 1) })}
                  required
                  style={{ height: '36px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {room.occupied > 0 && (
              <div style={{ fontSize: '0.74rem', color: '#6366f1', background: 'rgba(99, 102, 241, 0.08)', padding: '8px 10px', borderRadius: '6px' }}>
                ℹ️ Notice: Changing this room number will automatically update all {room.occupied} student(s) currently allocated here.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ height: '36px', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ height: '36px', fontSize: '0.8rem', padding: '0 16px' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
