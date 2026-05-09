import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const ProtectedRoute = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user', error);
          localStorage.removeItem('token'); // Invalid token
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.is_verified) {
    return <Navigate to="/otp" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;