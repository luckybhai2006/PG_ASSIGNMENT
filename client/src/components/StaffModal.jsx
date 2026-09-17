import React, { useState, useEffect } from 'react';
import { X, UserPlus, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function StaffModal({ isOpen, onClose }) {
  const [staffList, setStaffList] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await api.getStaff();
      setStaffList(res.staff || []);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.inviteEditor({ name, email, password, phone });
      setSuccess(res.message || 'Staff Editor invite dispatched successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      fetchStaff();
    } catch (err) {
      setError(err.message || 'Failed to invite editor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              Staff Management (Editors)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
              Add editors who can manage complaints and tenants on your behalf
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-light, #94a3b8)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
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

          {success && (
            <div style={{
              padding: '12px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              color: '#065f46',
              fontSize: '0.88rem',
              marginBottom: '16px',
            }}>
              {success}
            </div>
          )}

          {/* Invite Form */}
          <form onSubmit={handleInvite} style={{
            background: 'var(--bg-hover, #f8fafc)',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid var(--border-light, #e2e8f0)',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main, #0f172a)' }}>
              Invite New Staff Editor
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sunil Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="editor@pg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Temporary Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 98765..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px' }}
            >
              <UserPlus size={16} />
              {loading ? 'Sending Staff Invite...' : 'Send Staff Invite'}
            </button>

            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '10px', textAlign: 'center' }}>
              * When the editor logs in with these credentials, they will be required to accept the invite before viewing PG details.
            </p>
          </form>

          {/* Current Staff List */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main, #0f172a)' }}>
              Appointed Staff Team ({staffList.length})
            </h3>

            {staffList.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)', textAlign: 'center', padding: '16px' }}>
                No staff editors added yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                {staffList.map((st) => (
                  <div
                    key={st._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-card, #ffffff)',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      borderRadius: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main, #0f172a)' }}>
                        {st.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                        {st.email} {st.phone && `• ${st.phone}`}
                      </div>
                    </div>

                    <div>
                      {st.inviteStatus === 'accepted' ? (
                        <span className="badge badge-resolved" style={{ fontSize: '0.7rem' }}>
                          <CheckCircle size={11} /> Invite Accepted
                        </span>
                      ) : (
                        <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                          <Clock size={11} /> Invite Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
