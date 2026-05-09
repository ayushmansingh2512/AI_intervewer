import { NavLink, useOutletContext } from 'react-router-dom';
import React from 'react';

const CompanyDashboard = () => {
  const { company } = useOutletContext();
  const companyName = company?.company_name || 'Company';

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#FAF9F5] py-8 px-4">
      <div className="text-center flex flex-col items-center gap-6 w-full">
        <h1 className="text-5xl font-light text-[#3D3D3A] tracking-tight">
          Welcome, <span className="text-[#D97757] font-[DM-Serif-Display]">{companyName}</span>.
        </h1>

        <p className="text-lg text-[#6B6B68] font-medium">
          Create and manage your interviews from here.
        </p>

        <div className="w-full max-w-2xl mt-8">
          <NavLink
            to="/company/create-interview"
            className="w-full bg-[#1A1817] text-white py-4 rounded-lg font-light tracking-wide hover:bg-[#2D2B28] transition-all duration-200 shadow-sm block text-center"
          >
            Create New Interview
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
