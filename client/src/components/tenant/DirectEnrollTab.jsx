import React from 'react';
import { UserPlus } from 'lucide-react';

export default function DirectEnrollTab({
  onSubmit,
  name,
  setName,
  roomNumber,
  setRoomNumber,
  email,
  setEmail,
  password,
  setPassword,
  phone,
  setPhone,
  rooms,
  loading,
}) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: 'var(--bg-hover, #f8fafc)',
        padding: '18px',
        borderRadius: '12px',
        border: '1px solid var(--border-light, #e2e8f0)',
      }}
    >
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
          Enroll Student Directly
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
          Students added directly by you are immediately approved and allocated to their room.
        </p>
      </div>

      <div className="grid-2-col" style={{ gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Full Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Rahul Deshmukh"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Room Number *</label>
          {rooms.length > 0 ? (
            <select
              className="form-select"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
            >
              <option value="">-- Select Room --</option>
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
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 101 or 204-B"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value.toUpperCase())}
              required
            />
          )}
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Email Address *</label>
          <input
            type="email"
            className="form-input"
            placeholder="tenant@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label>Initial Login Password *</label>
          <input
            type="password"
            className="form-input"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '10px', gridColumn: 'span 2' }}>
          <label>Contact Phone Number</label>
          <input
            type="text"
            className="form-input"
            placeholder="+91 91234 56789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '8px' }}
      >
        <UserPlus size={16} />
        {loading ? 'Adding Tenant...' : 'Add Tenant to PG'}
      </button>
    </form>
  );
}
