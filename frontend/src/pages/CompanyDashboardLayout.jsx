import React from 'react';
import CompanySidebar from '../components/CompanySidebar';

const CompanyDashboardLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex' }}>
      <CompanySidebar />
      <main style={{ flexGrow: 1, backgroundColor: '#FAF9F5' }}>
        <div style={{ padding: '1rem' }}>{children}</div>
      </main>
    </div>
  );
};

export default CompanyDashboardLayout;
