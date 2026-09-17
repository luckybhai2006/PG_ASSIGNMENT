import React from 'react';
import {
  Sparkles,
  Plus,
  Tag,
  Building2,
  Loader2,
  DoorOpen,
  Bed,
  Users,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
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
  oldWingName,
  setOldWingName,
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
      <div className="room-stat-grid">
        <div className="room-stat-chip total-rooms">
          <div className="room-stat-top">
            <span className="room-stat-label">Total Rooms</span>
            <div className="room-stat-icon-wrap">
              <DoorOpen size={13} />
            </div>
          </div>
          <div className="room-stat-val">
            {roomStats.totalRooms || rooms.length}
          </div>
        </div>

        <div className="room-stat-chip total-beds">
          <div className="room-stat-top">
            <span className="room-stat-label">Total Beds</span>
            <div className="room-stat-icon-wrap">
              <Bed size={13} />
            </div>
          </div>
          <div className="room-stat-val">
            {roomStats.totalBeds}
          </div>
        </div>

        <div className="room-stat-chip occupied-beds">
          <div className="room-stat-top">
            <span className="room-stat-label">Occupied Beds</span>
            <div className="room-stat-icon-wrap">
              <Users size={13} />
            </div>
          </div>
          <div className="room-stat-val">
            {roomStats.occupiedBeds}
          </div>
        </div>

        <div className="room-stat-chip available-beds">
          <div className="room-stat-top">
            <span className="room-stat-label">Available Beds</span>
            <div className="room-stat-icon-wrap">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div className="room-stat-val">
            {roomStats.availableBeds}
          </div>
        </div>

        <div className="room-stat-chip maintenance-rooms">
          <div className="room-stat-top">
            <span className="room-stat-label">In Maintenance</span>
            <div className="room-stat-icon-wrap">
              <Wrench size={13} />
            </div>
          </div>
          <div className="room-stat-val">
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
                  height: '32px',
                  padding: '0 9px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  background: showBulkGenerator ? '#4338ca' : 'var(--primary, #4f46e5)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Sparkles size={13} />
                <span>Bulk Generator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSingleAdd(!showSingleAdd);
                  setShowBulkGenerator(false);
                  setShowRenameBlock(false);
                }}
                className="btn btn-secondary"
                style={{
                  height: '32px',
                  padding: '0 9px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={13} />
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
                height: '32px',
                padding: '0 9px',
                fontSize: '0.76rem',
                fontWeight: 700,
                background: showRenameBlock ? 'rgba(79, 70, 229, 0.12)' : undefined,
                borderColor: showRenameBlock ? 'var(--primary, #4f46e5)' : undefined,
                color: showRenameBlock ? 'var(--primary, #4f46e5)' : undefined,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              <Tag size={13} />
              <span>Rename Block</span>
            </button>
          )}
        </div>

        {/* Availability Filter Buttons */}
        <div className="tenant-avail-filter">
          {[
            { key: 'ALL', label: `All (${rooms.length})` },
            { key: 'AVAILABLE', label: `Available (${rooms.filter((r) => !r.isFull && r.status !== 'maintenance').length})` },
            { key: 'MAINTENANCE', label: `Maintenance (${rooms.filter((r) => r.status === 'maintenance').length})` },
            { key: 'FULL', label: `Full (${rooms.filter((r) => r.isFull && r.status !== 'maintenance').length})` },
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
                padding: '3px 7px',
                fontSize: '0.72rem',
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
            <Sparkles size={14} /> 10-Sec Bulk Generator
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
