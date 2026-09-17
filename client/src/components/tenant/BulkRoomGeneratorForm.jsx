import React from 'react';
import { Sparkles, X, Info, Loader2 } from 'lucide-react';

export default function BulkRoomGeneratorForm({
  onClose,
  onSubmit,
  genBlock,
  setGenBlock,
  genWing,
  setGenWing,
  genFloors,
  setGenFloors,
  genRoomsPerFloor,
  setGenRoomsPerFloor,
  genCapacity,
  setGenCapacity,
  genStartFloor,
  setGenStartFloor,
  previewTotalRooms,
  previewTotalBeds,
  generatingRooms,
}) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: 'var(--bg-hover, #f8fafc)',
        border: '1.5px solid var(--primary, #4f46e5)',
        borderRadius: '12px',
        padding: '16px 18px',
        marginBottom: '18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="var(--primary, #4f46e5)" />
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
            Bulk Room Sequence Generator
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light, #94a3b8)' }}
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: 0, marginBottom: '14px' }}>
        Quickly configure entire floors in seconds. Existing room numbers won't be duplicated.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Block (Opt.)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. A, Tower-1"
            value={genBlock}
            onChange={(e) => setGenBlock(e.target.value.toUpperCase())}
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Wing (Opt.)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. East, Wing-A"
            value={genWing}
            onChange={(e) => setGenWing(e.target.value.toUpperCase())}
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Floors Count *</label>
          <input
            type="number"
            min="1"
            max="20"
            className="form-input"
            value={genFloors}
            onChange={(e) => setGenFloors(Math.max(1, parseInt(e.target.value, 10) || 1))}
            required
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Rooms per Floor *</label>
          <input
            type="number"
            min="1"
            max="50"
            className="form-input"
            value={genRoomsPerFloor}
            onChange={(e) => setGenRoomsPerFloor(Math.max(1, parseInt(e.target.value, 10) || 1))}
            required
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Beds per Room *</label>
          <input
            type="number"
            min="1"
            max="10"
            className="form-input"
            value={genCapacity}
            onChange={(e) => setGenCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            required
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Start Floor No.</label>
          <input
            type="number"
            min="0"
            max="10"
            className="form-input"
            value={genStartFloor}
            onChange={(e) => setGenStartFloor(parseInt(e.target.value, 10) || 1)}
            required
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* Dynamic Preview Info */}
      <div
        style={{
          marginTop: '12px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(79, 70, 229, 0.08)',
          border: '1px solid rgba(79, 70, 229, 0.2)',
          fontSize: '0.76rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-main, #0f172a)',
        }}
      >
        <Info size={14} color="var(--primary, #4f46e5)" style={{ flexShrink: 0 }} />
        <span>
          Will generate <strong>{previewTotalRooms} rooms</strong> with <strong>{previewTotalBeds} total bed capacity</strong>{' '}
          (e.g.{' '}
          <code>
            {genBlock ? `${genBlock}-` : ''}{genStartFloor}01
          </code>{' '}
          to{' '}
          <code>
            {genBlock ? `${genBlock}-` : ''}
            {genStartFloor + genFloors - 1}
            {genRoomsPerFloor < 10 ? `0${genRoomsPerFloor}` : genRoomsPerFloor}
          </code>
          ).
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
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
          disabled={generatingRooms}
          className="btn btn-primary"
          style={{ height: '34px', fontSize: '0.8rem', padding: '0 16px' }}
        >
          {generatingRooms ? (
            <>
              <Loader2 size={13} className="spin" />
              <span>Generating...</span>
            </>
          ) : (
            <span>⚡ Generate All {previewTotalRooms} Rooms</span>
          )}
        </button>
      </div>
    </form>
  );
}
