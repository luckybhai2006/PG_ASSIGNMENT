import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

export default function StatusUpdateModal({ isOpen, onClose, complaint, onUpdated }) {
  const [status, setStatus] = useState('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status || 'In Progress');
      setResolutionNotes(complaint.resolutionNotes || '');
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.updateComplaintStatus(complaint._id, {
        status,
        resolutionNotes,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update complaint status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
            Update Resolution Status
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-light, #94a3b8)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '0.88rem',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <div style={{
            background: 'var(--bg-hover, #f8fafc)',
            padding: '14px',
            borderRadius: '10px',
            marginBottom: '18px',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
              COMPLAINT #{complaint._id.slice(-6).toUpperCase()} • ROOM {complaint.roomNumber}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginTop: '4px' }}>
              {complaint.title}
            </div>
          </div>

          <div className="form-group">
            <label>Select Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Resolution Remarks / Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Technician dispatched, heating element replaced, problem verified fixed."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-success">
              <CheckCircle2 size={16} />
              {loading ? 'Updating...' : 'Save & Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
