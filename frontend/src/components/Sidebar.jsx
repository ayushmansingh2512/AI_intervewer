// Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plus, FileText, Voicemail, VoicemailIcon, Mic, FileSignature } from 'lucide-react';

const Sidebar = () => {
  const linkClasses = ({ isActive }) => `
    flex items-center gap-3 px-4 py-3 text-[#1A1817] no-underline font-light
    hover:bg-[#F7F5F2] transition-all duration-200 rounded-lg
    ${isActive ? 'bg-[#F7F5F2] font-normal' : ''}
  `;

  return (
    <div className="h-[100vh] bg- border-r border-[#E5E1DC]">
      <div className="p-6">
        <h1 className="text-2xl font-light text-[#1A1817] tracking-tight">
          Solvithem
        </h1>
      </div>
      
      <nav className="px-4 space-y-2">
        <NavLink to="/dashboard" end className={linkClasses}>
          <LayoutDashboard size={20} strokeWidth={1.5} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/dashboard/create-interview" className={linkClasses}>
          <Plus size={20} strokeWidth={1.5} />
          <span>Create Interview</span>
        </NavLink>
        
        <NavLink to="/dashboard/cv-parser" className={linkClasses}>
          <FileText size={20} strokeWidth={1.5} />
          <span>CV Parser</span>
        </NavLink>
        
        <NavLink to="/dashboard/voice-interview" className={linkClasses}>
          <Mic size={20} strokeWidth={1.5} />
          <span>Voice Interview</span>
        </NavLink>
        <NavLink to="/dashboard/cv-maker" className={linkClasses}>
          <FileSignature size={20} strokeWidth={1.5} />
          <span>CV Maker</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;