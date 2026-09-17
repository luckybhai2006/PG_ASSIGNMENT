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
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TenantModal({ isOpen, onClose, onTenantAdded, initialTab = 'active' }) {
  const { pg } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'active' | 'pending' | 'add'
  const [tenants, setTenants] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);
  
  // Direct Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Status & Loaders
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTenants = async (term = '') => {
    try {
      const res = await api.getTenants(term);
      setTenants(res.tenants || []);
      setPendingTenants(res.pendingTenants || []);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTenants(search);
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
      setActiveTab('active');
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to add tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tenant) => {
    setError('');
    setSuccess('');
    setActionLoadingId(tenant._id);
    try {
      const res = await api.approveTenant(tenant._id);
      setSuccess(res.message || `Approved ${tenant.name} successfully!`);
      await fetchTenants(search);
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to approve student');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (tenant) => {
    if (!window.confirm(`Are you sure you want to reject enrollment for ${tenant.name} (Room ${tenant.roomNumber})?`)) {
      return;
    }
    setError('');
    setSuccess('');
    setActionLoadingId(tenant._id);
    try {
      const res = await api.rejectTenant(tenant._id);
      setSuccess(res.message || `Rejected enrollment for ${tenant.name}.`);
      await fetchTenants(search);
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to reject student');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-light, #e2e8f0)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                Student Management
              </h2>
              {pendingTenants.length > 0 && (
                <span style={{
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
                }}>
                  <Clock size={11} /> {pendingTenants.length} Awaiting Approval
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
              Approve self-registered residents, direct enroll students, and view room allocations
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
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
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
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
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
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* Secret Join Code Banner for Owner/Staff */}
          <div style={{
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
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={15} color="var(--primary, #4f46e5)" />
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--primary, #4f46e5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Secret Student Enrollment Passcode
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                Students need this code to register. Their access stays locked until you approve them below.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                background: 'var(--bg-card, #ffffff)',
                padding: '4px 12px',
                borderRadius: '8px',
                border: '1.5px dashed var(--primary, #4f46e5)',
                color: 'var(--primary, #4f46e5)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}>
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
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1.5px solid var(--border-light, #e2e8f0)',
            marginBottom: '18px',
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'active' ? '2.5px solid var(--primary, #4f46e5)' : '2.5px solid transparent',
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'active' ? 800 : 600,
                color: activeTab === 'active' ? 'var(--primary, #4f46e5)' : 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={15} />
              <span>Enrolled Students</span>
              <span style={{
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeTab === 'active' ? 'var(--primary-light, #eef2ff)' : '#f1f5f9',
                color: activeTab === 'active' ? 'var(--primary, #4f46e5)' : '#64748b',
                fontWeight: 700,
              }}>
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
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'pending' ? 800 : 600,
                color: activeTab === 'pending' ? '#b45309' : 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px',
                transition: 'all 0.15s ease',
              }}
            >
              <Clock size={15} color={pendingTenants.length > 0 ? '#d97706' : undefined} />
              <span>Pending Approvals</span>
              {pendingTenants.length > 0 ? (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  fontWeight: 800,
                }}>
                  {pendingTenants.length}
                </span>
              ) : (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontWeight: 700,
                }}>
                  0
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'add' ? '2.5px solid var(--primary, #4f46e5)' : '2.5px solid transparent',
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'add' ? 800 : 600,
                color: activeTab === 'add' ? 'var(--primary, #4f46e5)' : 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-2px',
                transition: 'all 0.15s ease',
              }}
            >
              <UserPlus size={15} />
              <span>+ Direct Enroll</span>
            </button>
          </div>

          {/* TAB 1: Enrolled Active Students */}
          {activeTab === 'active' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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
                <div style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: 'var(--bg-hover, #f8fafc)',
                  borderRadius: '10px',
                  border: '1px dashed var(--border-light, #e2e8f0)',
                }}>
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
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{t.name}</span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            background: '#ecfdf5',
                            color: '#059669',
                            borderRadius: '6px',
                            border: '1px solid #a7f3d0',
                          }}>
                            Active
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', display: 'flex', gap: '14px', marginTop: '3px' }}>
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

                      <span style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        letterSpacing: '0.02em',
                      }}>
                        Room {t.roomNumber}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Pending Approvals Queue */}
          {activeTab === 'pending' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#b45309" />
                  <span style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                    Students waiting for your review. Their portal remains locked until you approve them.
                  </span>
                </div>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#b45309' }}>
                  {pendingTenants.length} Pending
                </span>
              </div>

              {pendingTenants.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'var(--bg-hover, #f8fafc)',
                  borderRadius: '10px',
                  border: '1px dashed var(--border-light, #e2e8f0)',
                }}>
                  <ShieldCheck size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 800, color: 'var(--text-main, #0f172a)', fontSize: '0.96rem' }}>
                    All Clear! No Pending Requests
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 0' }}>
                    When a new student signs up using your Secret Join Passcode (<code>{pg?.joinCode || 'GH-2024'}</code>), their request will appear here for you to verify room allocation and approve or reject.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                  {pendingTenants.map((t) => {
                    const isProcessing = actionLoadingId === t._id;
                    const dateStr = t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Just now';

                    return (
                      <div
                        key={t._id}
                        style={{
                          background: 'var(--bg-card, #ffffff)',
                          border: '1.5px solid #fde68a',
                          borderRadius: '10px',
                          padding: '14px 16px',
                          boxShadow: '0 2px 4px rgba(217, 119, 6, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '14px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ minWidth: '220px', flex: '1 1 auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-main, #0f172a)' }}>
                              {t.name}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.74rem',
                            }}>
                              Room {t.roomNumber}
                            </span>
                            <span style={{
                              fontSize: '0.68rem',
                              color: 'var(--text-light, #94a3b8)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}>
                              <Calendar size={11} /> {dateStr}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', display: 'flex', gap: '14px', marginTop: '6px' }}>
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

                        {/* Actions */}
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
                              borderRadius: '6px',
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
                              borderRadius: '6px',
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
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <Check size={14} />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Direct Manual Add Form */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddTenant} style={{
              background: 'var(--bg-hover, #f8fafc)',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid var(--border-light, #e2e8f0)',
            }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                  Enroll Student Directly
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                  Students added directly by you are immediately approved and do not need passcode verification.
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
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 204-B"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    required
                  />
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
    </div>
  );
}
