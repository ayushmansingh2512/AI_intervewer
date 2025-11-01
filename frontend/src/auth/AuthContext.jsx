import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => {
    const storedToken = localStorage.getItem('authToken');
    console.log("AuthToken initialized from localStorage:", storedToken);
    return storedToken;
  });
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthToken useEffect fired. Current authToken:", authToken);
    if (authToken) {
      localStorage.setItem('authToken', authToken);
      // Set Authorization header for all future axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } else {
      localStorage.removeItem('authToken');
      // Remove Authorization header if no token
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [authToken]);

  const login = async (token) => {
    setAuthToken(token);
    console.log("Attempting to navigate to /dashboard...");
    navigate('/dashboard');
    console.log("Navigation call completed.");
  };

  const logout = () => {
    setAuthToken(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ authToken, login, logout, setAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};