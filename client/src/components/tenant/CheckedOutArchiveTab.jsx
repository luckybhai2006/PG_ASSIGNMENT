import React from 'react';
import { Search, History, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react';

export default function CheckedOutArchiveTab({
  vacatedTenants,
  searchTerm,
  onSearchChange,
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
          Historical record of checked-out students. Active portal access is securely revoked.
        </span>

        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-light, #94a3b8)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search past residents..."
            style={{ padding: '6px 10px 6px 30px', fontSize: '0.78rem' }}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {vacatedTenants.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 16px',
            background: 'var(--bg-hover, #f8fafc)',
            borderRadius: '12px',
            border: '1px dashed var(--border-light, #cbd5e1)',
          }}
        >
          <History size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)', fontSize: '0.92rem' }}>
            No Checked Out Students Found
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
            When you checkout students from the Enrolled tab, their records and history will be safely archived here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
          {vacatedTenants.map((t) => (
            <div
              key={t._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-light, #e2e8f0)',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{t.name}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      background: '#f1f5f9',
                      color: '#475569',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    Checked Out
                  </span>
                  {t.lastRoomNumber && t.lastRoomNumber !== 'None' && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        background: '#f8fafc',
                        color: '#0369a1',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                      }}
                    >
                      Former Room {t.lastRoomNumber}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', display: 'flex', gap: '14px', marginTop: '3px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> {t.email}
                  </span>
                  {t.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> {t.phone}
                    </span>
                  )}
                  {t.vacatedAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                      <Calendar size={12} /> Checked out: {new Date(t.vacatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {t.vacatedReason && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                    Note: "{t.vacatedReason}"
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    background: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ShieldCheck size={12} color="#059669" /> Access Closed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
