import React from 'react';
import { Tag, X, Loader2 } from 'lucide-react';

export default function RenameBlockWingForm({
  onClose,
  onSubmit,
  availableBlocks,
  rooms,
  oldBlockName,
  setOldBlockName,
  newBlockName,
  setNewBlockName,
  newWingName,
  setNewWingName,
  oldPrefix,
  setOldPrefix,
  newPrefix,
  setNewPrefix,
  renamingBlockLoading,
  formatBlockName,
  formatWingName,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={16} color="var(--primary, #4f46e5)" />
          <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
            Rename Block, Wing & Room Prefixes
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

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', margin: '0 0 14px 0' }}>
        Yahan se aap apne PG ka Block name, Wing name ya room sequence (jaise <code>G-101</code> ko <code>T-101</code>) change kar sakte hain. Residing students ka data automatically update ho jayega.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {/* 1. Current Block */}
        <div className="form-group" style={{ margin: 0 }}>
          <label htmlFor="select-current-block-name" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
            1. Select Current Block Name *
          </label>
          {availableBlocks.length > 0 ? (
            <select
              id="select-current-block-name"
              aria-label="Select Current Block Name"
              className="form-input"
              value={oldBlockName}
              onChange={(e) => {
                const chosenBlock = e.target.value;
                setOldBlockName(chosenBlock);
                if (chosenBlock) {
                  const matchingRoom = rooms.find((r) => r.block === chosenBlock && r.roomNumber.includes('-'));
                  if (matchingRoom) {
                    const parts = matchingRoom.roomNumber.split('-');
                    setOldPrefix(`${parts[0]}-`);
                  }
                } else {
                  setOldPrefix('');
                }
              }}
              style={{ height: '36px', fontSize: '0.8rem', fontWeight: 700 }}
              required
            >
              <option value="">-- Choose Your Block --</option>
              {availableBlocks.map((b) => (
                <option key={b} value={b}>
                  {formatBlockName ? formatBlockName(b) : b} ({rooms.filter((r) => r.block === b).length} rooms)
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="form-input"
              placeholder="e.g. A or Tower-1"
              value={oldBlockName}
              onChange={(e) => setOldBlockName(e.target.value.toUpperCase())}
              style={{ height: '36px', fontSize: '0.8rem' }}
            />
          )}
          <span style={{ fontSize: '0.68rem', color: 'var(--text-light, #94a3b8)' }}>
            Jis block ko change karna hai wo chunein
          </span>
        </div>

        {/* 2. New Block */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>2. New Block Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. TOWER-1 ya ALPHA"
            value={newBlockName}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setNewBlockName(val);
              if (val && !newPrefix) {
                setNewPrefix(`${val.charAt(0)}-`);
              }
            }}
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-light, #94a3b8)' }}>
            Naya block name jo rakhna chahte hain
          </span>
        </div>

        {/* 3. Wing Name */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>3. Set / New Wing Name (Opt.)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. K, East Wing, ya North"
            value={newWingName}
            onChange={(e) => setNewWingName(e.target.value.toUpperCase())}
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-light, #94a3b8)' }}>
            Rooms ko kaunsa wing dena chahte hain
          </span>
        </div>

        {/* 4. Current Room Prefix */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>
            4. Current Room Prefix (Opt.)
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. G- ya B-"
            value={oldPrefix}
            onChange={(e) => setOldPrefix(e.target.value.toUpperCase())}
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-light, #94a3b8)' }}>
            Rooms ke aage ka purana code (jaise G-)
          </span>
        </div>

        {/* 5. New Room Prefix */}
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>
            5. New Room Prefix (Opt.)
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. T- ya ALPHA-"
            value={newPrefix}
            onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
            style={{ height: '36px', fontSize: '0.8rem' }}
          />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-light, #94a3b8)' }}>
            Rooms ke aage ka naya code (jaise T-)
          </span>
        </div>
      </div>

      {/* Live Visual Preview */}
      {oldBlockName && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(79, 70, 229, 0.08)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            fontSize: '0.78rem',
          }}
        >
          <div style={{ fontWeight: 800, color: 'var(--primary, #4f46e5)', marginBottom: '5px' }}>
            👀 Live Preview (Dekhein kya change hoga):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: 'var(--text-main, #0f172a)' }}>
            <div>
              • <strong>Block:</strong> <code>{formatBlockName ? formatBlockName(oldBlockName) : oldBlockName}</code> ➡️{' '}
              <strong style={{ color: newBlockName ? '#059669' : 'inherit' }}>
                {newBlockName ? (formatBlockName ? formatBlockName(newBlockName) : newBlockName) : `${formatBlockName ? formatBlockName(oldBlockName) : oldBlockName} (No change)`}
              </strong>
            </div>
            {newWingName && (
              <div>
                • <strong>Wing:</strong> (None) ➡️{' '}
                <strong style={{ color: '#059669' }}>{formatWingName ? formatWingName(newWingName) : newWingName}</strong>
              </div>
            )}
            {oldPrefix && newPrefix && (
              <div>
                • <strong>Room Numbers:</strong> <code>{oldPrefix}101</code> ➡️{' '}
                <strong style={{ color: '#059669' }}>{newPrefix}101</strong> (Saare {rooms.filter((r) => r.block === oldBlockName).length} rooms aur students ke account update honge)
              </div>
            )}
          </div>
        </div>
      )}

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
          disabled={renamingBlockLoading || (!oldBlockName && !oldPrefix)}
          className="btn btn-primary"
          style={{ height: '34px', fontSize: '0.8rem', padding: '0 18px', fontWeight: 700 }}
        >
          {renamingBlockLoading ? (
            <>
              <Loader2 size={13} className="spin" />
              <span>Updating Rooms...</span>
            </>
          ) : (
            <span>Apply Changes</span>
          )}
        </button>
      </div>
    </form>
  );
}
