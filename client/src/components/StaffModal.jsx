import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  CheckCircle,
  Clock,
  Building2,
  ShieldCheck,
  Trash2,
  Settings2,
  Wrench,
  Users,
  MessageSquare,
  DoorOpen,
  BellRing,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PERMISSION_CONFIG = [
  { key: 'manageMaintenance', label: 'Room Maintenance', icon: Wrench, desc: 'Mark rooms clean / repair' },
  { key: 'manageTenants', label: 'Tenants & Approvals', icon: Users, desc: 'Approve students & checkout' },
  { key: 'manageComplaints', label: 'Complaints', icon: MessageSquare, desc: 'Update ticket progress' },
  { key: 'manageRooms', label: 'Rooms Hub', icon: DoorOpen, desc: 'Add / edit room info' },
  { key: 'manageNotices', label: 'Notices', icon: BellRing, desc: 'Post PG announcements' },
];

export default function StaffModal({ isOpen, onClose }) {
  const { pg, myPGs } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPgId, setSelectedPgId] = useState(pg?._id || '');
  const [invitePermissions, setInvitePermissions] = useState({
    manageMaintenance: true,
    manageTenants: true,
    manageComplaints: true,
    manageRooms: false,
    manageNotices: false,
  });

  const [branchFilter, setBranchFilter] = useState(pg?._id || 'ALL');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await api.getStaff();
      setStaffList(res.staff || []);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      if (pg?._id) {
        setSelectedPgId(pg._id);
        setBranchFilter(pg._id);
      }
      setError('');
      setSuccess('');
    }
  }, [isOpen, pg]);

  if (!isOpen) return null;

  const toggleInvitePermission = (key) => {
    setInvitePermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleStaffPermission = async (staffMember, permKey) => {
    // Current permission value (defaults to true if undefined)
    const currentVal = staffMember.permissions?.[permKey] !== false;
    const nextVal = !currentVal;
    setActionLoadingId(`${staffMember._id}-${permKey}`);
    setError('');
    setSuccess('');

    // Optimistically update local state immediately so UI changes without lag
    const nextPermissions = {
      manageMaintenance: true,
      manageTenants: true,
      manageComplaints: true,
      manageRooms: true,
      manageNotices: true,
      ...(staffMember.permissions || {}),
      [permKey]: nextVal,
    };

    setStaffList((prev) =>
      prev.map((s) => (s._id === staffMember._id ? { ...s, permissions: nextPermissions } : s))
    );

    try {
      const res = await api.updateStaffPermissions(staffMember._id, {
        permissions: { [permKey]: nextVal },
      });
      setSuccess(res.message || 'Permission updated successfully');
      
      const serverEditor = res.editor;
      if (serverEditor) {
        setStaffList((prev) =>
          prev.map((s) => (s._id === staffMember._id ? serverEditor : s))
        );
      }
    } catch (err) {
      // Revert on error
      setError(err.message || 'Failed to update permission');
      fetchStaff();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTransferBranch = async (staffMember, targetPgId) => {
    const currentPgId = staffMember.pgId?._id || staffMember.pgId;
    if (!targetPgId || targetPgId === currentPgId) return;

    const targetBranch = myPGs?.find((b) => b._id === targetPgId);
    const targetName = targetBranch ? targetBranch.name : 'new branch';

    if (!window.confirm(`Shift ${staffMember.name} to branch "${targetName}"? They will manage "${targetName}" from now on.`)) {
      return;
    }

    setActionLoadingId(`branch-${staffMember._id}`);
    setError('');
    setSuccess('');

    try {
      const res = await api.updateStaffPermissions(staffMember._id, {
        pgId: targetPgId,
      });
      setSuccess(res.message || `Shifted ${staffMember.name} to ${targetName} successfully!`);
      if (res.editor) {
        setStaffList((prev) =>
          prev.map((s) => (s._id === staffMember._id ? res.editor : s))
        );
      } else {
        await fetchStaff();
      }
    } catch (err) {
      setError(err.message || 'Failed to shift staff member to branch');
      await fetchStaff();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to remove ${staffName} from staff? They will immediately lose access to the PG dashboard.`)) {
      return;
    }
    setActionLoadingId(`delete-${staffId}`);
    setError('');
    setSuccess('');

    try {
      const res = await api.deleteStaff(staffId);
      setSuccess(res.message || 'Staff member removed successfully');
      setStaffList((prev) => prev.filter((s) => s._id !== staffId));
    } catch (err) {
      setError(err.message || 'Failed to remove staff member');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.inviteEditor({
        name,
        email,
        password,
        phone,
        pgId: selectedPgId || pg?._id,
        permissions: invitePermissions,
      });
      setSuccess(res.message || 'Staff Editor invite dispatched successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      fetchStaff();
    } catch (err) {
      setError(err.message || 'Failed to invite editor');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffList.filter((st) => {
    if (branchFilter === 'ALL') return true;
    const staffPgId = st.pgId?._id || st.pgId;
    return staffPgId?.toString() === branchFilter?.toString();
  });

  const activeBranchName = myPGs?.find((b) => b._id === branchFilter)?.name || (branchFilter === 'ALL' ? 'All Branches' : (pg?.name || 'Current Branch'));

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="tenant-modal-header" style={{ flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--primary, #4f46e5)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                Staff Management & Branch Access
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
              Assign editors to dedicated PG branches and toggle granular operational permissions
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
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="tenant-modal-body">
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.84rem',
                marginBottom: '16px',
              }}
            >
              {error}
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
                fontSize: '0.84rem',
                marginBottom: '16px',
              }}
            >
              {success}
            </div>
          )}

          {/* Invite Form */}
          <form
            onSubmit={handleInvite}
            style={{
              background: 'var(--bg-hover, #f8fafc)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-light, #e2e8f0)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                Invite New Staff Editor
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--primary, #4f46e5)',
                  background: 'var(--primary-light, #eef2ff)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Branch Isolated
              </span>
            </div>

            {/* Target Branch Selector */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={13} color="var(--primary, #4f46e5)" /> Assigned PG Facility / Branch *
              </label>
              <select
                className="form-input"
                value={selectedPgId}
                onChange={(e) => setSelectedPgId(e.target.value)}
                required
                style={{ fontWeight: 600 }}
              >
                {myPGs && myPGs.length > 0 ? (
                  myPGs.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.pgType === 'girls' ? 'Girls PG' : 'Boys Hostel/PG'})
                    </option>
                  ))
                ) : (
                  <option value={pg?._id}>{pg?.name || 'Current PG'}</option>
                )}
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                * Staff assigned to this branch will ONLY see and manage this PG. They cannot switch or access other branches.
              </span>
            </div>

            <div className="grid-2-col" style={{ gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="staff@pg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Temporary Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 98765..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Granular Permissions Selection */}
            <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Settings2 size={13} /> Grant Staff Operational Permissions:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {PERMISSION_CONFIG.map((p) => {
                  const Icon = p.icon;
                  const isChecked = !!invitePermissions[p.key];
                  return (
                    <label
                      key={p.key}
                      onClick={() => toggleInvitePermission(p.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        background: isChecked ? 'rgba(79, 70, 229, 0.07)' : 'var(--bg-card, #ffffff)',
                        border: isChecked ? '1px solid var(--primary, #4f46e5)' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ marginTop: '2px', accentColor: 'var(--primary, #4f46e5)' }}
                      />
                      <div style={{ fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: isChecked ? 'var(--primary, #4f46e5)' : 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Icon size={12} /> {p.label}
                        </div>
                        <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.68rem' }}>{p.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '14px', height: '38px', fontSize: '0.85rem', fontWeight: 700 }}
            >
              <UserPlus size={16} />
              {loading ? 'Adding Staff Editor...' : 'Add Staff Editor'}
            </button>
          </form>

          {/* Current Staff List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                Appointed Staff Team ({filteredStaff.length})
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)' }}>
                Click on any permission chip to toggle live
              </span>
            </div>

            {/* Branch Filter Tabs for Multi-Branch Owners */}
            {myPGs && myPGs.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '14px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                padding: '2px 0',
              }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', marginRight: '2px' }}>
                  Branch:
                </span>
                {myPGs.map((b) => {
                  const isSelected = branchFilter === b._id;
                  const count = staffList.filter((s) => (s.pgId?._id || s.pgId)?.toString() === b._id.toString()).length;
                  return (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => setBranchFilter(b._id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 9px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isSelected ? 'var(--primary, #4f46e5)' : 'var(--bg-card, #ffffff)',
                        color: isSelected ? '#ffffff' : 'var(--text-main, #0f172a)',
                        border: isSelected ? '1px solid var(--primary, #4f46e5)' : '1px solid var(--border-light, #e2e8f0)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{b.pgType === 'girls' ? '🌸' : '🔷'} {b.name}</span>
                      <span style={{
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-hover, #f1f5f9)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted, #64748b)',
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: '10px',
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setBranchFilter('ALL')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 9px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: branchFilter === 'ALL' ? 'var(--primary, #4f46e5)' : 'var(--bg-card, #ffffff)',
                    color: branchFilter === 'ALL' ? '#ffffff' : 'var(--text-main, #0f172a)',
                    border: branchFilter === 'ALL' ? '1px solid var(--primary, #4f46e5)' : '1px solid var(--border-light, #e2e8f0)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🌐 All Staff</span>
                  <span style={{
                    background: branchFilter === 'ALL' ? 'rgba(255,255,255,0.25)' : 'var(--bg-hover, #f1f5f9)',
                    color: branchFilter === 'ALL' ? '#ffffff' : 'var(--text-muted, #64748b)',
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: '10px',
                  }}>
                    {staffList.length}
                  </span>
                </button>
              </div>
            )}

            {filteredStaff.length === 0 ? (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted, #64748b)',
                  textAlign: 'center',
                  padding: '24px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px dashed #cbd5e1',
                }}
              >
                No staff editors appointed to {activeBranchName} yet. Use the form above to add or shift staff here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredStaff.map((st) => {
                  const branchName = st.pgId?.name || 'Unassigned / Primary';
                  const branchType = st.pgId?.pgType === 'girls' ? 'Girls PG' : 'Boys Hostel/PG';
                  return (
                    <div
                      key={st._id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid var(--border-light, #e2e8f0)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main, #0f172a)' }}>
                              {st.name}
                            </span>
                            {myPGs && myPGs.length > 1 ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <select
                                  value={st.pgId?._id || st.pgId}
                                  onChange={(e) => handleTransferBranch(st, e.target.value)}
                                  disabled={actionLoadingId === `branch-${st._id}`}
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    border: '1.5px solid rgba(79, 70, 229, 0.3)',
                                    background: 'rgba(79, 70, 229, 0.06)',
                                    color: 'var(--primary, #4f46e5)',
                                    cursor: 'pointer',
                                  }}
                                  title="Click to shift this staff member to another branch"
                                >
                                  {myPGs.map((b) => (
                                    <option key={b._id} value={b._id}>
                                      🏢 {b.name} ({b.pgType === 'girls' ? 'Girls' : 'Boys'})
                                    </option>
                                  ))}
                                </select>
                                {actionLoadingId === `branch-${st._id}` && (
                                  <Loader2 size={12} className="animate-spin" color="var(--primary, #4f46e5)" />
                                )}
                              </div>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  padding: '1px 7px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Building2 size={11} color="#64748b" /> {branchName} ({branchType})
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                            {st.email} {st.phone && `• ${st.phone}`}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {st.inviteStatus === 'accepted' ? (
                            <span className="badge badge-resolved" style={{ fontSize: '0.7rem' }}>
                              <CheckCircle size={11} /> Accepted
                            </span>
                          ) : (
                            <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                              <Clock size={11} /> Pending
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(st._id, st.name)}
                            disabled={actionLoadingId === `delete-${st._id}`}
                            title="Revoke and Remove Staff Member"
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Interactive Permission Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                          Permissions:
                        </span>
                        {PERMISSION_CONFIG.map((p) => {
                          const Icon = p.icon;
                          const hasPerm = st.permissions?.[p.key] !== false;
                          const isToggling = actionLoadingId === `${st._id}-${p.key}`;
                          return (
                            <button
                              key={p.key}
                              type="button"
                              onClick={() => handleToggleStaffPermission(st, p.key)}
                              disabled={isToggling}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '20px',
                                border: hasPerm ? '1.5px solid #16a34a' : '1.5px solid #cbd5e1',
                                background: hasPerm ? '#dcfce7' : '#f1f5f9',
                                color: hasPerm ? '#15803d' : '#64748b',
                                cursor: isToggling ? 'not-allowed' : 'pointer',
                                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: isToggling ? 0.6 : 1,
                                transform: hasPerm ? 'scale(1)' : 'scale(0.97)',
                                boxShadow: hasPerm ? '0 1px 3px rgba(22, 163, 74, 0.15)' : 'none',
                              }}
                              title={`Click to ${hasPerm ? 'DISABLE / REVOKE' : 'ENABLE / GRANT'} ${p.label}`}
                            >
                              <Icon size={12} color={hasPerm ? '#15803d' : '#94a3b8'} />
                              <span>{p.label}</span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  color: hasPerm ? '#15803d' : '#94a3b8',
                                }}
                              >
                                {hasPerm ? '✓' : '✕'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
