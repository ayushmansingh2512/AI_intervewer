import React from 'react';
import Navbar from './Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flexGrow: 1, backgroundColor: '#FAF9F5' }}>
        <Navbar />
        <div style={{ padding: '1rem' }}>{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;