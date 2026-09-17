import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api, getToken, setToken, removeToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pg, setPg] = useState(null);
  const [myPGs, setMyPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsInviteAcceptance, setNeedsInviteAcceptance] = useState(false);
  const [needsTenantApproval, setNeedsTenantApproval] = useState(false);
  const inFlightRef = useRef(false);

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

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    setPg(data.pg);
    if (data.myPGs) setMyPGs(data.myPGs);
    setNeedsInviteAcceptance(Boolean(data.needsInviteAcceptance));
    setNeedsTenantApproval(Boolean(data.needsTenantApproval));
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
    return data;
  };

  const registerTenant = async (formData) => {
    const data = await api.registerTenant(formData);
    setToken(data.token);
    setUser(data.user);
    setPg(data.pg);
    setNeedsInviteAcceptance(false);
    setNeedsTenantApproval(Boolean(data.needsTenantApproval));
    return data;
  };

  const logout = () => {
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
