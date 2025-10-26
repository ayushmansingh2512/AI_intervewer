import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      backgroundColor: '#fff',
      color: '#000',
      borderBottom: '1px solid #000'
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300' }}>Dashboard</h1>
      </div>
      <div>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid #000',
            color: '#000',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: '300'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;