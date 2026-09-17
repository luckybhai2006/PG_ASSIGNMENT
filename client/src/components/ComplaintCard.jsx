import React, { useState } from 'react';
import {
  Wrench,
  Wifi,
  Zap,
  Droplets,
  Sparkles,
  Utensils,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Home,
  Shield,
  Calendar,
  MessageSquareQuote,
} from 'lucide-react';

export default function ComplaintCard({ complaint, onUpdateStatus, userRole, canManageStatus: canManageStatusProp }) {
  const [showTimeline, setShowTimeline] = useState(false);

  const getCategoryConfig = (category) => {
    switch (category) {
      case 'Plumbing':
        return { icon: Droplets, color: '#0284c7', bg: '#f0f9ff' };
      case 'Electricity':
        return { icon: Zap, color: '#d97706', bg: '#fffbeb' };
      case 'Wi-Fi':
        return { icon: Wifi, color: '#7c3aed', bg: '#f5f3ff' };
      case 'Cleaning':
        return { icon: Sparkles, color: '#059669', bg: '#ecfdf5' };
      case 'Food':
        return { icon: Utensils, color: '#e11d48', bg: '#fff1f2' };
      case 'Carpentry':
        return { icon: Wrench, color: '#ca8a04', bg: '#fefce8' };
      default:
        return { icon: HelpCircle, color: '#64748b', bg: '#f8fafc' };
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Pending':
        return {
          label: 'Pending',
          statusClass: 'status-pending',
          color: '#d97706',
          bg: '#fffbeb',
          border: '#fde68a',
          accent: '#f59e0b',
          icon: Clock,
        };
      case 'In Progress':
        return {
          label: 'In Progress',
          statusClass: 'status-inprogress',
          color: '#2563eb',
          bg: '#eff6ff',
          border: '#bfdbfe',
          accent: '#3b82f6',
          icon: AlertTriangle,
        };
      case 'Resolved':
        return {
          label: 'Resolved',
          statusClass: 'status-resolved',
          color: '#059669',
          bg: '#ecfdf5',
          border: '#a7f3d0',
          accent: '#10b981',
          icon: CheckCircle2,
        };
      case 'Rejected':
        return {
          label: 'Rejected',
          statusClass: 'status-rejected',
          color: '#b91c1c',
          bg: '#fef2f2',
          border: '#fecaca',
          accent: '#ef4444',
          icon: AlertTriangle,
        };
      default:
        return {
          label: status,
          statusClass: 'status-default',
          color: '#64748b',
          bg: '#f8fafc',
          border: '#e2e8f0',
          accent: '#94a3b8',
          icon: HelpCircle,
        };
    }
  };

  const getPriorityDot = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { color: '#dc2626', bg: '#fee2e2', text: 'Urgent', priorityClass: 'priority-urgent' };
      case 'High':
        return { color: '#ea580c', bg: '#ffedd5', text: 'High', priorityClass: 'priority-high' };
      case 'Medium':
        return { color: '#d97706', bg: '#fef3c7', text: 'Medium', priorityClass: 'priority-medium' };
      default:
        return { color: '#64748b', bg: '#f1f5f9', text: 'Low', priorityClass: 'priority-low' };
    }
  };

  const catConfig = getCategoryConfig(complaint.category);
  const statusConfig = getStatusConfig(complaint.status);
  const priorityConfig = getPriorityDot(complaint.priority);
  const CatIcon = catConfig.icon;
  const StatusIcon = statusConfig.icon;

  const canManageStatus = canManageStatusProp !== undefined 
    ? canManageStatusProp 
    : (userRole === 'owner' || userRole === 'editor');
  const ticketId = complaint._id ? `#CMP-${complaint._id.slice(-5).toUpperCase()}` : '#CMP-TKT';
  const displayRoom = (complaint.tenantId?.roomNumber && complaint.tenantId.roomNumber !== 'Unassigned') 
    ? complaint.tenantId.roomNumber 
    : (complaint.roomNumber || 'Common Area');

  return (
    <div className={`complaint-card-container ${statusConfig.statusClass}`}>
      {/* Visual Accent Indicator */}
      <div 
        className="complaint-card-accent-bar" 
        style={{ background: statusConfig.accent }} 
      />

      <div className="complaint-card-content">
        {/* Top Header Row */}
        <div className="complaint-header-row">
          {/* Metadata Badges */}
          <div className="complaint-meta-chips">
            <span className="complaint-ticket-id">
              {ticketId}
            </span>

            <span className="complaint-room-chip">
              <Home size={12} color="var(--primary, #4f46e5)" />
              <span>Rm {displayRoom}</span>
            </span>

            <span className="complaint-category-chip" style={{ color: catConfig.color }}>
              <CatIcon size={12} />
              <span>{complaint.category}</span>
            </span>

            <span className={`complaint-priority-chip ${priorityConfig.priorityClass}`}>
              <span className="complaint-priority-dot" />
              <span>{priorityConfig.text}</span>
            </span>
          </div>

          {/* Right Action & Status Badge */}
          <div className="complaint-header-actions">
            <span className={`complaint-status-badge ${statusConfig.statusClass}`}>
              <StatusIcon size={12} />
              <span>{statusConfig.label}</span>
            </span>

            {canManageStatus && (
              <button
                type="button"
                onClick={() => onUpdateStatus(complaint)}
                className="complaint-update-btn"
                title="Update ticket status or leave notes"
              >
                <Shield size={12} />
                <span>Update</span>
              </button>
            )}
          </div>
        </div>

        {/* Complaint Title */}
        <h3 className="complaint-card-title">
          {complaint.title}
        </h3>

        {/* Description Body */}
        <p className="complaint-card-desc">
          {complaint.description}
        </p>

        {/* Staff Remarks / Resolution Notes */}
        {complaint.resolutionNotes && (
          <div className={`complaint-remarks-box ${complaint.status === 'Resolved' ? 'is-resolved' : 'is-inprogress'}`}>
            <div className="complaint-remarks-header">
              <MessageSquareQuote size={14} />
              <span>Staff Remarks:</span>
            </div>
            <div className="complaint-remarks-text">
              {complaint.resolutionNotes}
            </div>
          </div>
        )}

        {/* Footer Meta Row */}
        <div className="complaint-card-footer">
          <div className="complaint-footer-left">
            <div className="complaint-tenant-pill">
              <span className="complaint-tenant-avatar">
                {(complaint.tenantId?.name || 'T').charAt(0).toUpperCase()}
              </span>
              <span className="complaint-tenant-name">
                {complaint.tenantId?.name || 'Tenant'}
              </span>
            </div>

            {complaint.registeredByType === 'staff' && (
              <span className="complaint-staff-badge">
                Filed by Staff
              </span>
            )}

            <span className="complaint-date-stamp">
              <Calendar size={12} />
              <span>
                {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </span>
          </div>

          {/* Activity Log Accordion Toggle */}
          {complaint.timeline && complaint.timeline.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTimeline(!showTimeline)}
              className="complaint-timeline-toggle"
              title="View timeline history"
            >
              <span>{showTimeline ? 'Hide History' : `History (${complaint.timeline.length})`}</span>
              {showTimeline ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        {/* Stepper Timeline Dropdown */}
        {showTimeline && complaint.timeline && (
          <div className="complaint-timeline-wrapper">
            <h4 className="complaint-timeline-title">
              Resolution Activity Timeline
            </h4>

            <div className="complaint-timeline-list">
              {complaint.timeline.map((step, idx) => (
                <div key={idx} className="complaint-timeline-item">
                  <div className="complaint-timeline-track">
                    <div className={`complaint-timeline-dot ${step.status === 'Resolved' ? 'is-resolved' : ''}`} />
                    {idx < complaint.timeline.length - 1 && (
                      <div className="complaint-timeline-line" />
                    )}
                  </div>

                  <div className="complaint-timeline-content">
                    <div className="complaint-timeline-row">
                      <span className="complaint-timeline-status">
                        {step.status}
                      </span>
                      {step.changedByName && (
                        <span className="complaint-timeline-author">
                          — by {step.changedByName}
                        </span>
                      )}
                      <span className="complaint-timeline-time">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {step.note && (
                      <div className="complaint-timeline-note">
                        {step.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
