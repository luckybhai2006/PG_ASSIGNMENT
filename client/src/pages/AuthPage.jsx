import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Home,
  RefreshCw,
  Sun,
  Moon,
  ShieldCheck,
  Wrench,
  Bell,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export default function AuthPage() {
  const { login, registerOwner, registerTenant } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
  const [tJoinCode, setTJoinCode] = useState('');
  const [pgList, setPgList] = useState([]);
  const [loadingPGs, setLoadingPGs] = useState(false);

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

  const fetchPGList = async () => {
    setLoadingPGs(true);
    try {
      if (typeof api?.getPublicPGs === 'function') {
        const res = await api.getPublicPGs();
        const list = res?.pgs || [];
        setPgList(list);
        setTPgId((prev) => {
          if (list.some((p) => p._id === prev)) return prev;
          return list.length > 0 ? list[0]._id : '';
        });
      }
    } catch (err) {
      console.error('Error fetching PGs:', err);
    } finally {
      setLoadingPGs(false);
    }
  };

  useEffect(() => {
    fetchPGList();
  }, []);

  useEffect(() => {
    if (activeTab === 'tenant-reg') {
      fetchPGList();
    }
  }, [activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
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
        joinCode: tJoinCode.trim().toUpperCase(),
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
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      background: 'var(--bg-main, #f8fafc)',
      color: 'var(--text-main, #0f172a)',
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
    }}>
      <style>{`
        .auth-container-card {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          max-width: 1040px;
          width: 100%;
          min-height: 620px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: 20px;
          box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.1), 0 1px 3px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          box-sizing: border-box;
        }

        .auth-hero-panel {
          background: linear-gradient(170deg, #1e1b4b 0%, #0f172a 100%);
          color: #ffffff;
          padding: 44px 36px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .auth-hero-panel::before {
          content: '';
          position: absolute;
          top: -30%;
          right: -20%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
          pointer-events: none;
        }

        .auth-form-panel {
          padding: 38px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          background: var(--bg-card, #ffffff);
        }

        .auth-segmented-nav {
          display: flex;
          background: var(--bg-hover, #f1f5f9);
          padding: 4px;
          border-radius: 10px;
          gap: 4px;
          margin-bottom: 22px;
          border: 1px solid var(--border-light, #e2e8f0);
        }

        .auth-segmented-btn {
          flex: 1;
          padding: 8px 10px;
          border: none;
          background: transparent;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-muted, #64748b);
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }

        .auth-segmented-btn.active {
          background: var(--bg-card, #ffffff);
          color: var(--text-main, #0f172a);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          font-weight: 700;
        }

        .demo-chip-btn {
          border: 1px solid var(--border-light, #e2e8f0);
          background: var(--bg-card, #ffffff);
          color: var(--text-main, #334155);
          font-size: 0.74rem;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .demo-chip-btn:hover {
          border-color: #4f46e5;
          color: #4f46e5;
          background: var(--primary-light, #eef2ff);
        }

        @media (max-width: 900px) {
          .auth-container-card {
            grid-template-columns: 1fr;
            max-width: 520px;
          }
          .auth-hero-panel {
            padding: 28px 24px 24px;
          }
          .auth-form-panel {
            padding: 26px 20px;
          }
        }
      `}</style>

      <div className="auth-container-card">
        {/* Left Editorial Panel (Authentic Product Presence) */}
        <div className="auth-hero-panel">
          <div>
            {/* Top brand mark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
              <img
                src="/logo.png"
                alt="PG Portal"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  background: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  PG Management
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                  Resident Operations Hub
                </div>
              </div>
            </div>

            {/* Headline */}
            <h2 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.03em',
              marginBottom: '12px',
              color: '#f8fafc',
            }}>
              Organized hostel living, zero friction.
            </h2>
            <p style={{
              fontSize: '0.88rem',
              color: '#cbd5e1',
              lineHeight: 1.55,
              marginBottom: '28px',
              fontWeight: 400,
            }}>
              Designed for modern PG facilities. File maintenance requests in seconds, track repairs live, and maintain room allocations with full transparency.
            </p>

            {/* Feature highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'rgba(99, 102, 241, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  <Wrench size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Instant Maintenance Dispatch
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    Automated priority tagging for plumbing, electrical & Wi-Fi issues.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'rgba(6, 182, 212, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22d3ee',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Verified Student Directory
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    Each resident is linked to their exact room number for seamless oversight.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'rgba(16, 185, 129, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  <Bell size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Direct PG Noticeboard
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    Broadcast mess schedules, power updates, and building guidelines instantly.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Discreet bottom quote */}
          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Built for Owners, Staff & Residents
            </span>
            <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700 }}>
              v1.0 Ready
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-form-panel">
          <div>
            {/* Top row: Title and Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', letterSpacing: '-0.02em', margin: 0 }}>
                  {activeTab === 'login' && 'Sign in to account'}
                  {activeTab === 'tenant-reg' && 'Student enrollment'}
                  {activeTab === 'owner-reg' && 'Register new PG'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '3px', margin: 0 }}>
                  {activeTab === 'login' && 'Welcome back! Enter your login details below.'}
                  {activeTab === 'tenant-reg' && 'Select your PG and register your room account.'}
                  {activeTab === 'owner-reg' && 'Set up your property management workspace.'}
                </p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="theme-toggle-btn"
                style={{ width: '34px', height: '34px', borderRadius: '8px' }}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#6366f1" />}
              </button>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="auth-segmented-nav">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`auth-segmented-btn ${activeTab === 'login' ? 'active' : ''}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('tenant-reg'); setError(''); }}
                className={`auth-segmented-btn ${activeTab === 'tenant-reg' ? 'active' : ''}`}
              >
                Student Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('owner-reg'); setError(''); }}
                className={`auth-segmented-btn ${activeTab === 'owner-reg' ? 'active' : ''}`}
              >
                Register PG
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '10px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.82rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxSizing: 'border-box',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} style={{ width: '100%', boxSizing: 'border-box' }}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Email Address</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-light, #94a3b8)' }} />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '38px', height: '42px', fontSize: '0.88rem' }}
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Password</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-light, #94a3b8)' }} />
                    <input
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '38px', height: '42px', fontSize: '0.88rem' }}
                      placeholder="••••••••"
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
                  style={{
                    width: '100%',
                    height: '42px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{loading ? 'Verifying credentials...' : 'Sign In'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* TAB 2: STUDENT DIRECT SIGN UP */}
            {activeTab === 'tenant-reg' && (
              <form onSubmit={handleTenantRegister} style={{ width: '100%', boxSizing: 'border-box' }}>
                <div className="grid-2-col">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Rahul Sharma"
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      required
                      style={{ height: '40px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Room Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 204-B"
                      value={tRoom}
                      onChange={(e) => setTRoom(e.target.value)}
                      required
                      style={{ height: '40px' }}
                    />
                  </div>
                </div>

                <div className="grid-2-col">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="student@example.com"
                      value={tEmail}
                      onChange={(e) => setTEmail(e.target.value)}
                      required
                      style={{ height: '40px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min 6 chars"
                      value={tPassword}
                      onChange={(e) => setTPassword(e.target.value)}
                      required
                      style={{ height: '40px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Select PG Facility *</label>
                    <button
                      type="button"
                      onClick={fetchPGList}
                      disabled={loadingPGs}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4f46e5',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0',
                      }}
                      title="Refresh list of PGs"
                    >
                      <RefreshCw size={11} style={{ animation: loadingPGs ? 'spin 1s linear infinite' : 'none' }} />
                      <span>{loadingPGs ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                  </div>
                  <select
                    className="form-select"
                    value={tPgId}
                    onChange={(e) => setTPgId(e.target.value)}
                    required
                    disabled={loadingPGs || pgList.length === 0}
                    style={{ height: '40px', fontSize: '0.84rem' }}
                  >
                    {loadingPGs ? (
                      <option value="">Loading registered PGs...</option>
                    ) : pgList.length === 0 ? (
                      <option value="">No registered PGs found (Owner registration required)</option>
                    ) : (
                      pgList.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.address ? `— ${p.address}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Secret Join Code for {pgList.find((p) => p._id === tPgId)?.name || 'Selected PG'} *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-light, #94a3b8)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. GH-2024 (Provided by PG Owner)"
                      value={tJoinCode}
                      onChange={(e) => setTJoinCode(e.target.value.toUpperCase())}
                      required
                      style={{ paddingLeft: '38px', height: '40px', letterSpacing: '0.06em', fontWeight: 700 }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', marginTop: '3px', display: 'block' }}>
                    🔒 Enter the official passcode for this PG. Ask your PG Owner or Caretaker.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contact Phone (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={tPhone}
                    onChange={(e) => setTPhone(e.target.value)}
                    style={{ height: '40px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || pgList.length === 0}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '42px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{loading ? 'Creating account...' : 'Create Student Account'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* TAB 3: OWNER REGISTRATION FORM */}
            {activeTab === 'owner-reg' && (
              <form onSubmit={handleOwnerRegister} style={{ width: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Owner Profile
                </div>

                <div className="grid-2-col">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Vikram Malhotra"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ height: '40px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Personal Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+91..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ height: '40px' }}
                    />
                  </div>
                </div>

                <div className="grid-2-col">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="owner@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      style={{ height: '40px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min 6 chars"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      style={{ height: '40px' }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '10px', marginBottom: '8px' }}>
                  PG Details
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>PG Property Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Green Heights Luxury PG"
                    value={pgName}
                    onChange={(e) => setPgName(e.target.value)}
                    required
                    style={{ height: '40px' }}
                  />
                </div>

                <div className="grid-2-col">
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Physical Address *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Area, City, Pin"
                      value={pgAddress}
                      onChange={(e) => setPgAddress(e.target.value)}
                      required
                      style={{ height: '40px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Helpdesk / Warden Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+91..."
                      value={pgPhone}
                      onChange={(e) => setPgPhone(e.target.value)}
                      style={{ height: '40px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '42px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{loading ? 'Creating workspace...' : 'Complete PG Registration'}</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>

          {/* Understated Demo Access Strip */}
          {activeTab === 'login' && (
            <div style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-light, #e2e8f0)',
            }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted, #64748b)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <KeyRound size={12} color="#4f46e5" />
                <span>Quick demo credentials:</span>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fillCredentials('owner@greenheights.com', 'password123')}
                  className="demo-chip-btn"
                >
                  <span>👑 Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('editor@greenheights.com', 'password123')}
                  className="demo-chip-btn"
                >
                  <span>🛠️ Staff Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('rahul@greenheights.com', 'password123')}
                  className="demo-chip-btn"
                >
                  <span>🏠 Resident (Rahul)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
