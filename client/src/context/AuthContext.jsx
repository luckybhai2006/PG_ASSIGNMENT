import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, removeToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsInviteAcceptance, setNeedsInviteAcceptance] = useState(false);

  const loadUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setPg(data.pg);
      setNeedsInviteAcceptance(Boolean(data.needsInviteAcceptance));
    } catch (err) {
      console.error('Failed to load user:', err);
      removeToken();
      setUser(null);
      setPg(null);
    } finally {
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
    setNeedsInviteAcceptance(Boolean(data.needsInviteAcceptance));
    return data;
  };

  const registerOwner = async (formData) => {
    const data = await api.registerOwner(formData);
    setToken(data.token);
    setUser(data.user);
    setPg(data.pg);
    setNeedsInviteAcceptance(false);
    return data;
  };

  const registerTenant = async (formData) => {
    const data = await api.registerTenant(formData);
    setToken(data.token);
    setUser(data.user);
    setPg(data.pg);
    setNeedsInviteAcceptance(false);
    return data;
  };


  const logout = () => {
    removeToken();
    setUser(null);
    setPg(null);
    setNeedsInviteAcceptance(false);
  };

  const acceptInvite = async () => {
    const data = await api.acceptInvite();
    setUser(data.user);
    setPg(data.pg);
    setNeedsInviteAcceptance(false);
    return data;
  };

  const updatePGState = (newPgData) => {
    setPg((prev) => ({ ...prev, ...newPgData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        pg,
        loading,
        needsInviteAcceptance,
        login,
        registerOwner,
        registerTenant,
        logout,
        acceptInvite,
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
