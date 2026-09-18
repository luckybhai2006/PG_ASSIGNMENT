import React, { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main, #f8fafc)',
      gap: '16px',
    }}>
      <div style={{ position: 'relative', width: '68px', height: '68px' }}>
        <img
          src="/logo.png"
          alt="PG Management System"
          width="68"
          height="68"
          fetchpriority="high"
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
            background: '#ffffff',
          }}
        />
        <div style={{
          position: 'absolute',
          top: '-5px',
          left: '-5px',
          right: '-5px',
          bottom: '-5px',
          border: '3px solid transparent',
          borderTopColor: '#06b6d4',
          borderBottomColor: '#4f46e5',
          borderRadius: '50%',
          animation: 'spin 1.2s linear infinite',
        }} />
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
        Loading PG Management System...
      </span>
    </div>
  );
}

function MainContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      {user ? <Dashboard /> : <AuthPage />}
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

