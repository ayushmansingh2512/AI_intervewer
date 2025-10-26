import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const linkStyle = {
    display: 'block',
    padding: '1rem',
    color: '#000',
    textDecoration: 'none',
    fontWeight: '300'
  };

  const activeLinkStyle = {
    ...linkStyle,
    fontWeight: '700'
  };

  return (
    <div style={{
      width: '200px',
      backgroundColor: '#fff',
      color: '#000',
      borderRight: '1px solid #000',
      height: '100vh'
    }}>
      <div style={{ padding: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '300' }}>Solvithem</h2>
      </div>
      <nav>
        <NavLink
          to="/dashboard"
          style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
        >
          Dashboard
        </NavLink>
        {/* Add more links here as needed */}
      </nav>
    </div>
  );
};

export default Sidebar;
