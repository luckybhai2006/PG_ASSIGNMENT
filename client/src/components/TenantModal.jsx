import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UserPlus,
  Users,
  KeyRound,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Building2,
  History,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Modular Subcomponents
import ActiveTenantsTab from './tenant/ActiveTenantsTab';
import PendingApprovalsTab from './tenant/PendingApprovalsTab';
import RoomHubTab from './tenant/RoomHubTab';
import CheckedOutArchiveTab from './tenant/CheckedOutArchiveTab';
import DirectEnrollTab from './tenant/DirectEnrollTab';
import EditRoomModal from './tenant/EditRoomModal';
import CheckoutStudentModal from './tenant/CheckoutStudentModal';
import RoomMaintenanceModal from './tenant/RoomMaintenanceModal';

export default function TenantModal({ isOpen, onClose, onTenantAdded, initialTab = 'active' }) {
  const { pg, user, myPGs, updatePGState } = useAuth();
  const isOwner = user?.role === 'owner';
  const isEditor = user?.role === 'editor';
  const canManageMaintenance = isOwner || (isEditor && user?.permissions?.manageMaintenance !== false);
  const canManageRooms = isOwner || (isEditor && user?.permissions?.manageRooms !== false);
  const canManageTenants = isOwner || (isEditor && user?.permissions?.manageTenants !== false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'active' | 'pending' | 'rooms' | 'history' | 'add'
  const [tenants, setTenants] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);
  const [vacatedTenants, setVacatedTenants] = useState([]);
  const [vacateSearch, setVacateSearch] = useState('');

  // Checkout Student State
  const [checkoutStudent, setCheckoutStudent] = useState(null);
  const [checkoutReason, setCheckoutReason] = useState('Course completed / Moving out');
  const [checkoutMarkMaintenance, setCheckoutMarkMaintenance] = useState(true);
  const [checkoutMaintenanceReason, setCheckoutMaintenanceReason] = useState('Cleaning & sanitization after student checkout');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Room Maintenance Quick Toggle State
  const [maintenanceRoomTarget, setMaintenanceRoomTarget] = useState(null);
  const [maintenanceReasonInput, setMaintenanceReasonInput] = useState('Deep cleaning & sanitization');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

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

  const isFetchingTenantsRef = useRef(false);
  const fetchTenants = async (term = '') => {
    if (isFetchingTenantsRef.current) return;
    isFetchingTenantsRef.current = true;
    try {
      const res = await api.getTenants(term);
      setTenants(res.tenants || []);
      const pending = res.pendingTenants || [];
      setPendingTenants(pending);
      setVacatedTenants(res.vacatedTenants || []);

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
    } finally {
      isFetchingTenantsRef.current = false;
    }
  };

  const isFetchingRoomsRef = useRef(false);
  const fetchRooms = async () => {
    if (isFetchingRoomsRef.current) return;
    isFetchingRoomsRef.current = true;
    setLoadingRooms(true);
    try {
      const res = await api.getRooms();
      setRooms(res.rooms || []);
      if (res.stats) setRoomStats(res.stats);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      isFetchingRoomsRef.current = false;
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      Promise.all([fetchTenants(search), fetchRooms()]);
      setActiveTab(initialTab);
      setRoomFilterAvailability('ALL');
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

  const handleConfirmCheckout = async (e) => {
    e?.preventDefault();
    if (!checkoutStudent) return;
    setCheckoutLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.vacateTenant(checkoutStudent._id, {
        reason: checkoutReason,
        markMaintenance: checkoutMarkMaintenance,
        maintenanceReason: checkoutMaintenanceReason,
      });
      setSuccess(res.message || `Checked out ${checkoutStudent.name} successfully.`);
      setCheckoutStudent(null);
      await fetchTenants(search);
      await fetchRooms();
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to checkout student');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleToggleRoomMaintenance = async (room, nextStatus, customReason = '') => {
    setError('');
    setSuccess('');
    setMaintenanceLoading(true);
    try {
      const res = await api.toggleRoomMaintenance(room._id, {
        status: nextStatus,
        maintenanceReason: customReason || (nextStatus === 'maintenance' ? 'Cleaning / Repair in progress' : ''),
      });
      setSuccess(res.message || `Room ${room.roomNumber} status updated.`);
      setMaintenanceRoomTarget(null);
      await fetchRooms();
      await fetchTenants(search);
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to update room maintenance status');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter rooms for Rooms Hub
  const filteredRooms = rooms.filter((r) => {
    if (roomFilterAvailability === 'MAINTENANCE') return r.status === 'maintenance';
    if (roomFilterAvailability === 'AVAILABLE') return !r.isFull && r.status !== 'maintenance';
    if (roomFilterAvailability === 'FULL') return r.isFull && r.status !== 'maintenance';
    return true;
  });

  // Filter archived vacated students
  const filteredVacatedTenants = vacatedTenants.filter((t) => {
    if (!vacateSearch.trim()) return true;
    const term = vacateSearch.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(term)) ||
      (t.email && t.email.toLowerCase().includes(term)) ||
      (t.lastRoomNumber && t.lastRoomNumber.toLowerCase().includes(term)) ||
      (t.phone && t.phone.toLowerCase().includes(term)) ||
      (t.vacatedReason && t.vacatedReason.toLowerCase().includes(term))
    );
  });

  const availableBlocks = Array.from(new Set(rooms.map((r) => r.block).filter(Boolean)));

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
          maxWidth: '860px',
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
            className="tenant-passcode-banner"
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
            <div className="tenant-passcode-info">
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

            <div className="tenant-passcode-actions">
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
              onClick={() => {
                setActiveTab('rooms');
                setRoomFilterAvailability('ALL');
              }}
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
              <span>Rooms Hub</span>
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

            {/* TAB 4: Checked Out Archive */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'history' ? '2.5px solid #64748b' : '2.5px solid transparent',
                padding: '8px 12px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'history' ? 800 : 600,
                color: activeTab === 'history' ? '#334155' : 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px',
                whiteSpace: 'nowrap',
              }}
            >
              <History size={15} />
              <span>Checked Out Archive</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: activeTab === 'history' ? '#e2e8f0' : '#f1f5f9',
                  color: '#475569',
                  fontWeight: 700,
                }}
              >
                {vacatedTenants.length}
              </span>
            </button>

            {canManageTenants && (
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
            )}
          </div>

          {/* TAB 1: Enrolled Active Students */}
          {activeTab === 'active' && (
            <ActiveTenantsTab
              tenants={tenants}
              search={search}
              onSearchChange={handleSearch}
              onAddTenantClick={() => setActiveTab('add')}
              rooms={rooms}
              editingRoomTenantId={editingRoomTenantId}
              setEditingRoomTenantId={setEditingRoomTenantId}
              selectedNewRoom={selectedNewRoom}
              setSelectedNewRoom={setSelectedNewRoom}
              changingRoomLoading={changingRoomLoading}
              onChangeRoom={handleChangeRoom}
              isOwner={isOwner}
              myPGs={myPGs}
              pg={pg}
              transferringId={transferringId}
              onTransfer={handleTransfer}
              canManageTenants={canManageTenants}
              onCheckoutClick={(tenant) => {
                setCheckoutStudent(tenant);
                setCheckoutReason('Course completed / Moving out');
                setCheckoutMarkMaintenance(Boolean(tenant.roomNumber && tenant.roomNumber !== 'Unassigned'));
                setCheckoutMaintenanceReason(`Cleaning & sanitization after ${tenant.name} checkout`);
              }}
            />
          )}

          {/* TAB 2: Pending Approvals with Smart Room Allocation */}
          {activeTab === 'pending' && (
            <PendingApprovalsTab
              pendingTenants={pendingTenants}
              pg={pg}
              actionLoadingId={actionLoadingId}
              selectedRooms={selectedRooms}
              onSelectRoom={(tenantId, roomNum) => setSelectedRooms((prev) => ({ ...prev, [tenantId]: roomNum }))}
              rooms={rooms}
              onApprove={handleApprove}
              onReject={handleReject}
              canManageTenants={canManageTenants}
              onGoToRooms={() => setActiveTab('rooms')}
            />
          )}

          {/* TAB 3: Rooms Hub (Bulk Generator & Bed Occupancy) */}
          {activeTab === 'rooms' && (
            <RoomHubTab
              rooms={rooms}
              roomStats={roomStats}
              loadingRooms={loadingRooms}
              filteredRooms={filteredRooms}
              isOwner={isOwner}
              roomFilterAvailability={roomFilterAvailability}
              setRoomFilterAvailability={setRoomFilterAvailability}
              showBulkGenerator={showBulkGenerator}
              setShowBulkGenerator={setShowBulkGenerator}
              handleBulkGenerate={handleBulkGenerate}
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
              showSingleAdd={showSingleAdd}
              setShowSingleAdd={setShowSingleAdd}
              handleAddSingleRoom={handleAddSingleRoom}
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
              showRenameBlock={showRenameBlock}
              setShowRenameBlock={setShowRenameBlock}
              handleRenameBlock={handleRenameBlock}
              availableBlocks={availableBlocks}
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
              maintenanceLoading={maintenanceLoading}
              handleToggleRoomMaintenance={handleToggleRoomMaintenance}
              handleOpenEditRoom={handleOpenEditRoom}
              handleDeleteRoom={handleDeleteRoom}
              canManageMaintenance={canManageMaintenance}
              canManageRooms={canManageRooms}
            />
          )}

          {/* TAB 4: Checked Out Students Archive */}
          {activeTab === 'history' && (
            <CheckedOutArchiveTab
              vacatedTenants={filteredVacatedTenants}
              searchTerm={vacateSearch}
              onSearchChange={setVacateSearch}
            />
          )}

          {/* TAB 5: Direct Manual Add Form */}
          {activeTab === 'add' && (
            <DirectEnrollTab
              onSubmit={handleAddTenant}
              name={name}
              setName={setName}
              roomNumber={roomNumber}
              setRoomNumber={setRoomNumber}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              phone={phone}
              setPhone={setPhone}
              rooms={rooms}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Edit Single Room Modal */}
      <EditRoomModal
        room={editingRoomModal}
        formData={editRoomForm}
        onFormChange={setEditRoomForm}
        loading={editRoomLoading}
        onSubmit={handleUpdateRoom}
        onClose={() => setEditingRoomModal(null)}
      />

      {/* Checkout Student Confirmation Modal Overlay */}
      <CheckoutStudentModal
        student={checkoutStudent}
        reason={checkoutReason}
        onReasonChange={setCheckoutReason}
        markMaintenance={checkoutMarkMaintenance}
        onMarkMaintenanceChange={setCheckoutMarkMaintenance}
        maintenanceReason={checkoutMaintenanceReason}
        onMaintenanceReasonChange={setCheckoutMaintenanceReason}
        loading={checkoutLoading}
        onConfirm={handleConfirmCheckout}
        onClose={() => setCheckoutStudent(null)}
      />

      {/* Set Room to Maintenance Prompt Modal */}
      <RoomMaintenanceModal
        room={maintenanceRoomTarget}
        reason={maintenanceReasonInput}
        onReasonChange={setMaintenanceReasonInput}
        loading={maintenanceLoading}
        onSubmit={(e) => {
          e.preventDefault();
          handleToggleRoomMaintenance(maintenanceRoomTarget, 'maintenance', maintenanceReasonInput);
        }}
        onMarkClean={() => {
          if (maintenanceRoomTarget) {
            handleToggleRoomMaintenance(maintenanceRoomTarget, 'available');
          }
        }}
        onClose={() => setMaintenanceRoomTarget(null)}
      />
    </div>
  );
}
