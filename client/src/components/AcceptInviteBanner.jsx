import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Sparkles, Building, AlertTriangle } from 'lucide-react';

export default function AcceptInviteBanner() {
  const { user, acceptInvite, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    try {
      await acceptInvite();
    } catch (err) {
      setError(err.message || 'Failed to accept staff invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '680px',
      margin: '60px auto',
      padding: '36px',
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 20px 40px -15px rgba(79, 70, 229, 0.15)',
      border: '1px solid #e0e7ff',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: '0 10px 20px rgba(79, 70, 229, 0.25)',
      }}>
        <ShieldCheck size={32} />
      </div>

      <span className="badge badge-role-editor" style={{ marginBottom: '12px' }}>
        Staff Invite Pending
      </span>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
        Welcome, {user?.name}!
      </h2>
      
      <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '12px', lineHeight: 1.6 }}>
        You have been appointed as a <strong>Staff Editor</strong>.
        To access the PG account details, view complaints, and manage operations, please accept the staff invitation.
      </p>

      {error && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          justifyContent: 'center',
        }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '28px' }}>
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ padding: '12px 24px' }}
        >
          Logout
        </button>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '12px 28px', fontSize: '1rem' }}
        >
          <Sparkles size={18} />
          {loading ? 'Accepting Invite...' : 'Accept Invite & Open Dashboard'}
        </button>
      </div>

      <div style={{
        marginTop: '28px',
        padding: '14px',
        background: '#f8fafc',
        borderRadius: '12px',
        fontSize: '0.85rem',
        color: '#64748b',
        border: '1px dashed #cbd5e1',
      }}>
        ℹ️ <strong>Staff Privileges:</strong> Manage tenants, file complaints on tenants' behalf, and update complaint status resolution.
      </div>
    </div>
  );
}
