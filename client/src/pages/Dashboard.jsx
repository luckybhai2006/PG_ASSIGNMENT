import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
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

import {
  Plus,
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Inbox,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = ['All', 'Plumbing', 'Electricity', 'Wi-Fi', 'Cleaning', 'Food', 'Carpentry', 'Other'];
const STATUS_TABS = [
  { id: 'All', label: 'All Issues' },
  { id: 'Pending', label: 'Pending', icon: Clock },
  { id: 'In Progress', label: 'In Progress', icon: AlertCircle },
  { id: 'Resolved', label: 'Resolved', icon: CheckCircle2 },
];
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Urgent'];

export default function Dashboard() {
  const { user, pg, needsInviteAcceptance } = useAuth();

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
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

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
  }, [needsInviteAcceptance, selectedStatus, selectedCategory, selectedPriority, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  if (needsInviteAcceptance) {
    return <AcceptInviteBanner />;
  }

  const handleOpenStatusModal = (complaint) => {
    setSelectedComplaintForStatus(complaint);
    setIsStatusModalOpen(true);
  };

  const isOwner = user?.role === 'owner';
  const isEditor = user?.role === 'editor';
  const isStaff = isOwner || isEditor;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
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
      />

      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px 12px',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}>
        {/* Welcome & Action Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#4f46e5',
                background: '#eef2ff',
                padding: '2px 8px',
                borderRadius: '6px',
              }}>
                {isStaff ? 'Operations Hub' : 'Resident Portal'}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                • {pg?.name || 'Green Heights Premium PG'}
              </span>
            </div>

            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginTop: '4px',
              wordBreak: 'break-word',
            }}>
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
              {isStaff
                ? 'Manage resident complaints and facility workflows.'
                : 'Raise room issues and track live resolution status.'}
            </p>
          </div>

          {/* Action Buttons: Responsive App-Style Grid */}
          <div style={{ width: '100%', maxWidth: isStaff ? (isOwner ? '420px' : '320px') : 'auto' }}>
            <style>{`
              .action-buttons-wrap {
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: flex-end;
              }
              @media (max-width: 640px) {
                .action-buttons-wrap {
                  display: grid !important;
                  grid-template-columns: 1fr 1fr;
                  gap: 8px !important;
                  width: 100% !important;
                  margin-top: 4px;
                }
                .primary-action-btn {
                  grid-column: 1 / -1 !important;
                  width: 100% !important;
                }
                .secondary-action-btn {
                  width: 100% !important;
                }
              }
            `}</style>

            <div className="action-buttons-wrap">
              {isOwner && (
                <button
                  onClick={() => setIsStaffModalOpen(true)}
                  className="btn btn-secondary secondary-action-btn"
                  style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem' }}
                  title="Manage Staff Editors"
                >
                  <Users size={15} color="#8b5cf6" />
                  <span>Staff</span>
                </button>
              )}

              {isStaff && (
                <button
                  onClick={() => setIsTenantModalOpen(true)}
                  className="btn btn-secondary secondary-action-btn"
                  style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem' }}
                  title="Manage PG Tenants"
                >
                  <UserPlus size={15} color="#06b6d4" />
                  <span>Tenants</span>
                </button>
              )}

              <button
                onClick={() => setIsComplaintModalOpen(true)}
                className="btn btn-primary primary-action-btn"
                style={{ height: '38px', padding: '0 16px', fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                <span>{isStaff ? 'File Ticket for Tenant' : 'Raise Complaint'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Symmetrical High-Level Metric Stat Cards */}
        <StatCards
          stats={stats}
          activeStatus={selectedStatus}
          onFilterStatus={(status) => setSelectedStatus(status)}
        />

        {/* Filter & Search Box */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
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
              background: '#f1f5f9',
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
                      background: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#0f172a' : '#64748b',
                      boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <span>{tab.label}</span>
                    {count !== null && (
                      <span style={{
                        background: isActive ? '#eef2ff' : '#e2e8f0',
                        color: isActive ? '#4f46e5' : '#64748b',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Category:</span>
                <select
                  className="form-select"
                  style={{ height: '36px', padding: '0 8px', fontSize: '0.78rem', width: 'auto' }}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Priority:</span>
                <select
                  className="form-select"
                  style={{ height: '36px', padding: '0 8px', fontSize: '0.78rem', width: 'auto' }}
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
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              Loading complaints...
            </div>
          </div>
        ) : complaints.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 16px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#f1f5f9',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Inbox size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              No Complaints Found
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', maxWidth: '380px', margin: '6px auto 16px', lineHeight: 1.5 }}>
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
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                Showing <strong style={{ color: '#0f172a' }}>{complaints.length}</strong> complaints
              </span>
            </div>

            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint._id}
                complaint={complaint}
                userRole={user?.role}
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
        />
      )}

      {isStaff && (
        <TenantModal
          isOpen={isTenantModalOpen}
          onClose={() => setIsTenantModalOpen(false)}
          onTenantAdded={fetchData}
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
