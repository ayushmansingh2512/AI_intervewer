import React, { useState } from "react";
import { UserCheck, FileText, BarChart2, Settings, Bell, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./styles/Theme.css";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className=" move-bg flex w-full min-h-screen">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-64 bg-white/10 backdrop-blur-lg border-r border-white/20 text-gray-900 p-6 flex flex-col">
          <h2 className=" text-clr text-2xl font-bold  mb-8">HR Dashboard</h2>
          <nav className="flex flex-col space-y-4">
            <NavLink
              to="/dashboard"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <UserCheck /> Dashboard
            </NavLink>
            <NavLink
              to="/candidates"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <FileText /> Candidates
            </NavLink>
            <NavLink
              to="/interviews"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <BarChart2 /> Interviews
            </NavLink>
            <NavLink
              to="/analytics"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <BarChart2 /> Analytics
            </NavLink>
            <NavLink
              to="/settings"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Settings /> Settings
            </NavLink>
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="flex justify-between items-center bg-white/15 backdrop-blur-lg border-b border-white/20 p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/20 transition"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">AI Interviewer</h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative">
              <Bell size={24} />
              <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
              HR
            </div>
          </div>
        </header>

        {/* Hero / Cards */}
        <main className="p-8 flex-1 overflow-y-auto">
          <header className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome, HR</h2>
            <p className="text-gray-700">Manage candidates, interviews, and track performance.</p>
          </header>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform">
              <UserCheck size={40} className="text-clr mb-3" />
              <h3 className="text-gray-900 font-semibold text-lg mb-2">Candidates</h3>
              <p className="text-gray-700 text-sm text-center">
                View and manage all registered candidates.
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform">
              <FileText size={40} className="text-clr mb-3" />
              <h3 className="text-gray-900 font-semibold text-lg mb-2">Interviews</h3>
              <p className="text-gray-700 text-sm text-center">
                Schedule and monitor candidate interviews.
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform">
              <BarChart2 size={40} className="text-clr mb-3" />
              <h3 className="text-gray-900 font-semibold text-lg mb-2">Analytics</h3>
              <p className="text-gray-700 text-sm text-center">
                Track performance and view insights on interviews.
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform">
              <Settings size={40} className="text-clr mb-3" />
              <h3 className="text-gray-900 font-semibold text-lg mb-2">Settings</h3>
              <p className="text-gray-700 text-sm text-center">
                Configure system preferences and notifications.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
