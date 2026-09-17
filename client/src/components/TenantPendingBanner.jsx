import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, XCircle, RefreshCw, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function TenantPendingBanner() {
  const { user, pg, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const isRejected = user?.inviteStatus === 'rejected';

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage('');
    try {
      if (refreshUser) await refreshUser();
      setMessage('Status updated from server.');
    } catch {
      setMessage('Failed to check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      background: 'var(--bg-main, #f8fafc)',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        padding: '36px 28px',
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)',
        border: '1px solid var(--border-light, #e2e8f0)',
        textAlign: 'center',
        boxSizing: 'border-box',
      }}>
        {/* PG Logo */}
        <img
          src="/logo.png"
          alt="PG Management"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            objectFit: 'cover',
            margin: '0 auto 16px',
            display: 'block',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
            border: '2px solid var(--border-light, #e2e8f0)',
            background: '#ffffff',
          }}
        />

        {/* Status Badge */}
        <div style={{ marginBottom: '14px' }}>
          {isRejected ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '20px',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
            }}>
              <XCircle size={14} /> Enrollment Rejected
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '20px',
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fcd34d',
            }}>
              <Clock size={14} /> Approval Pending
            </span>
          )}
        </div>

        <h2 style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          color: 'var(--text-main, #0f172a)',
          letterSpacing: '-0.02em',
        }}>
          {isRejected ? 'Enrollment Not Approved' : `Welcome, ${user?.name}!`}
        </h2>

        <p style={{
          color: 'var(--text-muted, #64748b)',
          fontSize: '0.88rem',
          lineHeight: 1.6,
          marginTop: '10px',
          marginBottom: '20px',
        }}>
          {isRejected ? (
            <>
              Your enrollment request for <strong>{pg?.name || 'this PG'}</strong> (Room {user?.roomNumber}) was not approved by the property owner. If you believe this is a mistake, please reach out to the PG warden or owner directly.
            </>
          ) : (
            <>
              Your registration for <strong>{pg?.name || 'this PG'}</strong> (Room <strong>{user?.roomNumber}</strong>) has been submitted with the join code. For building security, the <strong>PG Owner</strong> must verify and approve your enrollment before you can access the portal.
            </>
          )}
        </p>

        {/* Room Info Box */}
        <div style={{
          background: 'var(--bg-hover, #f8fafc)',
          border: '1px solid var(--border-light, #e2e8f0)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '22px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          textAlign: 'left',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>
              PG Facility
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
              {pg?.name || 'Assigned PG'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>
              Allotted Room
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
              Room {user?.roomNumber || 'Pending'}
            </div>
          </div>
        </div>

        {message && (
          <div style={{
            fontSize: '0.8rem',
            color: '#059669',
            marginBottom: '14px',
            fontWeight: 600,
          }}>
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {!isRejected && (
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checking}
              className="btn btn-primary"
              style={{
                height: '40px',
                padding: '0 18px',
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={15} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
              <span>{checking ? 'Checking status...' : 'Check Status'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className="btn btn-secondary"
            style={{
              height: '40px',
              padding: '0 18px',
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
