import React from 'react';
import {
  Search,
  Users,
  UserPlus,
  Mail,
  Phone,
  Bed,
  Edit2,
  Check,
  X,
  Loader2,
  LogOut,
} from 'lucide-react';

export default function ActiveTenantsTab({
  tenants,
  search,
  onSearchChange,
  onAddTenantClick,
  rooms,
  editingRoomTenantId,
  setEditingRoomTenantId,
  selectedNewRoom,
  setSelectedNewRoom,
  changingRoomLoading,
  onChangeRoom,
  isOwner,
  myPGs,
  pg,
  transferringId,
  onTransfer,
  onCheckoutClick,
  canManageTenants = true,
}) {
  return (
    <div>
      <div className="tenant-search-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
          Showing approved residents currently residing in PG
        </span>

        <div className="tenant-search-box" style={{ position: 'relative', width: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-light, #94a3b8)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search name, room, email..."
            style={{ padding: '6px 10px 6px 30px', fontSize: '0.78rem' }}
            value={search}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {tenants.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: 'var(--bg-hover, #f8fafc)',
            borderRadius: '10px',
            border: '1px dashed var(--border-light, #e2e8f0)',
          }}
        >
          <Users size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)', fontSize: '0.92rem' }}>
            No Enrolled Students Found
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', maxWidth: '360px', margin: '4px auto 14px' }}>
            {search ? 'No residents match your search query.' : 'Share your PG passcode with students or add them directly using the Direct Enroll tab.'}
          </p>
          <button
            type="button"
            onClick={onAddTenantClick}
            className="btn btn-primary"
            style={{ height: '34px', fontSize: '0.8rem', padding: '0 14px' }}
          >
            <UserPlus size={14} /> Add Student Manually
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tenants.map((t) => (
            <div
              key={t._id}
              className="tenant-student-card"
            >
              <div className="tenant-student-info">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{t.name}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      background: '#ecfdf5',
                      color: '#059669',
                      borderRadius: '6px',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    Active Resident
                  </span>
                  {t.gender && (
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '6px',
                        background: t.gender === 'female' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: t.gender === 'female' ? '#db2777' : '#2563eb',
                        border: `1px solid ${t.gender === 'female' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                      }}
                    >
                      {t.gender === 'female' ? '🌸 Female' : '🔷 Male'}
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
                </div>
              </div>

              <div className="tenant-student-actions">
                {/* Interactive Room Badge / Quick Change Room for Staff & Owner */}
                {editingRoomTenantId === t._id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <select
                      className="form-select"
                      value={selectedNewRoom}
                      onChange={(e) => setSelectedNewRoom(e.target.value)}
                      style={{
                        height: '32px',
                        fontSize: '0.78rem',
                        padding: '2px 8px',
                        borderRadius: '7px',
                        fontWeight: 700,
                        borderColor: '#0284c7',
                        minWidth: '160px',
                      }}
                      disabled={changingRoomLoading}
                    >
                      <option value="">-- Select Room --</option>
                      {rooms.map((r) => {
                        const isCurrent = r.roomNumber.toUpperCase() === (t.roomNumber || '').toUpperCase();
                        const isMaint = r.status === 'maintenance';
                        return (
                          <option
                            key={r._id}
                            value={r.roomNumber}
                            disabled={!isCurrent && (r.isFull || isMaint)}
                          >
                            Room {r.roomNumber} {r.block ? `(${r.block})` : ''} — {isMaint ? `🟡 IN MAINTENANCE (${r.maintenanceReason || 'Cleaning'})` : `${r.available}/${r.capacity} free ${isCurrent ? '(Current)' : (r.isFull ? '(FULL)' : '')}`}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      type="button"
                      disabled={changingRoomLoading || !selectedNewRoom || selectedNewRoom === t.roomNumber}
                      onClick={() => onChangeRoom(t._id, selectedNewRoom)}
                      className="btn btn-primary"
                      style={{ height: '32px', padding: '0 10px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Save Room Change"
                    >
                      {changingRoomLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      <span>Save</span>
                    </button>

                    <button
                      type="button"
                      disabled={changingRoomLoading}
                      onClick={() => {
                        setEditingRoomTenantId(null);
                        setSelectedNewRoom('');
                      }}
                      className="btn btn-secondary"
                      style={{ height: '32px', padding: '0 8px', fontSize: '0.75rem' }}
                      title="Cancel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  canManageTenants ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRoomTenantId(t._id);
                        setSelectedNewRoom(t.roomNumber || '');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="Click to change student's room"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0284c7';
                        e.currentTarget.style.background = '#dbeafe';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#bae6fd';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)';
                      }}
                    >
                      <Bed size={13} color="#0284c7" />
                      <span>Room {t.roomNumber}</span>
                      <Edit2 size={11} color="#0369a1" style={{ opacity: 0.7 }} />
                    </button>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        background: '#f1f5f9',
                        color: '#475569',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                      }}
                    >
                      <Bed size={13} /> Room {t.roomNumber}
                    </span>
                  )
                )}

                {isOwner && myPGs && myPGs.length > 1 && (
                  <div className="tenant-branch-select-wrap" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <select
                      className="form-select"
                      style={{
                        fontSize: '0.74rem',
                        padding: '4px 8px',
                        height: '32px',
                        width: 'auto',
                        maxWidth: '100%',
                        borderRadius: '7px',
                        cursor: 'pointer',
                      }}
                      defaultValue=""
                      disabled={transferringId === t._id}
                      onChange={(e) => {
                        if (e.target.value) {
                          onTransfer(t._id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="" disabled>⇄ Move to Branch...</option>
                      {myPGs
                        .filter((branch) => branch._id !== pg?._id)
                        .map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            → {branch.name} ({branch.pgType === 'girls' ? 'Girls' : 'Boys'})
                          </option>
                        ))}
                    </select>
                    {transferringId === t._id && <Loader2 size={14} className="animate-spin" color="#4f46e5" />}
                  </div>
                )}

                {/* Checkout Student Button (requires canManageTenants) */}
                {canManageTenants && (
                  <button
                    type="button"
                    className="tenant-checkout-btn"
                    onClick={() => onCheckoutClick(t)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      background: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Checkout student, free their room bed, and optionally mark room for cleaning"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ffe4e6';
                      e.currentTarget.style.borderColor = '#fda4af';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff1f2';
                      e.currentTarget.style.borderColor = '#fecdd3';
                    }}
                  >
                    <LogOut size={13} />
                    <span>Checkout</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
