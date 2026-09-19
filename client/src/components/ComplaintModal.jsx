import React, { useState, useEffect } from 'react';
import { X, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Plumbing',
  'Electricity',
  'Wi-Fi',
  'Cleaning',
  'Food',
  'Carpentry',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function ComplaintModal({ isOpen, onClose, onComplaintCreated, userRole }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electricity');
  const [priority, setPriority] = useState('Medium');
  const [roomNumber, setRoomNumber] = useState('');

  // For Staff registering on behalf of tenant
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isStaff = userRole === 'owner' || userRole === 'editor';

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (!isStaff) {
        setRoomNumber(user?.roomNumber || '');
      } else {
        api.getTenants()
          .then((res) => {
            const list = res.tenants || [];
            setTenants(list);
            if (list.length > 0) {
              setSelectedTenantId(list[0]._id);
              setRoomNumber(list[0].roomNumber || '');
            } else {
              setSelectedTenantId('');
              setRoomNumber('');
            }
          })
          .catch((err) => console.error('Error fetching tenants list:', err));
      }
    }
  }, [isOpen, isStaff, user]);

  const handleTenantSelect = (e) => {
    const tId = e.target.value;
    setSelectedTenantId(tId);
    const tenant = tenants.find((t) => t._id === tId);
    if (tenant) {
      setRoomNumber(tenant.roomNumber || '');
    } else {
      setRoomNumber('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        category,
        priority,
        roomNumber,
      };

      if (isStaff) {
        payload.tenantId = selectedTenantId;
      }

      await api.createComplaint(payload);
      onComplaintCreated();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to file complaint');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="tenant-modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
            {isStaff ? 'Register Complaint (On Behalf of Tenant)' : 'Raise a Complaint'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-light, #94a3b8)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tenant-modal-body">
          {error && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '0.88rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Staff Selecting Tenant */}
          {isStaff && (
            <div className="form-group">
              <label htmlFor="complaint-tenant-select">Select Tenant (To register on their behalf):</label>
              {tenants.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#b91c1c' }}>
                  No tenants registered in this PG yet. Please add a tenant first.
                </p>
              ) : (
                <select
                  id="complaint-tenant-select"
                  aria-label="Select Tenant"
                  className="form-select"
                  value={selectedTenantId}
                  onChange={handleTenantSelect}
                  required
                >
                  {tenants.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} (Room: {t.roomNumber}) - {t.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Complaint Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Geyser not heating, Wi-Fi connectivity down"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid-2-col" style={{ gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="complaint-category-select">Category *</label>
              <select
                id="complaint-category-select"
                aria-label="Category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="complaint-priority-select">Priority</label>
              <select
                id="complaint-priority-select"
                aria-label="Priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((pri) => (
                  <option key={pri} value={pri}>{pri}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>Room Number *</label>
              {roomNumber && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#059669',
                  background: '#ecfdf5',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <CheckCircle2 size={12} /> Auto-filled
                </span>
              )}
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 101, 204-B"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', display: 'block' }}>
              {isStaff
                ? 'Auto-filled based on selected student. You can edit if needed.'
                : 'Auto-filled from your registered room profile.'}
            </span>
          </div>

          <div className="form-group">
            <label>Issue Details & Description *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Provide specific details so staff / maintenance can resolve it swiftly..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (isStaff && tenants.length === 0)}
              className="btn btn-primary"
            >
              <PlusCircle size={16} />
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
