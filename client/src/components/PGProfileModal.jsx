import React, { useState, useEffect } from 'react';
import { X, Save, Building, Users, KeyRound, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PGProfileModal({ isOpen, onClose }) {
  const { pg, updatePGState } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [pgType, setPgType] = useState('boys');
  const [curfewTime, setCurfewTime] = useState('');
  const [wardenPhone, setWardenPhone] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegenerateCode = async () => {
    if (!window.confirm("Are you sure you want to regenerate the Secret Join Passcode? The old passcode will stop working for new student registrations immediately.")) {
      return;
    }
    setRegenerating(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.regenerateJoinCode();
      setJoinCode(res.joinCode);
      if (updatePGState) {
        updatePGState({ joinCode: res.joinCode });
      }
      setSuccess(res.message || `New passcode generated: ${res.joinCode}`);
    } catch (err) {
      setError(err.message || 'Failed to regenerate join passcode');
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (pg) {
      setName(pg.name || '');
      setAddress(pg.address || '');
      setContactPhone(pg.contactPhone || '');
      setPgType(pg.pgType || 'boys');
      setCurfewTime(pg.curfewTime || '');
      setWardenPhone(pg.wardenPhone || '');
      setRulesText(pg.rules ? pg.rules.join('\n') : '');
      setJoinCode(pg.joinCode || 'GH-2024');
    }
  }, [pg]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const rules = rulesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await api.updatePGProfile({
        name,
        address,
        contactPhone,
        pgType,
        curfewTime,
        wardenPhone,
        rules,
        joinCode: joinCode.trim().toUpperCase(),
      });

      updatePGState(res.pg);
      setSuccess('PG Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to update PG profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="tenant-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Building size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                PG Account Profile
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                Exclusive Owner Configuration
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-light, #94a3b8)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tenant-modal-body">
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

          {/* Active Enrolled Students Overview */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-hover, #f8fafc)',
            border: '1px solid var(--border-light, #e2e8f0)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} color="#0891b2" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                Active Enrolled Students:
              </span>
            </div>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#0891b2',
              background: 'rgba(6, 182, 212, 0.12)',
              padding: '2px 10px',
              borderRadius: '12px'
            }}>
              {pg?.tenantCount ?? 0} Students
            </span>
          </div>

          <div className="form-group">
            <label>PG Property Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px' }}>PG Facility Category *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'boys', label: '👦 Boys PG', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
                { id: 'girls', label: '👧 Girls PG', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)' },
                { id: 'co-ed', label: '👥 Co-Ed PG', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPgType(t.id)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: pgType === t.id ? `2px solid ${t.color}` : '1.5px solid var(--border-light, #e2e8f0)',
                    background: pgType === t.id ? t.bg : 'var(--bg-card, #ffffff)',
                    color: pgType === t.id ? t.color : 'var(--text-muted, #64748b)',
                    fontWeight: pgType === t.id ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', display: 'block' }}>
              Students of the corresponding gender will be permitted to register.
            </span>
          </div>

          <div className="form-group">
            <label>Physical Address *</label>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid-2-col" style={{ gap: '12px' }}>
            <div className="form-group">
              <label>Curfew / Gate Closing Time</label>
              <input
                type="text"
                className="form-input"
                value={curfewTime}
                onChange={(e) => setCurfewTime(e.target.value)}
                placeholder="e.g. 09:30 PM"
              />
            </div>
            <div className="form-group">
              <label>Warden / Guard Phone</label>
              <input
                type="text"
                className="form-input"
                value={wardenPhone}
                onChange={(e) => setWardenPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>Secret Student Enrollment Code *</label>
              <button
                type="button"
                onClick={handleRegenerateCode}
                disabled={regenerating}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #4f46e5)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={11} style={{ animation: regenerating ? 'spin 1s linear infinite' : 'none' }} />
                <span>{regenerating ? 'Regenerating...' : '↻ Regenerate Code'}</span>
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <KeyRound size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-light, #94a3b8)' }} />
              <input
                type="text"
                className="form-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. GH-2024"
                required
                style={{ paddingLeft: '38px', fontWeight: 800, letterSpacing: '0.08em' }}
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', display: 'block' }}>
              Share this secret code with your residents. Only students who enter this exact passcode can enroll into your PG.
            </span>
          </div>

          <div className="form-group">
            <label>PG Support / Caretaker Phone</label>
            <input
              type="text"
              className="form-input"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>PG Guidelines & Rules (One rule per line)</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              placeholder="e.g. Gate closes at 10:30 PM..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
