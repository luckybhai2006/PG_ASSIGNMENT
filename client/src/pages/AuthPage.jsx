import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  AlertCircle,
  KeyRound,
  Home,
} from 'lucide-react';

export default function AuthPage() {
  const { login, registerOwner, registerTenant } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'tenant-reg' | 'owner-reg'

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Tenant Register state
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tRoom, setTRoom] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tPgId, setTPgId] = useState('');
  const [pgList, setPgList] = useState([]);

  // Owner Register state
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [pgName, setPgName] = useState('');
  const [pgAddress, setPgAddress] = useState('');
  const [pgPhone, setPgPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof api?.getPublicPGs === 'function') {
      api.getPublicPGs()
        .then((res) => {
          setPgList(res?.pgs || []);
          if (res?.pgs && res.pgs.length > 0) {
            setTPgId(res.pgs[0]._id);
          }
        })
        .catch(() => {});
    }
  }, []);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerTenant({
        name: tName,
        email: tEmail,
        password: tPassword,
        roomNumber: tRoom,
        phone: tPhone,
        pgId: tPgId,
      });
    } catch (err) {
      setError(err.message || 'Tenant registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerOwner({
        name,
        email: regEmail,
        password: regPassword,
        phone,
        pgName,
        pgAddress,
        pgPhone,
      });
    } catch (err) {
      setError(err.message || 'Owner registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setActiveTab('login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #eef2ff 50%, #faf5ff 100%)',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    }}>
      <div style={{
        maxWidth: activeTab === 'login' ? '420px' : '560px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        padding: '24px 18px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            margin: '0 auto 10px',
            boxShadow: '0 6px 16px rgba(79, 70, 229, 0.25)',
          }}>
            <Building2 size={24} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            StayResolved
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>
            PG Complaint & Facility Portal
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '3px',
          borderRadius: '10px',
          marginBottom: '16px',
          gap: '3px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.78rem',
              background: activeTab === 'login' ? '#ffffff' : 'transparent',
              color: activeTab === 'login' ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === 'login' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              textAlign: 'center',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('tenant-reg'); setError(''); }}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.78rem',
              background: activeTab === 'tenant-reg' ? '#ffffff' : 'transparent',
              color: activeTab === 'tenant-reg' ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === 'tenant-reg' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              textAlign: 'center',
            }}
          >
            Student Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('owner-reg'); setError(''); }}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.78rem',
              background: activeTab === 'owner-reg' ? '#ffffff' : 'transparent',
              color: activeTab === 'owner-reg' ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === 'owner-reg' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              textAlign: 'center',
            }}
          >
            Owner Register
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '0.82rem',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxSizing: 'border-box',
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Sign In Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '36px', height: '40px' }}
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '36px', height: '40px' }}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '0.92rem', marginTop: '6px', height: '42px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight size={16} />
            </button>

            {/* Quick 1-Click Demo Logins */}
            <div style={{
              marginTop: '18px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: '#475569',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}>
                <KeyRound size={12} color="#4f46e5" />
                1-Click Demo Logins:
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                <button
                  type="button"
                  onClick={() => fillCredentials('owner@greenheights.com', 'password123')}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '6px 8px',
                    minHeight: '34px',
                    whiteSpace: 'normal',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    justifyContent: 'center',
                  }}
                >
                  👑 Owner
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('editor@greenheights.com', 'password123')}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '6px 8px',
                    minHeight: '34px',
                    whiteSpace: 'normal',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    justifyContent: 'center',
                  }}
                >
                  🛠️ Staff (Active)
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('neweditor@greenheights.com', 'password123')}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '6px 8px',
                    minHeight: '34px',
                    whiteSpace: 'normal',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    justifyContent: 'center',
                  }}
                  title="Test Editor Invite Acceptance"
                >
                  ⏳ Staff (Invite)
                </button>

                <button
                  type="button"
                  onClick={() => fillCredentials('rahul@greenheights.com', 'password123')}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.72rem',
                    padding: '6px 8px',
                    minHeight: '34px',
                    whiteSpace: 'normal',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    justifyContent: 'center',
                  }}
                >
                  🏠 Tenant (Rahul)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 2. Tenant Direct Registration Form */}
        {activeTab === 'tenant-reg' && (
          <form onSubmit={handleTenantRegister} style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#06b6d4', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Home size={14} /> Student Room Enrollment
            </div>

            <div className="grid-2-col">
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Room Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 302-A"
                  value={tRoom}
                  onChange={(e) => setTRoom(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="student@example.com"
                  value={tEmail}
                  onChange={(e) => setTEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 chars"
                  value={tPassword}
                  onChange={(e) => setTPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Select PG *</label>
                <select
                  className="form-select"
                  value={tPgId}
                  onChange={(e) => setTPgId(e.target.value)}
                  required
                >
                  {pgList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91..."
                  value={tPhone}
                  onChange={(e) => setTPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '0.92rem', marginTop: '8px', height: '42px' }}
            >
              {loading ? 'Creating Student...' : 'Sign Up as Student'}
              <Sparkles size={15} />
            </button>
          </form>
        )}

        {/* 3. Owner Register PG Form */}
        {activeTab === 'owner-reg' && (
          <form onSubmit={handleOwnerRegister} style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4f46e5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <User size={14} /> 1. Owner Details
            </div>

            <div className="grid-2-col">
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vikram Malhotra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="owner@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 chars"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#06b6d4', marginTop: '10px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Building2 size={14} /> 2. PG Information
            </div>

            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label>PG Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Green Heights PG"
                value={pgName}
                onChange={(e) => setPgName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label>PG Address *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Area, City, Pin code"
                value={pgAddress}
                onChange={(e) => setPgAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Caretaker Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91..."
                value={pgPhone}
                onChange={(e) => setPgPhone(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '0.92rem', marginTop: '6px', height: '42px' }}
            >
              {loading ? 'Registering...' : 'Register PG Account'}
              <Sparkles size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
