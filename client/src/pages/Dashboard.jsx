import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../services/socket';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import StatCards from '../components/StatCards';
import ComplaintCard from '../components/ComplaintCard';
import ComplaintModal from '../components/ComplaintModal';
import StatusUpdateModal from '../components/StatusUpdateModal';
import StaffModal from '../components/StaffModal';
import TenantModal from '../components/TenantModal';
import NoticeBoardModal from '../components/NoticeBoardModal';
import PGProfileModal from '../components/PGProfileModal';
import RulesModal from '../components/RulesModal';
import AcceptInviteBanner from '../components/AcceptInviteBanner';
import TenantPendingBanner from '../components/TenantPendingBanner';

import {
  Plus,
  Users,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  BellRing,
  Inbox,
  X,
} from 'lucide-react';

const CATEGORIES = ['All', 'Plumbing', 'Electricity', 'Wi-Fi', 'Cleaning', 'Food', 'Carpentry', 'Other'];
const STATUS_TABS = [
  { id: 'All', label: 'All Issues' },
  { id: 'Pending', label: 'Pending', icon: Clock },
  { id: 'In Progress', label: 'In Progress', icon: AlertCircle },
  { id: 'Resolved', label: 'Resolved', icon: CheckCircle2 },
];
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

export default function Dashboard() {
  const { user, pg, needsInviteAcceptance, needsTenantApproval } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedComplaintForStatus, setSelectedComplaintForStatus] = useState(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenantModalInitialTab, setTenantModalInitialTab] = useState('active');
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const handleOpenTenants = (tab = 'active') => {
    setTenantModalInitialTab(tab);
    setIsTenantModalOpen(true);
  };

  const fetchData = useCallback(async () => {
    if (needsInviteAcceptance) return;
    setLoading(true);
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        api.getStats(),
        api.getComplaints({
          status: selectedStatus,
          category: selectedCategory,
          priority: selectedPriority,
          search: searchQuery,
        }),
      ]);
      setStats(statsRes.stats);
      setComplaints(complaintsRes.complaints || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [needsInviteAcceptance, selectedStatus, selectedCategory, selectedPriority, searchQuery, pg?._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Socket.io listener for new complaints, status updates, and room maintenance
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewComplaint = (data) => {
      fetchData();
      showToast({
        title: '🔔 New Complaint Registered',
        message: data.message || `A new issue was reported.`,
        type: 'bell',
        duration: 5000,
      });
    };

    const handleComplaintStatusUpdated = (data) => {
      fetchData();
      showToast({
        title: '📋 Ticket Status Updated',
        message: data.message || `A complaint status was changed.`,
        type: 'info',
        duration: 4000,
      });
    };

    const handleRoomStatusUpdated = (data) => {
      showToast({
        title: '🏢 Room Status Changed',
        message: data.message,
        type: data.targetStatus === 'maintenance' ? 'warning' : 'success',
        duration: 4500,
      });
    };

    socket.on('NEW_COMPLAINT', handleNewComplaint);
    socket.on('COMPLAINT_STATUS_UPDATED', handleComplaintStatusUpdated);
    socket.on('MY_COMPLAINT_STATUS_UPDATED', handleComplaintStatusUpdated);
    socket.on('ROOM_STATUS_UPDATED', handleRoomStatusUpdated);

    return () => {
      socket.off('NEW_COMPLAINT', handleNewComplaint);
      socket.off('COMPLAINT_STATUS_UPDATED', handleComplaintStatusUpdated);
      socket.off('MY_COMPLAINT_STATUS_UPDATED', handleComplaintStatusUpdated);
      socket.off('ROOM_STATUS_UPDATED', handleRoomStatusUpdated);
    };
  }, [fetchData, showToast]);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchData();
  };

  if (needsInviteAcceptance) {
    return <AcceptInviteBanner />;
  }

  if (needsTenantApproval) {
    return <TenantPendingBanner />;
  }

  const handleOpenStatusModal = (complaint) => {
    setSelectedComplaintForStatus(complaint);
    setIsStatusModalOpen(true);
  };

  const isOwner = user?.role === 'owner';
  const isEditor = user?.role === 'editor';
  const isStaff = isOwner || isEditor;
  const studentCount = stats?.totalTenants !== undefined ? stats.totalTenants : (pg?.tenantCount ?? 0);
  const pendingStudentsCount = stats?.pendingStudents || 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main, #f8fafc)',
      paddingBottom: '60px',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Top Navigation */}
      <Navbar
        onOpenNotices={() => setIsNoticeModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenTenants={() => handleOpenTenants('active')}
        tenantCount={studentCount}
      />

      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px 12px',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}>
        {/* Pending Student Approval Alert for Owner & Staff */}
        {isStaff && pendingStudentsCount > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid #fde68a',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <BellRing size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#92400e' }}>
                  {pendingStudentsCount} Student Enrollment Request{pendingStudentsCount > 1 ? 's' : ''} Awaiting Approval
                </div>
                <div style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '1px' }}>
                  New students used your join code to enroll. Verify their room allocations and approve or reject.
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenTenants('pending')}
              className="btn btn-primary"
              style={{
                height: '34px',
                padding: '0 14px',
                fontSize: '0.8rem',
                background: '#d97706',
                borderColor: '#b45309',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              Review Requests ({pendingStudentsCount})
            </button>
          </div>
        )}

        {/* Welcome & Action Banner */}
        <div className="dashboard-header-row">
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--primary, #4f46e5)',
                background: 'var(--primary-light, #eef2ff)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}>
                {isStaff ? 'Operations Hub' : 'Resident Portal'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                • {pg?.name || 'Green Heights Premium PG'}
              </span>
              {isStaff && (
                <button
                  type="button"
                  onClick={() => handleOpenTenants('active')}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#0891b2',
                    background: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  title="Click to view & manage students"
                >
                  <Users size={12} color="#0891b2" />
                  <span>{studentCount} Students Enrolled</span>
                </button>
              )}
            </div>

            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--text-main, #0f172a)',
              letterSpacing: '-0.02em',
              marginTop: '4px',
              wordBreak: 'break-word',
            }}>
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.82rem', marginTop: '2px' }}>
              {isStaff
                ? 'Manage resident complaints and facility workflows.'
                : 'Raise room issues and track live resolution status.'}
            </p>
          </div>

          {/* Action Buttons: Responsive Fluid Toolbar */}
          <div className="action-buttons-wrap">
            {isOwner && (
              <button
                onClick={() => setIsStaffModalOpen(true)}
                className="btn btn-secondary secondary-action-btn"
                style={{ height: '38px', padding: '0 14px', fontSize: '0.82rem' }}
                title="Manage Staff Editors"
              >
                <Users size={15} color="#8b5cf6" />
                <span>Staff</span>
              </button>
            )}

            {isStaff && (
              <button
                onClick={() => handleOpenTenants(pendingStudentsCount > 0 ? 'pending' : 'active')}
                className="btn btn-secondary secondary-action-btn"
                style={{
                  height: '38px',
                  padding: '0 14px',
                  fontSize: '0.82rem',
                  borderColor: pendingStudentsCount > 0 ? '#f59e0b' : undefined,
                }}
                title="Manage PG Students / Tenants"
              >
                <Users size={15} color={pendingStudentsCount > 0 ? '#d97706' : '#06b6d4'} />
                <span>Students ({studentCount})</span>
                {pendingStudentsCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    marginLeft: '2px',
                  }}>
                    {pendingStudentsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setIsComplaintModalOpen(true)}
              className="btn btn-primary primary-action-btn"
              style={{ height: '38px', padding: '0 18px', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              <span>{isStaff ? 'File Ticket for Tenant' : 'Raise Complaint'}</span>
            </button>
          </div>
        </div>

        {/* Symmetrical High-Level Metric Stat Cards */}
        <StatCards
          stats={stats}
          activeStatus={selectedStatus}
          activePriority={selectedPriority}
          onFilterStatus={(status) => setSelectedStatus(status)}
          onFilterPriority={(priority) => setSelectedPriority(priority)}
          isStaff={isStaff}
          onOpenTenants={() => handleOpenTenants('active')}
        />

        {/* Filter & Search Box */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '14px',
          border: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          padding: '14px',
          marginBottom: '16px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Status Tabs Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginBottom: '12px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'flex',
              background: 'var(--bg-hover, #f1f5f9)',
              padding: '3px',
              borderRadius: '10px',
              gap: '3px',
              overflowX: 'auto',
              width: '100%',
              scrollbarWidth: 'none',
              boxSizing: 'border-box',
            }}>
              {STATUS_TABS.map((tab) => {
                const isActive = selectedStatus === tab.id;
                let count = null;
                if (stats) {
                  if (tab.id === 'All') count = stats.total;
                  if (tab.id === 'Pending') count = stats.pending;
                  if (tab.id === 'In Progress') count = stats.inProgress;
                  if (tab.id === 'Resolved') count = stats.resolved;
                }

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedStatus(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: isActive ? 'var(--bg-card, #ffffff)' : 'transparent',
                      color: isActive ? 'var(--text-main, #0f172a)' : 'var(--text-muted, #64748b)',
                      boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <span>{tab.label}</span>
                    {count !== null && (
                      <span style={{
                        background: isActive ? 'var(--primary-light, #eef2ff)' : 'var(--bg-hover, #e2e8f0)',
                        color: isActive ? 'var(--primary, #4f46e5)' : 'var(--text-muted, #64748b)',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '999px',
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleRefresh}
              className="btn btn-secondary"
              style={{ height: '34px', padding: '0 10px', fontSize: '0.78rem', flexShrink: 0 }}
              title="Refresh"
            >
              <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
          </div>

          {/* Search & Dropdown Filters Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 180px', width: '100%', minWidth: 0, maxWidth: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search ticket or room..."
                style={{ paddingLeft: '32px', paddingRight: searchQuery ? '30px' : '10px', height: '36px', fontSize: '0.82rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '9px',
                    color: '#94a3b8',
                    padding: '2px',
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="filter-controls-wrap">
              <div className="filter-control-item">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap' }}>Category:</span>
                <select
                  className="form-select"
                  style={{ height: '36px', padding: '0 8px', fontSize: '0.78rem' }}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="filter-control-item">
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap' }}>Priority:</span>
                <select
                  className="form-select"
                  style={{ height: '36px', padding: '0 8px', fontSize: '0.78rem' }}
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  {PRIORITIES.map((pri) => (
                    <option key={pri} value={pri}>{pri}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Complaints Listing Stream */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '50px 0',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '14px',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--border-light, #e2e8f0)',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Loading complaints...
            </div>
          </div>
        ) : complaints.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 16px',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '14px',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--bg-hover, #f1f5f9)',
              color: 'var(--text-light, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Inbox size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              No Complaints Found
            </h3>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.82rem', maxWidth: '380px', margin: '6px auto 16px', lineHeight: 1.5 }}>
              {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedPriority !== 'All'
                ? 'No tickets match your filter criteria.'
                : 'All PG amenities are running smoothly without issues!'}
            </p>
            <button
              onClick={() => setIsComplaintModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', height: '36px' }}
            >
              <Plus size={15} />
              <span>{isStaff ? 'File Ticket for Tenant' : 'Raise a Complaint'}</span>
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              padding: '0 2px',
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted, #475569)' }}>
                Showing <strong style={{ color: 'var(--text-main, #0f172a)' }}>{complaints.length}</strong> complaints
              </span>
            </div>

            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint._id}
                complaint={complaint}
                userRole={user?.role}
                canManageStatus={
                  isOwner || (isEditor && user?.permissions?.manageComplaints !== false)
                }
                onUpdateStatus={handleOpenStatusModal}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <ComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        onComplaintCreated={fetchData}
        userRole={user?.role}
      />

      <StatusUpdateModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        complaint={selectedComplaintForStatus}
        onUpdated={fetchData}
      />

      {isOwner && (
        <StaffModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          activePgId={pg?._id}
        />
      )}

      {isStaff && (
        <TenantModal
          isOpen={isTenantModalOpen}
          onClose={() => setIsTenantModalOpen(false)}
          onTenantAdded={fetchData}
          initialTab={tenantModalInitialTab}
        />
      )}

      <NoticeBoardModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
      />

      {isOwner && (
        <PGProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
