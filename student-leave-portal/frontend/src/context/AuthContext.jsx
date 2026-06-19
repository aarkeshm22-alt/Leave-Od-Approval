// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read and synchronize existing session on browser boot
    const savedUser = localStorage.getItem('portal_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Updated to support either a single backend payload object or standard arguments fallback
  const login = (userData, password, role) => {
    let profile = null;

    // Case 1: Backend Object passed from Login.jsx (e.g., login(data))
    if (userData && typeof userData === 'object') {
      // Pull either data.user block or treat the root object as the profile directly
      const rawUser = userData.user || userData;
      
      profile = {
        ...rawUser,
        // Standardize the role casing to lowercase to preserve dashboard routing mechanisms
        role: (rawUser.role || 'student').toLowerCase()
      };

      // Persist secure authentication token if issued by Express controller router
      if (userData.token) {
        localStorage.setItem('portal_token', userData.token);
      }
    } 
    // Case 2: Fallback to primitive argument parameters to prevent crash exceptions
    else {
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

    // Save standardized parameters to state engine and disk cache storage
    localStorage.setItem('portal_user', JSON.stringify(profile));
    setUser(profile);
    
    return profile;
  };

  const logout = () => {
    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};