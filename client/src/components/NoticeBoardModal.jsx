import React, { useState } from 'react';
import { X, Bell, PlusCircle, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NoticeBoardModal({ isOpen, onClose }) {
  const { pg, user, updatePGState } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isOwner = user?.role === 'owner';
  const isEditor = user?.role === 'editor';
  const canPostNotice = isOwner || (isEditor && user?.permissions?.manageNotices !== false);

  const handlePostNotice = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.addNotice({ title, message, priority });
      updatePGState({ noticeBoard: res.noticeBoard });
      setTitle('');
      setMessage('');
      setPriority('normal');
    } catch (err) {
      setError(err.message || 'Failed to post notice');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    try {
      const res = await api.deleteNotice(noticeId);
      updatePGState({ noticeBoard: res.noticeBoard });
    } catch (err) {
      console.error('Failed to delete notice:', err);
    }
  };

  const notices = pg?.noticeBoard || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="tenant-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                Notice Board & Announcements
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                Updates from {pg?.name || 'PG Management'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-light, #94a3b8)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="tenant-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '0.88rem',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Form for Staff / Owner */}
          {canPostNotice && (
            <form onSubmit={handlePostNotice} style={{
              background: 'var(--bg-hover, #f8fafc)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-light, #e2e8f0)',
              marginBottom: '20px',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main, #0f172a)' }}>
                Post New Announcement
              </h3>
              <div className="grid-2-col" style={{ gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label>Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Water Tank Cleaning"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label htmlFor="notice-priority">Priority</label>
                  <select
                    id="notice-priority"
                    aria-label="Notice Priority"
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Message Content</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Details for all residents..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                <PlusCircle size={16} />
                {loading ? 'Posting...' : 'Publish Announcement'}
              </button>
            </form>
          )}

          {/* Notices List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notices.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted, #64748b)', padding: '24px' }}>
                No announcements at this time.
              </p>
            ) : (
              notices.map((n) => (
                <div
                  key={n._id}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: n.priority === 'urgent' ? '#ef4444' : 'var(--border-light, #e2e8f0)',
                    background: n.priority === 'urgent' ? 'var(--danger-light, #fef2f2)' : 'var(--bg-card, #ffffff)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                        {n.title}
                      </h4>
                      {n.priority === 'urgent' && (
                        <span className="badge badge-priority-urgent" style={{ fontSize: '0.68rem' }}>
                          Urgent
                        </span>
                      )}
                    </div>

                    {canPostNotice && (
                      <button
                        onClick={() => handleDeleteNotice(n._id)}
                        style={{ color: 'var(--text-light, #94a3b8)', padding: '4px' }}
                        title="Delete notice"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-main, #334155)', fontSize: '0.9rem', marginTop: '8px', lineHeight: 1.5 }}>
                    {n.message}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '10px' }}>
                    Posted on {new Date(n.date).toLocaleDateString()} at{' '}
                    {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
