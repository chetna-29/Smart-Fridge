import React, { createContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  getUserProfile,
  logoutUser,
} from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await getUserProfile();

        if (res.data.success) {
          setUser(res.data.user);
          setError(null);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(email, password);

      if (res.data.success) {
        const { token: authToken, user: userProfile } = res.data;
        localStorage.setItem('token', authToken);
        setToken(authToken);
        setUser(userProfile);
        return true;
      }

      setError(res.data.message || 'Login failed');
      return false;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid email or password');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);

    try {
      const res = await registerUser(name, email, password);

      if (res.data.success) {
        const { token: authToken, user: userProfile } = res.data;
        localStorage.setItem('token', authToken);
        setToken(authToken);
        setUser(userProfile);
        return true;
      }

      setError(res.data.message || 'Registration failed');
      return false;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout API call failed:', err);
    }

    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
