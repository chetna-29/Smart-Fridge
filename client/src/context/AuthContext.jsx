import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Set authorization header globally for this load session
          const res = await axios.get(`${API_URL}/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (res.data.success) {
            setUser(res.data.data);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.success) {
        const userData = res.data.data;
        localStorage.setItem('token', userData.token);
        setToken(userData.token);
        setUser({
          _id: userData._id,
          name: userData.name,
          email: userData.email,
        });
        setLoading(false);
        return true;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
      setLoading(false);
      return false;
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      if (res.data.success) {
        const userData = res.data.data;
        localStorage.setItem('token', userData.token);
        setToken(userData.token);
        setUser({
          _id: userData._id,
          name: userData.name,
          email: userData.email,
        });
        setLoading(false);
        return true;
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
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
