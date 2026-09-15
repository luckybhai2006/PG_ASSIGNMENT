import React, { useState, useEffect } from 'react';
import { X, UserPlus, Users, Search, Home, Phone, Mail } from 'lucide-react';
import { api } from '../services/api';

export default function TenantModal({ isOpen, onClose, onTenantAdded }) {
  const [tenants, setTenants] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTenants = async (term = '') => {
    try {
      const res = await api.getTenants(term);
      setTenants(res.tenants || []);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTenants(search);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchTenants(e.target.value);
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

      setSuccess(res.message || 'Tenant added successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setRoomNumber('');
      setPhone('');
      fetchTenants();
      if (onTenantAdded) onTenantAdded();
    } catch (err) {
      setError(err.message || 'Failed to add tenant');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              Tenant Management
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
              Register new tenants and view current room allocations
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-light, #94a3b8)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
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

          {success && (
            <div style={{
              padding: '12px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              color: '#065f46',
              fontSize: '0.88rem',
              marginBottom: '16px',
            }}>
              {success}
            </div>
          )}

          {/* Add Tenant Form */}
          <form onSubmit={handleAddTenant} style={{
            background: 'var(--bg-hover, #f8fafc)',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid var(--border-light, #e2e8f0)',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main, #0f172a)' }}>
              Enroll New Tenant
            </h3>

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
                <label>Login Password *</label>
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
              style={{ width: '100%', marginTop: '6px' }}
            >
              <UserPlus size={16} />
              {loading ? 'Adding Tenant...' : 'Add Tenant to PG'}
            </button>
          </form>

          {/* Tenants Directory List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                Registered Tenants ({tenants.length})
              </h3>

              <div style={{ position: 'relative', width: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-light, #94a3b8)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search room/name..."
                  style={{ padding: '6px 10px 6px 30px', fontSize: '0.8rem' }}
                  value={search}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {tenants.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)', textAlign: 'center', padding: '16px' }}>
                No tenants found.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {tenants.map((t) => (
                  <div
                    key={t._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-card, #ffffff)',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main, #0f172a)' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', display: 'flex', gap: '10px' }}>
                        <span><Mail size={11} style={{ verticalAlign: 'middle' }} /> {t.email}</span>
                        {t.phone && <span><Phone size={11} style={{ verticalAlign: 'middle' }} /> {t.phone}</span>}
                      </div>
                    </div>

                    <span style={{
                      padding: '4px 10px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}>
                      Room {t.roomNumber}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
