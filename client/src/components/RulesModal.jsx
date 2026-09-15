import React from 'react';
import { X, ShieldCheck, Phone, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RulesModal({ isOpen, onClose }) {
  const { pg } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                PG Rules & Information
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                {pg?.name || 'Resident Policy'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-light, #94a3b8)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Contact Details */}
          <div style={{
            background: 'var(--bg-hover, #f8fafc)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-light, #e2e8f0)',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main, #334155)', fontSize: '0.9rem', marginBottom: '8px' }}>
              <MapPin size={16} color="#4f46e5" />
              <span><strong>Address:</strong> {pg?.address || 'N/A'}</span>
            </div>
            {pg?.contactPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main, #334155)', fontSize: '0.9rem' }}>
                <Phone size={16} color="#059669" />
                <span><strong>Helpline / Caretaker:</strong> {pg.contactPhone}</span>
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '12px' }}>
            House Guidelines
          </h3>

          {pg?.rules && pg.rules.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pg.rules.map((rule, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.9rem', color: 'var(--text-main, #334155)' }}>
                  <CheckCircle size={16} color="#10b981" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>No specific rules defined yet.</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
