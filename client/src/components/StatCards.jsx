import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Layers,
  Users,
} from 'lucide-react';

export default function StatCards({ stats, onFilterStatus, activeStatus, isStaff, onOpenTenants }) {
  const items = [
    ...(isStaff ? [{
      label: 'Students',
      sublabel: 'Click to manage',
      value: stats?.totalTenants ?? 0,
      icon: Users,
      color: '#0891b2',
      bg: 'rgba(6, 182, 212, 0.12)',
      isAction: true,
      onClick: onOpenTenants,
    }] : []),
    {
      label: 'Total Tickets',
      sublabel: 'All logged issues',
      value: stats?.total ?? 0,
      icon: Layers,
      color: '#4f46e5',
      bg: '#eef2ff',
      status: 'All',
      isHero: !isStaff, // Full width on mobile only for tenant view
    },
    {
      label: 'Pending Action',
      sublabel: 'Awaiting review',
      value: stats?.pending ?? 0,
      icon: Clock,
      color: '#d97706',
      bg: '#fffbeb',
      status: 'Pending',
    },
    {
      label: 'In Progress',
      sublabel: 'Work assigned',
      value: stats?.inProgress ?? 0,
      icon: AlertCircle,
      color: '#2563eb',
      bg: '#eff6ff',
      status: 'In Progress',
    },
    {
      label: 'Resolved',
      sublabel: 'Closed issues',
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      color: '#059669',
      bg: '#ecfdf5',
      status: 'Resolved',
    },
    {
      label: 'Urgent Attention',
      sublabel: 'Immediate review',
      value: stats?.urgent ?? 0,
      icon: Flame,
      color: '#dc2626',
      bg: '#fef2f2',
      status: 'Urgent',
    },
  ];

  return (
    <div style={{ width: '100%', marginBottom: '18px' }}>
      <style>{`
        .stat-grid-container {
          display: grid;
          grid-template-columns: repeat(${items.length}, 1fr);
          gap: 12px;
          width: 100%;
        }
        @media (max-width: 1100px) {
          .stat-grid-container {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .stat-grid-container {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .hero-stat-card {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>

      <div className="stat-grid-container">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeStatus === item.status;
          const handleClick = () => {
            if (item.isAction && item.onClick) {
              item.onClick();
            } else if (onFilterStatus && item.status) {
              onFilterStatus(item.status);
            }
          };

          return (
            <div
              key={item.label}
              onClick={handleClick}
              className={item.isHero ? 'hero-stat-card' : ''}
              style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '14px',
                padding: '12px 14px',
                border: '1px solid',
                borderColor: isActive ? item.color : 'var(--border-light, #e2e8f0)',
                boxShadow: isActive
                  ? `0 6px 18px -4px ${item.color}25, 0 0 0 2px ${item.color}`
                  : 'var(--shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.05))',
                cursor: (item.isAction || onFilterStatus) ? 'pointer' : 'default',
                transform: isActive ? 'translateY(-1px)' : 'none',
                transition: 'all 0.15s ease',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                minWidth: 0,
              }}
            >
              {/* Top Accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: item.color,
                opacity: isActive ? 1 : 0.6,
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {item.label}
                </span>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                  flexShrink: 0,
                }}>
                  <Icon size={14} />
                </div>
              </div>

              <div style={{
                fontSize: item.isHero ? '1.8rem' : '1.5rem',
                fontWeight: 800,
                color: 'var(--text-main, #0f172a)',
                letterSpacing: '-0.03em',
                margin: '3px 0 1px',
                lineHeight: 1.1,
              }}>
                {item.value}
              </div>

              <div style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>{item.sublabel}</span>
                {isActive && <span style={{ color: item.color, fontWeight: 700 }}>• Active</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
