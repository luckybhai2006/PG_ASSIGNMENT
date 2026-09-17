import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api, getToken, setToken, removeToken } from '../services/api';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [pg, setPg] = useState(null);
  const [myPGs, setMyPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsInviteAcceptance, setNeedsInviteAcceptance] = useState(false);
  const [needsTenantApproval, setNeedsTenantApproval] = useState(false);
  const inFlightRef = useRef(false);

  // Setup live socket connection and event listeners
  useEffect(() => {
    const token = getToken();
    const currentUserId = user?._id || user?.id;
    if (token && currentUserId) {
      const socket = initSocket();
      if (socket) {
        let lastToastTime = 0;
        const handlePermissionsUpdated = (data) => {
          if (data?.permissions) {
            setUser((prev) => (prev ? { ...prev, permissions: data.permissions } : prev));
            const now = Date.now();
            if (now - lastToastTime > 1500) {
              lastToastTime = now;
              showToast({
                title: 'Permissions Updated',
                message: data.message || 'Your operational permissions were updated live by the PG Owner.',
                type: 'warning',
                duration: 5000,
              });
            }
          }
        };

        const handleBranchTransferred = (data) => {
          if (data?.pg) {
            setPg(data.pg);
            setUser((prev) => (prev ? { ...prev, pgId: data.pg._id } : prev));
            showToast({
              title: 'Branch Transferred',
              message: data.message || `You have been shifted to branch "${data.pg.name}" by the PG Owner.`,
              type: 'info',
              duration: 6000,
            });
          }
        };

        socket.on('STAFF_PERMISSIONS_UPDATED', handlePermissionsUpdated);
        socket.on('STAFF_BRANCH_TRANSFERRED', handleBranchTransferred);

        return () => {
          socket.off('STAFF_PERMISSIONS_UPDATED', handlePermissionsUpdated);
          socket.off('STAFF_BRANCH_TRANSFERRED', handleBranchTransferred);
        };
      }
    }
  }, [user?._id, user?.id, showToast]);

  const loadUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const data = await api.getMe();
      setUser(data.user);
      setPg(data.pg);
      if (data.myPGs) setMyPGs(data.myPGs);
      setNeedsInviteAcceptance(Boolean(data.needsInviteAcceptance));
      setNeedsTenantApproval(Boolean(data.needsTenantApproval));
      initSocket();
    } catch (err) {
      // Ignore abort errors from rapid reloads / page unloads
      if (err?.name === 'AbortError' || err?.message?.toLowerCase().includes('abort')) {
        return;
      }
      console.error('Failed to load user:', err);
      // ONLY clear token if the server explicitly responded with 401 Unauthorized
      // Never log out on 403 (e.g. pending invite), 500, or temporary network drops
      if (err?.status === 401) {
        removeToken();
        setUser(null);
        setPg(null);
        setMyPGs([]);
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Synchronize active PG facility type (girls, boys, co-ed) on root element for dynamic subtle theme styling
  useEffect(() => {
    const pgType = pg?.pgType || 'boys';
    document.documentElement.setAttribute('data-pg-type', pgType);
  }, [pg?.pgType]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    setPg(data.pg);
    if (data.myPGs) setMyPGs(data.myPGs);
    setNeedsInviteAcceptance(Boolean(data.needsInviteAcceptance));
    setNeedsTenantApproval(Boolean(data.needsTenantApproval));
    initSocket();
    return data;
  };

  const registerOwner = async (formData) => {
    const data = await api.registerOwner(formData);
    setToken(data.token);
    setUser(data.user);
    setPg(data.pg);
    if (data.myPGs) setMyPGs(data.myPGs);
    setNeedsInviteAcceptance(false);
    setNeedsTenantApproval(false);
    initSocket();
    return data;
  };

  const registerTenant = async (formData) => {
    const data = await api.registerTenant(formData);
    setToken(data.token);
    setUser(data.user);
    setPg(data.pg);
    setNeedsInviteAcceptance(false);
    setNeedsTenantApproval(Boolean(data.needsTenantApproval));
    initSocket();
    return data;
  };

  const logout = () => {
    disconnectSocket();
    removeToken();
    setUser(null);
    setPg(null);
    setMyPGs([]);
    setNeedsInviteAcceptance(false);
    setNeedsTenantApproval(false);
  };

  const acceptInvite = async () => {
    const data = await api.acceptInvite();
    setUser(data.user);
    setPg(data.pg);
    setNeedsInviteAcceptance(false);
    setNeedsTenantApproval(false);
    return data;
  };

  const switchActivePG = async (pgId) => {
    const data = await api.switchActivePG({ pgId });
    setUser(data.user);
    setPg(data.pg);
    if (data.myPGs) setMyPGs(data.myPGs);
    return data;
  };

  const addPGBranch = async (branchData) => {
    const data = await api.createPGBranch(branchData);
    setPg(data.pg);
    if (data.myPGs) setMyPGs(data.myPGs);
    return data;
  };

  const updatePGState = useCallback((newPgData) => {
    setPg((prev) => ({ ...prev, ...newPgData }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        pg,
        myPGs,
        loading,
        needsInviteAcceptance,
        needsTenantApproval,
        login,
        registerOwner,
        registerTenant,
        logout,
        acceptInvite,
        switchActivePG,
        addPGBranch,
        updatePGState,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
