import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Building2,
  UserCheck,
  Settings
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-950/50 border border-blue-400/30'
        : 'text-blue-100/70 hover:text-white hover:bg-white/[0.08] active:scale-[0.98]'
    }`;

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-gradient-to-b from-[#0b1938] via-[#0e214d] to-[#081229] border-r border-blue-900/40 text-white flex flex-col transition-all duration-200 no-print shadow-xl shadow-slate-950/20 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-blue-900/40 bg-[#07132a]/70 backdrop-blur-xs">
        <NavLink to="/dashboard" className="flex items-center overflow-hidden group">
          <span className="font-black text-lg tracking-wider text-white uppercase whitespace-nowrap group-hover:text-blue-300 transition">
            {isOpen ? 'GK METAL' : 'GK'}
          </span>
        </NavLink>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {/* Navigation Section Title (when open) */}
        {isOpen && (
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-300/50">
            Main Menu
          </div>
        )}

        {/* Dashboard */}
        <NavLink to="/dashboard" className={navLinkClass}>
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {isOpen && <span>Dashboard</span>}
        </NavLink>

        {/* Invoices */}
        <NavLink to="/invoices" className={navLinkClass}>
          <FileText className="w-4 h-4 shrink-0" />
          {isOpen && <span>Invoices</span>}
        </NavLink>

        {/* Customers / Buyers */}
        <NavLink to="/customers" className={navLinkClass}>
          <Building2 className="w-4 h-4 shrink-0" />
          {isOpen && <span>Customers</span>}
        </NavLink>

        {/* Section divider */}
        {isOpen && (
          <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-blue-300/50">
            Administration
          </div>
        )}

        {/* Employees & RBAC */}
        <NavLink to="/employees" className={navLinkClass}>
          <UserCheck className="w-4 h-4 shrink-0" />
          {isOpen && <span>Employees</span>}
        </NavLink>

        {/* System Settings */}
        <NavLink to="/settings" className={navLinkClass}>
          <Settings className="w-4 h-4 shrink-0" />
          {isOpen && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}

