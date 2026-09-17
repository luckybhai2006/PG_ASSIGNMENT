import React from 'react';
import { X, ShieldCheck, Phone, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RulesModal({ isOpen, onClose }) {
  const { pg } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="tenant-modal-header">
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

        <div className="tenant-modal-body">
          {/* Contact & Security Details */}
          <div style={{
            background: 'var(--bg-hover, #f8fafc)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-light, #e2e8f0)',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main, #334155)', fontSize: '0.9rem' }}>
                <MapPin size={16} color="#4f46e5" />
                <span><strong>Address:</strong> {pg?.address || 'N/A'}</span>
              </div>
              {pg?.pgType && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: pg.pgType === 'girls' ? 'rgba(236, 72, 153, 0.12)' : (pg.pgType === 'co-ed' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)'),
                  color: pg.pgType === 'girls' ? '#db2777' : (pg.pgType === 'co-ed' ? '#7c3aed' : '#2563eb'),
                  border: `1px solid ${pg.pgType === 'girls' ? 'rgba(236, 72, 153, 0.3)' : (pg.pgType === 'co-ed' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)')}`,
                }}>
                  {pg.pgType === 'girls' ? '🌸 Girls PG' : (pg.pgType === 'co-ed' ? '👥 Co-Ed PG' : '🔷 Boys PG')}
                </span>
              )}
            </div>

            {pg?.curfewTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700 }}>⏰ Gate Closing / Curfew:</span>
                <span style={{ fontWeight: 800, background: '#fef3c7', padding: '1px 7px', borderRadius: '6px' }}>{pg.curfewTime}</span>
              </div>
            )}

            {pg?.wardenPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main, #334155)', fontSize: '0.88rem' }}>
                <Phone size={15} color="#ec4899" />
                <span><strong>Warden / Security:</strong> {pg.wardenPhone}</span>
              </div>
            )}

            {pg?.contactPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main, #334155)', fontSize: '0.88rem' }}>
                <Phone size={15} color="#059669" />
                <span><strong>Caretaker Helpline:</strong> {pg.contactPhone}</span>
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
