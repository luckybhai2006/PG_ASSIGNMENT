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
  Building2,
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
    <div className="active-tenants-tab-container">
      {/* Top Header & Search Toolbar */}
      <div className="tenant-toolbar-row">
        <div className="tenant-toolbar-left">
          <span className="tenant-count-chip">
            <Users size={13} />
            <span>{tenants.length} Enrolled Resident{tenants.length === 1 ? '' : 's'}</span>
          </span>
          <span className="tenant-toolbar-subtitle">
            Currently residing & approved in PG
          </span>
        </div>

        <div className="tenant-toolbar-right">
          <div className="tenant-search-box">
            <Search size={14} className="tenant-search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search name, room, email..."
              value={search}
              onChange={onSearchChange}
            />
          </div>

          {canManageTenants && (
            <button
              type="button"
              onClick={onAddTenantClick}
              className="btn btn-primary tenant-quick-add-btn"
              title="Add a new student directly"
            >
              <UserPlus size={14} />
              <span>Add Student</span>
            </button>
          )}
        </div>
      </div>

      {tenants.length === 0 ? (
        <div className="tenant-empty-state">
          <Users size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
          <div className="tenant-empty-title">
            No Enrolled Students Found
          </div>
          <p className="tenant-empty-desc">
            {search
              ? 'No residents match your search query.'
              : 'Share your PG passcode with students or add them directly using the Direct Enroll tab.'}
          </p>
          {canManageTenants && (
            <button
              type="button"
              onClick={onAddTenantClick}
              className="btn btn-primary"
              style={{ height: '34px', fontSize: '0.8rem', padding: '0 14px' }}
            >
              <UserPlus size={14} /> Add Student Manually
            </button>
          )}
        </div>
      ) : (
        <div className="tenant-cards-list">
          {tenants.map((t) => {
            const initialLetter = (t.name || 'S').charAt(0).toUpperCase();
            const isEditingRoom = editingRoomTenantId === t._id;

            return (
              <div key={t._id} className="tenant-student-card">
                {/* Main Card Upper / Desktop Flex Layout */}
                <div className="tenant-card-main-layout">
                  {/* Left: Avatar + Details */}
                  <div className="tenant-identity-wrap">
                    <div className="tenant-avatar" aria-hidden="true">
                      {initialLetter}
                    </div>

                    <div className="tenant-student-info">
                      <div className="tenant-name-row">
                        <span className="tenant-student-name">{t.name}</span>
                        <span className="tenant-active-badge">Active</span>
                        {t.gender && (
                          <span className={`tenant-gender-badge ${t.gender}`}>
                            {t.gender === 'female' ? 'Female' : 'Male'}
                          </span>
                        )}
                      </div>

                      <div className="tenant-contact-row">
                        <span className="tenant-contact-item">
                          <Mail size={12} />
                          <span>{t.email}</span>
                        </span>
                        {t.phone && (
                          <span className="tenant-contact-item">
                            <Phone size={12} />
                            <span>{t.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Room Tag & Primary Desktop Actions */}
                  <div className="tenant-desktop-right-actions">
                    {/* Room Badge / Edit Trigger */}
                    {!isEditingRoom && (
                      canManageTenants ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoomTenantId(t._id);
                            setSelectedNewRoom(t.roomNumber || '');
                          }}
                          className="tenant-room-badge-btn"
                          title="Click to change student's room"
                        >
                          <Bed size={13} color="#0284c7" />
                          <span>Room {t.roomNumber || 'Unassigned'}</span>
                          <Edit2 size={11} color="#0369a1" style={{ opacity: 0.7 }} />
                        </button>
                      ) : (
                        <span className="tenant-room-badge-static">
                          <Bed size={13} /> Room {t.roomNumber || 'Unassigned'}
                        </span>
                      )
                    )}

                    {/* Checkout Button */}
                    {canManageTenants && (
                      <button
                        type="button"
                        className="tenant-checkout-btn"
                        onClick={() => onCheckoutClick(t)}
                        title="Checkout resident, free their room bed, and archive record"
                      >
                        <LogOut size={13} />
                        <span>Checkout</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Room Change Row when Editing */}
                {isEditingRoom && (
                  <div className="tenant-room-edit-row">
                    <div className="tenant-room-edit-label">
                      <Bed size={13} color="#0284c7" />
                      <span>Change Room:</span>
                    </div>
                    <div className="tenant-room-edit-controls">
                      <select
                        className="form-select tenant-room-edit-select"
                        value={selectedNewRoom}
                        onChange={(e) => setSelectedNewRoom(e.target.value)}
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
                              Room {r.roomNumber} {r.block ? `(${r.block})` : ''} — {isMaint ? `[MAINTENANCE] (${r.maintenanceReason || 'Cleaning'})` : `${r.available}/${r.capacity} free ${isCurrent ? '(Current)' : (r.isFull ? '(FULL)' : '')}`}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        disabled={changingRoomLoading || !selectedNewRoom || selectedNewRoom === t.roomNumber}
                        onClick={() => onChangeRoom(t._id, selectedNewRoom)}
                        className="btn btn-primary tenant-room-save-btn"
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
                        className="btn btn-secondary tenant-room-cancel-btn"
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Branch Transfer Row for Multi-Branch Facilities */}
                {isOwner && myPGs && myPGs.length > 1 && (
                  <div className="tenant-card-branch-row">
                    <span className="tenant-branch-row-label">
                      <Building2 size={12} color="var(--primary, #4f46e5)" />
                      <span>Transfer Branch:</span>
                    </span>
                    <div className="tenant-branch-select-wrap">
                      <select
                        className="form-select tenant-branch-select"
                        defaultValue=""
                        disabled={transferringId === t._id}
                        onChange={(e) => {
                          if (e.target.value) {
                            onTransfer(t._id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="" disabled>Select target branch to transfer student...</option>
                        {myPGs
                          .filter((branch) => branch._id !== pg?._id)
                          .map((branch) => (
                            <option key={branch._id} value={branch._id}>
                              {branch.name} ({branch.pgType === 'girls' ? 'Girls' : 'Boys'})
                            </option>
                          ))}
                      </select>
                      {transferringId === t._id && <Loader2 size={13} className="animate-spin" color="#4f46e5" />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
