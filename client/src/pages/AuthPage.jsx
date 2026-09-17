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
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function AuthPage() {
  const { login, registerOwner, registerTenant } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'tenant-reg' | 'owner-reg'

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showTenantPassword, setShowTenantPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Tenant Register state
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tPgId, setTPgId] = useState('');
  const [tJoinCode, setTJoinCode] = useState('');
  const [tGender, setTGender] = useState('female'); // 'female' | 'male'
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
  const [regPgType, setRegPgType] = useState('boys'); // 'boys' | 'girls' | 'co-ed'

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
        phone: tPhone,
        pgId: tPgId,
        joinCode: tJoinCode.trim().toUpperCase(),
        gender: tGender,
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
        pgType: regPgType,
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
    <div className="auth-root-wrapper">
      <style>{`
        /* ROOT WRAPPER: Perfectly Centered Horizontally & Vertically */
        .auth-root-wrapper {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: var(--bg-main, #f8fafc);
          color: var(--text-main, #0f172a);
          box-sizing: border-box;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient Lighting */
        .auth-root-wrapper::before {
          content: '';
          position: fixed;
          top: -20%;
          left: -10%;
          width: 50vw;
          height: 50vw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .auth-root-wrapper::after {
          content: '';
          position: fixed;
          bottom: -20%;
          right: -10%;
          width: 50vw;
          height: 50vw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* CARD CONTAINER: Safe Center with margin: auto */
        .auth-card-container {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          max-width: 1020px;
          width: 100%;
          min-height: 620px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-light, #e2e8f0);
          border-radius: 24px;
          box-shadow: 0 24px 50px -12px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          position: relative;
          z-index: 1;
          box-sizing: border-box;
          margin: auto;
        }

        /* DESKTOP LEFT BRAND PANEL */
        .auth-hero-panel {
          background: linear-gradient(160deg, #1e1b4b 0%, #0f172a 100%);
          color: #ffffff;
          padding: 48px 40px;
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
          right: -25%;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
          pointer-events: none;
        }

        .auth-hero-panel::after {
          content: '';
          position: absolute;
          bottom: -20%;
          left: -20%;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        /* RIGHT INTERACTIVE FORM PANEL */
        .auth-form-panel {
          padding: 42px 46px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--bg-card, #ffffff);
          box-sizing: border-box;
          width: 100%;
          position: relative;
        }

        /* Top Corner Floating Theme Toggle */
        .auth-theme-corner-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--border-light, #e2e8f0);
          background: var(--bg-card, #ffffff);
          color: var(--text-main, #0f172a);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .auth-theme-corner-btn:hover {
          background: var(--bg-hover, #f1f5f9);
          border-color: var(--primary, #4f46e5);
        }

        /* Mobile Brand Identity */
        .auth-mobile-brand {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin-bottom: 20px;
          padding-top: 4px;
        }

        .auth-mobile-logo-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #ffffff;
          padding: 3px;
          box-shadow: 0 6px 16px -2px rgba(79, 70, 229, 0.25), 0 2px 4px rgba(0, 0, 0, 0.06);
          border: 1.5px solid rgba(79, 70, 229, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .auth-mobile-logo {
          width: 100%;
          height: 100%;
          border-radius: 11px;
          object-fit: cover;
        }

        .auth-mobile-brand-name {
          font-size: 1.18rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-main, #0f172a);
          line-height: 1.2;
        }

        .auth-mobile-brand-tag {
          font-size: 0.74rem;
          color: var(--text-muted, #64748b);
          font-weight: 600;
          margin-top: 2px;
        }

        /* Heading & Subtitle Block */
        .auth-header-text {
          text-align: left;
          margin-bottom: 20px;
          padding-right: 44px; /* Space for theme button */
        }

        .auth-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main, #0f172a);
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.25;
        }

        .auth-subtitle {
          font-size: 0.82rem;
          color: var(--text-muted, #64748b);
          margin-top: 4px;
          margin-bottom: 0;
        }

        /* Segmented Nav Tab Switcher */
        .auth-segmented-nav {
          display: flex;
          background: var(--bg-hover, #f1f5f9);
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          margin-bottom: 22px;
          border: 1px solid var(--border-light, #e2e8f0);
          width: 100%;
          box-sizing: border-box;
        }

        .auth-segmented-btn {
          flex: 1;
          padding: 9px 8px;
          border: none;
          background: transparent;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-muted, #64748b);
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          white-space: nowrap;
          user-select: none;
        }

        .auth-segmented-btn:hover:not(.active) {
          color: var(--text-main, #0f172a);
          background: rgba(0, 0, 0, 0.03);
        }

        .auth-segmented-btn.active {
          background: var(--bg-card, #ffffff);
          color: var(--primary, #4f46e5);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
          font-weight: 700;
        }

        /* Input styling */
        .auth-input-wrapper {
          position: relative;
          width: 100%;
        }

        .auth-input-field {
          width: 100%;
          height: 44px;
          padding: 0 14px 0 40px;
          font-size: 0.9rem;
          font-family: inherit;
          color: var(--text-main, #0f172a);
          background: var(--bg-card, #ffffff);
          border: 1.5px solid var(--border-light, #e2e8f0);
          border-radius: 10px;
          box-sizing: border-box;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
          outline: none;
        }

        .auth-input-field:focus {
          border-color: var(--primary, #4f46e5);
          box-shadow: 0 0 0 3.5px var(--primary-glow, rgba(79, 70, 229, 0.15));
        }

        .auth-input-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-light, #94a3b8);
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .auth-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-light, #94a3b8);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.15s ease;
        }

        .auth-password-toggle:hover {
          color: var(--text-main, #0f172a);
        }

        /* 2-Col form grids */
        .auth-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* Demo credentials chip section */
        .auth-demo-section {
          margin-top: 22px;
          padding-top: 16px;
          border-top: 1px solid var(--border-light, #e2e8f0);
        }

        .auth-demo-title {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .auth-demo-chips-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .demo-chip-btn {
          border: 1px solid var(--border-light, #e2e8f0);
          background: var(--bg-card, #ffffff);
          color: var(--text-main, #334155);
          font-size: 0.74rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }

        .demo-chip-btn:hover {
          border-color: var(--primary, #4f46e5);
          color: var(--primary, #4f46e5);
          background: var(--primary-light, #eef2ff);
          transform: translateY(-1px);
        }

        /* RESPONSIVE BREAKPOINTS (Mobile & Tablet) */
        @media (max-width: 960px) {
          .auth-root-wrapper {
            padding: 20px 14px;
            justify-content: center;
            align-items: center;
          }

          .auth-card-container {
            grid-template-columns: 1fr;
            max-width: 440px; /* Snug, clean mobile card width */
            width: 100%;
            border-radius: 22px;
            margin: auto;
            min-height: auto;
            box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.1), 0 1px 3px rgba(0, 0, 0, 0.04);
          }

          .auth-hero-panel {
            display: none !important;
          }

          .auth-form-panel {
            padding: 30px 22px 24px;
          }

          .auth-mobile-brand {
            display: flex;
          }

          .auth-header-text {
            text-align: center;
            padding-right: 0;
            margin-bottom: 18px;
          }

          .auth-title {
            font-size: 1.25rem;
          }

          .auth-form-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .auth-demo-section {
            text-align: center;
          }

          .auth-demo-title {
            justify-content: center;
          }

          .auth-demo-chips-row {
            justify-content: center;
          }

          /* Prevent iOS input auto-zoom by ensuring minimum 16px font size on small screens */
          .auth-input-field,
          .form-select {
            font-size: 16px !important;
            height: 46px !important;
          }

          .auth-segmented-nav {
            padding: 3px;
          }

          .auth-segmented-btn {
            padding: 8px 4px;
            font-size: 0.78rem;
          }
        }

        @media (max-width: 400px) {
          .auth-root-wrapper {
            padding: 12px 10px;
          }

          .auth-form-panel {
            padding: 26px 16px 20px;
          }

          .auth-card-container {
            border-radius: 18px;
          }

          .demo-chip-btn {
            font-size: 0.7rem;
            padding: 5px 8px;
          }
        }
      `}</style>

      <div className="auth-card-container">
        {/* DESKTOP LEFT BRANDING PANEL */}
        <div className="auth-hero-panel">
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Top brand header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
              <img
                src="/logo.png"
                alt="PG Portal"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  background: '#ffffff',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  PG Portal
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em' }}>
                  Smart Resident & Facility Operations
                </div>
              </div>
            </div>

            {/* Headline */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', padding: '3px 10px', borderRadius: '14px', marginBottom: '14px' }}>
              <Sparkles size={13} color="#a5b4fc" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e0e7ff', letterSpacing: '0.03em' }}>
                PG MANAGEMENT SUITE
              </span>
            </div>

            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.03em',
              marginBottom: '14px',
              color: '#f8fafc',
            }}>
              Organized hostel living, zero friction.
            </h2>
            <p style={{
              fontSize: '0.88rem',
              color: '#cbd5e1',
              lineHeight: 1.6,
              marginBottom: '32px',
              fontWeight: 400,
              maxWidth: '380px',
            }}>
              File maintenance requests in seconds, track repairs in real-time, and manage room allocations with verified passcode access.
            </p>

            {/* Value Props */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'rgba(99, 102, 241, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  <Wrench size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Instant Maintenance Dispatch
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                    Priority auto-tagging for electrical, plumbing, and Wi-Fi tickets.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'rgba(6, 182, 212, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22d3ee',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Passcode-Protected Enrollments
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                    Students require an owner join code and explicit approval before access.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'rgba(16, 185, 129, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  <Bell size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Direct PG Noticeboard
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                    Instant broadcasts for mess schedules, gate timings, and rule updates.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Footer Badge */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Built for Owners, Staff & Students
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: '#818cf8',
              fontWeight: 700,
              background: 'rgba(99, 102, 241, 0.2)',
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              v2.0 Protected
            </span>
          </div>
        </div>

        {/* RIGHT INTERACTIVE FORM PANEL */}
        <div className="auth-form-panel">
          {/* Universal Corner Theme Toggle (Elegantly placed without misaligning form) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="auth-theme-corner-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
          </button>

          <div>
            {/* MOBILE-ONLY CENTERED BRAND EMBLEM */}
            <div className="auth-mobile-brand">
              <div className="auth-mobile-logo-wrap">
                <img
                  src="/logo.png"
                  alt="PG Portal"
                  className="auth-mobile-logo"
                />
              </div>
              <div className="auth-mobile-brand-name">PG Portal</div>
              <div className="auth-mobile-brand-tag">Operations & Resident Hub</div>
            </div>

            {/* TITLE & SUBTITLE BLOCK (Centered on mobile, left on desktop) */}
            <div className="auth-header-text">
              <h1 className="auth-title">
                {activeTab === 'login' && 'Sign in to your account'}
                {activeTab === 'tenant-reg' && 'Student enrollment'}
                {activeTab === 'owner-reg' && 'Register new PG facility'}
              </h1>
              <p className="auth-subtitle">
                {activeTab === 'login' && 'Enter your verified credentials to continue'}
                {activeTab === 'tenant-reg' && 'Enter your PG join code and room allocation'}
                {activeTab === 'owner-reg' && 'Create an operations workspace for your hostel or PG'}
              </p>
            </div>

            {/* Modern Segmented Navigation Bar */}
            <div className="auth-segmented-nav">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`auth-segmented-btn ${activeTab === 'login' ? 'active' : ''}`}
              >
                <Lock size={13} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('tenant-reg'); setError(''); }}
                className={`auth-segmented-btn ${activeTab === 'tenant-reg' ? 'active' : ''}`}
              >
                <User size={13} />
                <span>Student Sign Up</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('owner-reg'); setError(''); }}
                className={`auth-segmented-btn ${activeTab === 'owner-reg' ? 'active' : ''}`}
              >
                <Building2 size={13} />
                <span>Register PG</span>
              </button>
            </div>

            {/* Error Message Box */}
            {error && (
              <div style={{
                padding: '11px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#b91c1c',
                fontSize: '0.84rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                boxSizing: 'border-box',
                lineHeight: 1.4,
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* =========================================
                TAB 1: SIGN IN FORM
               ========================================= */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} style={{ width: '100%', boxSizing: 'border-box' }}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', display: 'block', color: 'var(--text-main, #0f172a)' }}>
                    Email Address
                  </label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      className="auth-input-field"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                      Password
                    </label>
                  </div>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="auth-input-field"
                      style={{ paddingRight: '40px' }}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="auth-password-toggle"
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                      tabIndex="-1"
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* =========================================
                TAB 2: STUDENT REGISTRATION FORM
               ========================================= */}
            {activeTab === 'tenant-reg' && (
              <form onSubmit={handleTenantRegister} style={{ width: '100%', boxSizing: 'border-box' }}>
                {/* Gender / Category Selection */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    I am registering as *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTGender('female');
                        const valid = pgList.filter((p) => p.pgType === 'girls' || p.pgType === 'co-ed' || !p.pgType);
                        if (valid.length > 0 && !valid.some((p) => p._id === tPgId)) {
                          setTPgId(valid[0]._id);
                        }
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: tGender === 'female' ? '2px solid #ec4899' : '1px solid var(--border-light, #e2e8f0)',
                        background: tGender === 'female' ? 'rgba(236, 72, 153, 0.12)' : 'var(--bg-hover, #f8fafc)',
                        color: tGender === 'female' ? '#db2777' : 'var(--text-muted, #64748b)',
                        fontWeight: tGender === 'female' ? 800 : 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>👩 Female (Girls PG)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTGender('male');
                        const valid = pgList.filter((p) => p.pgType === 'boys' || p.pgType === 'co-ed' || !p.pgType);
                        if (valid.length > 0 && !valid.some((p) => p._id === tPgId)) {
                          setTPgId(valid[0]._id);
                        }
                      }}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: tGender === 'male' ? '2px solid #3b82f6' : '1px solid var(--border-light, #e2e8f0)',
                        background: tGender === 'male' ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-hover, #f8fafc)',
                        color: tGender === 'male' ? '#2563eb' : 'var(--text-muted, #64748b)',
                        fontWeight: tGender === 'male' ? 800 : 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>👨 Male (Boys PG)</span>
                    </button>
                  </div>
                </div>

                <div className="auth-form-grid">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Full Name *
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        className="auth-input-field"
                        placeholder="e.g. Rahul Sharma"
                        value={tName}
                        onChange={(e) => setTName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Contact Phone (Optional)
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <Phone size={15} />
                      </div>
                      <input
                        type="text"
                        className="auth-input-field"
                        placeholder="+91 98765 43210"
                        value={tPhone}
                        onChange={(e) => setTPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="auth-form-grid">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Email Address *
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <Mail size={15} />
                      </div>
                      <input
                        type="email"
                        className="auth-input-field"
                        placeholder="student@example.com"
                        value={tEmail}
                        onChange={(e) => setTEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Password *
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <Lock size={15} />
                      </div>
                      <input
                        type={showTenantPassword ? 'text' : 'password'}
                        className="auth-input-field"
                        style={{ paddingRight: '40px' }}
                        placeholder="Min 6 characters"
                        value={tPassword}
                        onChange={(e) => setTPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowTenantPassword(!showTenantPassword)}
                        className="auth-password-toggle"
                        title={showTenantPassword ? 'Hide password' : 'Show password'}
                        tabIndex="-1"
                      >
                        {showTenantPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                      Select {tGender === 'female' ? 'Girls' : 'Boys'} PG Facility *
                    </label>
                    <button
                      type="button"
                      onClick={fetchPGList}
                      disabled={loadingPGs}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary, #4f46e5)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontWeight: 700,
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
                  {(() => {
                    const filteredPGList = pgList.filter((p) => {
                      if (tGender === 'female') return p.pgType === 'girls' || p.pgType === 'co-ed' || !p.pgType;
                      if (tGender === 'male') return p.pgType === 'boys' || p.pgType === 'co-ed' || !p.pgType;
                      return true;
                    });

                    return (
                      <select
                        className="form-select"
                        value={tPgId}
                        onChange={(e) => setTPgId(e.target.value)}
                        required
                        disabled={loadingPGs || filteredPGList.length === 0}
                        style={{ height: '44px', fontSize: '0.86rem', borderRadius: '10px' }}
                      >
                        {loadingPGs ? (
                          <option value="">Loading registered PGs...</option>
                        ) : filteredPGList.length === 0 ? (
                          <option value="">
                            No registered {tGender === 'female' ? 'Girls' : 'Boys'} PGs found
                          </option>
                        ) : (
                          filteredPGList.map((p) => {
                            const badge = p.pgType === 'girls' ? '[Girls PG] ' : p.pgType === 'boys' ? '[Boys PG] ' : '[Co-Ed] ';
                            return (
                              <option key={p._id} value={p._id}>
                                {badge}{p.name} {p.address ? `(${p.address})` : ''}
                              </option>
                            );
                          })
                        )}
                      </select>
                    );
                  })()}
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                    Secret Join Passcode for {pgList.find((p) => p._id === tPgId)?.name || 'Selected PG'} *
                  </label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <KeyRound size={15} color="var(--primary, #4f46e5)" />
                    </div>
                    <input
                      type="text"
                      className="auth-input-field"
                      placeholder="e.g. GH-2024 (Ask PG Owner)"
                      value={tJoinCode}
                      onChange={(e) => setTJoinCode(e.target.value.toUpperCase())}
                      required
                      style={{ letterSpacing: '0.06em', fontWeight: 700, color: 'var(--primary, #4f46e5)' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', marginTop: '4px', display: 'block' }}>
                    🔒 Official passcode provided by your PG Owner or Caretaker.
                  </span>
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.22)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '16px',
                  fontSize: '0.78rem',
                  lineHeight: 1.45,
                  color: 'var(--text-primary, #1e293b)'
                }}>
                  <Building2 size={16} color="var(--primary, #4f46e5)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--primary, #4f46e5)' }}>Room Assignment: </span>
                    <span>No need to pick a room now. Your PG Owner will assign an available room to you upon reviewing your request.</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || pgList.length === 0}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  <span>{loading ? 'Registering...' : 'Register Student Account'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* =========================================
                TAB 3: OWNER REGISTRATION FORM
               ========================================= */}
            {activeTab === 'owner-reg' && (
              <form onSubmit={handleOwnerRegister} style={{ width: '100%', boxSizing: 'border-box' }}>
                <div style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: 'var(--text-muted, #64748b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '10px',
                }}>
                  Owner Contact Information
                </div>

                <div className="auth-form-grid">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Full Name *
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        className="auth-input-field"
                        placeholder="e.g. Vikram Malhotra"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Personal Phone Number
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <Phone size={15} />
                      </div>
                      <input
                        type="text"
                        className="auth-input-field"
                        placeholder="+91..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="auth-form-grid">
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Email Address *
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <Mail size={15} />
                      </div>
                      <input
                        type="email"
                        className="auth-input-field"
                        placeholder="owner@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Password *
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <Lock size={15} />
                      </div>
                      <input
                        type={showOwnerPassword ? 'text' : 'password'}
                        className="auth-input-field"
                        style={{ paddingRight: '40px' }}
                        placeholder="Min 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                        className="auth-password-toggle"
                        title={showOwnerPassword ? 'Hide password' : 'Show password'}
                        tabIndex="-1"
                      >
                        {showOwnerPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: 'var(--text-muted, #64748b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: '12px',
                  marginBottom: '10px',
                }}>
                  PG Property Details
                </div>

                {/* PG Category / Gender Type Selection */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    PG Facility Category *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setRegPgType('boys')}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '10px',
                        border: regPgType === 'boys' ? '2px solid #3b82f6' : '1px solid var(--border-light, #e2e8f0)',
                        background: regPgType === 'boys' ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-hover, #f8fafc)',
                        color: regPgType === 'boys' ? '#2563eb' : 'var(--text-muted, #64748b)',
                        fontWeight: regPgType === 'boys' ? 800 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>Boys PG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegPgType('girls')}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '10px',
                        border: regPgType === 'girls' ? '2px solid #be185d' : '1px solid var(--border-light, #e2e8f0)',
                        background: regPgType === 'girls' ? 'rgba(190, 24, 93, 0.12)' : 'var(--bg-hover, #f8fafc)',
                        color: regPgType === 'girls' ? '#be185d' : 'var(--text-muted, #64748b)',
                        fontWeight: regPgType === 'girls' ? 800 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>Girls PG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegPgType('co-ed')}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '10px',
                        border: regPgType === 'co-ed' ? '2px solid #7c3aed' : '1px solid var(--border-light, #e2e8f0)',
                        background: regPgType === 'co-ed' ? 'rgba(124, 58, 237, 0.12)' : 'var(--bg-hover, #f8fafc)',
                        color: regPgType === 'co-ed' ? '#7c3aed' : 'var(--text-muted, #64748b)',
                        fontWeight: regPgType === 'co-ed' ? 800 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>Co-Ed PG</span>
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                    PG Facility Name *
                  </label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <Building2 size={15} />
                    </div>
                    <input
                      type="text"
                      className="auth-input-field"
                      placeholder={regPgType === 'girls' ? "e.g. Shanti Girls Luxury PG" : "e.g. Shanti Boys Residency"}
                      value={pgName}
                      onChange={(e) => setPgName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form-grid">
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Physical Address *
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <Home size={15} />
                      </div>
                      <input
                        type="text"
                        className="auth-input-field"
                        placeholder="Area, City, Pin"
                        value={pgAddress}
                        onChange={(e) => setPgAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>
                      Helpdesk / Warden Phone
                    </label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <Phone size={15} />
                      </div>
                      <input
                        type="text"
                        className="auth-input-field"
                        placeholder="+91..."
                        value={pgPhone}
                        onChange={(e) => setPgPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  <span>{loading ? 'Setting up workspace...' : 'Complete PG Registration'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>

          {/* QUICK DEMO CREDENTIALS SECTION (Centered on Mobile) */}
          {activeTab === 'login' && (
            <div className="auth-demo-section">
              <div className="auth-demo-title">
                <KeyRound size={12} color="var(--primary, #4f46e5)" />
                <span>Quick demo credentials:</span>
              </div>

              <div className="auth-demo-chips-row">
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
                  <span>🛠️ Staff</span>
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
