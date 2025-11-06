import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, FileText, Mic, FileSignature, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const iconClasses = ({ isActive }) => `
    flex items-center justify-center w-12 h-12 rounded-lg no-underline
    transition-all duration-200
    ${isActive 
      ? 'bg-[#D97757] text-white' 
      : 'text-[#3D3D3A] hover:bg-[#E3DACC]'
    }
  `;

  const tooltipClasses = 'absolute left-16 bg-[#3D3D3A] text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200';

  return (
    <div className="fixed left-0 top-0 h-screen w-15 bg-[#FAF9F5] border-r border-[#E1E5E9] flex flex-col items-center py-6 gap-4">
      {/* Logo */}
      <div className="mb-6">
        <h1 className="text-xl font-light text-[#D97757] tracking-tight"></h1>
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col gap-4">
        <div className="group relative">
          <NavLink to="/dashboard" end className={iconClasses}>
            <LayoutDashboard size={22} strokeWidth={1.5} />
          </NavLink>
          <div className={tooltipClasses}>Dashboard</div>
        </div>

        <div className="group relative">
          <NavLink to="/dashboard/create-interview" className={iconClasses}>
            <Plus size={22} strokeWidth={1.5} />
          </NavLink>
          <div className={tooltipClasses}>Create Interview</div>
        </div>

        <div className="group relative">
          <NavLink to="/dashboard/cv-parser" className={iconClasses}>
            <FileText size={22} strokeWidth={1.5} />
          </NavLink>
          <div className={tooltipClasses}>CV Parser</div>
        </div>

        <div className="group relative">
          <NavLink to="/dashboard/voice-interview" className={iconClasses}>
            <Mic size={22} strokeWidth={1.5} />
          </NavLink>
          <div className={tooltipClasses}>Voice Interview</div>
        </div>

        <div className="group relative">
          <NavLink to="/dashboard/cv-maker" className={iconClasses}>
            <FileSignature size={22} strokeWidth={1.5} />
          </NavLink>
          <div className={tooltipClasses}>CV Maker</div>
        </div>
      </nav>

      {/* Logout Button - Bottom */}
      <div className="mt-auto group relative">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-12 h-12 rounded-lg text-[#3D3D3A] hover:bg-[#E3DACC] transition-all duration-200 bg-none border-none cursor-pointer"
        >
          <LogOut size={22} strokeWidth={1.5} />
        </button>
        <div className={tooltipClasses}>Logout</div>
      </div>
    </div>
  );
};

export default Sidebar;