import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const role = searchParams.get('role');

        if (token) {
            localStorage.setItem('token', token);
            if (role) {
                localStorage.setItem('role', role);
            }

            if (role === 'company') {
                toast.success('Successfully logged in as Company!');
                navigate('/company/dashboard');
            } else {
                // Fetch user info to get the name (Talent flow)
                axios.get('http://127.0.0.1:8000/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(response => {
                        const { first_name } = response.data;
                        if (first_name) {
                            localStorage.setItem('first_name', first_name);
                        }
                        toast.success('Successfully logged in with Google!');
                        navigate('/dashboard');
                    })
                    .catch(error => {
                        console.error('Error fetching user info:', error);
                        // If fetching user fails, we might still be logged in, but let's warn
                        toast.error('Failed to fetch user profile.');
                        navigate('/login');
                    });
            }
        } else {
            toast.error('Login failed. No token received.');
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5]">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#D97757] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#3D3D3A] font-medium">Completing login...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
