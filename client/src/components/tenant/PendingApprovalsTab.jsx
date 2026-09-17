import React from 'react';
import { Clock, ShieldCheck, Calendar, Mail, Phone, Ban, Check, Loader2, Building2 } from 'lucide-react';

export default function PendingApprovalsTab({
  pendingTenants,
  pg,
  actionLoadingId,
  selectedRooms,
  onSelectRoom,
  rooms,
  onApprove,
  onReject,
  onGoToRooms,
  canManageTenants = true,
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '8px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="#b45309" />
          <span style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
            Select an available room from your PG and approve the student. Their portal unlocks instantly.
          </span>
        </div>
        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309' }}>
          {pendingTenants.length} Pending
        </span>
      </div>

      {pendingTenants.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--bg-hover, #f8fafc)',
            borderRadius: '10px',
            border: '1px dashed var(--border-light, #e2e8f0)',
          }}
        >
          <ShieldCheck size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontWeight: 800, color: 'var(--text-main, #0f172a)', fontSize: '0.96rem' }}>
            All Clear! No Pending Requests
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', maxWidth: '420px', margin: '4px auto 0' }}>
            When a new student registers using your Secret Join Passcode (<code>{pg?.joinCode || 'GH-2024'}</code>), their request will appear here for you to allocate an available room and approve.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
          {pendingTenants.map((t) => {
            const isProcessing = actionLoadingId === t._id;
            const dateStr = t.createdAt
              ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Just now';
            const currentAllocated = selectedRooms[t._id] || (t.roomNumber && t.roomNumber !== 'Unassigned' ? t.roomNumber : '');

            return (
              <div
                key={t._id}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 2px 5px rgba(217, 119, 6, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Student Details Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main, #0f172a)' }}>
                        {t.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-light, #94a3b8)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Calendar size={11} /> {dateStr}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', display: 'flex', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {t.email}
                      </span>
                      {t.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {t.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={isProcessing || !canManageTenants}
                      onClick={() => onReject(t)}
                      className="btn"
                      style={{
                        height: '34px',
                        padding: '0 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: '#fff1f2',
                        color: '#e11d48',
                        border: '1px solid #fecdd3',
                        borderRadius: '8px',
                        cursor: (isProcessing || !canManageTenants) ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: !canManageTenants ? 0.6 : 1,
                      }}
                      title={!canManageTenants ? 'You do not have permission to reject students' : ''}
                    >
                      <Ban size={13} />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing || !canManageTenants}
                      onClick={() => onApprove(t)}
                      className="btn"
                      style={{
                        height: '34px',
                        padding: '0 14px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: '#059669',
                        color: '#ffffff',
                        border: '1px solid #047857',
                        borderRadius: '8px',
                        cursor: (isProcessing || !canManageTenants) ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)',
                        opacity: !canManageTenants ? 0.6 : 1,
                      }}
                      title={!canManageTenants ? 'You do not have permission to approve students' : ''}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={13} className="spin" />
                          <span>Allocating...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Allocate & Approve</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Room Allocation Dropdown Row */}
                <div
                  style={{
                    background: 'var(--bg-hover, #f8fafc)',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={15} color="var(--primary, #4f46e5)" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                      Allocate Room:
                    </span>
                  </div>

                  <div style={{ flex: '1 1 240px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {rooms.length > 0 ? (
                      <select
                        className="form-select"
                        value={currentAllocated}
                        onChange={(e) => onSelectRoom(t._id, e.target.value)}
                        style={{
                          height: '34px',
                          fontSize: '0.8rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}
                      >
                        <option value="">-- Choose Available Room --</option>
                        {rooms.map((r) => {
                          const isMaint = r.status === 'maintenance';
                          return (
                            <option key={r._id} value={r.roomNumber} disabled={r.isFull || isMaint}>
                              Room {r.roomNumber} {r.block ? `(${r.block})` : ''} — {isMaint ? `🟡 IN MAINTENANCE (${r.maintenanceReason || 'Cleaning'})` : `${r.available}/${r.capacity} beds free ${r.isFull ? '(FULL)' : ''}`}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Type room number (e.g. 101)"
                          value={currentAllocated}
                          onChange={(e) => onSelectRoom(t._id, e.target.value.toUpperCase())}
                          style={{ height: '34px', fontSize: '0.8rem' }}
                        />
                        <button
                          type="button"
                          onClick={onGoToRooms}
                          className="btn btn-secondary"
                          style={{ height: '34px', fontSize: '0.74rem', whiteSpace: 'nowrap', padding: '0 10px' }}
                        >
                          ⚡ Setup Rooms
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
