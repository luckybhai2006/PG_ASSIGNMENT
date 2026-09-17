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
} from 'lucide-react';

export default function Navbar({ onOpenNotices, onOpenProfile, onOpenRules, tenantCount, onOpenTenants }) {
  const { user, pg, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isOwner = user?.role === 'owner';
  const isStaff = isOwner || user?.role === 'editor';
  const displayTenantCount = tenantCount !== undefined ? tenantCount : (pg?.tenantCount ?? 0);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div
                className="navbar-pg-name"
                title={pg?.name || 'PG Management'}
              >
                {pg?.name || 'PG Management'}
              </div>
              {/* {isStaff && (
                <button
                  type="button"
                  onClick={onOpenTenants}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(6, 182, 212, 0.12)',
                    color: '#0891b2',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '16px',
                    cursor: onOpenTenants ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Total ${displayTenantCount} students enrolled in this PG (Click to view)`}
                >
                  <Users size={12} color="#0891b2" />
                  <span>{displayTenantCount} Students</span>
                </button>
              )} */}
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

          {/* Desktop Shortcuts (Hidden on Mobile) */}
          <button
            onClick={onOpenRules}
            className="btn btn-secondary hide-on-mobile"
            style={{ padding: '6px 10px', fontSize: '0.78rem', height: '34px' }}
          >
            <FileText size={14} color="#64748b" />
            <span>Rules</span>
          </button>

          {user?.role === 'owner' && (
            <button
              onClick={onOpenProfile}
              className="btn btn-secondary hide-on-mobile"
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
              <span className="hide-on-mobile" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                {user?.name?.split(' ')[0]}
              </span>

              <span className={`badge ${roleInfo.badgeClass} hide-on-mobile`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
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
                      borderRadius: '12px'
                    }}>
                      {displayTenantCount}
                    </span>
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
    </header>

  );
}
