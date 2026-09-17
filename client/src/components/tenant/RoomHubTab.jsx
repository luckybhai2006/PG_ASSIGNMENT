import React from 'react';
import { Sparkles, Plus, Tag, Building2, Loader2 } from 'lucide-react';
import BulkRoomGeneratorForm from './BulkRoomGeneratorForm';
import SingleRoomAddForm from './SingleRoomAddForm';
import RenameBlockWingForm from './RenameBlockWingForm';
import RoomCard from './RoomCard';

export default function RoomHubTab({
  rooms,
  roomStats,
  loadingRooms,
  filteredRooms,
  isOwner,
  canManageMaintenance = true,
  canManageRooms = true,
  roomFilterAvailability,
  setRoomFilterAvailability,
  // Bulk generator props
  showBulkGenerator,
  setShowBulkGenerator,
  handleBulkGenerate,
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
  // Single room props
  showSingleAdd,
  setShowSingleAdd,
  handleAddSingleRoom,
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
  // Rename block/wing props
  showRenameBlock,
  setShowRenameBlock,
  handleRenameBlock,
  availableBlocks,
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
  // Room card actions
  maintenanceLoading,
  handleToggleRoomMaintenance,
  handleOpenEditRoom,
  handleDeleteRoom,
}) {
  return (
    <div>
      {/* Stat Chips Header */}
      <div
        className="tenant-stat-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-light, #e2e8f0)',
            padding: '12px 14px',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Rooms
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '2px' }}>
            {roomStats.totalRooms || rooms.length}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-light, #e2e8f0)',
            padding: '12px 14px',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Beds
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary, #4f46e5)', marginTop: '2px' }}>
            {roomStats.totalBeds}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-light, #e2e8f0)',
            padding: '12px 14px',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', fontWeight: 700, textTransform: 'uppercase' }}>
            Occupied Beds
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
            {roomStats.occupiedBeds}
          </div>
        </div>

        <div
          style={{
            border: '1px solid #a7f3d0',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
            Available Beds
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
            {roomStats.availableBeds}
          </div>
        </div>

        <div
          style={{
            border: '1px solid #fed7aa',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#c2410c', fontWeight: 700, textTransform: 'uppercase' }}>
            Under Maintenance
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
            {roomStats.maintenanceRooms ?? rooms.filter((r) => r.status === 'maintenance').length}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="tenant-action-toolbar">
        <div className="tenant-action-buttons">
          {canManageRooms && (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowBulkGenerator(!showBulkGenerator);
                  setShowSingleAdd(false);
                  setShowRenameBlock(false);
                }}
                className="btn"
                style={{
                  height: '34px',
                  padding: '0 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: showBulkGenerator ? '#4338ca' : 'var(--primary, #4f46e5)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} />
                <span>⚡ 10-Sec Bulk Generator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSingleAdd(!showSingleAdd);
                  setShowBulkGenerator(false);
                  setShowRenameBlock(false);
                }}
                className="btn btn-secondary"
                style={{ height: '34px', padding: '0 12px', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <Plus size={14} />
                <span>+ Single Room</span>
              </button>
            </>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setShowRenameBlock(!showRenameBlock);
                setShowBulkGenerator(false);
                setShowSingleAdd(false);
              }}
              className="btn btn-secondary"
              style={{
                height: '34px',
                padding: '0 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: showRenameBlock ? 'rgba(79, 70, 229, 0.12)' : undefined,
                borderColor: showRenameBlock ? 'var(--primary, #4f46e5)' : undefined,
                color: showRenameBlock ? 'var(--primary, #4f46e5)' : undefined,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Tag size={14} />
              <span>✏️ Rename Block / Wing</span>
            </button>
          )}
        </div>

        {/* Availability Filter Buttons */}
        <div className="tenant-avail-filter">
          {[
            { key: 'ALL', label: `All (${rooms.length})` },
            { key: 'AVAILABLE', label: `🟢 Available (${rooms.filter((r) => !r.isFull && r.status !== 'maintenance').length})` },
            { key: 'MAINTENANCE', label: `🟡 Maintenance (${rooms.filter((r) => r.status === 'maintenance').length})` },
            { key: 'FULL', label: `🔴 Full (${rooms.filter((r) => r.isFull && r.status !== 'maintenance').length})` },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setRoomFilterAvailability(filter.key)}
              style={{
                background: roomFilterAvailability === filter.key ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: roomFilterAvailability === filter.key ? 'var(--text-main, #0f172a)' : 'var(--text-muted, #64748b)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: roomFilterAvailability === filter.key ? 800 : 600,
                cursor: 'pointer',
                boxShadow: roomFilterAvailability === filter.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 10-Second Bulk Generator Card */}
      {showBulkGenerator && (
        <BulkRoomGeneratorForm
          onClose={() => setShowBulkGenerator(false)}
          onSubmit={handleBulkGenerate}
          genBlock={genBlock}
          setGenBlock={setGenBlock}
          genWing={genWing}
          setGenWing={setGenWing}
          genFloors={genFloors}
          setGenFloors={setGenFloors}
          genRoomsPerFloor={genRoomsPerFloor}
          setGenRoomsPerFloor={setGenRoomsPerFloor}
          genCapacity={genCapacity}
          setGenCapacity={setGenCapacity}
          genStartFloor={genStartFloor}
          setGenStartFloor={setGenStartFloor}
          previewTotalRooms={previewTotalRooms}
          previewTotalBeds={previewTotalBeds}
          generatingRooms={generatingRooms}
        />
      )}

      {/* Add Single Room Form */}
      {showSingleAdd && (
        <SingleRoomAddForm
          onClose={() => setShowSingleAdd(false)}
          onSubmit={handleAddSingleRoom}
          singleRoomNumber={singleRoomNumber}
          setSingleRoomNumber={setSingleRoomNumber}
          singleBlock={singleBlock}
          setSingleBlock={setSingleBlock}
          singleWing={singleWing}
          setSingleWing={setSingleWing}
          singleFloor={singleFloor}
          setSingleFloor={setSingleFloor}
          singleCapacity={singleCapacity}
          setSingleCapacity={setSingleCapacity}
          addingRoom={addingRoom}
        />
      )}

      {/* Rename Block & Wing Form */}
      {showRenameBlock && isOwner && (
        <RenameBlockWingForm
          onClose={() => setShowRenameBlock(false)}
          onSubmit={handleRenameBlock}
          availableBlocks={availableBlocks}
          rooms={rooms}
          oldBlockName={oldBlockName}
          setOldBlockName={setOldBlockName}
          newBlockName={newBlockName}
          setNewBlockName={setNewBlockName}
          newWingName={newWingName}
          setNewWingName={setNewWingName}
          oldPrefix={oldPrefix}
          setOldPrefix={setOldPrefix}
          newPrefix={newPrefix}
          setNewPrefix={setNewPrefix}
          renamingBlockLoading={renamingBlockLoading}
          formatBlockName={formatBlockName}
          formatWingName={formatWingName}
        />
      )}

      {/* Rooms List / Grid */}
      {loadingRooms ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted, #64748b)' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
          <div>Loading PG rooms and occupancy...</div>
        </div>
      ) : rooms.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: 'var(--bg-hover, #f8fafc)',
            borderRadius: '10px',
            border: '1px dashed var(--border-light, #e2e8f0)',
          }}
        >
          <Building2 size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 800, color: 'var(--text-main, #0f172a)', fontSize: '0.94rem' }}>
            No Rooms Added Yet
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 14px' }}>
            Configure your PG's rooms and beds so you can easily allocate incoming students upon approval.
          </p>
          <button
            type="button"
            onClick={() => setShowBulkGenerator(true)}
            className="btn btn-primary"
            style={{ height: '34px', fontSize: '0.8rem', padding: '0 14px' }}
          >
            <Sparkles size={14} /> ⚡ 10-Sec Bulk Generator
          </button>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: 'var(--bg-hover, #f8fafc)',
            borderRadius: '10px',
            border: '1px dashed var(--border-light, #e2e8f0)',
          }}
        >
          <Building2 size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 800, color: 'var(--text-main, #0f172a)', fontSize: '0.94rem' }}>
            No Rooms in "{roomFilterAvailability === 'MAINTENANCE' ? 'Maintenance' : roomFilterAvailability === 'AVAILABLE' ? 'Available' : 'Full'}" Filter
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', maxWidth: '420px', margin: '4px auto 14px' }}>
            {roomFilterAvailability === 'MAINTENANCE'
              ? 'Abhi aapka koi bhi room Under Maintenance nahi hai. Saare rooms clean aur admission ke liye ready hain.'
              : roomFilterAvailability === 'FULL'
              ? 'Abhi aapka koi bhi room 100% occupied (full) nahi hai.'
              : 'Is filter me koi room match nahi hua.'}
          </p>
          <button
            type="button"
            onClick={() => setRoomFilterAvailability('ALL')}
            className="btn btn-secondary"
            style={{ height: '34px', fontSize: '0.8rem', padding: '0 16px', fontWeight: 700 }}
          >
            View All {rooms.length} Rooms
          </button>
        </div>
      ) : (
        <div
          className="tenant-room-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '12px',
            maxHeight: '380px',
            overflowY: 'auto',
            paddingRight: '2px',
          }}
        >
          {filteredRooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              formatBlockName={formatBlockName}
              formatWingName={formatWingName}
              isOwner={isOwner}
              canManageMaintenance={canManageMaintenance}
              canManageRooms={canManageRooms}
              maintenanceLoading={maintenanceLoading}
              onToggleMaintenance={handleToggleRoomMaintenance}
              onEdit={handleOpenEditRoom}
              onDelete={handleDeleteRoom}
            />
          ))}
        </div>
      )}
    </div>
  );
}
