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

  return (
    <div
      style={{
        background: room.status === 'maintenance' ? '#fffdf7' : 'var(--bg-card, #ffffff)',
        border: room.status === 'maintenance'
          ? '1.5px solid #fcd34d'
          : room.isFull
          ? '1.5px solid #fed7aa'
          : '1.5px solid var(--border-light, #e2e8f0)',
        borderRadius: '12px',
        padding: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {/* Top: Room Number & Block */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
            Room {room.roomNumber}
          </span>
          {room.status === 'maintenance' ? (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '6px',
                background: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Wrench size={10} /> Maintenance
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                background: room.isFull ? '#fee2e2' : '#ecfdf5',
                color: room.isFull ? '#dc2626' : '#059669',
                border: room.isFull ? '1px solid #fca5a5' : '1px solid #a7f3d0',
              }}
            >
              {room.isFull ? '🔴 Full' : `🟢 ${room.available} Free`}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
          {room.block && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', background: 'var(--bg-hover, #f1f5f9)', padding: '1px 6px', borderRadius: '4px' }}>
              {formatBlockName ? formatBlockName(room.block) : room.block}
            </span>
          )}
          {room.wing && (
            <span style={{ fontSize: '0.7rem', color: '#0369a1', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
              {formatWingName ? formatWingName(room.wing) : room.wing}
            </span>
          )}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', background: 'var(--bg-hover, #f1f5f9)', padding: '1px 6px', borderRadius: '4px' }}>
            Floor {room.floor}
          </span>
        </div>

        {room.status === 'maintenance' && (
          <div style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: '#fffbeb',
            border: '1px dashed #fcd34d',
            borderRadius: '6px',
            fontSize: '0.72rem',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
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
            <span style={{ fontWeight: 700 }}>
              {room.occupied} / {room.capacity} Beds
            </span>
          </div>
          <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (room.occupied / room.capacity) * 100)}%`,
                background: room.status === 'maintenance' ? '#f59e0b' : room.isFull ? '#ea580c' : 'var(--primary, #4f46e5)',
                borderRadius: '3px',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Current Residents list */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
            Residents:
          </div>
          {hasResidents ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {room.residents.map((r, idx) => (
                <div
                  key={r.id || idx}
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: 'var(--text-main, #0f172a)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'var(--bg-hover, #f8fafc)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary, #4f46e5)' }} />
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
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-light, #e2e8f0)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div>
            {(isOwner || canManageMaintenance) && (
              room.status === 'maintenance' ? (
                <button
                  type="button"
                  onClick={() => onToggleMaintenance(room, 'available')}
                  disabled={maintenanceLoading}
                  className="btn"
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    height: '26px',
                    fontWeight: 700,
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
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
                  className="btn"
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    height: '26px',
                    fontWeight: 700,
                    background: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a',
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
