import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LogOut,
  Bell,
  FileText,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  Users,
  Building2,
  Check,
  Plus,
  Loader2,
  X,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

export default function Navbar({ onOpenNotices, onOpenProfile, onOpenRules, tenantCount, onOpenTenants, onOpenTeamDrawer, pendingTasksCount = 0 }) {
  const { user, pg, myPGs, logout, switchActivePG, addPGBranch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Multi-branch state for PG Owners
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef(null);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [switchingBranchId, setSwitchingBranchId] = useState(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    pgType: 'girls',
    address: '',
    contactPhone: '',
    curfewTime: '09:30 PM',
    wardenPhone: '',
  });
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState('');

  const isOwner = user?.role === 'owner';
  const isStaff = isOwner || user?.role === 'editor';
  const displayTenantCount = tenantCount !== undefined ? tenantCount : (pg?.tenantCount ?? 0);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setBranchDropdownOpen(false);
      }
    }

    function handleScroll(event) {
      // Don't close if scrolling inside the branch list itself
      if (branchDropdownRef.current && branchDropdownRef.current.contains(event.target)) {
        return;
      }
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      setBranchDropdownOpen(false);
      setDropdownOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

  const getPgTypeBadge = (type) => {
    if (type === 'girls') {
      return {
        label: 'Girls PG',
        bg: 'rgba(190, 24, 93, 0.12)',
        color: '#be185d',
        border: '1px solid rgba(190, 24, 93, 0.28)',
      };
    }
    if (type === 'co-ed') {
      return {
        label: 'Co-Ed PG',
        bg: 'rgba(124, 58, 237, 0.12)',
        color: '#7c3aed',
        border: '1px solid rgba(124, 58, 237, 0.28)',
      };
    }
    return {
      label: 'Boys PG',
      bg: 'rgba(79, 70, 229, 0.12)',
      color: '#4f46e5',
      border: '1px solid rgba(79, 70, 229, 0.28)',
    };
  };

  const handleSwitchBranch = async (targetPgId) => {
    if (targetPgId === pg?._id || switchingBranchId) return;
    setSwitchingBranchId(targetPgId);
    try {
      await switchActivePG(targetPgId);
      setBranchDropdownOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to switch PG branch');
    } finally {
      setSwitchingBranchId(null);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name.trim() || !branchForm.address.trim()) {
      setBranchError('Please provide both PG branch name and address.');
      return;
    }
    setBranchLoading(true);
    setBranchError('');
    try {
      await addPGBranch(branchForm);
      setBranchModalOpen(false);
      setBranchDropdownOpen(false);
      setBranchForm({
        name: '',
        pgType: 'girls',
        address: '',
        contactPhone: '',
        curfewTime: '09:30 PM',
        wardenPhone: '',
      });
    } catch (err) {
      setBranchError(err.message || 'Failed to create new PG branch');
    } finally {
      setBranchLoading(false);
    }
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 'owner':
        return { text: 'Owner', badgeClass: 'badge-role-owner', icon: '👑' };
      case 'editor':
        return { text: 'Staff Editor', badgeClass: 'badge-role-editor', icon: '🛠️' };
      case 'tenant':
        return { text: `Tenant (${user?.roomNumber || 'Room'})`, badgeClass: 'badge-role-tenant', icon: '🏠' };
      default:
        return { text: role, badgeClass: '', icon: '👤' };
    }
  };

  const roleInfo = getRoleInfo(user?.role);
  const noticeCount = pg?.noticeBoard?.length || 0;

  return (
    <header style={{
      background: 'var(--bg-card, #ffffff)',
      borderBottom: '1px solid var(--border-light, #e2e8f0)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 14px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Left: Brand & PG Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: 0,
          flexShrink: 1,
        }}>
          <img
            src="/logo.png"
            alt="PG Management System"
            width="38"
            height="38"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              border: '1.5px solid var(--border-light, #e2e8f0)',
              background: 'var(--bg-card, #ffffff)',
            }}
          />

          <div style={{ minWidth: 0, flexShrink: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', minWidth: 0 }}>
              <div
                className="navbar-pg-name"
                title={pg?.name || 'PG Management'}
              >
                {pg?.name || 'PG Management'}
              </div>

              {/* PG Type Badge (hidden on mobile to preserve space) */}
              {pg?.pgType && (() => {
                const badge = getPgTypeBadge(pg.pgType);
                return (
                  <span
                    className="hide-on-mobile"
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      whiteSpace: 'nowrap',
                      background: badge.bg,
                      color: badge.color,
                      border: badge.border,
                      flexShrink: 0,
                    }}
                  >
                    {badge.label}
                  </span>
                );
              })()}

              {/* Branch Switcher for Owner */}
              {isOwner && (
                <div style={{ position: 'relative', flexShrink: 0 }} ref={branchDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 7px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      background: 'var(--bg-hover, #f8fafc)',
                      color: 'var(--primary, #4f46e5)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                    title="Switch branch or add new PG branch"
                  >
                    <Building2 size={12} color="var(--primary, #4f46e5)" />
                    <span className="hide-on-mobile">Branches </span>
                    <span>({myPGs?.length || 1})</span>
                    <ChevronDown size={11} />
                  </button>

                  {/* Branch Switcher Dropdown */}
                  {branchDropdownOpen && (
                    <div
                      className="navbar-branch-dropdown"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '28px',
                        width: '280px',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 55%, #f7fee7 100%)',
                        borderRadius: '14px',
                        boxShadow: '0 14px 34px -4px rgba(16, 185, 129, 0.18), 0 4px 12px rgba(0, 0, 0, 0.05)',
                        border: '1.5px solid #86efac',
                        padding: '10px',
                        zIndex: 200,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{
                        padding: '4px 6px 8px',
                        borderBottom: '1px solid #bbf7d0',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          My PG Branches
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#047857', background: '#dcfce7', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '10px' }}>
                          {(myPGs?.length || 1)} Total
                        </span>
                      </div>

                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {(myPGs && myPGs.length > 0 ? myPGs : (pg ? [pg] : [])).map((branch) => {
                          const isActive = branch._id === pg?._id;
                          const badge = getPgTypeBadge(branch.pgType);
                          return (
                            <div
                              key={branch._id}
                              onClick={() => handleSwitchBranch(branch._id)}
                              style={{
                                padding: '9px 10px',
                                borderRadius: '9px',
                                cursor: isActive ? 'default' : 'pointer',
                                background: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                                border: isActive ? '1.5px solid #10b981' : '1px solid rgba(167, 243, 208, 0.6)',
                                boxShadow: isActive ? '0 2px 8px rgba(16, 185, 129, 0.14)' : 'none',
                                marginBottom: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = '#ffffff';
                                  e.currentTarget.style.borderColor = '#34d399';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.65)';
                                  e.currentTarget.style.borderColor = 'rgba(167, 243, 208, 0.6)';
                                }
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    fontWeight: 700,
                                    fontSize: '0.84rem',
                                    color: isActive ? '#064e3b' : '#1e293b',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}>
                                    {branch.name}
                                  </span>
                                  {isActive && <Check size={14} color="#059669" strokeWidth={3} />}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: '6px',
                                    background: badge.bg,
                                    color: badge.color,
                                    border: badge.border,
                                  }}>
                                    {badge.label}
                                  </span>
                                  <span style={{
                                    fontSize: '0.68rem',
                                    color: '#4b5563',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}>
                                    {branch.address ? branch.address.split(',')[0] : ''}
                                  </span>
                                </div>
                              </div>
                              {switchingBranchId === branch._id && (
                                <Loader2 size={14} className="animate-spin" color="#059669" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ borderTop: '1px solid #bbf7d0', marginTop: '6px', paddingTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setBranchDropdownOpen(false);
                            setBranchModalOpen(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1.5px dashed #10b981',
                            background: '#ffffff',
                            color: '#047857',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0fdf4';
                            e.currentTarget.style.borderColor = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#10b981';
                          }}
                        >
                          <Plus size={14} />
                          <span>+ Add New PG Branch</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div
              className="navbar-pg-address"
              title={pg?.address || 'PG Portal'}
            >
              {pg?.address ? pg.address.split(',')[0] : 'PG Portal'}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            style={{ width: '34px', height: '34px', borderRadius: '9px' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={16} color="#fbbf24" />
            ) : (
              <Moon size={16} color="#6366f1" />
            )}
          </button>

          {/* Team Workspace Drawer Toggle (Owner & Staff) */}
          {(user?.role === 'owner' || user?.role === 'editor') && onOpenTeamDrawer && (
            <button
              type="button"
              onClick={onOpenTeamDrawer}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '34px',
                padding: '0 10px',
                borderRadius: '9px',
                border: '1px solid var(--border-light, #e2e8f0)',
                background: 'var(--bg-hover, #f8fafc)',
                color: 'var(--primary, #4f46e5)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Team Workspace: Chat & Assigned Tasks"
            >
              <MessageSquare size={15} />
              <span className="hide-on-mobile">Team Hub</span>
              {pendingTasksCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    borderRadius: '999px',
                    padding: '1px 5px',
                    minWidth: '15px',
                    textAlign: 'center',
                  }}
                >
                  {pendingTasksCount}
                </span>
              )}
            </button>
          )}

          {/* Notice Bell */}
          <button
            onClick={onOpenNotices}
            style={{
              position: 'relative',
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              border: '1px solid var(--border-light, #e2e8f0)',
              background: 'var(--bg-hover, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary, #4f46e5)',
            }}
            title="Notice Board"
          >
            <Bell size={16} />
            {noticeCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 800,
                borderRadius: '999px',
                padding: '1px 4px',
                minWidth: '15px',
                textAlign: 'center',
              }}>
                {noticeCount}
              </span>
            )}
          </button>

          {/* Desktop Shortcuts (Hidden on Tablet & Laptop Split) */}
          <button
            onClick={onOpenRules}
            className="btn btn-secondary hide-on-tablet"
            style={{ padding: '6px 10px', fontSize: '0.78rem', height: '34px' }}
          >
            <FileText size={14} color="#64748b" />
            <span>Rules</span>
          </button>

          {user?.role === 'owner' && (
            <button
              onClick={onOpenProfile}
              className="btn btn-secondary hide-on-tablet"
              style={{ padding: '6px 10px', fontSize: '0.78rem', height: '34px' }}
            >
              <Settings size={14} color="#64748b" />
              <span>PG Profile</span>
            </button>
          )}

          {/* Profile Dropdown Trigger */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 6px',
                background: 'var(--bg-hover, #f8fafc)',
                border: '1px solid var(--border-light, #e2e8f0)',
                borderRadius: '999px',
                height: '34px',
              }}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.75rem',
                flexShrink: 0,
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Desktop Name & Role Badge */}
              <span className="hide-on-tablet" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                {user?.name?.split(' ')[0]}
              </span>

              <span className={`badge ${roleInfo.badgeClass} hide-on-tablet`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                {roleInfo.text}
              </span>

              <ChevronDown size={13} color="var(--text-muted, #64748b)" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '40px',
                width: '210px',
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '14px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-light, #e2e8f0)',
                padding: '8px',
                zIndex: 150,
                boxSizing: 'border-box',
              }}>
                {/* User Header */}
                <div style={{
                  padding: '6px 8px 8px',
                  borderBottom: '1px solid var(--border-light, #f1f5f9)',
                  marginBottom: '4px',
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${roleInfo.badgeClass}`} style={{ fontSize: '0.62rem' }}>
                      {roleInfo.icon} {roleInfo.text}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => { onOpenRules(); setDropdownOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '7px',
                    fontSize: '0.82rem',
                    color: 'var(--text-main, #334155)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FileText size={15} color="var(--text-muted, #64748b)" />
                  <span>PG Rules & Contact</span>
                </button>

                {user?.role === 'owner' && (
                  <button
                    onClick={() => { onOpenProfile(); setDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '7px',
                      fontSize: '0.82rem',
                      color: 'var(--text-main, #334155)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Settings size={15} color="var(--text-muted, #64748b)" />
                    <span>Edit PG Profile</span>
                  </button>
                )}

                {isStaff && onOpenTenants && (
                  <button
                    onClick={() => { onOpenTenants(); setDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      borderRadius: '7px',
                      fontSize: '0.82rem',
                      color: 'var(--text-main, #334155)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={15} color="#0891b2" />
                      <span>Students & Rooms</span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 'rgba(6, 182, 212, 0.12)',
                      color: '#0891b2',
                      padding: '1px 6px',
                      borderRadius: '6px',
                    }}>
                      {tenantCount || 0}
                    </span>
                  </button>
                )}

                {isStaff && onOpenTeamDrawer && (
                  <button
                    onClick={() => { onOpenTeamDrawer(); setDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      borderRadius: '7px',
                      fontSize: '0.82rem',
                      color: 'var(--text-main, #334155)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={15} color="var(--primary, #4f46e5)" />
                      <span>Team Hub (Chat & Tasks)</span>
                    </div>
                    {pendingTasksCount > 0 && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: '#fee2e2',
                        color: '#ef4444',
                        padding: '1px 6px',
                        borderRadius: '6px',
                      }}>
                        {pendingTasksCount}
                      </span>
                    )}
                  </button>
                )}

                <div style={{ borderTop: '1px solid var(--border-light, #f1f5f9)', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      borderRadius: '7px',
                      fontSize: '0.82rem',
                      color: '#ef4444',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-light, #fef2f2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={15} color="#ef4444" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Logout on Desktop */}
          <button
            onClick={logout}
            className="btn btn-secondary hide-on-mobile"
            style={{ height: '34px', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Log Out"
          >
            <LogOut size={14} color="#ef4444" />
            <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>Exit</span>
          </button>
        </div>
      </div>

      {/* Add New Branch Modal for PG Owners */}
      {branchModalOpen && (
        <div className="modal-backdrop" onClick={() => setBranchModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--primary, #4f46e5)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                  Add New PG Branch
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBranchModalOpen(false)}
                style={{ color: 'var(--text-light, #94a3b8)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} style={{ padding: '20px' }}>
              {branchError && (
                <div style={{
                  padding: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontSize: '0.82rem',
                  marginBottom: '14px',
                }}>
                  {branchError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Branch Facility Category *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'girls', label: 'Girls PG', color: '#be185d', bg: 'rgba(190, 24, 93, 0.08)' },
                    { id: 'boys', label: 'Boys PG', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.08)' },
                    { id: 'co-ed', label: 'Co-Ed PG', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBranchForm((prev) => ({ ...prev, pgType: t.id }))}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        border: branchForm.pgType === t.id ? `2px solid ${t.color}` : '1.5px solid var(--border-light, #e2e8f0)',
                        background: branchForm.pgType === t.id ? t.bg : 'var(--bg-card, #ffffff)',
                        color: branchForm.pgType === t.id ? t.color : 'var(--text-muted, #64748b)',
                        fontWeight: branchForm.pgType === t.id ? 700 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>PG Branch Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sunrise Girls Hostel (Branch 2)"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Physical Address *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sector 14, Opposite Metro Station"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Curfew / Gate Closing</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 09:30 PM"
                    value={branchForm.curfewTime}
                    onChange={(e) => setBranchForm({ ...branchForm, curfewTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Warden / Caretaker Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +91 9876543210"
                    value={branchForm.wardenPhone}
                    onChange={(e) => setBranchForm({ ...branchForm, wardenPhone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => setBranchModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={branchLoading}
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {branchLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>{branchLoading ? 'Creating Branch...' : 'Create Branch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
