import React from 'react';
import { Wrench, Edit2, Trash2 } from 'lucide-react';

export default function RoomCard({
  room,
  formatBlockName,
  formatWingName,
  isOwner,
  canManageMaintenance = true,
  canManageRooms = true,
  maintenanceLoading,
  onToggleMaintenance,
  onEdit,
  onDelete,
}) {
  const hasResidents = room.residents && room.residents.length > 0;
  const isMaintenance = room.status === 'maintenance';

  return (
    <div className={`hub-room-card ${isMaintenance ? 'is-maintenance' : ''} ${room.isFull ? 'is-full' : ''}`}>
      {/* Top: Room Number & Block */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
            Room {room.roomNumber}
          </span>
          {isMaintenance ? (
            <span className="hub-room-badge maintenance">
              <Wrench size={10} /> Maintenance
            </span>
          ) : (
            <span className={`hub-room-badge ${room.isFull ? 'full' : 'available'}`}>
              {room.isFull ? 'Full' : `${room.available} Free`}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
          {room.block && (
            <span className="hub-room-meta-tag">
              {formatBlockName ? formatBlockName(room.block) : room.block}
            </span>
          )}
          {room.wing && (
            <span className="hub-room-meta-wing">
              {formatWingName ? formatWingName(room.wing) : room.wing}
            </span>
          )}
          <span className="hub-room-meta-tag">
            Floor {room.floor}
          </span>
        </div>

        {isMaintenance && (
          <div className="hub-room-maintenance-alert">
            <Wrench size={11} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {room.maintenanceReason || 'Cleaning / Repair in progress'}
            </span>
          </div>
        )}

        {/* Bed occupancy bar & icons */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
            <span>Bed Occupancy</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              {room.occupied} / {room.capacity} Beds
            </span>
          </div>
          <div className="hub-room-progress-track">
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (room.occupied / room.capacity) * 100)}%`,
                background: isMaintenance ? '#f59e0b' : room.isFull ? 'var(--danger, #ef4444)' : 'var(--primary, #4f46e5)',
                borderRadius: '3px',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Current Residents list */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Residents
          </div>
          {hasResidents ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {room.residents.map((r, idx) => (
                <div key={r.id || idx} className="hub-room-resident-item">
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary, #4f46e5)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-light, #94a3b8)', fontStyle: 'italic', marginTop: '2px' }}>
              Empty room (0 residents)
            </div>
          )}
        </div>
      </div>

      {/* Room Card Footer / Maintenance, Edit & Delete */}
      {(isOwner || canManageMaintenance || canManageRooms) && (
        <div className="hub-room-footer">
          <div>
            {(isOwner || canManageMaintenance) && (
              isMaintenance ? (
                <button
                  type="button"
                  onClick={() => onToggleMaintenance(room, 'available')}
                  disabled={maintenanceLoading}
                  className="btn hub-room-clean-btn"
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    height: '26px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  title="Mark room clean & available for students"
                >
                  <Wrench size={11} />
                  <span>Mark Clean & Ready</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleMaintenance(room, 'maintenance')}
                  disabled={maintenanceLoading}
                  className="btn hub-room-maint-btn"
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    height: '26px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  title="Lock room for cleaning or maintenance"
                >
                  <Wrench size={11} />
                  <span>Maintenance</span>
                </button>
              )
            )}
          </div>

          {!room.isLegacy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {(isOwner || canManageRooms) && (
                <button
                  type="button"
                  onClick={() => onEdit(room)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    height: '26px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Edit room number, block code, floor or capacity"
                >
                  <Edit2 size={11} />
                  <span>Edit</span>
                </button>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={() => onDelete(room)}
                  disabled={hasResidents}
                  title={hasResidents ? 'Cannot delete room while residents are residing in it' : 'Delete this room'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: hasResidents ? 'var(--text-light, #cbd5e1)' : '#ef4444',
                    cursor: hasResidents ? 'not-allowed' : 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 4px',
                  }}
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
