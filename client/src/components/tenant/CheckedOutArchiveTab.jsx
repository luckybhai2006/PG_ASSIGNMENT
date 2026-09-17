import React from 'react';
import { Search, History, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react';

export default function CheckedOutArchiveTab({
  vacatedTenants,
  searchTerm,
  onSearchChange,
}) {
  return (
    <div>
      <div className="tenant-search-row">
        <span className="tenant-search-desc">
          Historical record of checked-out students. Active portal access is securely revoked.
        </span>

        <div className="tenant-search-box archive-search-box">
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-light, #94a3b8)' }} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {vacatedTenants.map((t) => (
            <div key={t._id} className="archive-tenant-card">
              {/* Card Header: Name, Badges & Access Status */}
              <div className="archive-card-header">
                <div className="archive-student-info">
                  <div className="archive-name-row">
                    <span className="archive-student-name">{t.name}</span>
                    <span className="archive-status-badge">
                      Checked Out
                    </span>
                    {t.lastRoomNumber && t.lastRoomNumber !== 'None' && (
                      <span className="archive-room-badge">
                        Former Room {t.lastRoomNumber}
                      </span>
                    )}
                  </div>

                  <div className="archive-contact-row">
                    <span className="archive-contact-item">
                      <Mail size={12} />
                      <span>{t.email}</span>
                    </span>
                    {t.phone && (
                      <span className="archive-contact-item">
                        <Phone size={12} />
                        <span>{t.phone}</span>
                      </span>
                    )}
                    {t.vacatedAt && (
                      <span className="archive-contact-item">
                        <Calendar size={12} />
                        <span>Checked out: {new Date(t.vacatedAt).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Security Access Revoked Badge */}
                <div className="archive-card-top-action">
                  <span className="archive-access-chip">
                    <ShieldCheck size={13} color="#059669" />
                    <span>Access Revoked</span>
                  </span>
                </div>
              </div>

              {/* Departure Reason Box (if provided) */}
              {t.vacatedReason && (
                <div className="archive-reason-box">
                  <span className="archive-reason-label">Departure Note:</span>
                  <span className="archive-reason-text">"{t.vacatedReason}"</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
