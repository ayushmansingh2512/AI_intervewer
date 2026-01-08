import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CompanyProtectedRoute = () => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCompany = async () => {
      if (token) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/company/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCompany(response.data);
        } catch (error) {
          console.error('Failed to fetch company', error);
          toast.error(`Session validation failed: ${error.message || error.response?.status}`);
          localStorage.removeItem('token'); // Invalid token
        }
      }
      setLoading(false);
    };

    fetchCompany();
  }, [token]);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!token) {
    return <Navigate to="/company-login" />;
  }

  if (!company) {
    return <Navigate to="/company-login" />;
  }

  if (!company.is_verified) {
    console.log("Company not verified, redirecting to OTP. is_verified:", company.is_verified);
    return <Navigate to="/company-otp" />;
  }

  return <Outlet context={{ company }} />;;
};

export default CompanyProtectedRoute;
