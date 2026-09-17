import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Users,
  Search,
  Phone,
  Mail,
  KeyRound,
  Copy,
  CheckCircle2,
  Clock,
  Check,
  Ban,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  Building2,
  Bed,
  Layers,
  Plus,
  Trash2,
  Sparkles,
  Info,
  ArrowRightLeft,
  Edit2,
  Tag,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TenantModal({ isOpen, onClose, onTenantAdded, initialTab = 'active' }) {
  const { pg, user, myPGs, updatePGState } = useAuth();
  const isOwner = user?.role === 'owner';
  const [activeTab, setActiveTab] = useState(initialTab); // 'active' | 'pending' | 'rooms' | 'add'
  const [tenants, setTenants] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);

  // Direct Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState(pg?.pgType === 'girls' ? 'female' : 'male');
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [transferringId, setTransferringId] = useState(null);

  // Student Room Change State
  const [editingRoomTenantId, setEditingRoomTenantId] = useState(null);
  const [selectedNewRoom, setSelectedNewRoom] = useState('');
  const [changingRoomLoading, setChangingRoomLoading] = useState(false);

  // Rooms Hub State
  const [rooms, setRooms] = useState([]);
  const [roomStats, setRoomStats] = useState({ totalRooms: 0, totalBeds: 0, occupiedBeds: 0, availableBeds: 0 });
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState({}); // tenantId -> allocatedRoomNumber

  // Bulk Generator State
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  const [genBlock, setGenBlock] = useState('');
  const [genWing, setGenWing] = useState('');
  const [genFloors, setGenFloors] = useState(3);
  const [genRoomsPerFloor, setGenRoomsPerFloor] = useState(4);
  const [genCapacity, setGenCapacity] = useState(2);
  const [genStartFloor, setGenStartFloor] = useState(1);
  const [generatingRooms, setGeneratingRooms] = useState(false);

  // Single Room State
  const [showSingleAdd, setShowSingleAdd] = useState(false);
  const [singleRoomNumber, setSingleRoomNumber] = useState('');
  const [singleBlock, setSingleBlock] = useState('');
  const [singleWing, setSingleWing] = useState('');
  const [singleFloor, setSingleFloor] = useState(1);
  const [singleCapacity, setSingleCapacity] = useState(2);
  const [addingRoom, setAddingRoom] = useState(false);

  // Filter in Rooms Hub
  const [roomFilterAvailability, setRoomFilterAvailability] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'FULL'

  // Rename Block & Wing State
  const [showRenameBlock, setShowRenameBlock] = useState(false);
  const [oldBlockName, setOldBlockName] = useState('');
  const [newBlockName, setNewBlockName] = useState('');
  const [oldWingName, setOldWingName] = useState('');
  const [newWingName, setNewWingName] = useState('');
  const [oldPrefix, setOldPrefix] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [renamingBlockLoading, setRenamingBlockLoading] = useState(false);

  // Edit Single Room State
  const [editingRoomModal, setEditingRoomModal] = useState(null);
  const [editRoomForm, setEditRoomForm] = useState({ roomNumber: '', block: '', wing: '', floor: 1, capacity: 2 });
  const [editRoomLoading, setEditRoomLoading] = useState(false);

  // Status & Loaders
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegenerateCode = async () => {
    if (!window.confirm("Are you sure you want to regenerate the Secret Join Passcode? The old passcode will stop working for new student registrations immediately.")) {
      return;
    }
    setRegenerating(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.regenerateJoinCode();
      if (updatePGState) {
        updatePGState({ joinCode: res.joinCode });
      }
      setSuccess(res.message || `New passcode generated: ${res.joinCode}`);
    } catch (err) {
      setError(err.message || 'Failed to regenerate join passcode');
    } finally {
      setRegenerating(false);
    }
  };

  const fetchTenants = async (term = '') => {
    try {
      const res = await api.getTenants(term);
      setTenants(res.tenants || []);
      const pending = res.pendingTenants || [];
      setPendingTenants(pending);

      // Pre-populate selectedRooms for pending tenants if they already have an existing room
      setSelectedRooms((prev) => {
        const updated = { ...prev };
        pending.forEach((t) => {
          if (!updated[t._id]) {
            updated[t._id] = (t.roomNumber && t.roomNumber !== 'Unassigned') ? t.roomNumber : '';
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await api.getRooms();
      setRooms(res.rooms || []);
      if (res.stats) setRoomStats(res.stats);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTenants(search);
      fetchRooms();
      setActiveTab(initialTab);
      setError('');
      setSuccess('');
    }
  }, [isOpen, initialTab]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchTenants(val);
  };

  const handleAddTenant = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.addTenant({
        name,
        email,
        password,
        gender,
        roomNumber,
        phone,
      });

      setSuccess(res.message || 'Tenant enrolled successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setRoomNumber('');
      setPhone('');
      fetchTenants();
      fetchRooms();
      setActiveTab('active');
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to add tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (tenantId, targetPgId) => {
    if (!targetPgId) return;
    if (!window.confirm('Are you sure you want to transfer this student to another PG branch? All their logged complaints will also be transferred.')) {
      return;
    }
    setTransferringId(tenantId);
    setError('');
    setSuccess('');
    try {
      const res = await api.transferTenantBranch(tenantId, targetPgId);
      setSuccess(res.message);
      await fetchTenants(search);
      await fetchRooms();
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to transfer student');
    } finally {
      setTransferringId(null);
    }
  };

  const handleChangeRoom = async (tenantId, newRoomNumber) => {
    if (!newRoomNumber || !newRoomNumber.trim()) return;
    setChangingRoomLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.changeTenantRoom(tenantId, newRoomNumber);
      setSuccess(res.message);
      setEditingRoomTenantId(null);
      setSelectedNewRoom('');
      await fetchTenants(search);
      await fetchRooms();
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to change student room');
    } finally {
      setChangingRoomLoading(false);
    }
  };

  const handleApprove = async (tenant) => {
    const roomToAssign = selectedRooms[tenant._id] || (tenant.roomNumber && tenant.roomNumber !== 'Unassigned' ? tenant.roomNumber : '');

    if (!roomToAssign || roomToAssign.toUpperCase() === 'UNASSIGNED') {
      setError(`Please choose an available room to allocate to ${tenant.name} before approving.`);
      return;
    }

    setError('');
    setSuccess('');
    setActionLoadingId(tenant._id);
    try {
      const res = await api.approveTenant(tenant._id, { roomNumber: roomToAssign });
      setSuccess(res.message || `Approved ${tenant.name} and allocated to Room ${roomToAssign}!`);
      await fetchTenants(search);
      await fetchRooms();
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to approve student');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (tenant) => {
    if (!window.confirm(`Are you sure you want to reject enrollment for ${tenant.name}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    setActionLoadingId(tenant._id);
    try {
      const res = await api.rejectTenant(tenant._id);
      setSuccess(res.message || `Rejected enrollment for ${tenant.name}.`);
      await fetchTenants(search);
      await fetchRooms();
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to reject student');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGeneratingRooms(true);
    try {
      const res = await api.generateRooms({
        block: genBlock,
        wing: genWing,
        floors: genFloors,
        roomsPerFloor: genRoomsPerFloor,
        capacity: genCapacity,
        startFloor: genStartFloor,
      });
      setSuccess(res.message || 'Rooms generated successfully!');
      setShowBulkGenerator(false);
      setGenWing('');
      await fetchRooms();
    } catch (err) {
      setError(err.message || 'Failed to generate rooms');
    } finally {
      setGeneratingRooms(false);
    }
  };

  const handleAddSingleRoom = async (e) => {
    e.preventDefault();
    if (!singleRoomNumber.trim()) {
      setError('Room number is required');
      return;
    }
    setError('');
    setSuccess('');
    setAddingRoom(true);
    try {
      const res = await api.addRoom({
        roomNumber: singleRoomNumber,
        block: singleBlock,
        wing: singleWing,
        floor: singleFloor,
        capacity: singleCapacity,
      });
      setSuccess(res.message || 'Room created successfully!');
      setSingleRoomNumber('');
      setSingleBlock('');
      setSingleWing('');
      setShowSingleAdd(false);
      await fetchRooms();
    } catch (err) {
      setError(err.message || 'Failed to add room');
    } finally {
      setAddingRoom(false);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Are you sure you want to delete Room ${room.roomNumber}? This cannot be undone.`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await api.deleteRoom(room._id);
      setSuccess(res.message || `Room ${room.roomNumber} deleted successfully.`);
      await fetchRooms();
    } catch (err) {
      setError(err.message || 'Failed to delete room');
    }
  };

  const handleRenameBlock = async (e) => {
    e.preventDefault();
    if (!oldBlockName && !oldWingName && !oldPrefix) {
      setError('Please select or specify the current Block, Wing, or Room Prefix to rename.');
      return;
    }
    setRenamingBlockLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.renameBlock({
        oldBlock: oldBlockName,
        newBlock: newBlockName,
        oldWing: oldWingName,
        newWing: newWingName,
        oldPrefix: oldPrefix,
        newPrefix: newPrefix,
      });
      setSuccess(res.message);
      setShowRenameBlock(false);
      setOldBlockName('');
      setNewBlockName('');
      setOldWingName('');
      setNewWingName('');
      setOldPrefix('');
      setNewPrefix('');
      await fetchRooms();
      await fetchTenants(search);
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to rename block/wing code');
    } finally {
      setRenamingBlockLoading(false);
    }
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoomModal(room);
    setEditRoomForm({
      roomNumber: room.roomNumber,
      block: room.block || '',
      wing: room.wing || '',
      floor: room.floor || 1,
      capacity: room.capacity || 2,
    });
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!editingRoomModal) return;
    setEditRoomLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.updateRoom(editingRoomModal._id, editRoomForm);
      setSuccess(res.message);
      setEditingRoomModal(null);
      await fetchRooms();
      await fetchTenants(search);
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to update room details');
    } finally {
      setEditRoomLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter rooms for Rooms Hub
  const filteredRooms = rooms.filter((r) => {
    if (roomFilterAvailability === 'AVAILABLE' && r.isFull) return false;
    if (roomFilterAvailability === 'FULL' && !r.isFull) return false;
    return true;
  });

  const availableBlocks = Array.from(new Set(rooms.map((r) => r.block).filter(Boolean)));
  const availableWings = Array.from(new Set(rooms.map((r) => r.wing).filter(Boolean)));

  const formatBlockName = (name) => {
    if (!name) return '';
    const trimmed = name.trim();
    if (/^(block|tower|wing|bldg|building|phase)\b/i.test(trimmed)) {
      return trimmed;
    }
    return `Block ${trimmed}`;
  };

  const formatWingName = (name) => {
    if (!name) return '';
    const trimmed = name.trim();
    if (/\bwing\b/i.test(trimmed)) {
      return trimmed;
    }
    return `Wing ${trimmed}`;
  };

  // Calculate live preview count for bulk generator
  const previewTotalRooms = Math.max(0, parseInt(genFloors, 10) || 0) * Math.max(0, parseInt(genRoomsPerFloor, 10) || 0);
  const previewTotalBeds = previewTotalRooms * Math.max(0, parseInt(genCapacity, 10) || 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '820px',
          width: '96%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="tenant-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                Student & Room Management
              </h2>
              {pendingTenants.length > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={11} /> {pendingTenants.length} Pending Approval
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
              Allocate rooms, approve enrollment requests, and manage block, wing & bed capacity
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light, #94a3b8)',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="tenant-modal-body">
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.85rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '10px 14px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                color: '#065f46',
                fontSize: '0.85rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* Secret Join Code Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.07) 0%, rgba(6, 182, 212, 0.07) 100%)',
              border: '1.5px solid rgba(79, 70, 229, 0.22)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={15} color="var(--primary, #4f46e5)" />
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: 'var(--primary, #4f46e5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Secret Student Enrollment Passcode
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                Students join with this code without selecting a room. You allocate rooms upon approval below.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  background: 'var(--bg-card, #ffffff)',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: '1.5px dashed var(--primary, #4f46e5)',
                  color: 'var(--primary, #4f46e5)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                {pg?.joinCode || 'GH-2024'}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pg?.joinCode || 'GH-2024');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 12px', fontSize: '0.78rem', fontWeight: 700 }}
                title="Copy enrollment passcode to clipboard"
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={13} color="#059669" />
                    <span style={{ color: '#059669' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="btn btn-secondary"
                  style={{ height: '32px', padding: '0 11px', fontSize: '0.78rem', fontWeight: 700 }}
                  title="Generate a new passcode if current one is leaked"
                >
                  <RefreshCw size={13} style={{ animation: regenerating ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tenant-tabs-bar">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'active' ? '2.5px solid var(--primary, #4f46e5)' : '2.5px solid transparent',
                padding: '8px 12px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'active' ? 800 : 600,
                color: activeTab === 'active' ? 'var(--primary, #4f46e5)' : 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
              }}
            >
              <Users size={15} />
              <span>Enrolled Students</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: activeTab === 'active' ? 'var(--primary-light, #eef2ff)' : '#f1f5f9',
                  color: activeTab === 'active' ? 'var(--primary, #4f46e5)' : '#64748b',
                  fontWeight: 700,
                }}
              >
                {tenants.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'pending' ? '2.5px solid #d97706' : '2.5px solid transparent',
                padding: '8px 12px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'pending' ? 800 : 600,
                color: activeTab === 'pending' ? '#b45309' : 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
              }}
            >
              <Clock size={15} color={pendingTenants.length > 0 ? '#d97706' : undefined} />
              <span>Pending Approvals</span>
              {pendingTenants.length > 0 ? (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    background: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    fontWeight: 800,
                  }}
                >
                  {pendingTenants.length}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: '#f1f5f9',
                    color: '#64748b',
                    fontWeight: 700,
                  }}
                >
                  0
                </span>
              )}
            </button>

            {/* TAB 3: Rooms Hub */}
            <button
              type="button"
              onClick={() => setActiveTab('rooms')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'rooms' ? '2.5px solid var(--primary, #4f46e5)' : '2.5px solid transparent',
                padding: '8px 12px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'rooms' ? 800 : 600,
                color: activeTab === 'rooms' ? 'var(--primary, #4f46e5)' : 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
              }}
            >
              <Building2 size={15} />
              <span>🏢 Rooms Hub</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: activeTab === 'rooms' ? 'var(--primary-light, #eef2ff)' : '#f1f5f9',
                  color: activeTab === 'rooms' ? 'var(--primary, #4f46e5)' : '#64748b',
                  fontWeight: 700,
                }}
              >
                {rooms.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'add' ? '2.5px solid var(--primary, #4f46e5)' : '2.5px solid transparent',
                padding: '8px 12px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'add' ? 800 : 600,
                color: activeTab === 'add' ? 'var(--primary, #4f46e5)' : 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
              }}
            >
              <UserPlus size={15} />
              <span>+ Direct Enroll</span>
            </button>
          </div>

          {/* TAB 1: Enrolled Active Students */}
          {activeTab === 'active' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                  Showing approved residents currently residing in PG
                </span>

                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-light, #94a3b8)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search name, room, email..."
                    style={{ padding: '6px 10px 6px 30px', fontSize: '0.78rem' }}
                    value={search}
                    onChange={handleSearch}
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
                    onClick={() => setActiveTab('add')}
                    className="btn btn-primary"
                    style={{ height: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                  >
                    <UserPlus size={14} /> Add Student Manually
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                  {tenants.map((t) => (
                    <div
                      key={t._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid var(--border-light, #e2e8f0)',
                        borderRadius: '10px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      <div>
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
                                return (
                                  <option
                                    key={r._id}
                                    value={r.roomNumber}
                                    disabled={!isCurrent && r.isFull}
                                  >
                                    Room {r.roomNumber} {r.block ? `(${r.block})` : ''} — {r.available}/{r.capacity} free {isCurrent ? '(Current)' : (r.isFull ? '(FULL)' : '')}
                                  </option>
                                );
                              })}
                            </select>

                            <button
                              type="button"
                              disabled={changingRoomLoading || !selectedNewRoom || selectedNewRoom === t.roomNumber}
                              onClick={() => handleChangeRoom(t._id, selectedNewRoom)}
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
                        )}

                        {isOwner && myPGs && myPGs.length > 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <select
                              className="form-select"
                              style={{
                                fontSize: '0.74rem',
                                padding: '4px 8px',
                                height: '32px',
                                width: 'auto',
                                borderRadius: '7px',
                                cursor: 'pointer',
                              }}
                              defaultValue=""
                              disabled={transferringId === t._id}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleTransfer(t._id, e.target.value);
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Pending Approvals with Smart Room Allocation */}
          {activeTab === 'pending' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#b45309" />
                  <span style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                    Select an available room from your PG and approve the student. Their portal unlocks instantly.
                  </span>
                </div>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309' }}>
                  {pendingTenants.length} Pending
                </span>
              </div>

              {pendingTenants.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    background: 'var(--bg-hover, #f8fafc)',
                    borderRadius: '10px',
                    border: '1px dashed var(--border-light, #e2e8f0)',
                  }}
                >
                  <ShieldCheck size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 800, color: 'var(--text-main, #0f172a)', fontSize: '0.96rem' }}>
                    All Clear! No Pending Requests
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', maxWidth: '420px', margin: '4px auto 0' }}>
                    When a new student registers using your Secret Join Passcode (<code>{pg?.joinCode || 'GH-2024'}</code>), their request will appear here for you to allocate an available room and approve.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                  {pendingTenants.map((t) => {
                    const isProcessing = actionLoadingId === t._id;
                    const dateStr = t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Just now';
                    const currentAllocated = selectedRooms[t._id] || (t.roomNumber && t.roomNumber !== 'Unassigned' ? t.roomNumber : '');

                    return (
                      <div
                        key={t._id}
                        style={{
                          background: 'var(--bg-card, #ffffff)',
                          border: '1.5px solid #fde68a',
                          borderRadius: '12px',
                          padding: '16px',
                          boxShadow: '0 2px 5px rgba(217, 119, 6, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        {/* Student Details Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main, #0f172a)' }}>
                                {t.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--text-light, #94a3b8)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Calendar size={11} /> {dateStr}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', display: 'flex', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
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

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReject(t)}
                              className="btn"
                              style={{
                                height: '34px',
                                padding: '0 12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                background: '#fff1f2',
                                color: '#e11d48',
                                border: '1px solid #fecdd3',
                                borderRadius: '8px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Ban size={13} />
                              <span>Reject</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(t)}
                              className="btn"
                              style={{
                                height: '34px',
                                padding: '0 14px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                background: '#059669',
                                color: '#ffffff',
                                border: '1px solid #047857',
                                borderRadius: '8px',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)',
                              }}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 size={13} className="spin" />
                                  <span>Allocating...</span>
                                </>
                              ) : (
                                <>
                                  <Check size={14} />
                                  <span>Allocate & Approve</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Room Allocation Dropdown Row */}
                        <div
                          style={{
                            background: 'var(--bg-hover, #f8fafc)',
                            border: '1px solid var(--border-light, #e2e8f0)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={15} color="var(--primary, #4f46e5)" />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                              Allocate Room:
                            </span>
                          </div>

                          <div style={{ flex: '1 1 240px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {rooms.length > 0 ? (
                              <select
                                className="form-select"
                                value={currentAllocated}
                                onChange={(e) =>
                                  setSelectedRooms((prev) => ({ ...prev, [t._id]: e.target.value }))
                                }
                                style={{
                                  height: '34px',
                                  fontSize: '0.8rem',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                }}
                              >
                                <option value="">-- Choose Available Room --</option>
                                {rooms.map((r) => (
                                  <option key={r._id} value={r.roomNumber} disabled={r.isFull}>
                                    Room {r.roomNumber} {r.block ? `(${r.block})` : ''} — {r.available}/{r.capacity} beds free {r.isFull ? '(FULL)' : ''}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Type room number (e.g. 101)"
                                  value={currentAllocated}
                                  onChange={(e) =>
                                    setSelectedRooms((prev) => ({ ...prev, [t._id]: e.target.value.toUpperCase() }))
                                  }
                                  style={{ height: '34px', fontSize: '0.8rem' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('rooms')}
                                  className="btn btn-secondary"
                                  style={{ height: '34px', fontSize: '0.74rem', whiteSpace: 'nowrap', padding: '0 10px' }}
                                >
                                  ⚡ Setup Rooms
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Rooms Hub (Bulk Generator & Bed Occupancy) */}
          {activeTab === 'rooms' && (
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
              </div>

              {/* Action Toolbar */}
              <div className="tenant-action-toolbar">
                <div className="tenant-action-buttons">
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
                  {['ALL', 'AVAILABLE', 'FULL'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setRoomFilterAvailability(filter)}
                      style={{
                        background: roomFilterAvailability === filter ? 'var(--bg-card, #ffffff)' : 'transparent',
                        color: roomFilterAvailability === filter ? 'var(--text-main, #0f172a)' : 'var(--text-muted, #64748b)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: roomFilterAvailability === filter ? 800 : 600,
                        cursor: 'pointer',
                        boxShadow: roomFilterAvailability === filter ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      {filter === 'ALL' ? 'All' : filter === 'AVAILABLE' ? '🟢 Available Only' : '🔴 Full Only'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 10-Second Bulk Generator Card */}
              {showBulkGenerator && (
                <form
                  onSubmit={handleBulkGenerate}
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
                      onClick={() => setShowBulkGenerator(false)}
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
                      onClick={() => setShowBulkGenerator(false)}
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
              )}

              {/* Add Single Room Form */}
              {showSingleAdd && (
                <form
                  onSubmit={handleAddSingleRoom}
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
                      onClick={() => setShowSingleAdd(false)}
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
                      onClick={() => setShowSingleAdd(false)}
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
              )}

              {/* Rename Block & Wing Form */}
              {showRenameBlock && isOwner && (
                <form
                  onSubmit={handleRenameBlock}
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
                      onClick={() => setShowRenameBlock(false)}
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
                      <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                        1. Select Current Block Name *
                      </label>
                      {availableBlocks.length > 0 ? (
                        <select
                          className="form-input"
                          value={oldBlockName}
                          onChange={(e) => {
                            const chosenBlock = e.target.value;
                            setOldBlockName(chosenBlock);
                            if (chosenBlock) {
                              // Automatically detect the room prefix for this block
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
                              {formatBlockName(b)} ({rooms.filter((r) => r.block === b).length} rooms)
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
                          • <strong>Block:</strong> <code>{formatBlockName(oldBlockName)}</code> ➡️{' '}
                          <strong style={{ color: newBlockName ? '#059669' : 'inherit' }}>
                            {newBlockName ? formatBlockName(newBlockName) : `${formatBlockName(oldBlockName)} (No change)`}
                          </strong>
                        </div>
                        {newWingName && (
                          <div>
                            • <strong>Wing:</strong> (None) ➡️{' '}
                            <strong style={{ color: '#059669' }}>{formatWingName(newWingName)}</strong>
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
                      onClick={() => setShowRenameBlock(false)}
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
              )}

              {/* Rooms List / Grid */}
              {loadingRooms ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted, #64748b)' }}>
                  <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                  <div>Loading PG rooms and occupancy...</div>
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
                  {filteredRooms.map((room) => {
                    const hasResidents = room.residents && room.residents.length > 0;

                    return (
                      <div
                        key={room._id}
                        style={{
                          background: 'var(--bg-card, #ffffff)',
                          border: room.isFull ? '1.5px solid #fed7aa' : '1.5px solid var(--border-light, #e2e8f0)',
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
                          </div>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {room.block && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', background: 'var(--bg-hover, #f1f5f9)', padding: '1px 6px', borderRadius: '4px' }}>
                                {formatBlockName(room.block)}
                              </span>
                            )}
                            {room.wing && (
                              <span style={{ fontSize: '0.7rem', color: '#0369a1', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                {formatWingName(room.wing)}
                              </span>
                            )}
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', background: 'var(--bg-hover, #f1f5f9)', padding: '1px 6px', borderRadius: '4px' }}>
                              Floor {room.floor}
                            </span>
                          </div>

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
                                  background: room.isFull ? '#ea580c' : 'var(--primary, #4f46e5)',
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

                        {/* Room Card Footer / Edit & Delete */}
                        {isOwner && !room.isLegacy && (
                          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-light, #e2e8f0)', paddingTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditRoom(room)}
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
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(room)}
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
                              <span>Delete Room</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Direct Manual Add Form */}
          {activeTab === 'add' && (
            <form
              onSubmit={handleAddTenant}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                      {rooms.map((r) => (
                        <option key={r._id} value={r.roomNumber} disabled={r.isFull}>
                          Room {r.roomNumber} {r.block ? `(${r.block})` : ''} — {r.available}/{r.capacity} beds free {r.isFull ? '(FULL)' : ''}
                        </option>
                      ))}
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
          )}
        </div>
      </div>

      {/* Edit Single Room Modal */}
      {editingRoomModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setEditingRoomModal(null)}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '14px',
              padding: '22px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--border-light, #e2e8f0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--primary, #4f46e5)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  Edit Room {editingRoomModal.roomNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoomModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light, #94a3b8)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateRoom}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Room Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editRoomForm.roomNumber}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, roomNumber: e.target.value.toUpperCase() })}
                    required
                    style={{ height: '36px', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Block (e.g. A, Main)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editRoomForm.block}
                      onChange={(e) => setEditRoomForm({ ...editRoomForm, block: e.target.value.toUpperCase() })}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Wing (e.g. East, Wing-A)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editRoomForm.wing}
                      onChange={(e) => setEditRoomForm({ ...editRoomForm, wing: e.target.value.toUpperCase() })}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Floor Number</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={editRoomForm.floor}
                      onChange={(e) => setEditRoomForm({ ...editRoomForm, floor: parseInt(e.target.value, 10) || 0 })}
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>Capacity (Beds) *</label>
                    <input
                      type="number"
                      min={editingRoomModal.occupied || 1}
                      max="10"
                      className="form-input"
                      value={editRoomForm.capacity}
                      onChange={(e) => setEditRoomForm({ ...editRoomForm, capacity: Math.max(editingRoomModal.occupied || 1, parseInt(e.target.value, 10) || 1) })}
                      required
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {editingRoomModal.occupied > 0 && (
                  <div style={{ fontSize: '0.74rem', color: '#6366f1', background: 'rgba(99, 102, 241, 0.08)', padding: '8px 10px', borderRadius: '6px' }}>
                    ℹ️ Notice: Changing this room number will automatically update all {editingRoomModal.occupied} student(s) currently allocated here.
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingRoomModal(null)}
                    className="btn btn-secondary"
                    style={{ height: '36px', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editRoomLoading}
                    className="btn btn-primary"
                    style={{ height: '36px', fontSize: '0.8rem', padding: '0 16px' }}
                  >
                    {editRoomLoading ? (
                      <>
                        <Loader2 size={13} className="spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
