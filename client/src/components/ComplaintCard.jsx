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
          color: '#d97706',
          bg: '#fffbeb',
          border: '#fde68a',
          accent: '#f59e0b',
          icon: Clock,
        };
      case 'In Progress':
        return {
          label: 'In Progress',
          color: '#2563eb',
          bg: '#eff6ff',
          border: '#bfdbfe',
          accent: '#3b82f6',
          icon: AlertTriangle,
        };
      case 'Resolved':
        return {
          label: 'Resolved',
          color: '#059669',
          bg: '#ecfdf5',
          border: '#a7f3d0',
          accent: '#10b981',
          icon: CheckCircle2,
        };
      case 'Rejected':
        return {
          label: 'Rejected',
          color: '#b91c1c',
          bg: '#fef2f2',
          border: '#fecaca',
          accent: '#ef4444',
          icon: AlertTriangle,
        };
      default:
        return {
          label: status,
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
        return { color: '#dc2626', bg: '#fee2e2', text: 'Urgent' };
      case 'High':
        return { color: '#ea580c', bg: '#ffedd5', text: 'High' };
      case 'Medium':
        return { color: '#d97706', bg: '#fef3c7', text: 'Medium' };
      default:
        return { color: '#64748b', bg: '#f1f5f9', text: 'Low' };
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

  return (
    <div style={{
      background: 'var(--bg-card, #ffffff)',
      borderRadius: '14px',
      border: '1px solid var(--border-light, #e2e8f0)',
      boxShadow: 'var(--shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.05))',
      marginBottom: '14px',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Left colored stripe */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: '4px',
        background: statusConfig.accent,
      }} />

      <div style={{ padding: '14px 14px 14px 16px', width: '100%', boxSizing: 'border-box' }}>
        {/* Top Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '8px',
        }}>
          {/* Metadata Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--text-muted, #475569)',
              background: 'var(--bg-hover, #f1f5f9)',
              padding: '2px 6px',
              borderRadius: '5px',
            }}>
              {ticketId}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-light, #e2e8f0)',
              borderRadius: '5px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--text-main, #0f172a)',
            }}>
              <Home size={11} color="var(--primary, #4f46e5)" />
              Rm {(complaint.tenantId?.roomNumber && complaint.tenantId.roomNumber !== 'Unassigned') ? complaint.tenantId.roomNumber : complaint.roomNumber}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              background: catConfig.bg,
              border: `1px solid ${catConfig.color}20`,
              borderRadius: '5px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: catConfig.color,
            }}>
              <CatIcon size={11} />
              {complaint.category}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '5px',
              background: priorityConfig.bg,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: priorityConfig.color,
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: priorityConfig.color }} />
              {priorityConfig.text}
            </span>
          </div>

          {/* Right Action & Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: statusConfig.bg,
              color: statusConfig.color,
              border: `1px solid ${statusConfig.border}`,
            }}>
              <StatusIcon size={12} />
              {statusConfig.label}
            </span>

            {canManageStatus && (
              <button
                onClick={() => onUpdateStatus(complaint)}
                className="btn btn-outline"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.76rem',
                  height: '28px',
                  borderRadius: '6px',
                }}
              >
                <Shield size={12} />
                <span>Update</span>
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: 800,
          color: 'var(--text-main, #0f172a)',
          letterSpacing: '-0.01em',
          margin: '4px 0 6px',
          lineHeight: 1.35,
          wordBreak: 'break-word',
        }}>
          {complaint.title}
        </h3>

        {/* Description Body */}
        <p style={{
          color: 'var(--text-muted, #475569)',
          fontSize: '0.88rem',
          lineHeight: 1.5,
          background: 'var(--bg-hover, #f8fafc)',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-light, #f1f5f9)',
          margin: '6px 0 10px',
          wordBreak: 'break-word',
        }}>
          {complaint.description}
        </p>

        {/* Resolution Notes Memo */}
        {complaint.resolutionNotes && (
          <div style={{
            margin: '8px 0',
            padding: '10px 12px',
            background: complaint.status === 'Resolved' ? '#ecfdf5' : '#eff6ff',
            border: `1px solid ${complaint.status === 'Resolved' ? '#a7f3d0' : '#bfdbfe'}`,
            borderRadius: '8px',
            fontSize: '0.84rem',
            color: complaint.status === 'Resolved' ? '#065f46' : '#1e40af',
            wordBreak: 'break-word',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800, marginBottom: '3px' }}>
              <MessageSquareQuote size={15} />
              Staff Remarks:
            </div>
            <div style={{ lineHeight: 1.45 }}>
              {complaint.resolutionNotes}
            </div>
          </div>
        )}

        {/* Footer Meta Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-light, #f1f5f9)',
          fontSize: '0.76rem',
          color: 'var(--text-muted, #64748b)',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-main, #1e293b)', fontWeight: 600 }}>
              Tenant: <strong>{complaint.tenantId?.name || 'Tenant'}</strong>
            </span>

            {complaint.registeredByType === 'staff' && (
              <span style={{
                background: 'rgba(124, 58, 237, 0.15)',
                color: '#a855f7',
                padding: '1px 6px',
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '0.7rem',
              }}>
                By Staff
              </span>
            )}

            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-light, #94a3b8)' }}>
              <Calendar size={12} />
              {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Activity Log Accordion Toggle */}
          {complaint.timeline && complaint.timeline.length > 0 && (
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: 'var(--primary, #4f46e5)',
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '3px 6px',
                borderRadius: '5px',
                background: 'var(--bg-hover, #f8fafc)',
                border: '1px solid var(--border-light, #e2e8f0)',
              }}
            >
              <span>{showTimeline ? 'Hide' : `History (${complaint.timeline.length})`}</span>
              {showTimeline ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        {/* Stepper Timeline Dropdown */}
        {showTimeline && complaint.timeline && (
          <div style={{
            marginTop: '10px',
            padding: '12px',
            background: 'var(--bg-hover, #f8fafc)',
            borderRadius: '10px',
            border: '1px solid var(--border-light, #e2e8f0)',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <h4 style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--text-muted, #475569)',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Resolution Activity Timeline
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {complaint.timeline.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: step.status === 'Resolved' ? '#10b981' : '#4f46e5',
                      boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.15)',
                    }} />
                    {idx < complaint.timeline.length - 1 && (
                      <div style={{
                        width: '2px',
                        flex: 1,
                        background: '#e2e8f0',
                        marginTop: '3px',
                        marginBottom: '3px',
                      }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                        {step.status}
                      </span>
                      {step.changedByName && (
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          — by {step.changedByName}
                        </span>
                      )}
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginLeft: 'auto' }}>
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {step.note && (
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px', wordBreak: 'break-word' }}>
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
