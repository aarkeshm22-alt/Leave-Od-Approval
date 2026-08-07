// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://leave-od-approval.onrender.com';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('portal_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, password, role) => {
    let profile = null;

    if (userData && typeof userData === 'object') {
      const rawUser = userData.user || userData;
      profile = {
        ...rawUser,
        role: (rawUser.role || 'student').toLowerCase()
      };
      // ✅ Store token with consistent key
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
    } else {
      const emailStr = String(userData || '');
      const parsedName = emailStr.includes('@') ? emailStr.split('@')[0].toUpperCase() : 'USER';
      const targetRole = String(role || 'student').toLowerCase();
      profile = {
        id: `usr_${Math.random().toString(36).substring(2, 11)}`,
        name: parsedName,
        email: emailStr,
        role: targetRole,
        deptCode: "DEPT-CSE-2026",
        mentorCode: targetRole === 'student' ? "MNT-ALAN-402" : null
      };
    }

    localStorage.setItem('portal_user', JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem('portal_user');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('portal_token');
    setUser(null);
  };

  // ✅ Fixed deleteAccount – checks all token keys
  const deleteAccount = async () => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('accessToken') || 
                  localStorage.getItem('portal_token');
    if (!token) throw new Error('No authentication token found.');

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        logout();
      }
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, deleteAccount, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};