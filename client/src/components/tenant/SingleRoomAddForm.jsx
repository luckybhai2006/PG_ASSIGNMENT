import React from 'react';
import { X } from 'lucide-react';

export default function SingleRoomAddForm({
  onClose,
  onSubmit,
  singleRoomNumber,
  setSingleRoomNumber,
  singleBlock,
  setSingleBlock,
  singleWing,
  setSingleWing,
  singleFloor,
  setSingleFloor,
  singleCapacity,
  setSingleCapacity,
  addingRoom,
}) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: 'var(--bg-hover, #f8fafc)',
        border: '1.5px solid var(--border-light, #e2e8f0)',
        borderRadius: '12px',
        padding: '16px 18px',
        marginBottom: '18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Add Single Custom Room</h4>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light, #94a3b8)' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Room Number *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 101 or B-205"
            value={singleRoomNumber}
            onChange={(e) => setSingleRoomNumber(e.target.value.toUpperCase())}
            required
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Block (Opt.)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Main, A"
            value={singleBlock}
            onChange={(e) => setSingleBlock(e.target.value.toUpperCase())}
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Wing (Opt.)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. East, Wing-B"
            value={singleWing}
            onChange={(e) => setSingleWing(e.target.value.toUpperCase())}
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Floor Number</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={singleFloor}
            onChange={(e) => setSingleFloor(parseInt(e.target.value, 10) || 1)}
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Beds (Capacity) *</label>
          <input
            type="number"
            min="1"
            max="10"
            className="form-input"
            value={singleCapacity}
            onChange={(e) => setSingleCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            required
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
          style={{ height: '34px', fontSize: '0.78rem' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={addingRoom}
          className="btn btn-primary"
          style={{ height: '34px', fontSize: '0.8rem', padding: '0 16px' }}
        >
          {addingRoom ? 'Adding...' : '+ Add Room'}
        </button>
      </div>
    </form>
  );
}
